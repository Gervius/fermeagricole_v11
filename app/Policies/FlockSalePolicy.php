<?php

namespace App\Policies;

use App\Models\FlockSale;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FlockSalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view flock sales');
    }

    public function view(User $user, FlockSale $flockSale): bool
    {
        return $user->can('view flock sales');
    }

    public function create(User $user): bool
    {
        return $user->can('create flock sales');
    }

    public function update(User $user, FlockSale $flockSale): bool
    {
        return $flockSale->isPending()
            && $user->can('edit flock sales')
            && ($user->id === $flockSale->created_by || $user->hasRole('Admin'));
    }

    public function delete(User $user, FlockSale $flockSale): bool
    {
        return $flockSale->isPending()
            && $user->can('delete flock sales')
            && ($user->id === $flockSale->created_by || $user->hasRole('Admin'));
    }

    public function approve(User $user, FlockSale $flockSale): bool
    {
        return $flockSale->canBeApproved() && $user->can('approve flock sales');
    }

    public function reject(User $user, FlockSale $flockSale): bool
    {
        return $flockSale->canBeRejected() && $user->can('reject flock sales');
    }
}
