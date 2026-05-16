<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExcelExporter;
use App\Services\ReportsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Reports + Excel exports.
 *
 * Endpoints:
 *   GET /api/reports/summary?month=YYYY-MM&dept=KVx
 *   GET /api/reports/contracts.xlsx
 *   GET /api/reports/requests.xlsx?month=YYYY-MM
 *
 * Scope rules:
 *   accountant/admin -> all
 *   manager          -> own department
 *   employee         -> own requests (no dept filter)
 *
 * Output shape (summary) matches FE ViecCanLam.jsx AccountantReport
 * tab consumption + adds sInvoiceCounts and legalDossiers blocks.
 */
class ReportsController extends Controller
{
    public function __construct(
        private readonly ReportsService $reports,
        private readonly ExcelExporter $excel,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $month = $request->query('month');
        $dept = $request->query('dept');

        $payload = $this->reports->summary($user, $month, $dept);

        return response()->json(['data' => $payload]);
    }

    public function contractsXlsx(Request $request): StreamedResponse
    {
        return $this->excel->contractsXlsx($request->user());
    }

    public function requestsXlsx(Request $request): StreamedResponse
    {
        return $this->excel->requestsXlsx($request->user(), $request->query('month'));
    }
}
