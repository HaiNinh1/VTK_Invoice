<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            // FE sends aggregate legalChecklist:{total, checked}. Cache server-side
            // so legal gate doesn't have to walk request_documents every approve.
            $table->unsignedInteger('legal_total')->default(0)->after('commitment_deadline');
            $table->unsignedInteger('legal_checked')->default(0)->after('legal_total');
            // FE shows rejectReason / returnReason directly on the request card.
            // Source of truth is rejections table; this is a cache of the latest one.
            $table->text('reject_reason')->nullable()->after('legal_checked');
            $table->text('return_reason')->nullable()->after('reject_reason');
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropColumn(['legal_total', 'legal_checked', 'reject_reason', 'return_reason']);
        });
    }
};
