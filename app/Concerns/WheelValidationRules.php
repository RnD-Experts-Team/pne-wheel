<?php

namespace App\Concerns;

use Illuminate\Validation\Rule;

trait WheelValidationRules
{
    /**
     * @return array<string, mixed>
     */
    protected function wheelRules(?int $wheelId = null): array
    {
        $slugRule = Rule::unique('wheels', 'slug');
        if ($wheelId !== null) {
            $slugRule = $slugRule->ignore($wheelId);
        }

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', 'regex:/^[a-z0-9-]+$/', $slugRule],
            'brand_name' => ['nullable', 'string', 'max:120'],
            'brand_logo' => ['nullable', 'file', 'mimetypes:image/png,image/svg+xml', 'max:512'],
            'remove_brand_logo' => ['boolean'],
            'address' => ['nullable', 'string', 'max:255'],
            'theme' => [
                'required',
                Rule::in(['dark', 'casino', 'pastel', 'neon', 'royal', 'gold', 'ocean', 'sunset', 'midnight', 'retro', 'brand', 'custom']),
            ],
            'brand_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette' => ['nullable', 'array'],
            'custom_palette.accent' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette.rim' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette.pointer' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette.textColor' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette.background' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette.surface' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'custom_palette.sliceColors' => ['nullable', 'array', 'max:8'],
            'custom_palette.sliceColors.*' => ['string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'hub_style' => ['nullable', Rule::in(['classic', 'minimal', 'logo', 'starburst'])],
            'pointer_style' => ['nullable', Rule::in(['classic', 'arrow', 'flag', 'triangle', 'pin', 'ball', 'diamond', 'needle', 'spear', 'crown'])],
            'peg_style' => ['nullable', Rule::in(['dots', 'lights', 'none'])],
            'number_of_fields' => ['nullable', 'integer', 'min:2', 'max:24'],
            'sound_enabled' => ['boolean'],
            'confetti_enabled' => ['boolean'],
            'is_published' => ['boolean'],

            'items' => ['required', 'array', 'min:2', 'max:24'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.label' => ['required', 'string', 'max:80'],
            'items.*.weight' => ['required', 'integer', 'min:1', 'max:100'],
            'items.*.image' => ['nullable', 'file', 'mimetypes:image/png,image/svg+xml', 'max:512'],
            'items.*.remove_image' => ['boolean'],
            'items.*.existing_image_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
