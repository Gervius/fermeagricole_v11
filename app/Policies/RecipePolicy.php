<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Recipe;

class RecipePolicy
{
    
    
    public function viewAny(User $user): bool
    {
        return $user->can('view recipes');
    }

    public function view(User $user, Recipe $recipe): bool
    {
        return $user->can('view recipes');
    }

    public function create(User $user): bool
    {
        return $user->can('create recipes');
    }

    public function update(User $user, Recipe $recipe): bool
    {
        return $user->can('edit recipes');
    }

    public function delete(User $user, Recipe $recipe): bool
    {
        return $user->can('delete recipes');
    }
    
}
