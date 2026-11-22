<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->after('email_verified_at');
            $table->string('role', 20)->default('user')->after('password');
            $table->foreignId('plan_id')->nullable()->after('role')->constrained('plans')->nullOnDelete();
            $table->string('theme', 10)->default('dark')->after('plan_id');
            $table->string('weight_unit', 5)->default('kg')->after('theme');
            $table->string('length_unit', 5)->default('cm')->after('weight_unit');
            $table->string('locale', 10)->default('pt_BR')->after('length_unit');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
            $table->dropColumn(['birth_date', 'role', 'theme', 'weight_unit', 'length_unit', 'locale']);
        });
    }
};
