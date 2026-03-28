<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recipe;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Http\Requests\StoreRecipeRequest;
use App\Http\Requests\UpdateRecipeRequest;
use Inertia\Inertia;

class RecipeController extends Controller
{
    
    public function index()
    {
        $recipes = Recipe::with(['ingredients', 'unit'])->get();
        $rawMaterials = \App\Models\Ingredient::with('unit')->get()->map(function($ing) {
            return [
                'id' => $ing->id,
                'name' => $ing->name,
                'stock_quantity' => $ing->stock_quantity ?? 0,
                'unit_name' => $ing->unit ? $ing->unit->symbol : '',
                'pmp' => $ing->pmp ?? 0,
            ];
        });

        return Inertia::render('Recipes/Index', [
            'recipes' => $recipes,
            'rawMaterials' => $rawMaterials
        ]);
    }

    public function create()
    {
        $ingredients = Ingredient::all(['id', 'name', 'default_unit_id']);
        $units = Unit::all();
        return Inertia::render('Recipes/Create', [
            'ingredients' => $ingredients,
            'units' => $units,
        ]);
    }

    public function store(StoreRecipeRequest $request)
    {
        $recipe = Recipe::create([
            'name' => $request->name,
            'description' => $request->description,
            'yield' => $request->yield_quantity, // Correspond au champ validé
            'unit_id' => $request->yield_unit_id,   // Correspond au champ validé
            'is_active' => $request->is_active ?? true,
        ]);

        // Attacher les ingrédients
        foreach ($request->ingredients as $ing) {
            $recipe->ingredients()->attach($ing['ingredient_id'], [
                'quantity' => $ing['quantity'],
                'unit_id' => $ing['unit_id'],
            ]);
        }

        return redirect()->route('recipesIndex')->with('success', 'Recette créée.');
    }

    public function edit(Recipe $recipe)
    {
        $recipe->load('ingredients');
        $ingredients = Ingredient::all(['id', 'name', 'default_unit_id']);
        $units = Unit::all();
        return Inertia::render('Recipes/Edit', [
            'recipe' => $recipe,
            'ingredients' => $ingredients,
            'units' => $units,
        ]);
    }

    public function update(UpdateRecipeRequest $request, Recipe $recipe)
    {
        $recipe->update([
            'name' => $request->name,
            'description' => $request->description,
            'yield' => $request->yield_quantity,
            'unit_id' => $request->yield_unit_id,
            'is_active' => $request->is_active ?? true,
        ]);

        // Synchroniser les ingrédients
        $syncData = [];
        foreach ($request->ingredients as $ing) {
            $syncData[$ing['ingredient_id']] = [
                'quantity' => $ing['quantity'],
                'unit_id' => $ing['unit_id'],
            ];
        }
        $recipe->ingredients()->sync($syncData);

        return redirect()->route('recipesIndex')->with('success', 'Recette mise à jour.');
    }

    public function destroy(Recipe $recipe)
    {
        $recipe->delete();
        return redirect()->route('recipesIndex')->with('success', 'Recette supprimée.');
    }
}
