<?php


namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectTreatmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('reject', $this->route('treatment'));
    }

    public function rules(): array
    {
        return [
            'reason' => 'required|string|max:500',
        ];
    }
}