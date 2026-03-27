<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTreatmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create treatments');
    }

    public function rules(): array
    {
        return [
            'flock_id' => 'required|exists:flocks,id',
            'treatment_date' => 'required|date',
            'veterinarian' => 'nullable|string|max:255',
            'treatment_type' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'cost' => 'nullable|numeric|min:0',
            'invoice_reference' => 'nullable|string|max:50',
        ];
    }
}