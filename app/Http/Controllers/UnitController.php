<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class UnitController extends Controller
{
    

    public function index()
    {
        $units = Unit::with('baseUnit')->paginate(15);
        return Inertia::render('Settings/Units/Index', ['units' => $units]);
    }

    public function create()
    {
        $baseUnits = Unit::whereNull('base_unit_id')->get(); // unités de base
        return Inertia::render('Settings/Units/Create', ['baseUnits' => $baseUnits]);
    }

    public function store(Request $request)
    {
        //$this->authorize('create', Unit::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'type' => 'required|in:mass,volume,unit',
            'conversion_factor' => 'nullable|numeric|min:0',
            'base_unit_id' => 'nullable|exists:units,id',
        ]);

        Unit::create($validated);

        return redirect()->route('unitsIndex')->with('success', 'Unité créée.');
    }

    public function edit(Unit $unit)
    {
        $baseUnits = Unit::whereNull('base_unit_id')->get();
        return Inertia::render('Settings/Units/Edit', [
            'unit' => $unit,
            'baseUnits' => $baseUnits,
        ]);
    }

    public function update(Request $request, Unit $unit)
    {   
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'type' => 'required|in:mass,volume,unit',
            'conversion_factor' => 'nullable|numeric|min:0',
            'base_unit_id' => 'nullable|exists:units,id',
        ]);

        $unit->update($validated);

        return redirect()->route('unitsIndex')->with('success', 'Unité mise à jour.');
    }

    public function destroy(Unit $unit)
    {
        
        $unit->delete();
        return redirect()->route('unitsIndex')->with('success', 'Unité supprimée.');
    }
}
