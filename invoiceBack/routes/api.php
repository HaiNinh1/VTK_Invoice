<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ContractDocumentController;
use App\Http\Controllers\Api\InvoiceTypeController;
use App\Http\Controllers\Api\ProfileController;
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
});
