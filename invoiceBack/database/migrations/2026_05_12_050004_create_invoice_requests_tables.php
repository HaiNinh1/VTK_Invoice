<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_code')->unique();
            $table->string('invoice_no')->nullable();
            $table->foreignId('invoice_type_id')->constrained('invoice_types')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('service_type_id')->constrained('service_types')->restrictOnDelete();
            // contract_id / payment_installment_id deferred (M3); keep nullable unsigned without FK now
            $table->unsignedBigInteger('contract_id')->nullable()->index();
            $table->unsignedBigInteger('payment_installment_id')->nullable()->index();
            $table->foreignId('revenue_center_id')->constrained('revenue_centers')->restrictOnDelete();
            $table->foreignId('creator_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->decimal('before_vat', 18, 2);
            $table->decimal('tax_rate', 5, 2)->default(10);
            $table->decimal('after_vat', 18, 2);
            $table->string('status')->default('draft');
            $table->json('legal_status_cache')->nullable();
            $table->string('s_invoice_status')->default('none');
            $table->string('s_invoice_code')->nullable();
            $table->text('s_invoice_error')->nullable();
            $table->string('vfs_status')->default('none');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'revenue_center_id']);
            $table->index('created_at');
        });

        Schema::create('invoice_request_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('legal_document_id')->nullable()->constrained('legal_documents')->nullOnDelete();
            $table->string('name');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('mime_type')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('commitments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique();
            $table->text('content');
            $table->string('status')->default('active');
            $table->date('deadline')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('step');
            $table->string('action')->default('pending');
            $table->text('comment')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();

            $table->unique(['invoice_request_id', 'step']);
        });

        Schema::create('invoice_code_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedInteger('value')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_code_sequences');
        Schema::dropIfExists('approvals');
        Schema::dropIfExists('commitments');
        Schema::dropIfExists('invoice_request_documents');
        Schema::dropIfExists('invoice_requests');
    }
};
