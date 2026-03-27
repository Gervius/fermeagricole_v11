<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IngredientController extends Controller
{

    public function index()
    {
        $ingredients = Ingredient::with('defaultUnit')->paginate(15);
        return Inertia::render('Settings/Ingredients/Index', ['ingredients' => $ingredients]);
    }

    public function create()
    {
        $units = Unit::all();
        return Inertia::render('Settings/Ingredients/Create', ['units' => $units]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'reference' => 'nullable|string|max:50',
            'default_unit_id' => 'required|exists:units,id',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Ingredient::create($validated);

        return redirect()->route('ingredientsIndex')->with('success', 'Ingrédient créé.');
    }

    public function edit(Ingredient $ingredient)
    {
        $units = Unit::all();
        return Inertia::render('Settings/Ingredients/Edit', [
            'ingredient' => $ingredient,
            'units' => $units,
        ]);
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'reference' => 'nullable|string|max:50',
            'default_unit_id' => 'required|exists:units,id',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $ingredient->update($validated);

        return redirect()->route('ingredientsIndex')->with('success', 'Ingrédient mis à jour.');
    }

    public function destroy(Ingredient $ingredient)
    {
        $ingredient->delete();
        return redirect()->route('ingredientsIndex')->with('success', 'Ingrédient supprimé.');
    }
}
