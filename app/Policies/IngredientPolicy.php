<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Ingredient;

class IngredientPolicy
{

    public function viewAny(User $user): bool
    {
        return $user->can('view ingredients');
    }

    public function view(User $user, Ingredient $ingredient): bool
    {
        return $user->can('view ingredients');
    }

    public function create(User $user): bool
    {
        return $user->can('create ingredients');
    }

    public function update(User $user, Ingredient $ingredient): bool
    {
        return $user->can('edit ingredients');
    }

    public function delete(User $user, Ingredient $ingredient): bool
    {
        return $user->can('delete ingredients');
    }
}
