<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class InvoiceCodeGenerator
{
    /**
     * Atomically generate the next invoice request code for the current year.
     * Format: DN-YYYY-##### (zero-padded to 5).
     */
    public function generate(?int $year = null): string
    {
        $year = $year ?? (int) now()->format('Y');

        return DB::transaction(function () use ($year) {
            $row = DB::table('invoice_code_sequences')
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                DB::table('invoice_code_sequences')->insert([
                    'year' => $year,
                    'value' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $current = 0;
            } else {
                $current = (int) $row->value;
            }

            $next = $current + 1;

            DB::table('invoice_code_sequences')
                ->where('year', $year)
                ->update(['value' => $next, 'updated_at' => now()]);

            return sprintf('DN-%04d-%05d', $year, $next);
        });
    }
}
