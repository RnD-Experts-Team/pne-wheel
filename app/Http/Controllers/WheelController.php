<?php

namespace App\Http\Controllers;

use App\Models\Wheel;
use App\Models\WheelItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class WheelController extends Controller
{
    public function show(Wheel $wheel): Response
    {
        abort_unless($wheel->is_published, 404);

        $wheel->load('items');

        return Inertia::render('wheel', [
            'wheel' => $this->serialize($wheel),
            'spinEndpoint' => route('wheel.spin', $wheel),
        ]);
    }

    public function spin(Wheel $wheel): JsonResponse
    {
        abort_unless($wheel->is_published, 404);

        $items = $wheel->items()->orderBy('position')->get();
        abort_if($items->isEmpty(), 404, 'Wheel has no items.');

        $totalWeight = (int) $items->sum('weight');
        $roll = random_int(1, max($totalWeight, 1));

        $cursor = 0;
        $winningIndex = 0;
        foreach ($items as $i => $item) {
            $cursor += $item->weight;
            if ($roll <= $cursor) {
                $winningIndex = $i;
                break;
            }
        }

        $winner = $items[$winningIndex];

        return response()->json([
            'index' => $winningIndex,
            'item' => [
                'id' => $winner->id,
                'label' => $winner->label,
                'image_url' => $winner->image_path
                    ? Storage::disk('public')->url($winner->image_path)
                    : null,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Wheel $wheel): array
    {
        return [
            'id' => $wheel->id,
            'slug' => $wheel->slug,
            'name' => $wheel->name,
            'brand_name' => $wheel->brand_name ?: $wheel->name,
            'brand_logo_url' => $wheel->brand_logo_path
                ? Storage::disk('public')->url($wheel->brand_logo_path)
                : null,
            'address' => $wheel->address,
            'theme' => $wheel->theme,
            'brand_color' => $wheel->brand_color,
            'custom_palette' => $wheel->custom_palette,
            'hub_style' => $wheel->hub_style,
            'pointer_style' => $wheel->pointer_style,
            'peg_style' => $wheel->peg_style,
            'number_of_fields' => $wheel->number_of_fields,
            'sound_enabled' => $wheel->sound_enabled,
            'confetti_enabled' => $wheel->confetti_enabled,
            'items' => $wheel->items->map(fn (WheelItem $item) => [
                'id' => $item->id,
                'label' => $item->label,
                'image_url' => $item->image_path
                    ? Storage::disk('public')->url($item->image_path)
                    : null,
            ])->values(),
        ];
    }
}
