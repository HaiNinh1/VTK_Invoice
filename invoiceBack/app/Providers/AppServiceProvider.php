<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

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
