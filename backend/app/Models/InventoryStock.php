<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_id',
        'location_id',
        'quantity',
        'batch_number',
        'expiry_date',
        'last_updated',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'last_updated' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
