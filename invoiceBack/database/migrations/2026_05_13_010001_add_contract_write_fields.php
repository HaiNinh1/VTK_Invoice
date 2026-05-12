<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignId('project_manager_id')->nullable()->after('customer_id')->constrained('users')->nullOnDelete();
            $table->foreignId('revenue_center_id')->nullable()->after('project_manager_id')->constrained('revenue_centers')->nullOnDelete();
            $table->decimal('total_value_after_tax', 18, 2)->nullable()->after('total_amount');
            $table->decimal('total_invoiced', 18, 2)->default(0)->after('total_value_after_tax');
            $table->decimal('total_paid', 18, 2)->default(0)->after('total_invoiced');

            $table->index('customer_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['status']);
            $table->dropForeign(['project_manager_id']);
            $table->dropForeign(['revenue_center_id']);
            $table->dropColumn([
                'project_manager_id',
                'revenue_center_id',
                'total_value_after_tax',
                'total_invoiced',
                'total_paid',
            ]);
        });
    }
};
