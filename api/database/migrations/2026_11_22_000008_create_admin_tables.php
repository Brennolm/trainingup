<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SPEC 6.5: "último acesso" in the admin user list (updated at most every few minutes).
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('remember_token');
        });

        // SPEC 6.5: every read-only support access, with the mandatory reason. The links become
        // null when an account is deleted, so the log keeps no personal data of a deleted user.
        Schema::create('admin_impersonation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        // SPEC 6.5: application errors, backup and e-mail failures. Repeats of an open alert
        // (same fingerprint) only bump the counter.
        Schema::create('admin_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30);
            $table->string('fingerprint', 64);
            $table->text('message');
            $table->unsignedInteger('occurrences')->default(1);
            $table->timestamp('last_occurred_at');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['fingerprint', 'resolved_at']);
        });

        // SPEC 5.2: calculation parameters edited in the admin. Only changed values are stored;
        // the defaults live in App\Support\Settings.
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->json('value');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('admin_alerts');
        Schema::dropIfExists('admin_impersonation_logs');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('last_seen_at'));
    }
};
