<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_requests', function (Blueprint $table) {
            $table->foreign('contract_id')->references('id')->on('contracts')->nullOnDelete();
            $table->foreign('payment_installment_id')->references('id')->on('payment_installments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoice_requests', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropForeign(['payment_installment_id']);
        });
    }
};
