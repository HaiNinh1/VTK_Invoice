<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_requests', function (Blueprint $table) {
            $table->foreignId('current_handler_id')->nullable()->after('creator_id')->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_id')->nullable()->after('current_handler_id')->constrained('users')->nullOnDelete();
            $table->string('contract_number', 64)->nullable()->after('payment_installment_id');
            $table->date('contract_date')->nullable()->after('contract_number');
            $table->text('service_content')->nullable()->after('after_vat');
            $table->boolean('legal_complete')->default(false)->after('legal_status_cache');
            $table->text('return_reason')->nullable()->after('notes');
            $table->text('rejection_reason')->nullable()->after('return_reason');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_requests', function (Blueprint $table) {
            $table->dropForeign(['current_handler_id']);
            $table->dropForeign(['approved_by_id']);
            $table->dropColumn([
                'current_handler_id',
                'approved_by_id',
                'contract_number',
                'contract_date',
                'service_content',
                'legal_complete',
                'return_reason',
                'rejection_reason',
            ]);
        });
    }
};
