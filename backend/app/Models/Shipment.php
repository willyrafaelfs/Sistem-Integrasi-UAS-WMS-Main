<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = ['do_number', 'so_id', 'customer_id', 'status', 'carrier', 'tracking_number', 'dispatched_at', 'delivered_at', 'notes'];
    protected $casts = ['dispatched_at' => 'datetime', 'delivered_at' => 'datetime'];
    public function salesOrder() { return $this->belongsTo(SalesOrder::class, 'so_id'); }
    public function customer() { return $this->belongsTo(Customer::class); }
}
