<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'sale_date',
        'subtotal',
        'discount_reason',
        'discount_value',
        'total',
        'currency',
        'note',
        'user_id',
        'investor_id',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

}
