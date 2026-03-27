<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveFlockSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La policy fera le reste
        return $this->user()->can('approve flocks sales');
    }

    public function rules(): array
    {
        return [];
    }
}
