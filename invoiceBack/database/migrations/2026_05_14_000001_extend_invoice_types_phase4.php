<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('invoice_types', 'deleted_at')) {
            Schema::table('invoice_types', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        if (! Schema::hasTable('invoice_type_service_type')) {
            Schema::create('invoice_type_service_type', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_type_id')->constrained('invoice_types')->cascadeOnDelete();
                $table->foreignId('service_type_id')->constrained('service_types')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['invoice_type_id', 'service_type_id'], 'it_st_unique');
                $table->index('service_type_id');
            });
        }

        if (! Schema::hasTable('invoice_type_legal_document')) {
            Schema::create('invoice_type_legal_document', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_type_id')->constrained('invoice_types')->cascadeOnDelete();
                $table->foreignId('legal_document_id')->constrained('legal_documents')->cascadeOnDelete();
                $table->boolean('required')->default(true);
                $table->timestamps();

                $table->unique(['invoice_type_id', 'legal_document_id'], 'it_ld_unique');
                $table->index(['legal_document_id', 'required'], 'it_ld_required_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_type_legal_document');
        Schema::dropIfExists('invoice_type_service_type');

        if (Schema::hasColumn('invoice_types', 'deleted_at')) {
            Schema::table('invoice_types', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
