<?php

namespace App\Models;

use Database\Factories\WheelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'slug',
    'name',
    'brand_name',
    'brand_logo_path',
    'address',
    'theme',
    'brand_color',
    'custom_palette',
    'hub_style',
    'pointer_style',
    'peg_style',
    'number_of_fields',
    'sound_enabled',
    'confetti_enabled',
    'is_published',
])]
class Wheel extends Model
{
    /** @use HasFactory<WheelFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sound_enabled' => 'boolean',
            'confetti_enabled' => 'boolean',
            'is_published' => 'boolean',
            'number_of_fields' => 'integer',
            'custom_palette' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<WheelItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(WheelItem::class)->orderBy('position');
    }
}
