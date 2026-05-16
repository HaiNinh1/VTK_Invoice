<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Request as InvoiceRequest;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Generates XLSX exports for contracts and requests.
 *
 * Returns StreamedResponse so PhpSpreadsheet writes directly to PHP output
 * (memory-friendly for large lists).
 */
class ExcelExporter
{
    /**
     * Export contracts list. Columns match FE HopDong.jsx CSV export:
     * Số HĐ, CĐT, MST, Loại DV, Ngày ký, Giá trị, Trạng thái, Hồ sơ
     */
    public function contractsXlsx(User $user): StreamedResponse
    {
        $query = Contract::query()->withCount('documents');
        if (! $user->canSeeAllDepartments()) {
            $query->where('department', $user->department);
        }
        $contracts = $query->orderBy('id')->get();

        // Pre-compute total docs per service_type from invoice_types config.
        $totalsByService = \Illuminate\Support\Facades\DB::table('document_templates as t')
            ->join('document_groups as g', 'g.id', '=', 't.document_group_id')
            ->join('invoice_types as it', 'it.id', '=', 'g.invoice_type_id')
            ->selectRaw('it.service_type, COUNT(*) as c')
            ->groupBy('it.service_type')
            ->pluck('c', 'service_type');

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Hợp đồng');

        $headers = ['Số HĐ', 'CĐT', 'MST', 'Loại DV', 'Ngày ký', 'Giá trị', 'Trạng thái', 'Hồ sơ'];
        $sheet->fromArray([$headers], null, 'A1');
        $this->styleHeader($sheet, 'A1:H1');

        $row = 2;
        foreach ($contracts as $c) {
            $sheet->fromArray([[
                $c->contract_number,
                $c->customer_name,
                $c->customer_tax_code,
                $c->service_type,
                optional($c->sign_date)->toDateString(),
                (int) $c->total_value,
                $c->status,
                ($c->documents_count ?? 0) . '/' . ($totalsByService[$c->service_type] ?? ($c->documents_count ?? 0)),
            ]], null, "A{$row}");
            $row++;
        }

        $sheet->getStyle('F2:F'.($row - 1))->getNumberFormat()->setFormatCode('#,##0');
        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return $this->stream($spreadsheet, 'hop-dong-'.date('Y-m-d').'.xlsx');
    }

    /**
     * Export requests list with full scope. Columns:
     * Mã ĐN, Số HĐ, CĐT, Loại DV, Trước VAT, %VAT, VAT, Sau VAT,
     * Trạng thái, Ngày tạo, Người tạo, Đợt TT, Số HĐ điện tử
     */
    public function requestsXlsx(User $user, ?string $month = null): StreamedResponse
    {
        $query = InvoiceRequest::query();

        if (! $user->canSeeAllDepartments()) {
            if ($user->role === 'manager') {
                $query->where('department', $user->department);
            } else {
                $query->where('created_by_id', $user->id);
            }
        }

        if ($month !== null && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $start = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $end   = (clone $start)->endOfMonth();
            $query->whereBetween('created_at', [$start, $end]);
        }

        $requests = $query->with(['creator', 'sInvoice'])->orderBy('id')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Đề nghị xuất HĐ');

        $headers = ['Mã ĐN','Số HĐ','CĐT','Loại DV','Trước VAT','%VAT','VAT','Sau VAT','Trạng thái','Ngày tạo','Người tạo','Đợt TT','Số HĐ điện tử'];
        $sheet->fromArray([$headers], null, 'A1');
        $this->styleHeader($sheet, 'A1:M1');

        $row = 2;
        foreach ($requests as $r) {
            $sheet->fromArray([[
                $r->id,
                $r->contract_number,
                $r->customer_name,
                $r->service_type,
                (int) $r->value_before_vat,
                (int) $r->vat_rate,
                (int) $r->vat_amount,
                (int) $r->value_after_vat,
                $r->status,
                optional($r->created_at)->toDateString(),
                optional($r->creator)->name,
                $r->payment_term,
                optional($r->sInvoice)->s_invoice_number,
            ]], null, "A{$row}");
            $row++;
        }

        $sheet->getStyle('E2:E'.($row - 1))->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('G2:H'.($row - 1))->getNumberFormat()->setFormatCode('#,##0');
        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $suffix = $month !== null ? '-'.$month : '-'.date('Y-m-d');
        return $this->stream($spreadsheet, 'de-nghi'.$suffix.'.xlsx');
    }

    private function styleHeader($sheet, string $range): void
    {
        $sheet->getStyle($range)->getFont()->setBold(true);
        $sheet->getStyle($range)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE8F0FE');
        $sheet->getStyle($range)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->freezePane('A2');
    }

    private function stream(Spreadsheet $book, string $filename): StreamedResponse
    {
        $writer = new Xlsx($book);
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
