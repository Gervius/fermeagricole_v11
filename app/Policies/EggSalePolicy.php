<?php

namespace App\Policies;

use App\Models\EggSale;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EggSalePolicy
{
    
    public function viewAny(User $user): bool
    {
        return $user->can('view egg sales');
    }

    public function view(User $user, EggSale $eggSale): bool
    {
        return $user->can('view egg sales');
    }

    public function create(User $user): bool
    {
        return $user->can('create egg sales');
    }

    public function update(User $user, EggSale $eggSale): bool
    {
        return $eggSale->isDraft()
            && $user->can('edit egg sales')
            && ($user->id === $eggSale->created_by || $user->hasRole('Admin'));
    }

    public function delete(User $user, EggSale $eggSale): bool
    {
        return $eggSale->isDraft()
            && $user->can('delete egg sales')
            && ($user->id === $eggSale->created_by || $user->hasRole('Admin'));
    }

    public function approve(User $user, EggSale $eggSale): bool
    {
        return $eggSale->canBeApproved() && $user->can('approve egg sales');
    }

    public function cancel(User $user, EggSale $eggSale): bool
    {
        return $eggSale->canBeCancelled() && $user->can('cancel egg sales');
    }
}
