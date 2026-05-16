<?php

namespace App\Services\Viettel;

use App\Models\Request as InvoiceRequest;

/**
 * Contract for any S-Invoice provider integration. Today we only ship
 * FakeViettelDriver; production swaps via container binding.
 */
interface ViettelDriverInterface
{
    /**
     * Issue an S-Invoice for the given request. Returns provider payload:
     *   ['number' => 'K26TYY0000123', 'taxCode' => '4A2B1000', 'rawResponse' => [...]]
     *
     * @throws \App\Services\Viettel\ViettelException on hard failure (network/validation)
     */
    public function issue(InvoiceRequest $request): array;
}
