<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();

            // Item details
            $table->string('product_name')->nullable();
            $table->string('barcode_prinsipal')->nullable();
            $table->string('barcode_generated')->nullable();
            $table->integer('quantity')->default(1);
            $table->integer('quantity_selled')->default(0);
            $table->decimal('unit_price', 12, 2)->default(0); // or purchase_price
            $table->decimal('subtotal', 12, 2)->default(0); // quantity * unit_price
            $table->decimal('sale_price', 12, 2)->default(0); // price at which the item will be sold

            // Relationships
            $table->foreignId('purchase_id')->constrained('purchases')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
