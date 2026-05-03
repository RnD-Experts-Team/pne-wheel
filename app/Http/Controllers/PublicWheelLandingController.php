<?php

namespace App\Http\Controllers;

use App\Models\Wheel;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicWheelLandingController extends Controller
{
    public function __invoke(): Response
    {
        $wheels = Wheel::query()
            ->where('is_published', true)
            ->withCount('items')
            ->latest('updated_at')
            ->limit(60)
            ->get()
            ->map(fn (Wheel $wheel) => [
                'id' => $wheel->id,
                'slug' => $wheel->slug,
                'name' => $wheel->name,
                'brand_name' => $wheel->brand_name ?: $wheel->name,
                'address' => $wheel->address,
                'theme' => $wheel->theme,
                'brand_logo_url' => $wheel->brand_logo_path
                    ? Storage::disk('public')->url($wheel->brand_logo_path)
                    : null,
                'items_count' => $wheel->items_count,
                'public_url' => route('wheel.show', $wheel),
            ]);

        return Inertia::render('welcome', [
            'wheels' => $wheels,
        ]);
    }
}
