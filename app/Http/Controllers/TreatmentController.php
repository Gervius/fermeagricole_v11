<?php
// app/Http/Controllers/TreatmentController.php

namespace App\Http\Controllers;

use App\Models\Treatment;
use App\Models\Flock;
use App\Http\Requests\StoreTreatmentRequest;
use App\Http\Requests\UpdateTreatmentRequest;
use App\Http\Requests\ApproveTreatmentRequest;
use App\Http\Requests\RejectTreatmentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TreatmentController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        
    }

    public function index(Request $request)
    {
        $query = Treatment::with(['flock', 'creator', 'approver'])
            ->when($request->flock_id, fn($q, $id) => $q->where('flock_id', $id))
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->orderBy('treatment_date', 'desc');

        $treatments = $query->paginate(20)->through(fn($treatment) => [
            'id' => $treatment->id,
            'flock_name' => $treatment->flock->name,
            'treatment_date' => $treatment->treatment_date->format('Y-m-d'),
            'veterinarian' => $treatment->veterinarian,
            'treatment_type' => $treatment->treatment_type,
            'description' => $treatment->description,
            'cost' => $treatment->cost,
            'invoice_reference' => $treatment->invoice_reference,
            'status' => $treatment->status,
            'created_by' => $treatment->creator->name,
            'created_at' => $treatment->created_at->format('d/m/Y H:i'),
            'approved_by' => $treatment->approver?->name,
            'approved_at' => $treatment->approved_at?->format('d/m/Y H:i'),
            'rejection_reason' => $treatment->rejection_reason,
            'can_edit' => auth()->user()->can('update', $treatment),
            'can_delete' => auth()->user()->can('delete', $treatment),
            'can_approve' => auth()->user()->can('approve', $treatment),
            'can_reject' => auth()->user()->can('reject', $treatment),
        ]);

        $flocks = Flock::all(['id', 'name']);

        // Calcul du coût moyen par poule
        $totalApprovedCost = Treatment::where('status', 'approved')->sum('cost');

        // Récupérer les lots actifs et sommer leur effectif calculé
        $activeFlocks = Flock::where('status', 'active')->get();
        $activeBirds = $activeFlocks->sum(fn($flock) => $flock->calculated_quantity);

        $averageCostPerBird = $activeBirds > 0 ? round($totalApprovedCost / $activeBirds, 2) : 0;
        // Liste des traitements à venir (pour les alertes)
        $upcomingTreatments = Treatment::with('flock')
            ->where('treatment_date', '>=', now())
            ->where('status', 'draft') // Seulement les brouillons (programmés)
            ->orderBy('treatment_date')
            ->take(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'flock_name' => $t->flock->name,
                'treatment_date' => $t->treatment_date->format('Y-m-d'),
                'treatment_type' => $t->treatment_type,
                'days_left' => now()->diffInDays($t->treatment_date, false),
        ]);

        return Inertia::render('Treatments/Index', [
            'treatments' => $treatments,
            'flocks' => $flocks,
            'filters' => $request->only(['flock_id', 'status']),
            'stats' => [
                'total_cost' => $totalApprovedCost,
                'average_cost_per_bird' => $averageCostPerBird,
                'active_birds' => $activeBirds,
            ],
            'upcoming_treatments' => $upcomingTreatments,
        ]);
    }

    public function create()
    {
        $flocks = Flock::where('status', 'active')->get(['id', 'name']);
        return Inertia::render('Treatments/Create', ['flocks' => $flocks]);
    }

    public function store(StoreTreatmentRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['status'] = 'draft'; // toujours en brouillon à la création

        Treatment::create($data);

        return redirect()->route('treatmentsIndex')->with('success', 'Traitement enregistré (brouillon).');
    }

    public function show(Treatment $treatment)
    {
        $treatment->load(['flock', 'creator', 'approver']);
        return Inertia::render('Treatments/Show', [
            'treatment' => [
                'id' => $treatment->id,
                'flock_name' => $treatment->flock->name,
                'treatment_date' => $treatment->treatment_date->format('Y-m-d'),
                'veterinarian' => $treatment->veterinarian,
                'treatment_type' => $treatment->treatment_type,
                'description' => $treatment->description,
                'cost' => $treatment->cost,
                'invoice_reference' => $treatment->invoice_reference,
                'status' => $treatment->status,
                'created_by' => $treatment->creator->name,
                'created_at' => $treatment->created_at->format('d/m/Y H:i'),
                'approved_by' => $treatment->approver?->name,
                'approved_at' => $treatment->approved_at?->format('d/m/Y H:i'),
                'rejection_reason' => $treatment->rejection_reason,
            ]
        ]);
    }

    public function edit(Treatment $treatment)
    {
        $this->authorize('update', $treatment);

        $flocks = Flock::all(['id', 'name']);
        return Inertia::render('Treatments/Edit', [
            'treatment' => $treatment,
            'flocks' => $flocks,
        ]);
    }

    public function update(UpdateTreatmentRequest $request, Treatment $treatment)
    {
        $this->authorize('update', $treatment);

        $treatment->update($request->validated());

        return redirect()->route('treatments.index')->with('success', 'Traitement mis à jour.');
    }

    public function destroy(Treatment $treatment)
    {
        $this->authorize('delete', $treatment);

        $treatment->delete();

        return redirect()->route('treatments.index')->with('success', 'Traitement supprimé.');
    }

    public function approve(ApproveTreatmentRequest $request, Treatment $treatment)
    {
        $this->authorize('approve', $treatment);
        DB::transaction(function () use ($treatment) {
            $treatment->status = 'approved';
            $treatment->approved_by = auth()->id();
            $treatment->approved_at = now();
            $treatment->save();

        });

        return redirect()->back()->with('success', 'Traitement approuvé.');
    }

    public function reject(RejectTreatmentRequest $request, Treatment $treatment)
    {
        $this->authorize('reject', $treatment);

        $treatment->status = 'rejected';
        $treatment->approved_by = auth()->id(); // ou un champ rejected_by si vous voulez
        $treatment->approved_at = now();
        $treatment->rejection_reason = $request->reason;
        $treatment->save();

        return redirect()->back()->with('success', 'Traitement rejeté.');
    }
}