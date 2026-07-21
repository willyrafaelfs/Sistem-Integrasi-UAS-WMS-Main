<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'description',
        'category',
        'uom',
        'weight_kg',
        'safety_stock',
        'attributes',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:2',
        'attributes' => 'array',
    ];

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class);
    }
}
