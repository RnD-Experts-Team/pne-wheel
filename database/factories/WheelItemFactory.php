<?php

namespace Database\Factories;

use App\Models\Wheel;
use App\Models\WheelItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WheelItem>
 */
class WheelItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'wheel_id' => Wheel::factory(),
            'label' => fake()->randomElement([
                '10% Off', 'Free Drink', 'Try Again', '$5 Voucher',
                'Mystery Gift', '20% Off', 'Free Item', 'Thank You',
            ]),
            'image_path' => null,
            'weight' => 1,
            'position' => 0,
        ];
    }
}
