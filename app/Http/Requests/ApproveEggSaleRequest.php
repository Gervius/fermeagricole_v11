<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveEggSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('approve egg sales');
    }

    public function rules(): array
    {
        return [];
    }
}
