<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Commitment;
use App\Models\InvoiceRequest;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class TimelineController extends Controller
{
    public function __invoke(Request $request, InvoiceRequest $invoiceRequest)
    {
        $this->authorize('view', $invoiceRequest);

        $activities = Activity::query()
            ->where(function ($query) use ($invoiceRequest) {
                $query->whereMorphedTo('subject', $invoiceRequest)
                    ->orWhere(function ($commitmentQuery) use ($invoiceRequest) {
                        $commitmentQuery->where('subject_type', Commitment::class)
                            ->whereIn('subject_id', $invoiceRequest->commitments()->pluck('id'));
                    });
            })
            ->with('causer')
            ->oldest()
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'actor' => $activity->causer?->name,
                'actor_id' => $activity->causer_id,
                'action' => $activity->event ?? $activity->description,
                'note' => $activity->description,
                'properties' => $activity->properties,
                'created_at' => optional($activity->created_at)->toIso8601String(),
            ]);

        return response()->json(['data' => $activities]);
    }
}
