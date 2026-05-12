<?php

namespace Tests\Unit\Services;

use App\Services\InvoiceCodeGenerator;
use Tests\TestCase;

class InvoiceCodeGeneratorTest extends TestCase
{
    public function test_generates_sequential_unique_codes(): void
    {
        $gen = app(InvoiceCodeGenerator::class);
        $codes = [];
        for ($i = 0; $i < 50; $i++) {
            $codes[] = $gen->generate(2026);
        }

        $this->assertCount(50, array_unique($codes));
        $this->assertSame('DN-2026-00001', $codes[0]);
        $this->assertSame('DN-2026-00050', $codes[49]);
    }

    public function test_year_isolated_sequences(): void
    {
        $gen = app(InvoiceCodeGenerator::class);
        $a = $gen->generate(2025);
        $b = $gen->generate(2026);
        $c = $gen->generate(2025);

        $this->assertSame('DN-2025-00001', $a);
        $this->assertSame('DN-2026-00001', $b);
        $this->assertSame('DN-2025-00002', $c);
    }
}
