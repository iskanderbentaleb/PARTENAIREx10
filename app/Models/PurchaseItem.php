<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasFactory;


    protected $fillable = [
        'purchase_id',
        'product_name',
        'barcode_prinsipal',
        'barcode_generated',
        'quantity',
        'quantity_selled',
        'unit_price',
        'sale_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    protected $appends = ['sold_percentage'];

    public function getSoldPercentageAttribute(): float
    {
        if ($this->quantity > 0) {
            return round(($this->quantity_selled / $this->quantity) * 100, 2);
        }
        return 0;
    }



}
