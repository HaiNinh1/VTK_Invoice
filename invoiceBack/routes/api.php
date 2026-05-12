<?php

use App\Http\Controllers\Api\V1\ApprovalController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommitmentController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InvoiceRequestActionController;
use App\Http\Controllers\Api\V1\InvoiceRequestController;
use App\Http\Controllers\Api\V1\InvoiceRequestLegalDocumentController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\Reports\LegalComplianceReportController;
use App\Http\Controllers\Api\V1\SignatureController;
use App\Http\Controllers\Api\V1\TimelineController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]));

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/me/signature', [SignatureController::class, 'show']);
    Route::match(['put', 'post'], '/me/signature', [SignatureController::class, 'update']);
    Route::delete('/me/signature', [SignatureController::class, 'destroy']);

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/reports/legal-compliance', [LegalComplianceReportController::class, 'show'])
        ->middleware('permission:report.view.company');
    Route::post('/reports/legal-compliance/approve', [LegalComplianceReportController::class, 'approve'])
        ->middleware('permission:report.view.company', 'require.signature');

    Route::get('/contracts', [ContractController::class, 'index']);
    Route::get('/contracts/{contract}', [ContractController::class, 'show']);
    Route::get('/contracts/{contract}/installments', [ContractController::class, 'installments']);
    Route::post('/contracts/{contract}/installments/{installment}/create-invoice-request', [ContractController::class, 'createInvoiceRequest']);

    // Invoice requests CRUD
    Route::get('/invoice-requests', [InvoiceRequestController::class, 'index']);
    Route::get('/invoice-requests/{invoiceRequest}', [InvoiceRequestController::class, 'show']);
    Route::post('/invoice-requests', [InvoiceRequestController::class, 'store'])
        ->middleware('permission:invoice.create');
    Route::put('/invoice-requests/{invoiceRequest}', [InvoiceRequestController::class, 'update'])
        ->middleware('permission:invoice.update');
    Route::patch('/invoice-requests/{invoiceRequest}', [InvoiceRequestController::class, 'update'])
        ->middleware('permission:invoice.update');
    Route::delete('/invoice-requests/{invoiceRequest}', [InvoiceRequestController::class, 'destroy']);

    // Workflow actions
    Route::post('/invoice-requests/{invoiceRequest}/submit', [InvoiceRequestActionController::class, 'submit']);
    Route::post('/invoice-requests/{invoiceRequest}/approve', [InvoiceRequestActionController::class, 'approve'])
        ->middleware('permission:invoice.approve.accountant|invoice.approve.director', 'require.signature');
    Route::post('/invoice-requests/{invoiceRequest}/reject', [InvoiceRequestActionController::class, 'reject'])
        ->middleware('permission:invoice.approve.accountant|invoice.approve.director', 'require.signature');
    Route::post('/invoice-requests/{invoiceRequest}/return', [InvoiceRequestActionController::class, 'return'])
        ->middleware('permission:invoice.return', 'require.signature');
    Route::post('/invoice-requests/{invoiceRequest}/resubmit', [InvoiceRequestActionController::class, 'resubmit']);
    Route::get('/invoice-requests/{invoiceRequest}/timeline', TimelineController::class);
    Route::get('/invoice-requests/{invoiceRequest}/legal-documents', [InvoiceRequestLegalDocumentController::class, 'index']);
    Route::post('/invoice-requests/{invoiceRequest}/legal-documents', [InvoiceRequestLegalDocumentController::class, 'store']);
    Route::delete('/invoice-requests/{invoiceRequest}/legal-documents/{document}', [InvoiceRequestLegalDocumentController::class, 'destroy']);

    Route::get('/invoice-requests/{invoiceRequest}/commitments', [CommitmentController::class, 'index']);
    Route::post('/invoice-requests/{invoiceRequest}/commitments', [CommitmentController::class, 'store'])
        ->middleware('permission:commitment.create', 'require.signature');
    Route::get('/commitments/{commitment}', [CommitmentController::class, 'show']);
    Route::post('/commitments/{commitment}/extend', [CommitmentController::class, 'extend'])
        ->middleware('permission:commitment.extend', 'require.signature');
    Route::post('/commitments/{commitment}/decide', [CommitmentController::class, 'decide'])
        ->middleware('permission:commitment.approve', 'require.signature');
    Route::post('/commitments/{commitment}/remind', [CommitmentController::class, 'remind'])
        ->middleware('permission:commitment.remind');

    // Approval queue
    Route::get('/approvals/pending', [ApprovalController::class, 'pending']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});
