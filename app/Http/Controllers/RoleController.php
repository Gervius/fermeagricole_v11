<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct()
    {
        //
    }

    public function index(): Response
    {
        $roles = Role::with('permissions')
            ->paginate(15)
            ->through(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'created_at' => $role->created_at->format('d/m/Y'),
            ]);

        return Inertia::render('Settings/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function create(): Response
    {
        $permissions = Permission::all()->map(fn ($perm) => [
            'value' => $perm->id,
            'label' => $perm->name,
        ]);

        return Inertia::render('Settings/Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        $role = Role::create(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return redirect()->route('rolesIndex')
            ->with('success', 'Rôle créé avec succès.');
    }

    public function edit(Role $role): Response
    {
        $role->load('permissions');
        $permissions = Permission::all()->map(fn ($perm) => [
            'value' => $perm->id,
            'label' => $perm->name,
        ]);

        return Inertia::render('Settings/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('id'),
            ],
            'permissions' => $permissions,
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return redirect()->route('rolesIndex')
            ->with('success', 'Rôle mis à jour.');
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return redirect()->route('rolesIndex')
            ->with('success', 'Rôle supprimé.');
    }
}
