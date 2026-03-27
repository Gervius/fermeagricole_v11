<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;


use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct()
    {
        //
    }

    public function index(Request $request): Response
    {
        $users = User::with('roles')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->paginate($request->get('per_page', 15))
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'created_at' => $user->created_at->format('d/m/Y'),
            ]);

        return Inertia::render('Settings/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function create(): Response
    {
        $roles = Role::all()->map(fn ($role) => [
            'value' => $role->id,
            'label' => $role->name,
        ]);

        return Inertia::render('Settings/Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create($request->validated());

        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }

        return redirect()->route('usersIndex')
            ->with('success', 'Utilisateur créé avec succès.');
    }

    public function edit(User $user): Response
    {
        $roles = Role::all()->map(fn ($role) => [
            'value' => $role->id,
            'label' => $role->name,
        ]);

        $user->load('roles');

        return Inertia::render('Settings/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('id'),
            ],
            'roles' => $roles,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->validated());

        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }

        return redirect()->route('usersIndex')
            ->with('success', 'Utilisateur mis à jour.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('usersIndex')
            ->with('success', 'Utilisateur supprimé.');
    }
}
