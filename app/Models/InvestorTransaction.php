<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvestorTransaction extends Model
{
    protected $fillable = [
        'date',
        'type',
        'amount',
        'note',
        'investor_id',
        'user_id',
        'purchase_id',
        'sale_id',
    ];

    // Relations
    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
