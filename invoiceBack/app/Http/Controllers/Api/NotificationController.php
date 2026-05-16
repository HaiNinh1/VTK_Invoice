<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    /**
     * GET /api/notifications  — returns the authed user's notifications, newest first.
     * Honours each user's per-kind settings (disabled kinds are filtered out).
     */
    public function index(HttpRequest $request): JsonResponse
    {
        $user = $request->user();
        $settings = $this->dispatcher->settingsForUser($user->id);
        $disabledKinds = array_keys(array_filter($settings, fn ($v) => $v === false));

        $rows = Notification::query()
            ->where('user_id', $user->id)
            ->when($disabledKinds, fn ($q) => $q->whereNotIn('kind', $disabledKinds))
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json([
            'data' => NotificationResource::collection($rows)->resolve(),
            'unreadCount' => $rows->whereNull('read_at')->count(),
        ]);
    }

    /** POST /api/notifications/{id}/read */
    public function markRead(HttpRequest $request, string $id): JsonResponse
    {
        $row = Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();
        if ($row->read_at === null) {
            $row->forceFill(['read_at' => now()])->save();
        }
        return response()->json(['ok' => true]);
    }

    /** POST /api/notifications/read-all */
    public function markAllRead(HttpRequest $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['ok' => true]);
    }

    /** GET /api/notification-settings */
    public function settings(HttpRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dispatcher->settingsForUser($request->user()->id),
        ]);
    }

    /** PATCH /api/notification-settings  body: {pendingApproval:bool, ...} */
    public function updateSettings(HttpRequest $request): JsonResponse
    {
        $patch = $request->validate(
            // Accept any of the 9 keys, all booleans.
            collect(\App\Models\NotificationSetting::KINDS)
                ->mapWithKeys(fn ($k) => [$k => ['sometimes', 'boolean']])
                ->all()
        );
        $merged = $this->dispatcher->updateSettingsForUser($request->user()->id, $patch);
        return response()->json(['data' => $merged]);
    }
}
