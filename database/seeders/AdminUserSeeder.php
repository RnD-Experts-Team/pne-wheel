<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@callme.wheels')],
            [
                'name' => 'Callme Admin',
                'password' => env('ADMIN_PASSWORD', 'Callme123456!'),
                'email_verified_at' => now(),
            ],
        );
    }
}