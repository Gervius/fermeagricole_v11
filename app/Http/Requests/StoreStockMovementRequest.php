<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create stock movements');
    }

    public function rules(): array
    {
        return [
            'ingredient_id' => 'required|exists:ingredients,id',
            'type' => 'required|in:in,out,adjust',
            'quantity' => 'required|numeric|min:0',
            'unit_id' => 'required|exists:units,id',
            'unit_price' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string|max:500',
        ];
    }
}
