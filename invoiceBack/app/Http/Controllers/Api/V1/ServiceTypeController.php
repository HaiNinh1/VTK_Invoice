<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceTypeRequest;
use App\Http\Requests\UpdateServiceTypeRequest;
use App\Http\Resources\ServiceTypeResource;
use App\Models\ServiceType;
use Illuminate\Http\Request;

class ServiceTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ServiceType::class);

        $query = ServiceType::query()->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) min(100, max(1, (int) $request->input('per_page', 20)));

        return ServiceTypeResource::collection($query->paginate($perPage));
    }

    public function store(StoreServiceTypeRequest $request)
    {
        $this->authorize('create', ServiceType::class);

        return (new ServiceTypeResource(ServiceType::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(ServiceType $serviceType): ServiceTypeResource
    {
        $this->authorize('view', $serviceType);

        return new ServiceTypeResource($serviceType);
    }

    public function update(UpdateServiceTypeRequest $request, ServiceType $serviceType): ServiceTypeResource
    {
        $this->authorize('update', $serviceType);

        $serviceType->update($request->validated());

        return new ServiceTypeResource($serviceType->refresh());
    }

    public function destroy(ServiceType $serviceType)
    {
        $this->authorize('delete', $serviceType);

        if ($serviceType->invoiceRequests()->exists() || $serviceType->invoiceTypes()->exists()) {
            return response()->json(['message' => 'Service type is in use.'], 409);
        }

        $serviceType->delete();

        return response()->noContent();
    }
}
