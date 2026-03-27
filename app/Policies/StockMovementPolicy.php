<?php

namespace App\Policies;

use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class StockMovementPolicy
{

   public function viewAny(User $user): bool
    {
        return $user->can('view stock movements');
    }

    public function view(User $user, StockMovement $stockMovement): bool
    {
        return $user->can('view stock movements');
    }

    public function create(User $user): bool
    {
        return $user->can('create stock movements');
    }

    public function update(User $user, StockMovement $stockMovement): bool
    {
        // Seulement si en attente ET créateur
        return $stockMovement->isPending()
            && $user->can('create stock movements')
            && $user->id === $stockMovement->created_by;
    }

    public function delete(User $user, StockMovement $stockMovement): bool
    {
        // Seulement si en attente ET créateur
        return $stockMovement->isPending()
            && $user->can('create stock movements')
            && $user->id === $stockMovement->created_by;
    }

    public function approve(User $user, StockMovement $stockMovement): bool
    {
        return $stockMovement->canBeApproved() && $user->can('approve stock movements');
    }

    public function reject(User $user, StockMovement $stockMovement): bool
    {
        return $stockMovement->canBeRejected() && $user->can('reject stock movements');
    }
}
