<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('buyer_name', 200)->nullable()->after('contact_email');
            $table->string('buyer_email', 200)->nullable()->after('buyer_name');
            $table->string('buyer_phone', 50)->nullable()->after('buyer_email');
        });

        Schema::table('invoice_types', function (Blueprint $table) {
            $table->json('required_legal_documents')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_types', function (Blueprint $table) {
            $table->dropColumn('required_legal_documents');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['buyer_name', 'buyer_email', 'buyer_phone']);
        });
    }
};
