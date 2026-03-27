<?php

namespace App\Policies;

use App\Models\Building;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BuildingPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view buildings');
    }

    public function view(User $user, Building $building): bool
    {
        return $user->can('view buildings');
    }

    public function create(User $user): bool
    {
        return $user->can('create buildings');
    }

    public function update(User $user, Building $building): bool
    {
        return $user->can('edit buildings');
    }

    public function delete(User $user, Building $building): bool
    {
        return $user->can('delete buildings');
    }
}
