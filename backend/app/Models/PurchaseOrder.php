<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = ['po_number', 'supplier_id', 'order_date', 'expected_arrival', 'status', 'notes'];
    protected $casts = ['order_date' => 'date', 'expected_arrival' => 'date'];
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseOrderItem::class, 'po_id'); }
}
