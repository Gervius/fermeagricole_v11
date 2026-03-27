<?php
// app/Http/Requests/UpdateTreatmentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTreatmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('treatment'));
    }

    public function rules(): array
    {
        return [
            'flock_id' => 'sometimes|exists:flocks,id',
            'treatment_date' => 'sometimes|date',
            'veterinarian' => 'nullable|string|max:255',
            'treatment_type' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'cost' => 'nullable|numeric|min:0',
            'invoice_reference' => 'nullable|string|max:50',
        ];
    }
}