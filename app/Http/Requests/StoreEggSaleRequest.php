<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEggSaleRequest extends FormRequest
{


    public function authorize(): bool
    {
        return $this->user()->can('create egg sales');
    }

    public function rules(): array
    {
        return [
            'sale_date' => 'required|date',
            'customer_name' => 'nullable|string|max:255',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
