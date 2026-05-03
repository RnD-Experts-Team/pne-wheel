<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWheelRequest;
use App\Http\Requests\UpdateWheelRequest;
use App\Models\Wheel;
use App\Models\WheelItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WheelController extends Controller
{
    public function index(Request $request): Response
    {
        $wheels = $request->user()->wheels()
            ->withCount('items')
            ->latest('updated_at')
            ->get()
            ->map(fn (Wheel $wheel) => [
                'id' => $wheel->id,
                'slug' => $wheel->slug,
                'name' => $wheel->name,
                'theme' => $wheel->theme,
                'is_published' => $wheel->is_published,
                'items_count' => $wheel->items_count,
                'public_url' => route('wheel.show', $wheel->slug),
                'edit_url' => route('admin.wheels.edit', $wheel),
                'updated_at' => $wheel->updated_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/wheels/index', [
            'wheels' => $wheels,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/wheels/create');
    }

    public function store(StoreWheelRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $wheel = DB::transaction(function () use ($request, $data) {
            $logoPath = $request->hasFile('brand_logo')
                ? $request->file('brand_logo')->store('wheel-logos', 'public')
                : null;

            $wheel = $request->user()->wheels()->create([
                'slug' => $this->resolveSlug($data['slug'] ?? null, $data['name']),
                'name' => $data['name'],
                'brand_name' => $data['brand_name'] ?? null,
                'brand_logo_path' => $logoPath,
                'address' => $data['address'] ?? null,
                'theme' => $data['theme'],
                'brand_color' => $data['brand_color'] ?? null,
                'custom_palette' => $data['theme'] === 'custom' ? ($data['custom_palette'] ?? null) : null,
                'hub_style' => $data['hub_style'] ?? 'classic',
                'pointer_style' => $data['pointer_style'] ?? 'classic',
                'peg_style' => $data['peg_style'] ?? 'dots',
                'number_of_fields' => $data['number_of_fields'] ?? null,
                'sound_enabled' => $data['sound_enabled'] ?? true,
                'confetti_enabled' => $data['confetti_enabled'] ?? true,
                'is_published' => $data['is_published'] ?? false,
            ]);

            foreach ($data['items'] as $position => $item) {
                $imagePath = null;
                if (isset($item['image']) && $item['image']) {
                    $imagePath = $item['image']->store('wheel-items', 'public');
                }

                $wheel->items()->create([
                    'label' => $item['label'],
                    'weight' => $item['weight'],
                    'position' => $position,
                    'image_path' => $imagePath,
                ]);
            }

            return $wheel;
        });

        return redirect()
            ->route('admin.wheels.edit', $wheel)
            ->with('success', 'Wheel created.');
    }

    public function edit(Wheel $wheel, Request $request): Response
    {
        $this->authorizeOwner($wheel, $request);

        $wheel->load('items');

        return Inertia::render('admin/wheels/edit', [
            'wheel' => [
                'id' => $wheel->id,
                'slug' => $wheel->slug,
                'name' => $wheel->name,
                'brand_name' => $wheel->brand_name,
                'brand_logo_path' => $wheel->brand_logo_path,
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
                'is_published' => $wheel->is_published,
                'public_url' => route('wheel.show', $wheel->slug),
                'items' => $wheel->items->map(fn (WheelItem $item) => [
                    'id' => $item->id,
                    'label' => $item->label,
                    'weight' => $item->weight,
                    'position' => $item->position,
                    'image_path' => $item->image_path,
                    'image_url' => $item->image_path
                        ? Storage::disk('public')->url($item->image_path)
                        : null,
                ])->values(),
            ],
        ]);
    }

    public function update(UpdateWheelRequest $request, Wheel $wheel): RedirectResponse
    {
        $this->authorizeOwner($wheel, $request);

        $data = $request->validated();

        DB::transaction(function () use ($request, $wheel, $data) {
            $logoPath = $wheel->brand_logo_path;

            if ($request->hasFile('brand_logo')) {
                if ($logoPath) {
                    Storage::disk('public')->delete($logoPath);
                }
                $logoPath = $request->file('brand_logo')->store('wheel-logos', 'public');
            } elseif ($request->boolean('remove_brand_logo') && $logoPath) {
                Storage::disk('public')->delete($logoPath);
                $logoPath = null;
            }

            $wheel->update([
                'slug' => $this->resolveSlug($data['slug'] ?? null, $data['name'], $wheel->id),
                'name' => $data['name'],
                'brand_name' => $data['brand_name'] ?? null,
                'brand_logo_path' => $logoPath,
                'address' => $data['address'] ?? null,
                'theme' => $data['theme'],
                'brand_color' => $data['brand_color'] ?? null,
                'custom_palette' => $data['theme'] === 'custom' ? ($data['custom_palette'] ?? null) : null,
                'hub_style' => $data['hub_style'] ?? 'classic',
                'pointer_style' => $data['pointer_style'] ?? 'classic',
                'peg_style' => $data['peg_style'] ?? 'dots',
                'number_of_fields' => $data['number_of_fields'] ?? null,
                'sound_enabled' => $data['sound_enabled'] ?? true,
                'confetti_enabled' => $data['confetti_enabled'] ?? true,
                'is_published' => $data['is_published'] ?? false,
            ]);

            $existingIds = $wheel->items()->pluck('id')->all();
            $keptIds = [];

            foreach ($data['items'] as $position => $payload) {
                $itemImagePath = null;
                $existingItem = null;

                if (! empty($payload['id'])) {
                    $existingItem = $wheel->items()->find($payload['id']);
                    if ($existingItem) {
                        $itemImagePath = $existingItem->image_path;
                    }
                }

                $newImage = $payload['image'] ?? null;
                $removeImage = ! empty($payload['remove_image']);

                if ($newImage) {
                    if ($itemImagePath) {
                        Storage::disk('public')->delete($itemImagePath);
                    }
                    $itemImagePath = $newImage->store('wheel-items', 'public');
                } elseif ($removeImage && $itemImagePath) {
                    Storage::disk('public')->delete($itemImagePath);
                    $itemImagePath = null;
                }

                $attributes = [
                    'label' => $payload['label'],
                    'weight' => $payload['weight'],
                    'position' => $position,
                    'image_path' => $itemImagePath,
                ];

                if ($existingItem) {
                    $existingItem->update($attributes);
                    $keptIds[] = $existingItem->id;
                } else {
                    $created = $wheel->items()->create($attributes);
                    $keptIds[] = $created->id;
                }
            }

            $toDelete = array_diff($existingIds, $keptIds);
            if (! empty($toDelete)) {
                $wheel->items()
                    ->whereIn('id', $toDelete)
                    ->get()
                    ->each(function (WheelItem $item) {
                        if ($item->image_path) {
                            Storage::disk('public')->delete($item->image_path);
                        }
                        $item->delete();
                    });
            }
        });

        return redirect()
            ->route('admin.wheels.edit', $wheel->fresh())
            ->with('success', 'Wheel updated.');
    }

    public function destroy(Wheel $wheel, Request $request): RedirectResponse
    {
        $this->authorizeOwner($wheel, $request);

        DB::transaction(function () use ($wheel) {
            if ($wheel->brand_logo_path) {
                Storage::disk('public')->delete($wheel->brand_logo_path);
            }

            $wheel->items()->get()->each(function (WheelItem $item) {
                if ($item->image_path) {
                    Storage::disk('public')->delete($item->image_path);
                }
            });

            $wheel->delete();
        });

        return redirect()
            ->route('admin.wheels.index')
            ->with('success', 'Wheel deleted.');
    }

    private function authorizeOwner(Wheel $wheel, Request $request): void
    {
        abort_unless($wheel->user_id === $request->user()?->id, 403);
    }

    private function resolveSlug(?string $candidate, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($candidate ?: $name);
        if ($base === '') {
            $base = 'wheel';
        }

        $slug = $base;
        $i = 2;
        while (Wheel::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
