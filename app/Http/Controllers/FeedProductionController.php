<?php

namespace App\Http\Controllers;

use App\Models\FeedProduction;
use App\Models\Recipe;
use App\Models\Unit;
use App\Models\StockMouvement;
use App\Models\Ingredient;
use App\Http\Requests\StoreFeedProductionRequest;
use App\Http\Requests\SubmitFeedProductionRequest;
use App\Http\Requests\ApproveFeedProductionRequest;
use App\Http\Requests\RejectFeedProductionRequest;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class FeedProductionController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $productions = FeedProduction::with(['recipe.ingredients', 'unit', 'creator', 'approver'])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->recipe_id, fn($q, $id) => $q->where('recipe_id', $id))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'recipeId' => $p->recipe_id,
                'recipe_name' => $p->recipe->name ?? 'Recette supprimée',
                'batchMultiplier' => $p->quantity_produced / max(1, $p->recipe->yield_quantity ?? 1),
                'totalOutput' => $p->quantity_produced,
                'date' => $p->production_date->format('Y-m-d'),
                'status' => $p->status,
                'notes' => $p->notes,
                'created_by' => $p->creator->name ?? 'Inconnu',
                'created_at' => $p->created_at->toIso8601String(),
                'approved_by' => $p->approver?->name,
                'approved_at' => $p->approved_at?->toIso8601String(),
                'rejectionReason' => $p->rejection_reason,
                'can_edit' => auth()->user()->can('update', $p),
                'can_delete' => auth()->user()->can('delete', $p),
                'can_submit' => auth()->user()->can('submit', $p),
                'can_approve' => auth()->user()->can('approve', $p),
                'can_reject' => auth()->user()->can('reject', $p),
            ]);

        $recipes = Recipe::all(['id', 'name']);

        return Inertia::render('FeedProductions/Index', [
            'productions' => $productions,
            'recipes' => $recipes,
            'filters' => $request->only(['status', 'recipe_id']),
        ]);
    }

    public function create()
    {
        $recipes = Recipe::with('ingredients', 'unit')->get();
        $units = Unit::all();
        return Inertia::render('FeedProductions/Create', [
            'recipes' => $recipes,
            'units' => $units,
        ]);
    }

    public function store(StoreFeedProductionRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['status'] = 'draft';

        FeedProduction::create($data);

        return redirect()->route('feedProductionsIndex')
            ->with('success', 'Production créée en brouillon.');
    }

    public function show(FeedProduction $feedProduction)
    {
        $feedProduction->load(['recipe.ingredients', 'unit', 'creator', 'approver']);
        
        return Inertia::render('FeedProductions/Show', [
            'production' => [
                'id' => $feedProduction->id,
                'recipe' => $feedProduction->recipe->name,
                'quantity' => $feedProduction->quantity_produced,
                'unit' => $feedProduction->unit->symbol,
                'production_date' => $feedProduction->production_date->format('d/m/Y'),
                'notes' => $feedProduction->notes,
                'status' => $feedProduction->status,
                'created_by' => $feedProduction->creator->name,
                'created_at' => $feedProduction->created_at->format('d/m/Y H:i'),
                'approved_by' => $feedProduction->approver?->name,
                'approved_at' => $feedProduction->approved_at?->format('d/m/Y H:i'),
                'rejection_reason' => $feedProduction->rejection_reason,
                'can_edit' => auth()->user()->can('update', $feedProduction),
                'can_delete' => auth()->user()->can('delete', $feedProduction),
                'can_submit' => auth()->user()->can('submit', $feedProduction),
                'can_approve' => auth()->user()->can('approve', $feedProduction),
                'can_reject' => auth()->user()->can('reject', $feedProduction),
            ]
        ]);
    }

    public function edit(FeedProduction $feedProduction)
    {
        $this->authorize('update', $feedProduction);

        $recipes = Recipe::with('ingredients', 'unit')->get();
        $units = Unit::all();
        return Inertia::render('FeedProductions/Edit', [
            'production' => $feedProduction,
            'recipes' => $recipes,
            'units' => $units,
        ]);
    }

    public function update(StoreFeedProductionRequest $request, FeedProduction $feedProduction)
    {
        $this->authorize('update', $feedProduction);

        $feedProduction->update($request->validated());

        return redirect()->route('feedProductionsIndex')
            ->with('success', 'Production mise à jour.');
    }

    public function destroy(FeedProduction $feedProduction)
    {
        $this->authorize('delete', $feedProduction);

        $feedProduction->delete();

        return redirect()->route('feedProductionsIndex')
            ->with('success', 'Production supprimée.');
    }


    public function submit(SubmitFeedProductionRequest $request, FeedProduction $feedProduction)
    {
        $this->authorize('submit', $feedProduction);

        $feedProduction->status = 'pending';
        $feedProduction->save();

        return redirect()->route('feedProductionsIndex')
            ->with('success', 'Production soumise pour approbation.');
    }



    public function approve(ApproveFeedProductionRequest $request, FeedProduction $feedProduction)
    {
        $this->authorize('approve', $feedProduction);

        DB::transaction(function () use ($feedProduction) {
            $feedProduction->status = 'approved';
            $feedProduction->approved_by = auth()->id();
            $feedProduction->approved_at = now();
            $feedProduction->save(); 
        });

        return redirect()->route('feedProductionsIndex')
            ->with('success', 'Production approuvée et stocks mis à jour.');
    }

    

    public function reject(RejectFeedProductionRequest $request, FeedProduction $feedProduction)
    {
        $this->authorize('reject', $feedProduction);

        $feedProduction->status = 'rejected';
        $feedProduction->approved_by = auth()->id(); // ou un champ rejected_by
        $feedProduction->approved_at = now();
        $feedProduction->rejection_reason = $request->reason;
        $feedProduction->save();

        return redirect()->route('feedProductionsIndex')
            ->with('success', 'Production rejetée.');
    }
}
