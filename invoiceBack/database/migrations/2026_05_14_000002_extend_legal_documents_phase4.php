<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('legal_documents', function (Blueprint $table) {
            if (! Schema::hasColumn('legal_documents', 'group')) {
                $table->string('group', 50)->default('contract')->after('description')->index();
            }

            if (! Schema::hasColumn('legal_documents', 'default_deadline_days')) {
                $table->unsignedSmallInteger('default_deadline_days')->nullable()->after('default_required');
            }

            if (! Schema::hasColumn('legal_documents', 'enabled')) {
                $table->boolean('enabled')->default(true)->after('default_deadline_days')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('legal_documents', function (Blueprint $table) {
            if (Schema::hasColumn('legal_documents', 'enabled')) {
                $table->dropColumn('enabled');
            }

            if (Schema::hasColumn('legal_documents', 'default_deadline_days')) {
                $table->dropColumn('default_deadline_days');
            }

            if (Schema::hasColumn('legal_documents', 'group')) {
                $table->dropColumn('group');
            }
        });
    }
};
