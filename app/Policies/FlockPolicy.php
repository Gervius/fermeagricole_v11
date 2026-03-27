<?php

namespace App\Policies;

use App\Models\Flock;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FlockPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view flocks');
    }

    /**
     * Détermine si l'utilisateur peut voir un lot spécifique.
     * Tous ceux qui ont la permission 'view flocks' peuvent voir.
     */
    public function view(User $user, Flock $flock): bool
    {
        return $user->can('view flocks');
    }

    /**
     * Création : seulement si permission 'create flocks'.
     */
    public function create(User $user): bool
    {
        return $user->can('create flocks');
    }

    /**
     * Mise à jour : seulement si le lot est modifiable (brouillon/rejeté) ET
     * l'utilisateur a la permission 'edit flocks' ET est le créateur (ou admin).
     */
    public function update(User $user, Flock $flock): bool
    {
        if (!$flock->isEditable()) {
            return false;
        }

        // Seul le créateur ou un admin peut modifier
        return $user->can('edit flocks') && ($user->id === $flock->created_by || $user->hasRole('Admin'));
    }

    /**
     * Suppression : seulement si le lot est en brouillon ET (créateur ou admin).
     */
    public function delete(User $user, Flock $flock): bool
    {
        if (!$flock->canBeDeleted()) {
            return false;
        }

        return $user->can('delete flocks') && ($user->id === $flock->created_by || $user->hasRole('Admin'));
    }

    /**
     * Soumission pour approbation.
     */
    public function submit(User $user, Flock $flock): bool
    {
        // Seulement si le lot est modifiable et que l'utilisateur est le créateur ou admin
        return $flock->canBeSubmitted()
            && $user->can('submit flocks')
            && ($user->id === $flock->created_by || $user->hasRole('Admin'));
    }

    /**
     * Approbation.
     */
    public function approve(User $user, Flock $flock): bool
    {
        // Seulement si en attente et l'utilisateur a la permission
        return $flock->canBeApproved() && $user->can('approve flocks');
    }

    /**
     * Rejet.
     */
    public function reject(User $user, Flock $flock): bool
    {
        // Seulement si en attente et l'utilisateur a la permission
        return $flock->canBeRejected() && $user->can('reject flocks');
    }

    public function end(User $user, Flock $flock): bool
    {
        // Seulement si actif et l'utilisateur a la permission
        return $flock->canBeEnded() && $user->can('end flocks');
    }
}
