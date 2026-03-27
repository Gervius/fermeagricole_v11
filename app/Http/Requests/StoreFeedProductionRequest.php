<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeedProductionRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return $this->user()->can('create feed productions');
    }

    protected function prepareForValidation()
    {
        // The frontend form sends 'quantity' and we map it to 'quantity_produced'
        // We also need to get the unit from the recipe if not provided
        $recipe = \App\Models\Recipe::find($this->input('recipe_id'));

        $this->merge([
            'quantity_produced' => $this->input('quantity_produced', $this->input('quantity')),
            'unit_id' => $this->input('unit_id', $recipe ? $recipe->unit_id : null),
        ]);
    }

    public function rules(): array
    {
        return [
            'recipe_id' => 'required|exists:recipes,id',
            'quantity_produced' => 'required|numeric|min:0',
            'unit_id' => 'required|exists:units,id',
            'production_date' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }
}
