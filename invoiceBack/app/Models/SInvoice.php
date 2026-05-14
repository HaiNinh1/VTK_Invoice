<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SInvoice extends Model
{
    use HasFactory;

    protected $table = 's_invoices';

    protected $fillable = [
        'request_id', 's_invoice_number', 's_invoice_tax_code',
        'status', 'error_message', 'gateway_response_json',
        'exported_at', 'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'gateway_response_json' => 'array',
            'exported_at' => 'datetime',
            'last_synced_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }
}
