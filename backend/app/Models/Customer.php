<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = ['code', 'name', 'contact_person', 'phone', 'email', 'address', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function salesOrders() { return $this->hasMany(SalesOrder::class); }
}
