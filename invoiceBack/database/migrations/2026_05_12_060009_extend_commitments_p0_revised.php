<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commitments', function (Blueprint $table) {
            $table->json('missing_documents')->nullable()->after('content');
            $table->foreignId('signature_snapshot_id')->nullable()->after('missing_documents')->constrained('signature_snapshots')->nullOnDelete();
            $table->foreignId('director_id')->nullable()->after('signature_snapshot_id')->constrained('users')->nullOnDelete();
            $table->string('director_decision', 16)->default('pending')->after('director_id');
            $table->text('director_note')->nullable()->after('director_decision');
            $table->json('extensions')->nullable()->after('director_note');
        });
    }

    public function down(): void
    {
        Schema::table('commitments', function (Blueprint $table) {
            $table->dropForeign(['signature_snapshot_id']);
            $table->dropForeign(['director_id']);
            $table->dropColumn([
                'missing_documents',
                'signature_snapshot_id',
                'director_id',
                'director_decision',
                'director_note',
                'extensions',
            ]);
        });
    }
};
