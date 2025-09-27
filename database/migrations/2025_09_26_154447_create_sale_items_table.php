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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();

            $table->integer('quantity');
            $table->decimal('sale_price', 10, 2);
            $table->decimal('subtotal', 12, 2);

            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('purchase_item_id')->constrained('purchase_items')->onDelete('cascade')->onUpdate('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
