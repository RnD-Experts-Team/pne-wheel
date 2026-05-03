<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_is_seeded_with_expected_credentials(): void
    {
        $this->seed(AdminUserSeeder::class);

        $admin = User::query()->where('email', 'admin@callme.wheels')->first();

        $this->assertNotNull($admin);
        $this->assertSame('Callme Admin', $admin->name);
        $this->assertTrue(Hash::check('Callme123456!', $admin->password));
        $this->assertNotNull($admin->email_verified_at);
    }
}