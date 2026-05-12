<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceRequestResource;
use App\Models\InvoiceRequest;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    /**
     * Pending approval queue tailored to the actor's permissions.
     */
    public function pending(Request $request)
    {
        $user = $request->user();
        $query = InvoiceRequest::query()
            ->with(['customer', 'creator', 'revenueCenter', 'invoiceType', 'serviceType']);

        if ($user->can('invoice.approve.accountant') && ! $user->can('invoice.approve.director')) {
            $query->where('status', InvoiceStatus::Pending->value);
        } elseif ($user->can('invoice.approve.director')) {
            $query->where('status', InvoiceStatus::PendingVpgd->value);
        } else {
            $query->whereRaw('1 = 0');
        }

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));

        return InvoiceRequestResource::collection($query->latest()->paginate($perPage));
    }
}
