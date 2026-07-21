<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasUuids;
    protected $fillable = ['user_id', 'title', 'message', 'type', 'is_read'];
    protected $casts = ['is_read' => 'boolean'];
}
