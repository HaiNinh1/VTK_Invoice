<?php

namespace App\Providers;

use App\Models\Contract;
use App\Models\InvoiceType;
use App\Models\Request as InvoiceRequest;
use App\Models\User;
use App\Observers\RequestObserver;
use App\Policies\ContractPolicy;
use App\Policies\InvoiceTypePolicy;
use App\Policies\RequestPolicy;
use App\Policies\UserPolicy;
use App\Services\Viettel\FakeViettelDriver;
use App\Services\Viettel\ViettelDriverInterface;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Production swaps this binding to a real Http-based driver.
        $this->app->bind(ViettelDriverInterface::class, FakeViettelDriver::class);
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Contract::class, ContractPolicy::class);
        Gate::policy(InvoiceType::class, InvoiceTypePolicy::class);
        Gate::policy(InvoiceRequest::class, RequestPolicy::class);

        InvoiceRequest::observe(RequestObserver::class);

        // FE-facing user codes look like "u1". Accept either "u1" or "1" in route params.
        Route::bind('user', function (string $value): User {
            $id = str_starts_with($value, 'u') ? substr($value, 1) : $value;

            if (! ctype_digit($id)) {
                abort(404);
            }

            return User::findOrFail((int) $id);
        });
    }
}
