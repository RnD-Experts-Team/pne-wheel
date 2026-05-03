<?php

namespace App\Models;

use Database\Factories\WheelItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'wheel_id',
    'label',
    'image_path',
    'weight',
    'position',
])]
class WheelItem extends Model
{
    /** @use HasFactory<WheelItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weight' => 'integer',
            'position' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Wheel, $this>
     */
    public function wheel(): BelongsTo
    {
        return $this->belongsTo(Wheel::class);
    }
}
