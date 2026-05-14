<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->string('request_id', 20)->primary();
            $table->foreignId('approved_by_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('approved_at');
            $table->string('accounting_ref_no', 60);
            $table->string('account_revenue', 20)->default('5113');
            $table->string('account_tax', 20)->default('33311');
            $table->string('account_receivable', 20)->default('131');
            $table->text('approval_note')->nullable();
            $table->json('signature_snapshot')->nullable();
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
        });

        Schema::create('rejections', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 20);
            $table->string('kind', 20); // reject | return
            $table->text('reason');
            $table->foreignId('by_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('at');
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
            $table->index(['request_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rejections');
        Schema::dropIfExists('approvals');
    }
};
