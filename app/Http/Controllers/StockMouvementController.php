<?php

namespace App\Http\Controllers;

use App\Models\StockMouvement;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Http\Requests\StoreStockMovementRequest;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use App\Http\Requests\ApproveStockMovementRequest;
use App\Http\Requests\RejectStockMovementRequest;
use Illuminate\Support\Facades\DB;
use App\Services\AccountingService;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StockMovementsExport;

class StockMouvementController extends Controller
{

    use AuthorizesRequests;

    public function index(Request $request)
    {
        $movements = StockMouvement::with(['ingredient', 'unit', 'creator', 'approver'])
            ->when($request->ingredient_id, fn($q, $id) => $q->where('ingredient_id', $id))
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn($movement) => [
                'id' => $movement->id,
                'ingredient' => $movement->ingredient->name,
                'type' => $movement->type,
                'quantity' => $movement->quantity,
                'unit' => $movement->unit->symbol,
                'unit_price' => $movement->unit_price,
                'reason' => $movement->reason,
                'status' => $movement->status,
                'created_by' => $movement->creator->name,
                'created_at' => $movement->created_at->format('d/m/Y H:i'),
                'approved_by' => $movement->approver?->name,
                'approved_at' => $movement->approved_at?->format('d/m/Y H:i'),
                'rejection_reason' => $movement->rejection_reason,
                'can_edit' => auth()->user()->can('update', $movement),
                'can_delete' => auth()->user()->can('delete', $movement),
                'can_approve' => auth()->user()->can('approve', $movement),
                'can_reject' => auth()->user()->can('reject', $movement),
            ]);

        $ingredients = Ingredient::all(['id', 'name']);

        return Inertia::render('StockMovements/Index', [
            'movements' => $movements,
            'ingredients' => $ingredients,
            'filters' => $request->only(['ingredient_id', 'status']),
        ]);
    }

    public function exportExcel()
    {
        return Excel::download(new StockMovementsExport, 'Mouvements_Stock_' . date('Y_m_d') . '.xlsx');
    }

    /**
     * Formulaire de création (accessible à la secrétaire)
     */
    public function create()
    {
        $ingredients = Ingredient::all(['id', 'name', 'default_unit_id']);
        $units = Unit::all();
        return Inertia::render('StockMovements/Create', [
            'ingredients' => $ingredients,
            'units' => $units,
        ]);
    }

    /**
     * Enregistrement d'un mouvement (statut pending)
     */
    public function store(StoreStockMovementRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['status'] = 'pending'; // toujours en attente

        StockMouvement::create($data);

        return redirect()->route('stockMovementsIndex')
            ->with('success', 'Mouvement enregistré et en attente d\'approbation.');
    }

    /**
     * Affichage d'un mouvement (pour voir le détail)
     */
    public function show(StockMouvement $stockMovement)
    {
        $stockMovement->load(['ingredient', 'unit', 'creator', 'approver']);
        
        return Inertia::render('StockMovements/Show', [
            'movement' => [
                'id' => $stockMovement->id,
                'ingredient' => $stockMovement->ingredient->name,
                'type' => $stockMovement->type,
                'quantity' => $stockMovement->quantity,
                'unit' => $stockMovement->unit->symbol,
                'unit_price' => $stockMovement->unit_price,
                'reason' => $stockMovement->reason,
                'status' => $stockMovement->status,
                'created_by' => $stockMovement->creator->name,
                'created_at' => $stockMovement->created_at->format('d/m/Y H:i'),
                'approved_by' => $stockMovement->approver?->name,
                'approved_at' => $stockMovement->approved_at?->format('d/m/Y H:i'),
                'rejection_reason' => $stockMovement->rejection_reason,
                'can_edit' => auth()->user()->can('update', $stockMovement),
                'can_delete' => auth()->user()->can('delete', $stockMovement),
                'can_approve' => auth()->user()->can('approve', $stockMovement),
                'can_reject' => auth()->user()->can('reject', $stockMovement),
            ]
        ]);
    }

    /**
     * Formulaire d'édition (uniquement pour les mouvements en attente et par le créateur)
     */
    public function edit(StockMouvement $stockMovement)
    {
        $this->authorize('update', $stockMovement);

        $ingredients = Ingredient::all(['id', 'name', 'default_unit_id']);
        $units = Unit::all();
        
        return Inertia::render('StockMovements/Edit', [
            'movement' => $stockMovement,
            'ingredients' => $ingredients,
            'units' => $units,
        ]);
    }

    /**
     * Mise à jour (uniquement si en attente)
     */
    public function update(StoreStockMovementRequest $request, StockMouvement $stockMovement)
    {
        $this->authorize('update', $stockMovement);

        $stockMovement->update($request->validated());

        return redirect()->route('stock-movements.index')
            ->with('success', 'Mouvement mis à jour.');
    }

    /**
     * Suppression (uniquement si en attente)
     */
    public function destroy(StockMouvement $stockMovement)
    {
        $this->authorize('delete', $stockMovement);

        $stockMovement->delete();

        return redirect()->route('stock-movements.index')
            ->with('success', 'Mouvement supprimé.');
    }

    /**
     * Approbation d'un mouvement
     */
    // Dans StockMouvementController@approve
    // Dans StockMouvementController@approve
    public function approve(ApproveStockMovementRequest $request, StockMouvement $stockMovement)
    {
        $this->authorize('approve', $stockMovement);

        DB::transaction(function () use ($stockMovement) {
            $stockMovement->status = 'approved';
            $stockMovement->approved_by = auth()->id();
            $stockMovement->approved_at = now();
            $stockMovement->save(); // ← déclenche l'observer
        });

        return redirect()->back()->with('success', 'Mouvement approuvé et stock mis à jour.');
    }

    /**
     * Rejet d'un mouvement
     */
    public function reject(RejectStockMovementRequest $request, StockMouvement $stockMovement)
    {
        $this->authorize('reject', $stockMovement);

        $stockMovement->status = 'rejected';
        $stockMovement->approved_by = auth()->id(); // ou un champ rejected_by si vous voulez
        $stockMovement->approved_at = now();
        $stockMovement->rejection_reason = $request->reason;
        $stockMovement->save();

        return redirect()->back()->with('success', 'Mouvement rejeté.');
    }

    /**
     * Fonction utilitaire pour convertir les unités
     * (À améliorer avec un service dédié)
     */
    private function convertQuantity($quantity, $fromUnit, $toUnit)
    {
        if ($fromUnit->id === $toUnit->id) {
            return $quantity;
        }

        // Si les unités ont une base commune (même type et lien via base_unit_id)
        // On peut implémenter une logique de conversion
        // Pour l'instant, on suppose qu'il n'y a pas de conversion, donc erreur
        // Idéalement, on devrait avoir un service de conversion
        
        // Exemple simple : si l'unité source a un facteur de conversion par rapport à une unité de base
        // et que l'unité cible a aussi un facteur, on peut calculer
        
        // Pour simplifier, on peut interdire les unités différentes à la saisie
        // en ne proposant que des unités compatibles avec l'ingrédient.
        // Dans l'interface, on peut filtrer les unités par type (mass, volume, unit)
        // et ne proposer que celles du même type que l'unité par défaut de l'ingrédient.
        
        // Pour l'instant, on retourne la quantité sans conversion
        // et on émet un avertissement
        \Log::warning("Conversion non implémentée entre unité {$fromUnit->id} et {$toUnit->id}");
        
        return $quantity;
    }
}
