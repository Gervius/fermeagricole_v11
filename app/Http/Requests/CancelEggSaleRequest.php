<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelEggSaleRequest extends FormRequest
{
   public function authorize(): bool
    {
        return $this->user()->can('cancel egg sales');
    }

    public function rules(): array
    {
        return [
            'reason' => 'required|string|max:500',
        ];
    }
}
