<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class saleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'purchase_item_id',
        'quantity',
        'sale_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'sale_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    // Relations
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class);
    }
}
