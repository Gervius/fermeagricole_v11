<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFlockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create flocks');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'building_id' => 'required|exists:buildings,id',
            'arrival_date' => 'required|date',
            'initial_quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'purchase_cost' => 'nullable|numeric|min:0',
        ];
    }
}
