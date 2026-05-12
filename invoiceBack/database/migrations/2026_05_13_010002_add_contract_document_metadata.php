<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_documents', function (Blueprint $table) {
            $table->string('mime_type')->nullable()->after('file_size');
            $table->timestamp('updated_at')->nullable()->after('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('contract_documents', function (Blueprint $table) {
            $table->dropColumn(['mime_type', 'updated_at']);
        });
    }
};
