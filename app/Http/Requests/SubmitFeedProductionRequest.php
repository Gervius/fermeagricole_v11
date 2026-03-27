<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFeedProductionRequest extends FormRequest
{

    public function authorize(): bool
    {
        return $this->user()->can('submit feed productions');
    }

    public function rules(): array
    {
        return [];
    }
}
