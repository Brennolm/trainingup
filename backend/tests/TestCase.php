<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Sends requests as the SPA does, so Sanctum treats them as stateful (cookie session). */
    protected function fromSpa(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:5180',
            'Referer' => 'http://localhost:5180/',
            'Accept' => 'application/json',
        ]);
    }
}
