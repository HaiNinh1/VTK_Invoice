<?php

namespace App\Services;

use App\Models\AppSetting;

/**
 * Typed accessor over the `app_settings` table for connection configs (S-Invoice, SMTP).
 *
 * - Defaults mirror the FE form initial values in `invoiceFront/src/pages/CaiDat.jsx` ConnectionsTab
 *   so a freshly-installed BE returns the same values the FE prefills with.
 * - Secrets (`apiSecret`, `password`) are stored encrypted at rest by `AppSetting`'s cast.
 * - `*Public()` methods strip secrets and replace them with a boolean `hasX` flag for the GET endpoint.
 */
class ConnectionSettingsService
{
    public const KEY_SINVOICE = 'connections.sinvoice';
    public const KEY_SMTP = 'connections.smtp';

    private const SINVOICE_DEFAULTS = [
        'endpoint' => 'https://api-vinvoice.viettel.vn',
        'taxCode' => '0100109106',
        'username' => 'vtk-prod',
        'apiSecret' => '',
    ];

    private const SMTP_DEFAULTS = [
        'host' => 'smtp.viettel.com.vn',
        'port' => '465',
        'username' => 'no-reply@vtk.vn',
        'password' => '',
        'from' => 'VTK Hoá đơn <no-reply@vtk.vn>',
    ];

    public function sInvoice(): array
    {
        return array_merge(self::SINVOICE_DEFAULTS, AppSetting::getValue(self::KEY_SINVOICE));
    }

    public function smtp(): array
    {
        return array_merge(self::SMTP_DEFAULTS, AppSetting::getValue(self::KEY_SMTP));
    }

    public function sInvoicePublic(): array
    {
        $cfg = $this->sInvoice();
        unset($cfg['apiSecret']);
        $cfg['hasApiSecret'] = $this->sInvoice()['apiSecret'] !== '';

        return $cfg;
    }

    public function smtpPublic(): array
    {
        $cfg = $this->smtp();
        unset($cfg['password']);
        $cfg['hasPassword'] = $this->smtp()['password'] !== '';

        return $cfg;
    }

    public function saveSInvoice(array $patch): array
    {
        $current = $this->sInvoice();
        // Empty-string `apiSecret` from the FE form means "don't change" (avoids wiping stored secret on every save).
        if (array_key_exists('apiSecret', $patch) && ($patch['apiSecret'] === '' || $patch['apiSecret'] === null)) {
            unset($patch['apiSecret']);
        }
        AppSetting::setValue(self::KEY_SINVOICE, array_merge($current, $patch));

        return $this->sInvoicePublic();
    }

    public function saveSmtp(array $patch): array
    {
        $current = $this->smtp();
        if (array_key_exists('password', $patch) && ($patch['password'] === '' || $patch['password'] === null)) {
            unset($patch['password']);
        }
        AppSetting::setValue(self::KEY_SMTP, array_merge($current, $patch));

        return $this->smtpPublic();
    }
}
