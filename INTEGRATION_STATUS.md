# VTK_Invoice — Integration Status

_Last updated: 2026-05-12_

## TL;DR
- Backend (Laravel 11) and Frontend (Vite + React + TS) are now **wired together and runnable end-to-end** for the core invoice flow.
- P0 integration blockers fixed: frontend payload field-name mismatch, frontend build error (`isConflict`), missing frontend `tsconfig.json`, catalog read endpoints inaccessible to non-admin roles.
- Verified flows: login → list catalogs/customers/invoice-requests → create invoice-request draft.

## How to run (Windows, current setup)

### Prereqs (verified)
- PHP 8.4.15, Composer 2.9.2
- Node v24.12.0, pnpm 10.10.0
- MySQL 8.0.30 on `127.0.0.1:3307`, DB `vtkinvoice` migrated + seeded

### Backend
```powershell
cd D:\BTAP\VTK_Invoice\invoiceBack
php artisan serve --host=127.0.0.1 --port=8000
# Health: GET http://127.0.0.1:8000/api/v1/health -> {"status":"ok",...}
```

### Frontend
```powershell
cd D:\BTAP\VTK_Invoice\invoiceFront
# NOTE: Windows reserves TCP ports 5083-5282 (covers Vite's default 5173).
# Use a port outside the excluded range.
pnpm dev --port 3100 --host 127.0.0.1
# Open http://127.0.0.1:3100/
```
Check Windows reservations with `netsh interface ipv4 show excludedportrange protocol=tcp` if a port refuses to bind.

### Seeded users (password = `password`)
- `employee@vtk.local`
- `manager@vtk.local`
- `accountant@vtk.local`
- `director@vtk.local`
- `admin@vtk.local`
- `employee.kv1@vtk.local`, `manager.kv1@vtk.local`

## P0 Fixes applied this session

1. **Frontend payload mismatch — invoice create**
   - File: `invoiceFront/src/app/components/CreateInvoiceForm.tsx`
   - Renamed payload fields to match backend `StoreInvoiceRequestRequest`:
     - `amount_before_vat` → `before_vat`
     - `amount_after_vat`  → `after_vat`
     - removed `vat_amount` (backend derives from `tax_rate`)
   - Updated field-error keys + DOM `id`/`for` to `before_vat`.

2. **Frontend build blocker — missing API error helper**
   - File: `invoiceFront/src/app/components/ApprovalRoleBased.tsx` line 59
   - `e.isConflict()` → `e.isAlreadyInvoiced()` (matches `src/lib/api/errors.ts`).

3. **Frontend missing `tsconfig.json`**
   - Added `invoiceFront/tsconfig.json` with bundler-mode TS, JSX, `@/*` path alias.

4. **Backend catalog read endpoints — 403 for non-admin**
   - File: `invoiceBack/routes/api.php`
   - Split catalog reads (any auth user) from writes (admin / `catalog.manage` / `invoice_type.manage`):
     - `GET /invoice-types`, `GET /invoice-types/{id}`
     - `GET /service-types`, `GET /service-types/{id}`
     - `GET /legal-documents`, `GET /legal-documents/{id}`
   - Files: `invoiceBack/app/Policies/{InvoiceTypePolicy,ServiceTypePolicy,LegalDocumentPolicy}.php`
     - `viewAny()` and `view()` now return `true` for any authenticated user.
     - Writes (`create`/`update`/`delete`) still gated by `canManage()`.

## Smoke Test Evidence

- `GET /api/v1/health` → 200 `{"status":"ok"}`
- `POST /api/v1/auth/login` (employee@vtk.local) → token + user payload, role `employee`
- `GET /api/v1/auth/me` → 200, includes roles + permissions
- `GET /api/v1/customers` → 5 seeded customers
- `GET /api/v1/invoice-types` → 8 records (was 403 before fix)
- `GET /api/v1/service-types` → 8 records (was 403 before fix)
- `GET /api/v1/legal-documents` → 11 records (was 403 before fix)
- `GET /api/v1/invoice-requests` → 3 seeded drafts/pending
- `POST /api/v1/invoice-requests` with `{invoice_type_id, customer_id, service_type_id, before_vat, tax_rate, after_vat, notes}` → 200, created `DN-2026-00005`
- `pnpm build` → clean, 2423 modules, 1 size-warning only (no errors)
- `pnpm dev --port 3100` → serves index.html (HTTP 200)

## Known Gaps / P1 backlog

### Done this session (round 2)
- ✅ Pinned Vite dev port to 3100 in `vite.config.ts` (Windows reserves 5083–5282).
- ✅ Gated demo role switcher behind `VITE_ENABLE_DEMO_ROLE_SWITCHER` (default off). Two switcher clusters (desktop header + mobile menu) wrapped in `{SHOW_DEMO_ROLE_SWITCHER && ...}`. Added flag to `.env.example`.
- ✅ Wired `NotificationCenter.tsx` to `useNotifications` + `useMarkNotificationRead` + `useMarkAllNotificationsRead`. Mock array deleted. Added loading/error states, type-classifier (approval/legal/system), relative-time formatter, date-bucket grouping based on real `created_at`. Click row → marks read. “Đọc tất cả” wired. Replaced “Xoá đã đọc” with “Làm mới” (refetch) since backend has no delete endpoint.

### Deferred — require user direction on data-ownership
Originally in scope; turned out to be **architectural migrations**, not cleanup. Not safe to land without an explicit decision:

1. **ContractManagement → useContracts wiring.** Frontend `Contract` type (`src/app/data/contractData.ts`) carries rich nested `installments[]`, `masterDocuments[]`, computed `totalInvoiced/totalPaid/remainingAmount`, per-installment status. Backend `ContractResource` returns flat fields + `whenLoaded('installments')` only when `?include=installments` requested. Component modals (create installment, upload document) call write paths the backend doesn't expose. Decision needed: keep mock as source of truth and treat backend as read-only ledger, OR cut the rich modals and rebuild around backend shape.

2. **InvoiceTypeManagement → useInvoiceTypes wiring.** Backend returns `code/name/description/status/total_invoices/compliance_rate` + optional legal_documents; admin UI expects per-type document-requirement config CRUD with no backend endpoint. Decision: read-only admin view (small change) or skip until backend gets the config CRUD.

3. **Hardcoded 'Nguyễn Văn A' / 'KV3' across role-based views.** These are **not display strings** — they are filter predicates against `useMasterInvoiceData` (mock). Replacing them only matters once each role-based list moves off mock onto `useInvoiceRequests`. Affected: `InvoiceListRoleBased`, `LegalTracking`, `Reports`, `InvoiceExport`, `DashboardEmployee/Manager/Company`. Decision: keep mock for demo continuity, or migrate to backend (multi-day; needs backend additions for some report shapes).

### P2 backlog
- Backend missing: users/admin APIs, S-Invoice/VFS endpoints, exports, file download, parts of dashboard/report/settings.
- `NotificationDropdown` header dropdown in `App.tsx` already pulls from `useNotifications`; could DRY date/type mapping helpers with `NotificationCenter`.
- “Demo Chữ ký” header button could also be gated by the same env flag.
- Vite bundle warning: 1.29 MB main chunk — add `manualChunks` later.

## File Map of Changes
### Backend
- `invoiceBack/routes/api.php` — catalog read/write route split
- `invoiceBack/app/Policies/InvoiceTypePolicy.php` — open `viewAny`/`view`
- `invoiceBack/app/Policies/ServiceTypePolicy.php` — open `viewAny`/`view`
- `invoiceBack/app/Policies/LegalDocumentPolicy.php` — open `viewAny`/`view`

### Frontend
- `invoiceFront/src/app/components/CreateInvoiceForm.tsx` — payload field rename
- `invoiceFront/src/app/components/ApprovalRoleBased.tsx` — error helper rename
- `invoiceFront/src/app/components/NotificationCenter.tsx` — full rewrite, backend-driven
- `invoiceFront/src/app/App.tsx` — demo role switcher gated by env flag
- `invoiceFront/vite.config.ts` — pinned port 3100
- `invoiceFront/tsconfig.json` — added
- `invoiceFront/.env.example` — documented `VITE_ENABLE_DEMO_ROLE_SWITCHER`
