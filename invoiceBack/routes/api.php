<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ContractDocumentController;
use App\Http\Controllers\Api\InvoiceTypeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RequestActionController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public auth.
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated routes (Sanctum bearer token).
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/signature', [ProfileController::class, 'uploadSignature']);

    Route::apiResource('users', UserController::class);

    // Contracts.
    Route::apiResource('contracts', ContractController::class);
    Route::post('contracts/{contract}/documents', [ContractDocumentController::class, 'store']);
    Route::delete('contracts/{contract}/documents/{document}', [ContractDocumentController::class, 'destroy']);

    // Invoice types (admin-only CUD; reads open to all auth users).
    Route::apiResource('invoice-types', InvoiceTypeController::class)->parameters(['invoice-types' => 'invoiceType']);
    Route::post('invoice-types/{invoiceType}/toggle-active', [InvoiceTypeController::class, 'toggleActive']);
    Route::post('invoice-types/{invoiceType}/groups', [InvoiceTypeController::class, 'storeGroup']);
    Route::patch('invoice-types/{invoiceType}/groups/{group}', [InvoiceTypeController::class, 'updateGroup']);
    Route::delete('invoice-types/{invoiceType}/groups/{group}', [InvoiceTypeController::class, 'destroyGroup']);
    Route::post('invoice-types/{invoiceType}/groups/{group}/templates', [InvoiceTypeController::class, 'storeTemplate']);
    Route::patch('document-templates/{template}', [InvoiceTypeController::class, 'updateTemplate']);
    Route::delete('document-templates/{template}', [InvoiceTypeController::class, 'destroyTemplate']);

    // Requests (invoice request lifecycle).
    Route::apiResource('requests', RequestController::class)->parameters(['requests' => 'invoiceRequest']);
    Route::post('requests/{invoiceRequest}/submit', [RequestActionController::class, 'submit']);
    Route::post('requests/{invoiceRequest}/recall', [RequestActionController::class, 'recall']);
    Route::post('requests/{invoiceRequest}/approve', [RequestActionController::class, 'approve']);
    Route::post('requests/{invoiceRequest}/reject', [RequestActionController::class, 'reject']);
    Route::post('requests/{invoiceRequest}/return', [RequestActionController::class, 'returnSupplement']);
    Route::post('requests/{invoiceRequest}/export', [\App\Http\Controllers\Api\SInvoiceController::class, 'export']);
    Route::post('requests/{invoiceRequest}/retry-export', [\App\Http\Controllers\Api\SInvoiceController::class, 'retry']);


    // Notifications.
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
    Route::get('notification-settings', [\App\Http\Controllers\Api\NotificationController::class, 'settings']);
    Route::patch('notification-settings', [\App\Http\Controllers\Api\NotificationController::class, 'updateSettings']);

    // Reports.
    Route::get('reports/summary', [\App\Http\Controllers\Api\ReportsController::class, 'summary']);
    Route::get('reports/contracts.xlsx', [\App\Http\Controllers\Api\ReportsController::class, 'contractsXlsx']);
    Route::get('reports/requests.xlsx', [\App\Http\Controllers\Api\ReportsController::class, 'requestsXlsx']);

    // Settings (admin-only enforced inside controller).
    Route::get('settings/connections', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
    Route::patch('settings/connections/s-invoice', [\App\Http\Controllers\Api\SettingsController::class, 'updateSInvoice']);
    Route::patch('settings/connections/smtp', [\App\Http\Controllers\Api\SettingsController::class, 'updateSmtp']);
    Route::post('settings/connections/s-invoice/test', [\App\Http\Controllers\Api\SettingsController::class, 'testSInvoice']);
    Route::post('settings/connections/smtp/test', [\App\Http\Controllers\Api\SettingsController::class, 'testSmtp']);
});

// Public webhook (HMAC-signed, no Sanctum).
Route::post('/webhooks/viettel/sinvoice', [\App\Http\Controllers\Api\ViettelWebhookController::class, 'handle']);
