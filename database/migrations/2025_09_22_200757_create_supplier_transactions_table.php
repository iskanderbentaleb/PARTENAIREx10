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
        Schema::create('supplier_transactions', function (Blueprint $table) {
            $table->id();

            $table->date('date');
            $table->decimal('amount', 15, 2);
            $table->text('note')->nullable();

            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->onDelete('restrict');

            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('restrict');

            $table->foreignId('purchase_id')
                ->nullable()
                ->constrained('purchases')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_transactions');
    }
};
