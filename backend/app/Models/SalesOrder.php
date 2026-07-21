<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrder extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = ['so_number', 'customer_id', 'order_date', 'ship_by_date', 'status', 'notes'];
    protected $casts = ['order_date' => 'date', 'ship_by_date' => 'date'];
    public function customer() { return $this->belongsTo(Customer::class); }
    public function items() { return $this->hasMany(SalesOrderItem::class, 'so_id'); }
    public function shipments() { return $this->hasMany(Shipment::class, 'so_id'); }
}
