<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFlocksSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create flock sales');
    }

    public function rules(): array
    {
        return [
            'flock_id' => 'required|exists:flocks,id',
            'sale_date' => 'required|date',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'buyer_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ];
    }
}
