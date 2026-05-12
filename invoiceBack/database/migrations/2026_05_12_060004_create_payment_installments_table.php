<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sequence');
            $table->string('name');
            $table->decimal('amount', 18, 2);
            $table->date('due_date')->nullable();
            $table->string('status', 16)->default('pending');
            $table->decimal('invoiced_amount', 18, 2)->default(0);
            $table->decimal('paid_amount', 18, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['contract_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_installments');
    }
};
