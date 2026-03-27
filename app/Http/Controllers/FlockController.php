<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\StoreFlockRequest;
use App\Http\Requests\UpdateFlockRequest;
use App\Http\Requests\SubmitFlockRequest;
use App\Http\Requests\ApproveFlockRequest;
use App\Http\Requests\RejectFlockRequest;
use App\Models\Flock;
use App\Models\Building;
use App\Models\DailyRecord;
use Illuminate\Http\Request;
use App\Events\FlockApproved;
use Inertia\Inertia;
use App\Services\ProfitabilityService;

class FlockController extends Controller
{
    use AuthorizesRequests;

    /**
     * Liste des lots avec filtres et statistiques.
     */
    public function index(Request $request)
    {
        $query = Flock::with(['building', 'creator', 'approver'])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->building_id, fn($q, $id) => $q->where('building_id', $id))
            ->when($request->search, fn($q, $search) => $q->where('name', 'like', "%{$search}%"));

        $recipes = \App\Models\Recipe::select('id', 'name')->orderBy('name')->get();

        $flocks = $query->latest()->paginate(15)->through(fn($flock) => [
            'id' => $flock->id,
            'name' => $flock->name,
            'building' => $flock->building->name,
            'arrival_date' => $flock->arrival_date->format('d/m/Y'),
            'initial_quantity' => $flock->initial_quantity,
            'current_quantity' => $flock->calculated_quantity, // Utilise l'Accessor dynamique
            'status' => $flock->status,
            'creator' => $flock->creator->name,
            'can_edit'    => auth()->user()->can('update', $flock),  // 'update' correspond à ta Policy
            'can_submit'  => auth()->user()->can('submit', $flock),
            'can_approve' => auth()->user()->can('approve', $flock),
            'can_reject'  => auth()->user()->can('reject', $flock),
            'can_delete'  => auth()->user()->can('delete', $flock),
            'can_end'     => auth()->user()->can('end', $flock),
        ]);

        return Inertia::render('Flocks/Index', [
            'flocks' => $flocks,
            'buildings' => Building::select('id', 'name')->get(),
            'recipes' => $recipes,
            'filters' => $request->only(['status', 'building_id', 'search']),
            // Chargement paresseux pour le suivi journalier
            'dailyRecords' => Inertia::lazy(fn() => 
                $request->flock_id ? DailyRecord::where('flock_id', $request->flock_id)->latest()->paginate(5) : null
            ),
        ]);
    }

    /**
     * Terminer un lot : Redirection intelligente vers la facture si c'est une vente.
     */
    public function end(Request $request, Flock $flock)
    {
        $this->authorize('end', $flock);

        $validated = $request->validate([
            'end_reason' => 'required|in:sale,mortality,disease,other',
            'notes' => 'nullable|string',
        ]);

        if ($validated['end_reason'] === 'sale') {
            // Unification : Rediriger vers la création de facture avec les données pré-remplies
            return redirect()->route('invoicesCreate', [
                'source_id' => $flock->id,
                'source_type' => 'flock',
                'description' => "Vente totale du lot : " . $flock->name,
                'quantity' => $flock->calculated_quantity,
            ]);
        }

        $flock->update([
            'status' => 'completed',
            'end_reason' => $validated['end_reason'],
            'ended_at' => now(),
            'notes' => $flock->notes . "\n[FIN] " . ($validated['notes'] ?? ''),
        ]);

        return redirect()->route('generation')->with('success', 'Lot terminé avec succès.');
    }

    public function store(StoreFlockRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['status'] = 'draft';
        $data['current_quantity'] = $data['initial_quantity']; // Initialiser la quantité actuelle à la quantité initiale
        
        Flock::create($data);

        return redirect()->route('generation')->with('success', 'Lot créé en brouillon.');
    }

    public function approve(ApproveFlockRequest $request,Flock $flock)
    {
        $this->authorize('approve', $flock);

        // Sécurité : Un seul lot actif par bâtiment
        if (Flock::where('building_id', $flock->building_id)->where('status', 'active')->exists()) {
            return back()->with('error', 'Un lot est déjà actif dans ce bâtiment.');
        }

        $flock->update([
            'status' => 'active',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('generation')->with('success', 'Lot approuvé et actif.');
    }

    /**
     * Formulaire d'édition (uniquement si modifiable).
     */
    public function edit(Flock $flock)
    {
        $this->authorize('edit flocks', $flock);

        $buildings = Building::all(['id', 'name']);
        return Inertia::render('Flocks/Edit', [
            'flock' => [
                'id' => $flock->id,
                'name' => $flock->name,
                'building_id' => $flock->building_id,
                'arrival_date' => $flock->arrival_date->format('Y-m-d'),
                'initial_quantity' => $flock->initial_quantity,
                'notes' => $flock->notes,
            ],
            'buildings' => $buildings,
        ]);
    }

    /**
     * Mise à jour (uniquement si modifiable).
     */
    public function update(UpdateFlockRequest $request, Flock $flock)
    {
        $this->authorize('update', $flock);
        $data = $request->validated();
        $data['current_quantity'] = $data['initial_quantity']; // si on change la quantité initiale, on réinitialise la quantité actuelle

        $flock->update($data);

        return redirect()->route('generation')->with('success', 'Lot mis à jour.');
    }

    /**
     * Suppression (uniquement si brouillon).
     */
    public function destroy(Flock $flock)
    {
        $this->authorize('delete', $flock);

        $flock->delete();

        return redirect()->route('generation')->with('success', 'Lot supprimé.');
    }

    /**
     * Soumettre pour approbation.
     */
    public function submit(SubmitFlockRequest $request, Flock $flock)
    {
        $this->authorize('submit flocks', $flock);

        $flock->status = 'pending';
        $flock->save();

        return redirect()->route('generation')->with('success', 'Lot soumis pour approbation.');
    }

    /*
    public function show(Flock $flock, ProfitabilityService $profitabilityService)
    {
        // On charge les relations de base
        $flock->load(['building', 'creator', 'approver']);

        // Analyse de rentabilité financière
        $financialAnalysis = $profitabilityService->calculateForFlock($flock);

        $recipes = \App\Models\Recipe::select('id', 'name')->orderBy('name')->get();

        // On transforme le lot en un "Cockpit" de données
        return Inertia::render('Flocks/Show', [
            'recipes' => $recipes,
            'flock' => [
                'id' => $flock->id,
                'name' => $flock->name,
                'building' => $flock->building->name,
                'arrival_date' => $flock->arrival_date->format('Y-m-d'),
                'initial_quantity' => $flock->initial_quantity,
                'current_quantity' => $flock->calculated_quantity, // Accessor dynamique
                'status' => $flock->status,
                'standard_mortality_rate' => $flock->standard_mortality_rate,
                'notes' => $flock->notes,
                // Stats de performance calculées à la volée
                'stats' => [
                    'mortality_rate' => $flock->initial_quantity > 0 
                        ? round(($flock->dailyRecords()->sum('losses') / $flock->initial_quantity) * 100, 2) 
                        : 0,
                    'total_eggs' => $flock->dailyRecords()->where('status', 'approved')->sum('eggs'),
                    'egg_efficiency' => $flock->calculated_quantity > 0 && $flock->dailyRecords()->count() > 0
                        ? round(($flock->dailyRecords()->where('status', 'approved')->sum('eggs') / ($flock->calculated_quantity * $flock->dailyRecords()->where('status', 'approved')->count())) * 100, 2)
                        : 0,
                ]
            ],
            // Chargement des ventes via la nouvelle table unifiée
            'sales_history' => $flock->invoiceItems()
                ->with('invoice')
                ->get()
                ->map(fn($item) => [
                    'date' => $item->invoice->date->format('d/m/Y'),
                    'invoice_number' => $item->invoice->number,
                    'quantity' => $item->quantity,
                    'total' => $item->total,
                ]),
            // On garde tes dailyRecords mais on les pagine pour l'UX
            'dailyRecords' => $flock->dailyRecords()
                ->with(['creator'])
                ->latest('date')
                ->paginate(10),
            'financial_analysis' => $financialAnalysis,
        ]);
    }
    */
    public function show(Flock $flock, ProfitabilityService $profitabilityService)
    {
        $flock->load(['building', 'creator', 'approver']);

        $financialAnalysis = $profitabilityService->calculateForFlock($flock);

        // Pré-calculs pour les stats
        $losses = $flock->dailyRecords()->sum('losses');
        $approvedRecords = $flock->dailyRecords()->where('status', 'approved');
        $approvedCount = $approvedRecords->count();
        $approvedEggs = $approvedRecords->sum('eggs');
        $calculatedQuantity = $flock->calculated_quantity;

        return Inertia::render('Flocks/Show', [
            'flock' => [
                'id' => $flock->id,
                'name' => $flock->name,
                'building' => $flock->building->name,
                'arrival_date' => $flock->arrival_date->format('Y-m-d'),
                'initial_quantity' => $flock->initial_quantity,
                'current_quantity' => $calculatedQuantity,
                'status' => $flock->status,
                'standard_mortality_rate' => $flock->standard_mortality_rate,
                'notes' => $flock->notes,
                'creator' => $flock->creator->name,
                'approver' => $flock->approver?->name,
                'approved_at' => $flock->approved_at?->format('d/m/Y H:i'),
                'stats' => [
                    'mortality_rate' => $flock->initial_quantity > 0
                        ? round(($losses / $flock->initial_quantity) * 100, 2)
                        : 0,
                    'total_eggs' => $approvedEggs,
                    'egg_efficiency' => $calculatedQuantity > 0 && $approvedCount > 0
                        ? round(($approvedEggs / ($calculatedQuantity * $approvedCount)) * 100, 2)
                        : 0,
                ]
            ],
            'sales_history' => $flock->invoiceItems()
                ->with('invoice')
                ->get()
                ->map(fn($item) => [
                    'date' => $item->invoice->date->format('d/m/Y'),
                    'invoice_number' => $item->invoice->number,
                    'quantity' => $item->quantity,
                    'total' => $item->total,
                ]),
            'dailyRecords' => $flock->dailyRecords()
                ->with(['creator'])
                ->latest('date')
                ->paginate(10),
            'financial_analysis' => $financialAnalysis,
        ]);
    }
    

    /**
     * Rejeter (retour en brouillon).
     */
    public function reject(RejectFlockRequest $request, Flock $flock)
    {
        $this->authorize('reject', $flock);

        $flock->status = 'rejected';
        $flock->save();

        return redirect()->route('generation')->with('success', 'Lot rejeté, retour en brouillon.');
    }
}
