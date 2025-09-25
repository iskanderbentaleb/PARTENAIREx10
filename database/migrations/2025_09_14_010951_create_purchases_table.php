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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();

            // Purchase details
            $table->string('supplier_invoice_number')->nullable();
            $table->date('purchase_date')->default(now());
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->string('discount_reason')->nullable();
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->string('shipping_note')->nullable();
            $table->decimal('shipping_value', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('currency', 3)->default('DZD');
            $table->string('invoice_image')->nullable();
            $table->text('note')->nullable();

            // Relationships
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');
            $table->foreignId('investor_id')->constrained('investors')->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');


            // System timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
