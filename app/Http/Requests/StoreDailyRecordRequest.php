<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDailyRecordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create daily records');
    }

    public function rules(): array
    {
        return [
            'flock_id' => 'required|exists:flocks,id',
            'date' => 'required|date',
            'losses' => 'required|integer|min:0',
            'eggs' => 'required|integer|min:0',
            'feed_type_id' => 'nullable|exists:recipes,id',
            'feed_consumed' => 'nullable|numeric|min:0',
            'water_consumed' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ];
    }
}
