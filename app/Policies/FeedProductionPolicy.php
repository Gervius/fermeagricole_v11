<?php

namespace App\Policies;

use App\Models\FeedProduction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FeedProductionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view feed productions');
    }

    public function view(User $user, FeedProduction $feedProduction): bool
    {
        return $user->can('view feed productions');
    }

    public function create(User $user): bool
    {
        return $user->can('create feed productions');
    }

    public function update(User $user, FeedProduction $feedProduction): bool
    {
        // Modifiable seulement si en draft et créateur
        return $feedProduction->isDraft()
            && $user->can('create feed productions')
            && $user->id === $feedProduction->created_by;
    }

    public function delete(User $user, FeedProduction $feedProduction): bool
    {
        // Supprimable seulement si en draft et créateur
        return $feedProduction->isDraft()
            && $user->can('create feed productions')
            && $user->id === $feedProduction->created_by;
    }

    public function submit(User $user, FeedProduction $feedProduction): bool
    {
        return $feedProduction->canBeSubmitted()
            && $user->can('submit feed productions')
            && $user->id === $feedProduction->created_by;
    }

    public function approve(User $user, FeedProduction $feedProduction): bool
    {
        return $feedProduction->canBeApproved()
            && $user->can('approve feed productions');
    }

    public function reject(User $user, FeedProduction $feedProduction): bool
    {
        return $feedProduction->canBeRejected()
            && $user->can('reject feed productions');
    }
}
