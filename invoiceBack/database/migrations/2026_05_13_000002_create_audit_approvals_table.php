<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_approvals', function (Blueprint $table) {
            $table->id();
            $table->string('report_type');
            $table->json('payload');
            $table->foreignId('approver_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('signature_snapshot_id')->nullable()->constrained('signature_snapshots')->nullOnDelete();
            $table->dateTime('approved_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_approvals');
    }
};
