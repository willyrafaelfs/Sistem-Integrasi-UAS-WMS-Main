<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrderItem extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = ['so_id', 'product_id', 'ordered_qty', 'picked_qty', 'packed_qty', 'shipped_qty'];
    public function salesOrder() { return $this->belongsTo(SalesOrder::class, 'so_id'); }
    public function product() { return $this->belongsTo(Product::class); }
}
