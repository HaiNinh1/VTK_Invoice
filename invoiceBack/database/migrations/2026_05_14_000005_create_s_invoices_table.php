<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('s_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 20)->unique();
            $table->string('s_invoice_number', 60)->unique()->nullable(); // K26TYY{7 digits}
            $table->string('s_invoice_tax_code', 20)->nullable(); // 4A2B{4 digits}
            $table->string('status', 20); // Đang xử lý | Thành công | Lỗi
            $table->text('error_message')->nullable();
            $table->json('gateway_response_json')->nullable();
            $table->timestamp('exported_at');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('s_invoices');
    }
};
