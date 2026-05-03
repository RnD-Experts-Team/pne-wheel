<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Wheel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Wheel>
 */
class WheelFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'user_id' => User::factory(),
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'name' => $name,
            'brand_name' => $name,
            'brand_logo_path' => null,
            'address' => fake()->streetAddress().' · '.fake()->city(),
            'theme' => fake()->randomElement(['dark', 'casino', 'pastel']),
            'brand_color' => null,
            'hub_style' => 'classic',
            'pointer_style' => 'classic',
            'peg_style' => 'dots',
            'number_of_fields' => null,
            'sound_enabled' => true,
            'confetti_enabled' => true,
            'is_published' => true,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}
