<?php

namespace App\Http\Controllers;

use App\Models\Building;
use Illuminate\Http\Request;
use Inertia\Inertia;


class BuildingController extends Controller
{
    public function __construct()
    {
        //
    }

    public function index()
    {
        $buildings = Building::paginate(10);
        return Inertia::render('Settings/Buildings/Index', ['buildings' => $buildings]);
    }

    public function create()
    {
        // On n'utilise plus la vue Create, tout se fait via la modal dans Index
        return redirect()->route('buildingsIndex');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
        ]);

        Building::create($validated);

        return redirect()->back()->with('success', 'Bâtiment créé.');
    }

    public function edit(Building $building)
    {
        // On n'utilise plus la vue Edit, tout se fait via la modal dans Index
        return redirect()->route('buildingsIndex');
    }

    public function update(Request $request, Building $building)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
        ]);

        $building->update($validated);

        return redirect()->back()->with('success', 'Bâtiment mis à jour.');
    }

    public function destroy(Building $building)
    {
        $building->delete();
        return redirect()->back()->with('success', 'Bâtiment supprimé.');
    }
}
