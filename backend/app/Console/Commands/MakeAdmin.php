<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;

/** SPEC 9 item 7: gives (or removes) the admin role. Run once on the server for the first admin. */
class MakeAdmin extends Command
{
    protected $signature = 'user:make-admin {email} {--revoke : Back to a regular user}';

    protected $description = 'Give or remove the admin role for an existing account';

    public function handle(): int
    {
        $user = User::where('email', mb_strtolower(trim($this->argument('email'))))->first();
        if (! $user) {
            $this->error('No account with this e-mail. Sign up in the app first.');

            return self::FAILURE;
        }

        $role = $this->option('revoke') ? Role::User : Role::Admin;
        $user->forceFill(['role' => $role])->save();
        $this->info("{$user->email} is now: {$role->value}");

        return self::SUCCESS;
    }
}
