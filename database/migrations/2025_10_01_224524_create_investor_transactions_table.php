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
        Schema::create('investor_transactions', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('type', ['In', 'Out']); // Transaction type
            $table->decimal('amount', 15, 2);
            $table->text('note')->nullable();

            // Foreign keys
            $table->foreignId('investor_id')
                ->constrained('investors')
                ->onDelete('restrict');

            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('restrict');

            $table->foreignId('purchase_id')->nullable()
                ->constrained('purchases')
                ->onDelete('cascade');

            $table->foreignId('sale_id')->nullable()
                ->constrained('sales')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investor_transactions');
    }
};
