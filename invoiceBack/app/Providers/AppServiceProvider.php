<?php

namespace App\Providers;

use App\Models\InvoiceRequest;
use App\Observers\InvoiceRequestObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        InvoiceRequest::observe(InvoiceRequestObserver::class);
    }
}
