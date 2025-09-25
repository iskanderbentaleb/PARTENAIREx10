<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'supplier_id',
        'investor_id',
        'supplier_invoice_number',
        'purchase_date',
        'due_date',
        'subtotal',
        'discount_value',
        'discount_reason',
        'shipping_value',
        'shipping_note',
        'total',
        'currency',
        'invoice_image',
        'note',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'shipping_value' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function transactions()
    {
        return $this->hasMany(SupplierTransaction::class);
    }


    protected $appends = ['sold_percentage'];

    public function getSoldPercentageAttribute(): float
    {
        $totalQty = $this->items->sum('quantity');
        $totalSold = $this->items->sum('quantity_selled');

        if ($totalQty > 0) {
            return round(($totalSold / $totalQty) * 100, 2);
        }
        return 0;
    }


}
