<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wheel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicWheelTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_wheel_renders_for_anyone(): void
    {
        $user = User::factory()->create();
        $wheel = Wheel::factory()->for($user)->create([
            'is_published' => true,
            'name' => 'Public Wheel',
        ]);
        $wheel->items()->createMany([
            ['label' => 'A', 'weight' => 1, 'position' => 0],
            ['label' => 'B', 'weight' => 1, 'position' => 1],
        ]);

        $this->get(route('wheel.show', $wheel))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('wheel')
                ->where('wheel.slug', $wheel->slug)
                ->has('wheel.items', 2));
    }

    public function test_unpublished_wheel_returns_404(): void
    {
        $user = User::factory()->create();
        $wheel = Wheel::factory()->unpublished()->for($user)->create();

        $this->get(route('wheel.show', $wheel))->assertNotFound();
        $this->postJson(route('wheel.spin', $wheel))->assertNotFound();
    }

    public function test_spin_returns_index_within_item_range(): void
    {
        $user = User::factory()->create();
        $wheel = Wheel::factory()->for($user)->create(['is_published' => true]);
        $wheel->items()->createMany([
            ['label' => 'A', 'weight' => 1, 'position' => 0],
            ['label' => 'B', 'weight' => 1, 'position' => 1],
            ['label' => 'C', 'weight' => 1, 'position' => 2],
        ]);

        $response = $this->postJson(route('wheel.spin', $wheel));
        $response->assertOk();

        $payload = $response->json();
        $this->assertIsInt($payload['index']);
        $this->assertGreaterThanOrEqual(0, $payload['index']);
        $this->assertLessThan(3, $payload['index']);
        $this->assertContains($payload['item']['label'], ['A', 'B', 'C']);
    }

    public function test_spin_respects_weighting(): void
    {
        $user = User::factory()->create();
        $wheel = Wheel::factory()->for($user)->create(['is_published' => true]);
        $wheel->items()->createMany([
            ['label' => 'Always', 'weight' => 100, 'position' => 0],
            ['label' => 'Never', 'weight' => 0, 'position' => 1],
        ]);

        for ($i = 0; $i < 25; $i++) {
            $payload = $this->postJson(route('wheel.spin', $wheel))->json();
            $this->assertSame('Always', $payload['item']['label']);
        }
    }

    public function test_spin_404s_when_no_items(): void
    {
        $user = User::factory()->create();
        $wheel = Wheel::factory()->for($user)->create(['is_published' => true]);

        $this->postJson(route('wheel.spin', $wheel))->assertNotFound();
    }
}
