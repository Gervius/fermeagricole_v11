<?php

namespace App\Policies;

use App\Models\User;

class PermissionPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function viewAny(User $user): bool
    {
        return $user->can('view permissions');
    }

    public function view(User $user, Permission $permission): bool
    {
        return $user->can('view permissions');
    }

    // On peut bloquer création/modification si on veut
    public function create(User $user): bool
    {
        return false; // ou via une permission spécifique
    }

    public function update(User $user, Permission $permission): bool
    {
        return false;
    }

    public function delete(User $user, Permission $permission): bool
    {
        return false;
    }

}
