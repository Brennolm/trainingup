<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Example image of each exercise (file on the `local` disk, exercises/).
        Schema::table('exercises', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('contraindications');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
