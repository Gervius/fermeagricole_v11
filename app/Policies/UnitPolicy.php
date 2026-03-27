<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Unit;

class UnitPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view units');
    }

    public function view(User $user, Unit $unit): bool
    {
        return $user->can('view units');
    }

    public function create(User $user): bool
    {
        return $user->can('create units');
    }

    public function update(User $user, Unit $unit): bool
    {
        return $user->can('edit units');
    }

    public function delete(User $user, Unit $unit): bool
    {
        return $user->can('delete units');
    }
}
