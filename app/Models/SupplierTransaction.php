<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class SupplierTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'amount',
        'note',
        'supplier_id',
        'user_id',
        'purchase_id',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}
