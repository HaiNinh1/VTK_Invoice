<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_types', function (Blueprint $table) {
            $table->string('id', 60)->primary(); // slug, e.g. 'lap-dat'
            $table->string('name', 200);
            $table->string('service_type', 60)->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('document_groups', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_type_id', 60);
            $table->string('name', 200);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('invoice_type_id')->references('id')->on('invoice_types')->cascadeOnDelete();
            $table->index(['invoice_type_id', 'sort_order']);
        });

        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_group_id');
            $table->string('code', 60)->nullable(); // matches FE doc-id like 'hd1', 'tv-nt2'
            $table->string('name', 200);
            $table->boolean('required')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('document_group_id')->references('id')->on('document_groups')->cascadeOnDelete();
            $table->index(['document_group_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
        Schema::dropIfExists('document_groups');
        Schema::dropIfExists('invoice_types');
    }
};
