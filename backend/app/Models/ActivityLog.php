<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasUuids;
    protected $fillable = ['user_id', 'action', 'model_type', 'model_id', 'description', 'old_data', 'new_data', 'ip_address'];
    protected $casts = ['old_data' => 'array', 'new_data' => 'array'];
    public function user() { return $this->belongsTo(User::class); }
}
