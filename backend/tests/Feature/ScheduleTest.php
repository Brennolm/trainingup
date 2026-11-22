<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class ScheduleTest extends TestCase
{
    private function eventFor(string $command): ?Event
    {
        return collect(app(Schedule::class)->events())
            ->first(fn (Event $e) => str_contains((string) $e->command, $command));
    }

    public function test_deploy_finalize_runs_every_minute(): void
    {
        $this->assertSame('* * * * *', $this->eventFor('deploy:finalize')?->expression);
    }

    public function test_queue_is_processed_every_minute(): void
    {
        $this->assertSame('* * * * *', $this->eventFor('queue:work')?->expression);
    }

    public function test_database_backup_runs_daily_at_3am_brasilia(): void
    {
        $event = $this->eventFor('backup:database');

        $this->assertSame('0 3 * * *', $event?->expression);
        $this->assertSame('America/Sao_Paulo', $event?->timezone);
    }
}
