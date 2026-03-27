<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveFeedProductionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('approve feed productions');
    }

    public function rules(): array
    {
        return [];
    }
}
