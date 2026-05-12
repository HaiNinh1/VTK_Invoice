<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commitments', function (Blueprint $table) {
            $table->foreignId('signer_id')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->dateTime('signed_at')->nullable()->after('signer_id');
            $table->softDeletes();
            $table->index(['invoice_request_id', 'status'], 'commitments_invoice_status_index');
            $table->index('deadline', 'commitments_deadline_index');
            $table->string('director_decision', 16)->nullable()->default(null)->change();
            $table->string('status')->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('commitments', function (Blueprint $table) {
            $table->string('director_decision', 16)->nullable(false)->default('pending')->change();
            $table->string('status')->default('active')->change();
            $table->dropIndex('commitments_invoice_status_index');
            $table->dropIndex('commitments_deadline_index');
            $table->dropSoftDeletes();
            $table->dropForeign(['signer_id']);
            $table->dropColumn(['signer_id', 'signed_at']);
        });
    }
};
