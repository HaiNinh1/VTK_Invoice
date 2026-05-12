# Backend Full-Coverage Implementation Plan

**Project:** VTK_Invoice — Laravel 11/12 backend (`invoiceBack`)
**Goal:** Make the backend fully cover every feature the React frontend (`invoiceFront`) implies, fix all logic bugs identified in the deep-dive, and ship a production-grade API.
**Source of truth:** Deep-dive cross-check (see chat transcript dated 2026-05-12) — frontend has 0 real API calls; backend covers ~35–40% of UI surface and contains several critical bugs.

---

## 0. Conventions & Ground Rules

- **API prefix:** `/api/v1` (already configured in `bootstrap/app.php`). All new routes go under this prefix.
- **Auth:** Laravel Sanctum (token + SPA cookie). Existing setup is kept.
- **Authorization:** Spatie Laravel Permission. Policies for every resource that has visibility scope (revenue-center vs. own vs. all).
- **Response shape:** ALWAYS wrap in `JsonResource` — `{ data, meta?, links? }`. Never return raw paginators. Update `NotificationController@index` to comply.
- **Validation:** Use `FormRequest` classes for every write endpoint. No inline validation longer than 5 rules.
- **Errors:** Existing JSON exception renderer in `bootstrap/app.php` is kept. New error codes use the same `{ message, errors? }` shape.
- **Naming:** snake_case in JSON, camelCase nowhere. Match existing `InvoiceRequestResource` style.
- **Timestamps:** ISO-8601 UTC. Cast all date/datetime columns in models.
- **Money:** `decimal(18,2)` already used; never use float. Multiply server-side; never trust client math.
- **Soft deletes:** Already used on `InvoiceRequest`, `Contract`. Extend to `Customer`, `InvoiceType`, `ServiceType`, `LegalDocument`, `Commitment`.
- **Transactions:** Wrap every multi-write action in `DB::transaction()`.
- **Activity log:** Spatie activity log is already wired; every state-changing action must emit a log entry.
- **Tests:** Each phase ships with feature tests (`tests/Feature/...`). Aim for >80% line coverage on services and controllers. Use `RefreshDatabase`.
- **Throttling:** `throttle:api` (60/min) globally; `throttle:6,1` on `/auth/login`.
- **OpenAPI:** Generate `docs/openapi.yaml` after each phase using `dedoc/scramble` or `darkaonline/l5-swagger` (pick one in Phase 1).
- **Commits:** Conventional Commits. Each phase = one or more PRs. Never commit `.env`.

---

## 1. Phase Map (high-level)

| Phase | Title | Outcome | Est. tasks |
|---|---|---|---|
| 1 | Critical bug fixes & hardening | Existing API stops lying to clients | 12 |
| 2 | Commitments + Legal compliance v2 | Legal workflow actually works | 9 |
| 3 | Contracts write side + Master documents | Frontend contract page is functional | 7 |
| 4 | Invoice Types & Catalog admin | Admin can configure invoice types | 6 |
| 5 | Reports & Dashboard aggregations | Reports page renders real data | 8 |
| 6 | Export pipeline (PDF + Excel) | Invoices can be printed/exported | 7 |
| 7 | Admin / Settings module | Settings page is functional | 12 |
| 8 | Notifications v2 (email, categories, prefs) | Email channel + grouping work | 6 |
| 9 | S-Invoice integration | Issuance pipeline live (real or sandbox) | 9 |
| 10 | VFS accounting integration | Postings + reconciliation work | 8 |
| 11 | Workflow completion (approved→issued→accounted) | Full state machine implemented | 4 |
| 12 | Hardening, OpenAPI, perf, observability | Production-ready | 8 |

Total: ~96 atomic tasks. Order is dependency-driven; phases can be parallelized only inside themselves.

---

## Phase 1 — Critical Bug Fixes & Hardening

### 1.1 Fix legal-compliance table mismatch
- **Files:** `app/Services/LegalComplianceService.php`
- **Change:** Read uploaded docs from `invoice_request_legal_documents` (matching by `document_type` → `LegalDocument.code`), not from `invoice_request_documents`.
- **Add method:** `missingDocuments(InvoiceRequest $r): array` returning list of `LegalDocument` codes that are required-for-this-invoice-type but not uploaded.
- **Source of requirements:** `invoice_types.required_legal_documents` (JSON array of `LegalDocument.code`). Fall back to `legal_documents.default_required = true` if invoice type has none configured.
- **Acceptance:** Unit test asserts that uploading a file with `document_type = "contract"` for an invoice whose type requires `["contract"]` marks compliance as `complete`.

### 1.2 Refresh compliance cache on document changes
- **Files:** `app/Http/Controllers/Api/V1/InvoiceRequestLegalDocumentController.php`
- **Change:** After `store()` and `destroy()`, call `LegalComplianceService::refresh($invoiceRequest)`.
- **Acceptance:** Feature test: upload → GET invoice → `legal_status` is `complete`. Delete → `legal_status` is `supplementing` or `missing`.

### 1.3 Server-compute `legal_complete`
- **Files:** `app/Http/Requests/StoreInvoiceRequestRequest.php`, `UpdateInvoiceRequestRequest.php`, `InvoiceRequestController@store/update`, `LegalComplianceService`.
- **Change:**
  - Remove `legal_complete` from request validation entirely.
  - Compute it in `LegalComplianceService::refresh()` as `count(missing) === 0` and persist to the column.
  - Submit flow: `ApprovalService::submit()` calls `refresh()` first, then reads the column.
- **Acceptance:** `POST /invoice-requests` with `legal_complete=true` in body is ignored. Submit branches based on actual uploaded docs.

### 1.4 Enforce `current_handler_id` in workflow actions
- **Files:** `app/Services/ApprovalService.php`
- **Change:** In `approve/reject/return`, before checking step permission, assert `$invoice->current_handler_id === null || $invoice->current_handler_id === $actor->id || $actor->hasRole('admin')`. Return 403 with `not_assigned_handler` code otherwise.
- **Acceptance:** A second accountant cannot poach an invoice already assigned to another accountant unless they are admin.

### 1.5 Add policies on Contracts and Customers
- **Files:** `app/Policies/ContractPolicy.php` (new), `app/Policies/CustomerPolicy.php` (new), `app/Providers/AppServiceProvider.php` (register).
- **Rules:**
  - Contract `viewAny`: any authenticated user with `contract.view.own | center | all`.
  - Contract `view`: own (project_manager_id), center (revenue_center_id), all — pattern from `InvoiceRequestPolicy`.
  - Customer `viewAny`/`view`: `invoice.view.*` permissions reused.
- **Files updated:** `ContractController`, `CustomerController` — add `$this->authorize(...)` calls and `Customer::scopeVisibleTo` / `Contract::scopeVisibleTo` query scopes.
- **Acceptance:** Employee sees only own contracts; manager sees center's; accountant/director/admin see all.

### 1.6 Eager-load relations on workflow action responses
- **Files:** `app/Http/Controllers/Api/V1/InvoiceRequestActionController.php`
- **Change:** Before returning `new InvoiceRequestResource($invoice)`, call `$invoice->load(['customer','invoiceType','serviceType','revenueCenter','creator','currentHandler','approvedBy','approvals','commitments','legalDocuments'])`.
- **Acceptance:** Response after `approve` contains non-null `customer.name`.

### 1.7 Fix `NotificationController@index` shape
- **Files:** `app/Http/Resources/NotificationResource.php` (new), `app/Http/Controllers/Api/V1/NotificationController.php`
- **Change:**
  - Return `NotificationResource::collection($paginator)`.
  - Resource shape: `{ id, category, type, title, message, data, read_at, priority, created_at }`.
  - Compute `category` by mapping notification class → category enum (`approval`, `legal`, `system`).
  - Compute `priority` from notification data (default `normal`).
- **Acceptance:** Response wraps `{ data: [], meta: {...}, links: {...} }`.

### 1.8 Validate invoice math
- **Files:** `app/Http/Requests/StoreInvoiceRequestRequest.php`, `UpdateInvoiceRequestRequest.php`
- **Change:** Add `after`-style rule using `closure`: `abs($after_vat - $before_vat * (1 + $tax_rate/100)) <= 0.01`. Fail with `invalid_total` error.
- **Acceptance:** Sending mismatched totals returns 422.

### 1.9 Add `exists` validation for `contract_id` and `payment_installment_id`
- **Files:** Same Form Requests.
- **Change:** `nullable|integer|exists:contracts,id`, `nullable|integer|exists:payment_installments,id`. Also assert installment belongs to contract via closure.
- **Acceptance:** Sending bogus IDs returns 422.

### 1.10 Throttle login
- **Files:** `routes/api.php`
- **Change:** Apply `middleware('throttle:6,1')` to `POST /auth/login`.
- **Acceptance:** 7th login attempt within 1 minute returns 429.

### 1.11 Symmetric signature requirement
- **Files:** `routes/api.php`
- **Decision:** Submit/resubmit do NOT require signature (no audit doc produced). Document this in route comments. Leave behavior as-is.
- **Acceptance:** Doc-only change; existing tests pass.

### 1.12 Expose `s_invoice_error` in resource
- **Files:** `app/Http/Resources/InvoiceRequestResource.php`
- **Change:** Add `s_invoice_error` field.
- **Acceptance:** Resource snapshot test updated.

**Phase 1 Exit Criteria:**
- All 12 tasks shipped with feature tests.
- Run `php artisan test` — green.
- `php artisan migrate:fresh --seed` works.
- Existing endpoints behave correctly per OpenAPI (generated at end of phase).

---

## Phase 2 — Commitments & Legal Compliance v2

### 2.1 Commitments table audit & migration
- **Files:** `database/migrations/2026_05_13_000001_finalize_commitments.php`
- **Change:** Ensure columns exist: `id, invoice_request_id (FK, cascade), code (unique), content (text), deadline (date), signer_id (FK users), signed_at (datetime nullable), signature_snapshot_id (FK nullable), status (enum: pending, signed, fulfilled, overdue, extended, rejected), missing_documents (json), director_decision (enum: pending, accepted, rejected nullable), director_note (text nullable), extensions (json default '[]'), created_at, updated_at, deleted_at`. Add indices on `(invoice_request_id, status)`, `(deadline)`.
- **Model:** `app/Models/Commitment.php` — casts, fillable, relations (invoiceRequest, signer, signatureSnapshot), activity log.

### 2.2 CommitmentController + routes
- **Routes (all `auth:sanctum`):**
  - `GET /invoice-requests/{invoiceRequest}/commitments` — list
  - `POST /invoice-requests/{invoiceRequest}/commitments` — create (creator only, `permission:invoice.create`, require.signature, captures snapshot)
  - `GET /commitments/{commitment}` — show
  - `POST /commitments/{commitment}/extend` — director only (`permission:commitment.extend`), body `{ days: 1-30, reason: required min 10 }`
  - `POST /commitments/{commitment}/decide` — director only (`permission:commitment.approve`), body `{ decision: accepted|rejected, note }`
  - `POST /commitments/{commitment}/remind` — accountant/director (`permission:commitment.remind`), triggers `CommitmentReminderNotification`
- **FormRequests:** `StoreCommitmentRequest`, `ExtendCommitmentRequest`, `DecideCommitmentRequest`.
- **Resource:** `CommitmentResource`.

### 2.3 CommitmentService
- `create(InvoiceRequest, array)`: generates `code` (e.g. `CK-YYYY-#####` via new sequence), captures missing docs snapshot from `LegalComplianceService::missingDocuments()`, requires actor signature snapshot, persists.
- `extend(Commitment, days, reason)`: pushes onto `extensions` json (with actor, before/after deadlines, ISO timestamp), checks config max-extensions (default 2), updates `deadline` and `status='extended'`.
- `markOverdue()`: scheduled job (Phase 8) sets `status='overdue'` when `deadline < today` and not fulfilled.
- `decide(Commitment, decision, note)`: sets `director_decision`, `director_note`. If `accepted`, marks status `fulfilled`. If `rejected`, marks `rejected` and **bubbles back to ApprovalService::returnForSupplement** on the invoice with reason "Commitment rejected: {note}".

### 2.4 New permissions
- `commitment.create` (employees with `invoice.create`), `commitment.extend` (director, admin), `commitment.approve` (director, admin), `commitment.remind` (accountant, director, admin).
- Update `RolePermissionSeeder.php`.

### 2.5 Hook into ApprovalService.submit
- When `legal_complete === false`, require at least one **pending** (un-decided) Commitment to allow `pending_vpgd` branch. Currently checks any commitment — tighten.

### 2.6 Legal compliance report endpoint
- `GET /reports/legal-compliance` — director/accountant/admin only.
- Query params: `from`, `to`, `revenue_center_id`, `service_type_id`.
- Response: `{ data: { totals: { total, complete, supplementing, insufficient, overdue, completion_rate }, by_center: [...], by_service: [...] } }`.
- Service: `app/Services/Reports/LegalComplianceReportService.php`.

### 2.7 Approve compliance report
- `POST /reports/legal-compliance/approve` — director/admin only.
- Stores an `audit_approvals` row (new table) with snapshot of report payload and approver signature.

### 2.8 Frontend commitment fields exposed in InvoiceRequestResource
- Add `commitment` nested resource (latest active commitment) to invoice request payload.

### 2.9 Tests
- Feature: create commitment → submit invoice → director accepts → invoice approved.
- Feature: director rejects commitment → invoice transitions to `returned` with reason.
- Feature: extend commitment past max — 422.

---

## Phase 3 — Contracts Write Side + Master Documents

### 3.1 Migrations
- `2026_05_13_010001_add_contract_write_fields.php`: ensure `Contract` has `project_manager_id (FK users)`, `revenue_center_id (FK)`, `total_value_after_tax`, `total_invoiced`, `total_paid`, `remaining_amount`, `progress` (computed columns or accessors), `status` enum (`draft, active, completed, terminated`).
- Ensure `contract_documents` table covers: `id, contract_id (FK), name, file_path, original_filename, mime_type, file_size, uploaded_by_id, is_shared (bool), created_at, updated_at`.

### 3.2 Contracts CRUD endpoints
- `POST /contracts` (`permission:contract.create`)
- `PUT/PATCH /contracts/{contract}` (`permission:contract.update`)
- `DELETE /contracts/{contract}` (soft delete, `permission:contract.delete`)
- FormRequests with validation: `code unique`, `name max 255`, `customer_id exists`, `total_value > 0`, `sign_date date`, `start_date date`, `end_date after_or_equal start_date`, `revenue_center_id exists`, `project_manager_id exists users`.

### 3.3 Installments CRUD
- `POST /contracts/{contract}/installments`
- `PUT /contracts/{contract}/installments/{installment}`
- `DELETE /contracts/{contract}/installments/{installment}`
- Auto-calc `sequence` if missing. Validate sum of installment amounts == contract total_value (warn-only, not blocker).

### 3.4 Contract documents endpoints
- `GET /contracts/{contract}/documents`
- `POST /contracts/{contract}/documents` — multipart upload
- `DELETE /contracts/{contract}/documents/{document}`
- File rules: pdf/doc/docx/xls/xlsx/jpg/png, max 20MB.
- Storage: `contracts/{contractId}/`.

### 3.5 Fix `CreateInvoiceFromInstallmentAction`
- Idempotency: reject if installment already has a non-cancelled invoice request (`installment.invoice_request_id` set, or any non-rejected/non-cancelled IR with `payment_installment_id = $installment->id`).
- Resolve invoice type via `contract.default_invoice_type_id` (new nullable FK on contract) instead of `firstOrFail()`.
- Resolve service type same way.
- Wrap in `DB::transaction()`.
- After creation, refresh compliance + update installment `invoiced_amount += amount`.

### 3.6 Recompute contract aggregates
- `app/Services/ContractAggregateService.php`: `recompute(Contract)` recalculates `total_invoiced`, `total_paid`, `remaining_amount`, `progress`. Hook into IR `created/updated/deleted` model events when `contract_id` is non-null.

### 3.7 Permissions + tests
- New permissions: `contract.create`, `contract.update`, `contract.delete`, `contract.document.upload`.
- Tests: create contract, upload master doc, create installment, create invoice from installment (idempotency).

---

## Phase 4 — Invoice Types & Catalog Admin

### 4.1 InvoiceType CRUD endpoints
- `GET /invoice-types` (already? no — add). Filters: `status`, `search`.
- `POST /invoice-types` (`permission:catalog.manage`)
- `PUT /invoice-types/{invoiceType}`
- `DELETE /invoice-types/{invoiceType}` (soft delete; prevent if used by any IR)
- `POST /invoice-types/{invoiceType}/toggle-status`

### 4.2 InvoiceTypeResource
- Fields: `id, code, name, description, service_types (array of ServiceType refs), legal_documents (array of LegalDocument refs marked required/optional), status, total_invoices (computed), compliance_rate (computed), created_at, updated_at`.

### 4.3 Validation
- `code` unique, max 50.
- `service_type_ids` array of `exists:service_types,id`.
- `required_legal_document_codes` array of `exists:legal_documents,code`.

### 4.4 LegalDocument catalog endpoints (admin)
- `GET /legal-documents` — list all.
- `POST /legal-documents`, `PUT`, `DELETE` (`permission:catalog.manage`).
- Fields: `code, name, description, group (contract|acceptance|settlement|payment_guarantee), default_required, default_deadline_days, enabled`.

### 4.5 ServiceType catalog endpoints
- Same CRUD pattern.

### 4.6 Tests
- Admin creates invoice type with required docs → invoice using that type computes legal status against those docs only.

---

## Phase 5 — Reports & Dashboard Aggregations

### 5.1 Extend `/dashboard`
- Add to response:
  - `monthly_revenue`: array of `{ month, revenue, count }` for last 12 months
  - `recent_requests`: latest 10 IRs visible to user
  - `top_customers`: top 5 by revenue YTD
  - `pending_approvals_count` (matches `/approvals/pending` total)
- Service: `app/Services/Reports/DashboardService.php`. Cache 5 min per user.

### 5.2 Revenue report endpoint
- `GET /reports/revenue`
- Query: `period=month|quarter|year`, `from`, `to`, `revenue_center_id`, `service_type_id`.
- Response: `{ data: { totals: {revenue, count, avg, growth_pct}, series: [...], by_service: [...], by_center: [...], top_customers: [...], yoy_comparison: [...] } }`.
- Service: `RevenueReportService`. Optimize with raw SQL aggregations on `invoice_requests` filtered by status in `['approved','issued','accounted']`.

### 5.3 Center report
- `GET /reports/centers` — per-center aggregations (revenue, IR count, compliance, top customers).

### 5.4 Reconciliation report
- `GET /reports/reconciliation` — 3-way reconciliation across IR / S-Invoice / VFS rows.
- Response per row: `{ request_code, before_vat, after_vat, s_invoice_code, s_invoice_amount, vfs_voucher, vfs_amount, mismatches: [...] }`.

### 5.5 Report export endpoints
- `GET /reports/{type}/export` with `format=excel|pdf`. Wires to Phase 6 pipeline.

### 5.6 Scopes & permissions
- `report.view.center` (manager), `report.view.all` (accountant/director/admin).
- Manager scope: filter all queries to `revenue_center_id = user.revenue_center_id`.

### 5.7 Performance
- Add covering indexes: `invoice_requests (revenue_center_id, status, created_at)`, `(service_type_id, status, created_at)`, `(customer_id, status)`.

### 5.8 Tests
- Seeded fixtures verify totals match per-period sums.

---

## Phase 6 — Export Pipeline (PDF + Excel)

### 6.1 Dependencies
- `composer require barryvdh/laravel-dompdf` (PDF).
- `composer require maatwebsite/excel` (Excel).
- Optional: `composer require spatie/laravel-pdf` if dompdf renders Vietnamese poorly — decide after test.

### 6.2 Invoice PDF templates
- `resources/views/exports/invoice/{standard,detailed,simple}.blade.php` matching the frontend's preview layout.
- Embed Vietnamese fonts (Roboto/Noto Sans) under `resources/fonts/`.

### 6.3 Export service
- `app/Services/Export/InvoiceExportService.php`
  - `renderPdf(InvoiceRequest $r, string $template, array $options): string` returns binary
  - `renderExcel(Collection $rs, array $options): string`
- `app/Services/Export/ReportExportService.php` similar for reports.

### 6.4 Endpoints
- `POST /invoice-requests/export` body `{ ids: [], format: pdf|excel, template, options: { include_header, footer, logo, signature, stamp, paper_size, orientation } }`. Authorization: each invoice must pass `view` policy. Returns binary stream or async job link if > 50 invoices.
- `GET /invoice-requests/{invoiceRequest}/preview` returns rendered PDF inline.

### 6.5 Async export job
- For batch > 50: dispatch `ExportInvoicesJob`, store result in `storage/app/exports/{uuid}.zip`, send notification with download URL valid for 24h via signed route.

### 6.6 Activity log export
- `GET /audit/activity-log/export` (admin) — Excel of activity log filtered by user/date/action.

### 6.7 Tests
- Snapshot tests on rendered HTML before PDF.
- Excel: open with PhpSpreadsheet in test, assert row counts and totals.

---

## Phase 7 — Admin / Settings Module

### 7.1 Users CRUD
- `GET /users` (admin only). Filters: `role, revenue_center_id, department_id, is_active, search`.
- `POST /users` — body includes `name, email, password, phone, employee_code, department_id, revenue_center_id, role`.
- `PUT /users/{user}` — full update.
- `POST /users/{user}/toggle-active`.
- `POST /users/{user}/reset-password` — admin sends new password (or trigger email).
- `DELETE /users/{user}` — soft delete + revoke tokens.
- FormRequests with `email unique`, `employee_code unique`, password rules (min 8, mixed).

### 7.2 Roles & permissions matrix
- `GET /admin/permission-matrix` — `{ roles: [...], permissions: [...], matrix: { role: { permission: bool } } }`.
- `PUT /admin/permission-matrix` — save changed cells (delta). Validates against Spatie tables. Admin only.

### 7.3 Workflow configuration
- New table `workflow_steps`: `id, code (submit|accountant|director|issue|accounting), label, enabled, handler_role, sla_hours, order, options (json)`. Seeded with defaults.
- `GET /admin/workflow` — list steps + global toggles (`require_director_when_legal_missing`, `allow_commitment`, `auto_email`).
- `PUT /admin/workflow` — update steps + toggles. Admin only.
- `ApprovalService` reads these settings at runtime via cached `WorkflowConfigService` (5-min cache).

### 7.4 Checklist editor
- New table `checklist_items`: `id, service_type_id (FK nullable for global), legal_document_code, group, required, deadline_days, sort_order`. Seeded from current legal_documents.
- `GET /admin/checklists` — group by service type.
- `POST/PUT/DELETE /admin/checklists/{item}`. Bulk reorder: `POST /admin/checklists/reorder`.
- `LegalComplianceService` reads from this table instead of `invoice_types.required_legal_documents` (deprecate that column or treat as override).

### 7.5 Connections config
- New table `integration_settings`: `key (sinvoice|vfs|vof|smtp), config (json encrypted), is_enabled, last_check_at, last_check_status`. Use Laravel encrypted casts.
- `GET /admin/integrations` — list (mask secrets).
- `PUT /admin/integrations/{key}` — update.
- `POST /admin/integrations/{key}/test` — runs a sandbox call, stores `last_check_*`.

### 7.6 Activity log API
- `GET /audit/activity-log` — filters: `user_id, action, log_name, subject_type, from, to, search`. Pagination. Resource: `ActivityLogResource`.
- Admin/director only.

### 7.7 Email templates & rules
- New tables:
  - `email_templates`: `code (unique), subject, body_html, body_text, variables_doc`
  - `email_rules`: `event_code, recipient_type (role|user|creator|handler|email), recipient_value, template_code, enabled`
- Endpoints: full CRUD + `POST /admin/email/test` to send test email.

### 7.8 SMTP config
- Stored in `integration_settings` with key `smtp`. `MAIL_*` env vars are seeded from this at boot (override mail config).

### 7.9 Personal notification preferences
- `user_notification_preferences`: `user_id, channel (email|inapp), category, enabled`.
- `GET /me/notification-preferences`, `PUT /me/notification-preferences`.

### 7.10 Signature management (existing — extend)
- Add `GET /admin/users/{user}/signature` for admin view (read-only).

### 7.11 New permissions
- `user.manage`, `permission.manage`, `workflow.manage`, `checklist.manage`, `integration.manage`, `audit.view`, `email.manage`.

### 7.12 Tests
- Admin role can hit every admin endpoint; non-admin gets 403.

---

## Phase 8 — Notifications v2

### 8.1 Implement `ShouldQueue` on notifications
- `InvoicePendingApprovalNotification`, future ones — all implement `ShouldQueue` for performance.

### 8.2 Add email channel
- Update `via()` to include `mail` when user prefers email for that category.
- Implement `toMail()` with template lookup from `email_templates`.

### 8.3 Notification categories enum
- `app/Enums/NotificationCategory.php`: `approval, legal, system, accounting`. Map each notification class → category in a registry.

### 8.4 Delete notification endpoint
- `DELETE /notifications/{id}` — only own notifications.
- `POST /notifications/delete-read` — bulk delete current user's read notifications.

### 8.5 Scheduled reminders job
- `app/Console/Commands/SendCommitmentRemindersCommand.php` — daily at 08:00 Asia/Bangkok.
  - For each commitment with `deadline - today <= reminder_lead_days` and not yet reminded today: dispatch `CommitmentReminderNotification`.
  - Mark `extensions` json with `last_reminder_at`.
- `MarkOverdueCommitmentsCommand` — daily.
- Register in `bootstrap/app.php` `withSchedule()`.

### 8.6 Tests
- Queue assertions, mail fakes.

---

## Phase 9 — S-Invoice Integration

### 9.1 Decision: real client or sandbox stub
- Build behind interface `App\Contracts\SInvoiceClient`. Two implementations: `ViettelSInvoiceClient` (HTTP) and `FakeSInvoiceClient` (in-memory for dev/tests). Bind in `AppServiceProvider` via config flag.

### 9.2 Schema
- New table `s_invoice_transactions`: `id, invoice_request_id (FK), attempt, request_payload (json), response_payload (json nullable), status (none|pending|processing|sent_to_cqt|completed|error), s_invoice_code nullable, cqt_code nullable, lookup_code nullable, reservation_code nullable, error_code, error_message, started_at, completed_at`.

### 9.3 Issue pipeline
- Trigger: on `InvoiceRequest` transition to `approved` (event listener `IssueOnApproval`).
- Job: `IssueSInvoiceJob` (queued, retryable, max 3 attempts with exponential backoff).
- Job calls client, persists transaction, updates IR: on success `status=issued, s_invoice_code, s_invoice_status=completed`. On error: `s_invoice_status=error, s_invoice_error=msg`.

### 9.4 Endpoints
- `GET /sinvoice/transactions` — list with filters (status, from, to, search). Accountant/admin only.
- `GET /sinvoice/transactions/{transaction}` — detail with request/response payloads.
- `POST /sinvoice/transactions/{transaction}/retry` — re-dispatches job.
- `POST /invoice-requests/{invoiceRequest}/issue` — manual issue (admin override).

### 9.5 Settings reuse
- Read endpoint config from `integration_settings.sinvoice`.

### 9.6 Webhook (if Viettel supports)
- `POST /webhooks/sinvoice` — receives async status; signed by shared secret. Updates transaction.

### 9.7 Tests
- Fake client returns success → IR becomes `issued`.
- Fake client returns 500 → status=error; retry endpoint succeeds.

### 9.8 Permissions
- `sinvoice.view`, `sinvoice.retry`, `sinvoice.issue.manual`.

### 9.9 Activity log on every status change.

---

## Phase 10 — VFS Accounting Integration

### 10.1 Schema
- `vfs_transactions`: `id, invoice_request_id (FK), attempt, request_payload, response_payload, status (none|pending|processing|posted|error), voucher_number, accounting_date, debit_account, credit_account, error_code, error_message, started_at, completed_at`.
- `vfs_journal_lines`: `id, vfs_transaction_id, line_no, description, debit_account, credit_account, amount, project_code`.

### 10.2 Pipeline
- Trigger: on IR transition to `issued`. Listener `PostToVfsOnIssued`.
- Job: `PostVfsJob` similar to S-Invoice job.
- On success: IR `status=accounted, vfs_status=posted`.

### 10.3 Endpoints
- `GET /vfs/transactions` — list + filters (status, revenue_center_id, accountant_id, date, search). Accountant/admin only.
- `GET /vfs/transactions/{transaction}` — detail.
- `POST /vfs/transactions/{transaction}/retry`.
- `POST /vfs/transactions/{transaction}/manual-post` — admin override.
- `GET /vfs/transactions/{transaction}/journal-pdf` — exports journal entry PDF (via Phase 6).
- `GET /vfs/reconciliation` — 3-way matching report.

### 10.4 Bulk manual post
- `POST /vfs/bulk-post` body `{ ids: [] }`. Dispatches jobs.

### 10.5 Permissions
- `vfs.view`, `vfs.retry`, `vfs.post.manual`.

### 10.6 Reuse `integration_settings.vfs` for config.

### 10.7 Tests
- Fake client paths.

### 10.8 Reconciliation logic
- Service `ReconciliationService` matches IR.after_vat vs SInvoice.amount vs VFS.amount. Flags mismatches.

---

## Phase 11 — Workflow Completion

### 11.1 State machine documented in Enum
- `InvoiceStatus` already declares full chain. Add `Transition::allowed(from, to)` table and validation helper.

### 11.2 Implement `approved → issued` transition
- Driven by Phase 9 success.

### 11.3 Implement `issued → accounted` transition
- Driven by Phase 10 success.

### 11.4 Tests
- End-to-end: create → submit → approve → S-Invoice success → VFS success → status=accounted.

---

## Phase 12 — Hardening, OpenAPI, Performance, Observability

### 12.1 OpenAPI generation
- Install `dedoc/scramble`. Generate `/api/v1/docs` and `docs/openapi.yaml`.
- Annotate every controller with response examples.

### 12.2 Rate limits
- Tiered: auth 6/min, mutations 30/min, reads 120/min.

### 12.3 Caching
- Dashboard 5 min per user.
- Catalog reads (invoice types, service types, legal documents) cached 30 min, invalidated on write.
- Permission matrix cached 10 min.

### 12.4 N+1 audit
- Add `Laravel-debugbar` or `barryvdh/laravel-ide-helper` in dev only.
- Add `Model::preventLazyLoading()` in non-production.

### 12.5 Logging & metrics
- Structured logging via `monolog` JSON formatter.
- Log every external call (S-Invoice/VFS) with duration + status.
- Optional: Sentry / Bugsnag wiring.

### 12.6 Security
- CSP headers on Sanctum CSRF endpoint.
- `passwords` blocklist (common passwords) on register/change-password.
- Rotate Sanctum tokens on password change.
- Force HTTPS in production via middleware.

### 12.7 Backups
- Document `php artisan backup:run` with `spatie/laravel-backup` (optional).

### 12.8 Test coverage gate
- CI: GitHub Actions workflow running `php artisan test --coverage --min=80`.

---

## Cross-Cutting Deliverables

### A. Permissions catalog (final)

```
invoice.create
invoice.update
invoice.delete
invoice.view.own
invoice.view.center
invoice.view.all
invoice.approve.accountant
invoice.approve.director
invoice.return
invoice.issue.manual

commitment.create
commitment.extend
commitment.approve
commitment.remind

contract.create
contract.update
contract.delete
contract.view.own
contract.view.center
contract.view.all
contract.document.upload

catalog.manage

report.view.center
report.view.all

user.manage
permission.manage
workflow.manage
checklist.manage
integration.manage
audit.view
email.manage

sinvoice.view
sinvoice.retry
sinvoice.issue.manual

vfs.view
vfs.retry
vfs.post.manual
```

### B. Final route list (post-implementation)

Auth, Me, Signature — as today plus:
- `POST /auth/forgot-password`, `POST /auth/reset-password` (optional in Phase 12).

Invoices — as today plus:
- `POST /invoice-requests/export`
- `GET /invoice-requests/{id}/preview`
- `POST /invoice-requests/{id}/issue`

Commitments — see Phase 2.

Contracts — full CRUD + documents (Phase 3).

Catalog — invoice-types, service-types, legal-documents CRUD (Phase 4).

Reports — `/reports/revenue`, `/reports/legal-compliance`, `/reports/centers`, `/reports/reconciliation`, plus `/reports/{type}/export`.

Admin — `/users`, `/admin/permission-matrix`, `/admin/workflow`, `/admin/checklists`, `/admin/integrations`, `/audit/activity-log`, `/admin/email-templates`, `/admin/email-rules`, `/me/notification-preferences`.

Notifications — as today plus delete, delete-read.

S-Invoice — Phase 9.
VFS — Phase 10.

### C. Migration order (chronological)

1. Phase 1 — no schema changes (logic only) **except** Phase 1.6 doesn't need a migration.
2. Phase 2 — `finalize_commitments`.
3. Phase 3 — `add_contract_write_fields`, ensure `contract_documents`, add `contract.default_invoice_type_id`.
4. Phase 4 — none (catalogs already exist).
5. Phase 5 — add indexes on `invoice_requests`.
6. Phase 7 — `workflow_steps`, `checklist_items`, `integration_settings`, `email_templates`, `email_rules`, `user_notification_preferences`, `audit_approvals`.
7. Phase 9 — `s_invoice_transactions`.
8. Phase 10 — `vfs_transactions`, `vfs_journal_lines`.

### D. Test plan summary

- **Unit tests** for every Service method (Approval, LegalCompliance, ContractAggregate, Reports, Export, Reconciliation).
- **Feature tests** for every endpoint with role matrix: employee, manager, accountant, director, admin (assert 200/403 as appropriate).
- **Integration tests** for end-to-end happy path: create → submit → approve → S-Invoice → VFS → accounted.
- **Failure tests:** legal_complete bypass attempt, current_handler bypass attempt, idempotency on installment invoice creation, race on InvoiceCodeGenerator (concurrent transaction test).

### E. Risk register

| Risk | Mitigation |
|---|---|
| Viettel S-Invoice API access not available in dev | Build behind interface; ship `FakeSInvoiceClient` first |
| VFS API spec unknown | Same pattern; coordinate spec early |
| Vietnamese PDF font rendering | Test Roboto + Noto Sans; fallback to spatie/laravel-pdf (Browsershot) |
| Workflow toggles change behavior at runtime | Cache + version key; emit activity log on config change |
| Large export blocks request | Async + signed download URL when > 50 invoices |
| `InvoiceCodeGenerator` race on year roll-over | Pre-seed sequence row when first request of year arrives, inside a `SELECT ... FOR UPDATE` with `INSERT IGNORE` fallback |
| Soft-delete cascade complexity | Use `restrict` on FKs where appropriate; never hard delete invoice requests with attached approvals |

### F. Definition of Done (per task)

A task is complete when:
1. Code shipped and reviewed.
2. Feature/unit tests added and green.
3. `php artisan test` full suite green.
4. `php artisan migrate:fresh --seed` works.
5. OpenAPI spec regenerated.
6. Activity log emits where required.
7. Permission/policy enforcement verified by negative-path test.
8. No N+1 detected (lazy-loading prevention test).
9. PR description references the task ID in this plan.

### G. Execution order recommendation

Run phases strictly 1 → 12 in order. Phase 1 is the unblocker for frontend integration. Phases 2–4 can each be one PR. Phase 5 can ship before Phase 6 by returning JSON only initially. Phases 9–10 are the longest; prototype with fakes early.

---

**End of plan body. Appendices follow.**

Estimated calendar effort (1 senior engineer, focused): ~6–8 weeks. Estimated lines of code: ~6–8k production + ~4–5k tests.

---

## Appendix H — Atomic Commit Strategy

Every phase is broken into atomic commits. Each commit must:
- Touch one logical concern (one bug fix, one endpoint group, one migration, one set of tests).
- Compile and pass `php artisan test` independently.
- Use Conventional Commits: `<type>(<scope>): <subject>` where `type ∈ {feat,fix,refactor,test,chore,docs,perf,security}` and `scope` is the phase code (`p1`..`p12`) or module (`auth`, `invoice`, `commitment`, etc.).
- Reference the plan task ID in the body, e.g. `Refs: plan §1.1`.

### Commit map per phase

**Phase 1 — Critical Bug Fixes** (one PR, 6 commits)
1. `fix(p1/compliance): rewire LegalComplianceService to legal-documents table` — task 1.1
2. `fix(p1/compliance): refresh compliance cache on upload/delete` — tasks 1.2, 1.6 (resource field)
3. `security(p1/invoice): compute legal_complete server-side, strip from input` — task 1.3
4. `fix(p1/workflow): enforce current_handler_id in approval actions` — task 1.4
5. `feat(p1/policies): add ContractPolicy and CustomerPolicy with scoping` — task 1.5
6. `fix(p1/validation): math equality, FK exists, throttle login` — tasks 1.7, 1.8, 1.9, 1.10

**Phase 2 — Commitments** (one PR, 5 commits)
1. `feat(p2/commitment): finalize commitments migration and model` — 2.1
2. `feat(p2/commitment): controller, routes, FormRequests, resource` — 2.2
3. `feat(p2/commitment): CommitmentService with extend/decide/remind` — 2.3
4. `feat(p2/legal): compliance report endpoints and audit_approvals table` — 2.6, 2.7
5. `test(p2/commitment): full flow feature tests` — 2.9

**Phase 3 — Contracts write** (one PR, 4 commits)
1. `feat(p3/contract): schema for write fields and documents` — 3.1
2. `feat(p3/contract): CRUD + installments CRUD + documents endpoints` — 3.2, 3.3, 3.4
3. `fix(p3/contract): idempotent createInvoiceFromInstallment + aggregate recompute` — 3.5, 3.6
4. `test(p3/contract): feature tests` — 3.7

**Phase 4 — Catalog admin** (one PR, 3 commits)
1. `feat(p4/catalog): InvoiceType CRUD` — 4.1, 4.2, 4.3
2. `feat(p4/catalog): LegalDocument and ServiceType CRUD` — 4.4, 4.5
3. `test(p4/catalog)` — 4.6

**Phase 5 — Reports** (one PR, 5 commits)
1. `perf(p5/db): indexes on invoice_requests for reporting` — 5.7
2. `feat(p5/dashboard): extend /dashboard with monthly/recent/top` — 5.1
3. `feat(p5/reports): revenue + center + reconciliation services and endpoints` — 5.2, 5.3, 5.4
4. `feat(p5/reports): per-role scoping` — 5.6
5. `test(p5/reports)` — 5.8

**Phase 6 — Export** (one PR, 4 commits)
1. `chore(p6/deps): install dompdf + maatwebsite/excel` — 6.1
2. `feat(p6/export): invoice templates and InvoiceExportService` — 6.2, 6.3
3. `feat(p6/export): endpoints + async job + audit-log export` — 6.4, 6.5, 6.6
4. `test(p6/export)` — 6.7

**Phase 7 — Admin/Settings** (split into 4 PRs)
- PR-7a Users + Permission matrix: commits `feat(p7/users)`, `feat(p7/rbac)`, `test(p7)` — 7.1, 7.2, 7.11
- PR-7b Workflow + Checklist: `feat(p7/workflow)`, `feat(p7/checklist)`, integration with ApprovalService/LegalComplianceService — 7.3, 7.4
- PR-7c Integrations + Activity log: `feat(p7/integrations)`, `feat(p7/audit)` — 7.5, 7.6
- PR-7d Email + Preferences: `feat(p7/email)`, `feat(p7/smtp)`, `feat(p7/prefs)`, `feat(p7/signature-admin)` — 7.7, 7.8, 7.9, 7.10

**Phase 8 — Notifications v2** (one PR, 3 commits)
1. `feat(p8/notify): ShouldQueue + email channel + categories` — 8.1, 8.2, 8.3
2. `feat(p8/notify): delete endpoints + bulk delete-read` — 8.4
3. `feat(p8/notify): scheduled reminders and overdue jobs` — 8.5

**Phase 9 — S-Invoice** (one PR, 5 commits)
1. `feat(p9/sinvoice): schema s_invoice_transactions` — 9.2
2. `feat(p9/sinvoice): client interface + Fake + Viettel impl` — 9.1
3. `feat(p9/sinvoice): issue pipeline (event, job, listener)` — 9.3
4. `feat(p9/sinvoice): endpoints (list/detail/retry/manual + webhook)` — 9.4, 9.6
5. `test(p9/sinvoice)` — 9.7

**Phase 10 — VFS** (one PR, 5 commits)
1. `feat(p10/vfs): schema vfs_transactions + vfs_journal_lines` — 10.1
2. `feat(p10/vfs): client interface + Fake impl + pipeline` — 10.2
3. `feat(p10/vfs): endpoints + manual post + bulk` — 10.3, 10.4
4. `feat(p10/vfs): ReconciliationService + report` — 10.8
5. `test(p10/vfs)` — 10.7

**Phase 11 — Workflow completion** (one PR, 2 commits)
1. `feat(p11/workflow): Transition::allowed + state machine validator` — 11.1
2. `test(p11/workflow): end-to-end happy path` — 11.4

**Phase 12 — Hardening** (one PR, 4 commits)
1. `chore(p12/docs): install scramble + annotate controllers + emit openapi.yaml` — 12.1
2. `security(p12): tiered throttle + password rules + HTTPS middleware + token rotation` — 12.2, 12.6
3. `perf(p12): caching dashboard/catalog/permission matrix + N+1 prevention` — 12.3, 12.4
4. `chore(p12/ci): GitHub Actions with 80% coverage gate` — 12.5, 12.8

### Branching
- One branch per phase: `phase/1-critical-fixes`, `phase/2-commitments`, … `phase/12-hardening`.
- Phase 7 has sub-branches `phase/7a-users`, `phase/7b-workflow`, etc.
- Branch off `main`; PR back to `main`; squash-merge only if all commits stay logically atomic — otherwise standard merge.

---

## Appendix I — QA Verification Scenarios (per task)

Each scenario specifies the **exact command(s) or HTTP calls** to run and the **expected outcome**. Format:
- **Tool:** `php artisan test`, `curl`, `php artisan tinker`, `php artisan migrate:fresh --seed`, etc.
- **Steps:** numbered.
- **Expected:** HTTP status, JSON shape, DB state, or test result.

Pre-flight for every task: `php artisan migrate:fresh --seed` succeeds and `php artisan test` baseline is green.

### Phase 1

**1.1 LegalComplianceService rewire**
- Tool: PHPUnit + tinker.
- Steps:
  1. Write `tests/Feature/LegalComplianceUploadTest.php`: create invoice request whose invoice_type requires `["contract"]`, upload a file with `document_type=contract` via `POST /api/v1/invoice-requests/{id}/legal-documents`.
  2. Run `php artisan test --filter=LegalComplianceUploadTest`.
- Expected: `GET /invoice-requests/{id}` returns `legal_status="complete"`, `legal_complete=true`. DB column `legal_status_cache` = `complete`.

**1.2 Refresh on upload/delete**
- Tool: PHPUnit.
- Steps: same as 1.1 then `DELETE /invoice-requests/{id}/legal-documents/{docId}` and re-fetch.
- Expected: After delete, `legal_status` flips to `missing` or `supplementing`.

**1.3 legal_complete bypass blocked**
- Tool: curl/HTTPie.
- Steps:
  1. `POST /api/v1/invoice-requests` with body containing `"legal_complete": true` and no uploaded docs.
  2. `GET` the returned invoice.
- Expected: stored `legal_complete=false`. PHPUnit test `LegalCompleteServerComputedTest` asserts client value is ignored.

**1.4 current_handler enforcement**
- Tool: PHPUnit.
- Steps:
  1. Submit invoice, capture `current_handler_id = userA`.
  2. Authenticate as userB (same role, different id) and `POST /invoice-requests/{id}/approve`.
- Expected: 403 with code `not_assigned_handler`. UserA can approve.

**1.5 Policies on contracts/customers**
- Tool: PHPUnit feature test matrix.
- Steps: as employee → `GET /contracts` returns only own; as manager → only center's; as admin → all. Same for customers.
- Expected: counts match seeded fixtures per role.

**1.6 Eager loading on action responses**
- Tool: curl.
- Steps: `POST /invoice-requests/{id}/approve` and inspect response.
- Expected: `customer.name`, `service_type.name`, `revenue_center.name` are non-null.

**1.7 Notification resource shape**
- Tool: curl.
- Steps: `GET /api/v1/notifications`.
- Expected: top-level keys are `data`, `meta`, `links`. Items have `category` in `{approval,legal,system}`.

**1.8 Invoice math validation**
- Tool: curl.
- Steps: `POST /invoice-requests` with `before_vat=100`, `tax_rate=10`, `after_vat=999`.
- Expected: 422 with `errors.after_vat[0] = "invalid_total"`.

**1.9 FK exists validation**
- Tool: curl.
- Steps: `POST /invoice-requests` with `contract_id=999999`.
- Expected: 422 with `errors.contract_id`.

**1.10 Login throttle**
- Tool: bash loop.
- Steps: `for i in 1..7; do curl POST /auth/login ...; done`.
- Expected: 7th call returns 429.

**1.11 Doc-only.** No automated check; confirmed by reading `routes/api.php` diff in PR review.

**1.12 s_invoice_error in resource**
- Tool: PHPUnit snapshot test.
- Steps: factory IR with `s_invoice_error="X"`, fetch.
- Expected: response JSON contains `s_invoice_error: "X"`.

### Phase 2

**2.1 Commitments migration**
- Tool: `php artisan migrate:fresh --seed && php artisan db:show commitments`.
- Expected: all listed columns + indexes exist.

**2.2 Commitment endpoints**
- Tool: PHPUnit `tests/Feature/CommitmentCrudTest.php`.
- Steps: create IR → create commitment → list → extend → decide.
- Expected: each call returns 200/201; final commitment status `fulfilled` or `rejected` matches director decision.

**2.3 CommitmentService unit**
- Tool: `php artisan test --filter=CommitmentServiceTest`.
- Expected: all edge cases (max extensions exceeded, signature missing, idempotency) covered.

**2.4 New permissions seeded**
- Tool: `php artisan tinker --execute='echo Spatie\Permission\Models\Permission::pluck("name")->join(",");'`.
- Expected: output contains `commitment.create`, `commitment.extend`, `commitment.approve`, `commitment.remind`.

**2.5 Submit requires pending commitment when legal incomplete**
- Tool: PHPUnit.
- Steps: IR with no uploads, no commitments → submit.
- Expected: 422 `"commitment_required"`. Add commitment → submit succeeds, goes to `pending_vpgd`.

**2.6 Legal compliance report**
- Tool: curl as director.
- Steps: `GET /api/v1/reports/legal-compliance?from=2026-01-01&to=2026-12-31`.
- Expected: 200 with `data.totals.completion_rate` numeric; structure matches schema in §2.6.

**2.7 Approve compliance report**
- Tool: curl + DB inspect.
- Steps: `POST /reports/legal-compliance/approve` as director.
- Expected: row in `audit_approvals` with signature snapshot.

**2.8 Commitment in invoice payload**
- Tool: curl.
- Steps: `GET /invoice-requests/{id}` for IR with active commitment.
- Expected: `commitment` object present with `status`, `deadline`, `days_remaining`.

**2.9 Full flow test** — `php artisan test --filter=CommitmentFullFlowTest`.

### Phase 3

**3.1 Contract write schema** — `php artisan db:show contracts contract_documents payment_installments` shows new columns.

**3.2 Contracts CRUD**
- Tool: PHPUnit `ContractCrudTest`.
- Expected: create returns 201 with resource; update returns 200; soft delete returns 204; subsequent GET returns 404.

**3.3 Installments CRUD**
- Tool: PHPUnit.
- Steps: create 3 installments, list, update one, delete one.
- Expected: sequence auto-assigned, sums tracked.

**3.4 Contract documents**
- Tool: PHPUnit with `Storage::fake()`.
- Steps: upload a 1MB PDF; list; delete.
- Expected: file persisted under `contracts/{id}/`; resource returned; cleanup on delete.

**3.5 Idempotency on createInvoiceFromInstallment**
- Tool: PHPUnit.
- Steps: call endpoint twice for same installment.
- Expected: second call returns 409 `installment_already_invoiced`.

**3.6 Aggregate recompute**
- Tool: PHPUnit.
- Steps: create IR linked to contract, change status to approved, fetch contract.
- Expected: `total_invoiced` increased; `remaining_amount` decreased; `progress` % updated.

**3.7 Feature tests** — `php artisan test --filter=Phase3`.

### Phase 4

**4.1–4.3 InvoiceType CRUD**
- Tool: PHPUnit `InvoiceTypeCrudTest`.
- Steps: create with `required_legal_document_codes=["contract"]`; ensure linked IRs use these for compliance.
- Expected: compliance for new IRs of this type counts only `["contract"]`.

**4.4 LegalDocument CRUD**
- Tool: PHPUnit. Soft delete blocked if referenced by an active IR. Expected 409.

**4.5 ServiceType CRUD** — same pattern.

**4.6** — `php artisan test --filter=Phase4`.

### Phase 5

**5.1 Dashboard extension**
- Tool: curl.
- Steps: `GET /dashboard` as accountant.
- Expected: keys `monthly_revenue (array length 12)`, `recent_requests (length ≤ 10)`, `top_customers (length ≤ 5)`, `pending_approvals_count` matches `/approvals/pending` total.

**5.2 Revenue report**
- Tool: PHPUnit `RevenueReportTest` with deterministic seeded data.
- Expected: totals match SUM over seeded IRs in status set `{approved,issued,accounted}`.

**5.3 Center report**, **5.4 Reconciliation** — analogous PHPUnit fixture tests.

**5.5 Export endpoints** — covered in Phase 6 verification.

**5.6 Scoping** — PHPUnit role matrix: manager sees only own center; admin sees all.

**5.7 Indexes** — `php artisan db:show invoice_requests` lists new indexes; `EXPLAIN` on a reporting query shows index usage.

**5.8 Tests** — `php artisan test --filter=Phase5`.

### Phase 6

**6.1 Deps installed** — `composer show barryvdh/laravel-dompdf maatwebsite/excel` returns versions.

**6.2/6.3 Service**
- Tool: PHPUnit `InvoiceExportServiceTest`.
- Expected: `renderPdf` returns binary ≥ 1KB; opens as valid PDF (magic bytes `%PDF`).

**6.4 Endpoints**
- Tool: curl.
- Steps: `POST /invoice-requests/export` body `{ids:[1,2], format:pdf, template:standard}`.
- Expected: 200, content-type `application/pdf`, content-disposition attachment.

**6.5 Async job**
- Tool: PHPUnit with `Queue::fake()`.
- Steps: export 100 IRs.
- Expected: `ExportInvoicesJob` dispatched; notification created with signed download URL.

**6.6 Audit log export** — curl returns Excel; `PhpSpreadsheet` opens in test, row count = filter result count.

**6.7** — `php artisan test --filter=Phase6`.

### Phase 7

**7.1 Users CRUD** — PHPUnit `UserCrudTest`. Expected 201/200/204; non-admin gets 403.

**7.2 Permission matrix** — PHPUnit `PermissionMatrixTest`. PUT modifies Spatie pivots; GET reflects changes.

**7.3 Workflow config** — PHPUnit `WorkflowConfigTest`. Disabling `director` step routes all approvals through accountant only; ApprovalService respects cache invalidation.

**7.4 Checklist editor** — PHPUnit. Disable a checklist item → compliance for new IRs no longer requires it.

**7.5 Integration settings** — PHPUnit with config encryption. `GET` returns masked; `PUT` saves; `POST .../test` runs a mock client and stores last_check_*.

**7.6 Activity log API** — curl as admin; filter by `user_id` returns subset; non-admin 403.

**7.7/7.8 Email + SMTP**
- Tool: PHPUnit with `Mail::fake()`.
- Steps: configure SMTP via API; trigger test send.
- Expected: `Mail::assertSent(...)`; SMTP config stored encrypted.

**7.9 Preferences** — curl; PUT then GET reflects changes; subsequent approval triggers email only for users who opted-in.

**7.10 Admin signature view** — curl as admin returns signature; non-admin 403.

**7.11 Permissions seeded** — tinker query for new permissions.

**7.12 Role matrix tests** — `php artisan test --filter=Phase7`.

### Phase 8

**8.1 ShouldQueue** — PHPUnit with `Queue::fake()` confirms notifications dispatched to queue not synchronously.

**8.2 Email channel** — `Mail::fake()` then submit approval flow; assert mail sent only to users with email preference.

**8.3 Categories** — every notification class registered in mapper; assertion test loops over registry.

**8.4 Delete notification endpoints**
- Tool: curl.
- Steps: `DELETE /notifications/{id}`; `POST /notifications/delete-read`.
- Expected: 204; subsequent list excludes deleted; cannot delete other users' notifications (403).

**8.5 Scheduled commands**
- Tool: `php artisan schedule:list` + `php artisan SendCommitmentReminders --dry-run` (add flag).
- Expected: command listed in schedule; dry run lists candidate commitments.

**8.6 Tests** — `php artisan test --filter=Phase8`.

### Phase 9

**9.1/9.2 Client interface + schema** — `php artisan db:show s_invoice_transactions`; service container resolves `SInvoiceClient` to `FakeSInvoiceClient` in tests.

**9.3 Issue pipeline**
- Tool: PHPUnit with `Bus::fake()` then real handler.
- Steps: approve IR → assert `IssueSInvoiceJob` dispatched → run handler with Fake returning success.
- Expected: IR `status=issued`, `s_invoice_code` set, `s_invoice_status=completed`. Transaction row created.

**9.4 Endpoints**
- Tool: curl.
- Steps: list, detail, retry on a failed transaction.
- Expected: retry re-dispatches job; eventual completion.

**9.5 Settings reuse** — covered by Phase 7.5 integration test.

**9.6 Webhook** — POST with valid HMAC signature → transaction updated; invalid signature → 401.

**9.7 Tests** — `php artisan test --filter=Phase9`.

**9.8 Permissions** — tinker check.

**9.9 Activity log** — assert events emitted on each status change in test.

### Phase 10

**10.1 Schema** — db:show on both tables.

**10.2 Pipeline**
- Tool: PHPUnit with Fake client.
- Steps: IR transitions to `issued` → `PostVfsJob` runs → Fake returns posted.
- Expected: IR `status=accounted`, `vfs_status=posted`, voucher_number set, journal_lines rows created.

**10.3 Endpoints** — list/detail/retry/manual-post curl matrix.

**10.4 Bulk post** — PHPUnit asserts job dispatched per id.

**10.5 Permissions** — tinker.

**10.6 Settings reuse** — Phase 7.5.

**10.7 Tests** — `php artisan test --filter=Phase10`.

**10.8 Reconciliation**
- Tool: PHPUnit `ReconciliationServiceTest`.
- Steps: seed IR with mismatched S-Invoice amount.
- Expected: report flags row with reason `amount_mismatch_sinvoice`.

### Phase 11

**11.1 State machine** — PHPUnit `TransitionTest` asserts every disallowed transition throws `InvalidTransitionException`.

**11.2/11.3 Transitions** — covered by Phase 9 and Phase 10 pipeline tests.

**11.4 End-to-end happy path**
- Tool: PHPUnit `EndToEndInvoiceFlowTest`.
- Steps: create → submit → approve → S-Invoice fake success → VFS fake success.
- Expected: final IR status `accounted`; activity log has 5+ entries; all related rows linked.

### Phase 12

**12.1 OpenAPI**
- Tool: `php artisan scramble:export docs/openapi.yaml`.
- Expected: file generated; `npx @redocly/cli lint docs/openapi.yaml` passes.

**12.2 Rate limits**
- Tool: bash loop hitting endpoints in each tier.
- Expected: each tier 429s at its limit, others unaffected.

**12.3 Caching**
- Tool: PHPUnit with `Cache::spy()`.
- Expected: dashboard hit twice within 5 min increments cache hit counter; catalog write invalidates relevant keys.

**12.4 N+1 prevention**
- Tool: PHPUnit with `Model::preventLazyLoading()` enabled.
- Expected: every endpoint test passes without lazy-loading exceptions.

**12.5 Logging** — manually run a request with `LOG_CHANNEL=stack`; verify JSON log contains request id + duration.

**12.6 Security**
- Tool: PHPUnit.
- Expected: HTTPS middleware enforces redirect in production env; password change revokes existing Sanctum tokens; weak password rejected.

**12.7 Backups** — `php artisan backup:run --only-files` writes archive to storage.

**12.8 CI coverage gate**
- Tool: GitHub Actions log on PR.
- Expected: workflow fails when coverage < 80%; passes at ≥ 80%.

---

### Final Verification Wave (post Phase 12)

Run in order:
1. `php artisan migrate:fresh --seed` — green.
2. `php artisan test --coverage --min=80` — green.
3. `php artisan scramble:export docs/openapi.yaml && npx @redocly/cli lint docs/openapi.yaml` — green.
4. End-to-end test `EndToEndInvoiceFlowTest` — green.
5. Manually exercise each role login via curl against seeded users; capture response samples in `docs/examples/`.
6. Run `php artisan route:list` and diff against the route inventory in §B of this plan — zero differences.

If all six pass, the backend is considered fully covering the frontend per this plan.

**End of plan.**
