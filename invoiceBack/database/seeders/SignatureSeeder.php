<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserSignature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class SignatureSeeder extends Seeder
{
    public function run(): void
    {
        foreach (User::all() as $user) {
            $path = "signatures/{$user->id}.txt";
            Storage::disk('local')->put($path, "Demo signature for {$user->email}");

            UserSignature::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'method' => 'text',
                    'data_path' => $path,
                    'font_family' => 'sans',
                ]
            );
        }
    }
}
