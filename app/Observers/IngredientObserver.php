<?php

namespace App\Observers;

use App\Models\Ingredient;

class IngredientObserver
{
    /**
     * Handle the Ingredient "created" event.
     */
    public function created(Ingredient $ingredient): void
    {
        //
    }

    /**
     * Handle the Ingredient "updated" event.
     */
    public function updated(Ingredient $ingredient): void
    {
        //
    }

    /**
     * Handle the Ingredient "deleted" event.
     */
    public function deleting(Ingredient $ingredient): void
    {
        if ($ingredient->movements()->exists() || $ingredient->recipes()->exists()) {
            throw new \Exception("Impossible de supprimer cet ingrédient car il est lié à des recettes ou des mouvements de stock.");
        }
    }

    public function deleted(Ingredient $ingredient): void
    {
        //
    }

    /**
     * Handle the Ingredient "restored" event.
     */
    public function restored(Ingredient $ingredient): void
    {
        //
    }

    /**
     * Handle the Ingredient "force deleted" event.
     */
    public function forceDeleted(Ingredient $ingredient): void
    {
        //
    }
}
