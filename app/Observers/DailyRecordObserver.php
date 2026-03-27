<?php

namespace App\Observers;

use App\Models\DailyRecord;
use App\Models\EggMovement;
use App\Models\StockMouvement;
use App\Models\Ingredient;

class DailyRecordObserver
{
    public function updated(DailyRecord $record): void
    {
        if ($record->wasChanged('status') && $record->status === 'approved') {
            if ($record->eggs > 0) {
                EggMovement::create([
                'date' => $record->date,
                'type' => 'in',
                'quantity' => $record->eggs,
                'source_id' => $record->id,
                'source_type' => DailyRecord::class,
                'created_by' => $record->approved_by,
                    'notes' => "Production du lot: " . $record->flock->name,
                ]);
            }

            if ($record->feed_consumed > 0 && $record->feed_type_id) {
                // Find the corresponding pseudo-ingredient for this recipe
                $feedIngredient = Ingredient::where('reference', 'FEED-' . $record->feed_type_id)
                                            ->orWhere('name', $record->feedType?->name)
                                            ->first();

                if ($feedIngredient) {
                    StockMouvement::create([
                        'ingredient_id' => $feedIngredient->id,
                        'type' => 'out',
                        'quantity' => $record->feed_consumed,
                        'unit_id' => $feedIngredient->default_unit_id,
                        'unit_price' => $feedIngredient->pmp, // Use PMP of the ingredient
                        'reason' => "Consommation du lot: {$record->flock->name} (RECORD-{$record->id})",
                        'status' => 'approved',
                        'created_by' => $record->approved_by,
                        'approved_by' => $record->approved_by,
                        'approved_at' => now(),
                    ]);
                }
            }
        }
    }
}