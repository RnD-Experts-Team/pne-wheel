<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@pneunited.com')],
            [
                'name' => 'PNE Admin',
                'password' => env('ADMIN_PASSWORD', 'PNEWheel@2026'),
                'email_verified_at' => now(),
            ],
        );
    }
}
