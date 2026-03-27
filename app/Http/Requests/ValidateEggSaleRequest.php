<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidateEggSaleRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return $this->user()->can('validate egg sales');
    }

    public function rules(): array
    {
        return [];
    }
}
