<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->string('id', 20)->primary(); // HD-YYYY-NNN
            $table->string('contract_number', 60);
            $table->string('customer_name', 200);
            $table->string('customer_tax_code', 20);
            $table->text('customer_address')->nullable();
            $table->string('customer_representative', 200)->nullable();
            $table->string('customer_email', 200)->nullable();
            $table->string('customer_phone', 30)->nullable();
            $table->string('service_type', 60);
            $table->date('sign_date');
            $table->decimal('total_value', 18, 0)->default(0);
            $table->string('currency', 8)->default('VND');
            $table->string('department', 20)->index();
            $table->string('status', 40)->index(); // Đang thực hiện | Đã quyết toán | Đã thanh lý
            $table->text('notes')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('service_type');
        });

        Schema::create('contract_documents', function (Blueprint $table) {
            $table->string('id', 60)->primary(); // doc-{ts}-{rand}
            $table->string('contract_id', 20);
            $table->string('name', 200);
            $table->string('group_name', 200);
            $table->string('file_name', 255);
            $table->string('file_path', 500)->nullable();
            $table->string('mime', 120)->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->foreignId('uploaded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('upload_date');
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('contracts')->cascadeOnDelete();
            $table->index(['contract_id', 'group_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_documents');
        Schema::dropIfExists('contracts');
    }
};
