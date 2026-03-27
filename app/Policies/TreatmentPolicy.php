<?php

namespace App\Policies;

use App\Models\Treatment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TreatmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view treatments');
    }

    public function view(User $user, Treatment $treatment): bool
    {
        return $user->can('view treatments');
    }

    public function create(User $user): bool
    {
        return $user->can('create treatments');
    }

    public function update(User $user, Treatment $treatment): bool
    {
        // Peut modifier si c'est le créateur ou admin, et seulement si le traitement n'est pas terminé
        return $user->can('edit treatments')
            && ($user->id === $treatment->created_by || $user->hasRole('Admin'))
            && $treatment->status === 'draft'; // On ne peut modifier que les programmés
    }

    public function delete(User $user, Treatment $treatment): bool
    {
        // Peut supprimer si c'est le créateur ou admin, et seulement si programmé
        return $user->can('delete treatments')
            && ($user->id === $treatment->created_by || $user->hasRole('Admin'))
            && $treatment->status === 'draft'; // On ne peut supprimer que les programmés
    }


    
    public function approve(User $user, Treatment $treatment): bool
    {
        return $user->can('approve treatments') && $treatment->canBeApproved();
    }

    public function reject(User $user, Treatment $treatment): bool
    {
        return $treatment->canBeRejected() && $user->can('reject treatments');
    }
}
