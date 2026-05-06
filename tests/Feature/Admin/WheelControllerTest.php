<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\Wheel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WheelControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_admin_wheels(): void
    {
        $this->get(route('admin.wheels.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_sees_only_their_wheels(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Wheel::factory()->for($alice)->create(['name' => 'Alice Wheel']);
        Wheel::factory()->for($bob)->create(['name' => 'Bob Wheel']);

        $response = $this->actingAs($alice)->get(route('admin.wheels.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/wheels/index')
            ->has('wheels', 1)
            ->where('wheels.0.name', 'Alice Wheel'));
    }

    public function test_user_can_create_wheel_with_items_and_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.wheels.store'), [
            'name' => 'Spring Promo',
            'slug' => 'spring-promo',
            'brand_name' => 'CallMe Coffee',
            'address' => '1 Market St',
            'theme' => 'dark',
            'is_published' => 1,
            'sound_enabled' => 1,
            'confetti_enabled' => 1,
            'brand_logo' => UploadedFile::fake()->image('logo.png', 200, 200),
            'items' => [
                ['label' => '10% Off', 'weight' => 1, 'image' => UploadedFile::fake()->image('a.png', 64, 64)],
                ['label' => 'Free Drink', 'weight' => 2],
                ['label' => 'Try Again', 'weight' => 5],
            ],
        ]);

        $wheel = Wheel::query()->where('slug', 'spring-promo')->firstOrFail();

        $response->assertRedirect(route('admin.wheels.edit', $wheel));
        $this->assertSame($user->id, $wheel->user_id);
        $this->assertCount(3, $wheel->items);
        $this->assertNotNull($wheel->brand_logo_path);
        Storage::disk('public')->assertExists($wheel->brand_logo_path);
        $this->assertNotNull($wheel->items->first()->image_path);
    }

    public function test_slug_is_auto_generated_when_omitted(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $this->actingAs($user)->post(route('admin.wheels.store'), [
            'name' => 'Holiday Bash',
            'theme' => 'casino',
            'items' => [
                ['label' => 'A', 'weight' => 1],
                ['label' => 'B', 'weight' => 1],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('wheels', ['slug' => 'holiday-bash']);
    }

    public function test_owner_can_update_wheel_and_replace_items(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $wheel = Wheel::factory()->for($user)->create(['theme' => 'dark']);
        $existingItem = $wheel->items()->create(['label' => 'Old', 'weight' => 1, 'position' => 0]);

        $response = $this->actingAs($user)->put(route('admin.wheels.update', $wheel), [
            'name' => 'Renamed',
            'theme' => 'pastel',
            'is_published' => 1,
            'items' => [
                ['id' => $existingItem->id, 'label' => 'Updated label', 'weight' => 2],
                ['label' => 'New item', 'weight' => 1],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $wheel->refresh()->load('items');
        $this->assertSame('Renamed', $wheel->name);
        $this->assertSame('pastel', $wheel->theme);
        $this->assertCount(2, $wheel->items);
        $this->assertSame('Updated label', $wheel->items->first()->label);
    }

    public function test_user_cannot_edit_another_users_wheel(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $wheel = Wheel::factory()->for($owner)->create();

        $this->actingAs($intruder)
            ->get(route('admin.wheels.edit', $wheel))
            ->assertForbidden();

        $this->actingAs($intruder)
            ->put(route('admin.wheels.update', $wheel), [
                'name' => 'Hacked',
                'theme' => 'dark',
                'items' => [
                    ['label' => 'A', 'weight' => 1],
                    ['label' => 'B', 'weight' => 1],
                ],
            ])
            ->assertForbidden();
    }

    public function test_owner_can_delete_wheel(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $wheel = Wheel::factory()->for($user)->create();
        $wheel->items()->create(['label' => 'A', 'weight' => 1, 'position' => 0]);

        $this->actingAs($user)
            ->delete(route('admin.wheels.destroy', $wheel))
            ->assertRedirect(route('admin.wheels.index'));

        $this->assertDatabaseMissing('wheels', ['id' => $wheel->id]);
        $this->assertDatabaseMissing('wheel_items', ['wheel_id' => $wheel->id]);
    }

    public function test_validation_rejects_disallowed_image_types(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.wheels.store'), [
                'name' => 'Bad Wheel',
                'theme' => 'dark',
                'brand_logo' => UploadedFile::fake()->create('logo.gif', 10, 'image/gif'),
                'items' => [
                    ['label' => 'A', 'weight' => 1],
                    ['label' => 'B', 'weight' => 1],
                ],
            ])
            ->assertSessionHasErrors('brand_logo');
    }

    public function test_user_can_create_wheel_with_custom_styles(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('admin.wheels.store'), [
            'name' => 'Custom Style Wheel',
            'theme' => 'neon',
            'hub_style' => 'starburst',
            'pointer_style' => 'flag',
            'peg_style' => 'lights',
            'items' => [
                ['label' => 'A', 'weight' => 1],
                ['label' => 'B', 'weight' => 1],
            ],
        ])->assertSessionHasNoErrors();

        $wheel = Wheel::query()->where('name', 'Custom Style Wheel')->firstOrFail();
        $this->assertSame('neon', $wheel->theme);
        $this->assertSame('starburst', $wheel->hub_style);
        $this->assertSame('flag', $wheel->pointer_style);
        $this->assertSame('lights', $wheel->peg_style);
    }

    public function test_user_can_create_wheel_with_new_realistic_pointer_style(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('admin.wheels.store'), [
            'name' => 'Realistic Marker Wheel',
            'theme' => 'dark',
            'pointer_style' => 'needle',
            'items' => [
                ['label' => 'A', 'weight' => 1],
                ['label' => 'B', 'weight' => 1],
            ],
        ])->assertSessionHasNoErrors();

        $wheel = Wheel::query()->where('name', 'Realistic Marker Wheel')->firstOrFail();
        $this->assertSame('needle', $wheel->pointer_style);
    }

    public function test_user_can_create_wheel_with_royal_theme(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('admin.wheels.store'), [
            'name' => 'Royal Theme Wheel',
            'theme' => 'royal',
            'items' => [
                ['label' => 'A', 'weight' => 1],
                ['label' => 'B', 'weight' => 1],
            ],
        ])->assertSessionHasNoErrors();

        $wheel = Wheel::query()->where('name', 'Royal Theme Wheel')->firstOrFail();
        $this->assertSame('royal', $wheel->theme);
    }

    public function test_invalid_style_values_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.wheels.store'), [
                'name' => 'Bad styles',
                'theme' => 'dark',
                'hub_style' => 'wobble',
                'items' => [
                    ['label' => 'A', 'weight' => 1],
                    ['label' => 'B', 'weight' => 1],
                ],
            ])
            ->assertSessionHasErrors('hub_style');
    }

    public function test_validation_requires_at_least_two_items(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.wheels.store'), [
                'name' => 'Tiny Wheel',
                'theme' => 'dark',
                'items' => [
                    ['label' => 'Only one', 'weight' => 1],
                ],
            ])
            ->assertSessionHasErrors('items');
    }
}
