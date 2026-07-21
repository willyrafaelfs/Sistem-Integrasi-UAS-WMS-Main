<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'warehouse_id',
        'name',
        'barcode',
        'zone',
        'aisle',
        'bay',
        'tier',
        'bin',
        'max_weight_kg',
        'is_active',
    ];

    protected $casts = [
        'max_weight_kg' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class);
    }
}
