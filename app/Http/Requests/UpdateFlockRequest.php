<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFlockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // La vérification fine est dans la policy, mais on peut aussi
        // s'assurer que l'utilisateur a la permission de base
        return $this->user()->can('edit flocks');
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'building_id' => 'sometimes|exists:buildings,id',
            'arrival_date' => 'sometimes|date',
            'initial_quantity' => 'sometimes|integer|min:1',
            'notes' => 'nullable|string',
        ];
    }
}
