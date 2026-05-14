<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->string('id', 20)->primary(); // DN-YYYY-NNNNN
            $table->string('contract_id', 20);
            $table->string('contract_number', 60);
            // Customer snapshot (immutable once created)
            $table->string('customer_name', 200);
            $table->string('customer_tax_code', 20);
            $table->text('customer_address')->nullable();
            $table->string('service_type', 60);
            $table->string('department', 20)->index();
            // Money
            $table->decimal('value_before_vat', 18, 0)->default(0);
            $table->unsignedTinyInteger('vat_rate')->default(10); // 0|5|8|10
            $table->decimal('vat_amount', 18, 0)->default(0);
            $table->decimal('value_after_vat', 18, 0)->default(0);
            // Payment + invoice type
            $table->string('payment_term', 40); // Tạm ứng|Đợt 1|Đợt 2|Đợt 3|Thanh toán cuối|1 lần
            $table->string('payment_method', 40)->nullable(); // Chuyển khoản|Tiền mặt|Bù trừ
            $table->string('invoice_type', 20); // Tạo mới|Điều chỉnh|Thay thế
            $table->string('original_invoice_number', 60)->nullable();
            $table->text('adjustment_reason')->nullable();
            // Misc
            $table->string('buyer_email', 200)->nullable();
            $table->text('notes')->nullable();
            // Status
            $table->string('status', 40)->index(); // Nháp|Chờ duyệt|Đã duyệt|Đã xuất HĐ|Từ chối|Trả lại bổ sung
            // Commitment
            $table->boolean('has_commitment')->default(false);
            $table->text('commitment_text')->nullable();
            $table->date('commitment_deadline')->nullable();
            // Authorship
            $table->foreignId('created_by_id')->constrained('users')->cascadeOnDelete();
            // Lifecycle timestamps
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('recalled_at')->nullable();
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('contracts')->restrictOnDelete();
            $table->index('contract_id');
            $table->index(['status', 'created_at']);
        });

        Schema::create('request_documents', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 20);
            $table->string('name', 200);
            $table->string('file_path', 500)->nullable();
            $table->string('file_name', 255)->nullable();
            $table->boolean('checked')->default(false);
            $table->string('inherited_from_contract_doc_id', 60)->nullable();
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
            $table->foreign('inherited_from_contract_doc_id')->references('id')->on('contract_documents')->nullOnDelete();
            $table->index(['request_id', 'checked']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_documents');
        Schema::dropIfExists('requests');
    }
};
