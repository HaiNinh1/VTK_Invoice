<?php

use App\Http\Controllers\Api\V1\ApprovalController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InvoiceRequestActionController;
use App\Http\Controllers\Api\V1\InvoiceRequestController;
use App\Http\Controllers\Api\V1\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]));

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

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
        ->middleware('permission:invoice.approve.dept|invoice.approve.accountant|invoice.approve.director');
    Route::post('/invoice-requests/{invoiceRequest}/reject', [InvoiceRequestActionController::class, 'reject'])
        ->middleware('permission:invoice.approve.dept|invoice.approve.accountant|invoice.approve.director');

    // Approval queue
    Route::get('/approvals/pending', [ApprovalController::class, 'pending']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});
