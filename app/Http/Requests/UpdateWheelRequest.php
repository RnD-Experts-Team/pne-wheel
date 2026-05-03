<?php

namespace App\Http\Requests;

use App\Concerns\WheelValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWheelRequest extends FormRequest
{
    use WheelValidationRules;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->wheelRules($this->route('wheel')?->id);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'sound_enabled' => $this->boolean('sound_enabled'),
            'confetti_enabled' => $this->boolean('confetti_enabled'),
            'is_published' => $this->boolean('is_published'),
            'remove_brand_logo' => $this->boolean('remove_brand_logo'),
        ]);
    }
}
