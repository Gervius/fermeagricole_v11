<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveStockMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('approve stock movements');
    }

    public function rules(): array
    {
        return [];
    }
}
