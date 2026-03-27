<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFlockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // La policy fera le reste
        return $this->user()->can('submit flocks');
    }

    public function rules(): array
    {
        return [];
    }
}
