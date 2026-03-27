<?php

namespace App\Policies;

use App\Models\DailyRecord;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DailyRecordPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view daily records');
    }

    public function view(User $user, DailyRecord $dailyRecord): bool
    {
        return $user->can('view daily records');
    }

    public function create(User $user): bool
    {
        return $user->can('create daily records');
    }

    public function update(User $user, DailyRecord $dailyRecord): bool
    {
        // Seulement si en attente ET (créateur ou admin)
        return $dailyRecord->isPending()
            && $user->can('create daily records')
            && ($user->id === $dailyRecord->created_by || $user->hasRole('Admin'));
    }

    public function delete(User $user, DailyRecord $dailyRecord): bool
    {
        // Seulement si en attente ET (créateur ou admin)
        return $dailyRecord->isPending()
            && $user->can('create daily records')
            && ($user->id === $dailyRecord->created_by || $user->hasRole('Admin'));
    }

    public function approve(User $user, DailyRecord $dailyRecord): bool
    {
        return $dailyRecord->canBeApproved() && $user->can('approve daily records');
    }

    public function reject(User $user, DailyRecord $dailyRecord): bool
    {
        return $dailyRecord->canBeRejected() && $user->can('reject daily records');
    }
}
