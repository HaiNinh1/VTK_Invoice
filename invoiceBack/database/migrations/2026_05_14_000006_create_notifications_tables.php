<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // pendingApproval|approved|rejected|returned|exportSuccess|exportError|legalDueSoon|commitmentOverdue|system
            $table->string('kind', 30)->index();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->json('data_json')->nullable();
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamp('created_at')->nullable()->index();

            $table->index(['user_id', 'read_at']);
        });

        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('key', 30); // one of 9 kinds
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
        Schema::dropIfExists('notifications');
    }
};
