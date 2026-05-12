# VTK Invoice — Revised P0+ Backend Plan

**Status**: Draft for review
**Author**: Sisyphus
**Date**: 2026-05-12
**Supersedes**: Original P0 plan (employee → manager → accountant → director chain)

---

## 1. Context & Why This Revision Exists

The original P0 backend implemented an `employee → manager → accountant → director` linear approval chain. After a deep audit of `invoiceFront`, the frontend implements a fundamentally different model:

- **Manager** is **read-only KV3 tracking** ("Quyền phê duyệt thuộc về Kế toán và Giám đốc")
- **Accountant (KT)** approves **normal** requests (legal documents complete)
- **Director (PGĐ/VPGĐ)** approves **special** requests (legal docs missing + commitment created)
- Branch selection is **legal-completeness based**, not seniority based
- The status lifecycle continues past approval: `approved → issued (S-Invoice) → accounted (VFS)`
- `rejected` and `returned` are **distinct actions** (rejected = closed; returned = editable for resubmit)
- First-login mandatory signature setup blocks all approval/commitment actions

**Decision (user confirmed)**: Align backend to frontend (option A) and expand P0 to cover FE-blocking pieces.

---

## 2. Scope

### IN SCOPE (P0+)

1. **Approval chain refactor** — remove manager step, add legal-completeness branching
2. **Status enum expansion** — add `issued`, `accounted`, `returned`
3. **Return action** — distinct from reject, allows owner edit + resubmit
4. **Signature subsystem** — model, endpoints, first-login gate, immutable per-action snapshots
5. **Customer extended fields** — `address`, `buyer_name`, `buyer_email`, `buyer_phone`
6. **Invoice_request column additions** — `return_reason`, `rejection_reason`, `current_handler_id`, `approved_by_id`, `contract_id`, `installment_id`, `service_content`, `contract_number`, `contract_date`
7. **Contracts + installments** — read-only listing + "create invoice from installment" endpoint
8. **Activity log wiring** — spatie/laravel-activitylog on key models, timeline endpoint
9. **File uploads for legal documents** — multipart endpoint, storage, listing
10. **Dashboard aggregates** — per-role counts (pending/approved/issued/accounted/overdue)

### OUT OF SCOPE (deferred)

- **P1**: S-Invoice integration jobs, VFS accounting postings (with mock callbacks for FE wiring), reports/exports
- **P2**: Admin config (invoice types CRUD, workflow config, email rules, integration credentials, audit log UI)

---

## 3. Approval Chain — New Model

### Role Permission Matrix

| Action | employee | manager | accountant | director | admin |
|---|---|---|---|---|---|
| View own requests | ✅ | — | — | — | ✅ |
| View department requests (KV3) | — | ✅ read-only | — | — | ✅ |
| View all pending normal | — | — | ✅ | — | ✅ |
| View all pending special | — | — | ✅ read | ✅ | ✅ |
| Create request | ✅ | — | — | — | ✅ |
| Submit request | ✅ (own) | — | — | — | ✅ |
| Approve normal (legal complete) | — | — | ✅ | — | ✅ |
| Approve special (with commitment) | — | — | — | ✅ | ✅ |
| Reject | — | — | ✅ | ✅ | ✅ |
| Return for supplement | — | — | ✅ | ✅ | ✅ |
| Create commitment | ✅ (own) | — | — | — | ✅ |

### Branch Selection Logic (server-side on `submit`)

```
on submit(invoice_request):
  if legal_documents_complete(request):
    request.status = 'pending'
    request.current_handler_id = next_accountant()
  else:
    if request.commitment_id == null:
      reject submission with 422: "Hồ sơ pháp lý chưa đầy đủ. Vui lòng tạo cam kết bổ sung."
    else:
      request.status = 'pending-vpgd'
      request.current_handler_id = next_director()
```

**`legal_documents_complete`** is determined by `invoice_types.required_legal_documents` matched against `invoice_request_legal_documents` uploads. For P0, a single bool column `legal_complete` on `invoice_requests` set by the creator is acceptable — full per-document validation is P2.

### Status Lifecycle

```
draft
  └─ submit → pending (normal)
  └─ submit → pending-vpgd (special-with-commitment)

pending
  ├─ approve(accountant) → approved
  ├─ return(accountant) → returned
  └─ reject(accountant) → rejected

pending-vpgd
  ├─ approve(director) → approved
  ├─ return(director) → returned
  └─ reject(director) → rejected

returned
  └─ resubmit(owner) → pending OR pending-vpgd (re-branch)

approved
  └─ s_invoice push (P1) → issued

issued
  └─ vfs post (P1) → accounted   [terminal success]

rejected   [terminal]
```

### Status Naming Convention

- Database: snake_case → `pending_vpgd`
- API response: kebab-case → `pending-vpgd`
- Translation layer in API resource

---

## 4. Database Changes

### 4.1 Modify `invoice_requests` (column ADDITIONS only — existing schema verified)

Existing columns already present (do NOT recreate): `status` (already `string` not enum), `contract_id` (unsigned, no FK), `payment_installment_id` (unsigned, no FK), `invoice_no`, `s_invoice_code`, `s_invoice_status`, `s_invoice_error`, `vfs_status`, `legal_status_cache` (json), `notes`.

```php
// migration: 2026_05_12_060001_alter_invoice_requests_p0_revised
Schema::table('invoice_requests', function (Blueprint $table) {
    // status is already string; no type change needed. Enum is enforced at app layer + validation.

    $table->text('return_reason')->nullable()->after('notes');
    $table->text('rejection_reason')->nullable()->after('return_reason');

    $table->foreignId('current_handler_id')->nullable()->after('creator_id')
          ->constrained('users')->nullOnDelete();
    $table->foreignId('approved_by_id')->nullable()->after('current_handler_id')
          ->constrained('users')->nullOnDelete();

    // Denormalized contract reference fields (when contract_id is null, e.g. ad-hoc invoices)
    $table->string('contract_number', 64)->nullable()->after('payment_installment_id');
    $table->date('contract_date')->nullable()->after('contract_number');

    $table->text('service_content')->nullable()->after('after_vat');
    $table->boolean('legal_complete')->default(false)->after('legal_status_cache');
});

// Second migration runs AFTER contracts + payment_installments tables exist:
// 2026_05_12_060010_add_fks_to_invoice_requests
Schema::table('invoice_requests', function (Blueprint $table) {
    $table->foreign('contract_id')->references('id')->on('contracts')->nullOnDelete();
    $table->foreign('payment_installment_id')->references('id')->on('payment_installments')->nullOnDelete();
});
```

**Note on column naming**: Plan uses existing `payment_installment_id` everywhere (NOT `installment_id`). API resource may expose as `installment_id` for FE convenience.

**Constraint**: status ∈ {`draft`, `pending`, `pending_vpgd`, `approved`, `issued`, `accounted`, `rejected`, `returned`}. Enforced via `Rule::in([...])` in FormRequests + a domain constants class `App\Domain\InvoiceRequestStatus`.

### 4.2 Modify `customers` (column ADDITIONS only)

Existing columns (do NOT recreate): `name`, `tax_code`, `address`, `contact_name`, `contact_phone`, `contact_email`.

```php
// migration: 2026_05_12_060002_add_buyer_fields_to_customers
Schema::table('customers', function (Blueprint $table) {
    // FE distinguishes 'contact' (account contact) from 'buyer' (legal invoice recipient).
    $table->string('buyer_name', 200)->nullable()->after('contact_email');
    $table->string('buyer_email', 200)->nullable()->after('buyer_name');
    $table->string('buyer_phone', 50)->nullable()->after('buyer_email');
});
```

### 4.3 New tables

#### `user_signatures` (one per user)
```
id, user_id (unique FK), method enum('draw','text','upload'),
data_path (string, storage path for PNG),
font_family (nullable, for text method),
created_at, updated_at
```

#### `signature_snapshots` (immutable per action)
```
id, user_id FK, signature_method, data_path (copied at time of action),
created_at
```

#### `contracts`
```
id, code (unique), customer_id FK, name, total_amount decimal(18,2),
signed_date, expiry_date, status enum('active','expired','terminated'),
notes, created_at, updated_at, deleted_at
```

#### `payment_installments`
```
id, contract_id FK, sequence int, name, amount decimal(18,2),
due_date, status enum('pending','invoiced','paid'),
invoiced_amount decimal(18,2) default 0, paid_amount decimal(18,2) default 0,
notes, created_at, updated_at
```

#### `contract_documents`
```
id, contract_id FK, document_type, file_path, original_filename,
file_size, uploaded_by_id FK users, created_at
```

#### `invoice_request_legal_documents`
```
id, invoice_request_id FK, document_type (string), file_path,
original_filename, file_size, mime_type, uploaded_by_id FK users,
created_at
```

#### Extend existing `commitments` table

Current shape: `id, invoice_request_id, code, content, status, deadline, created_by, timestamps`.

```php
// migration: 2026_05_12_060008_extend_commitments
Schema::table('commitments', function (Blueprint $table) {
    $table->json('missing_documents')->nullable()->after('content');
    $table->foreignId('signature_snapshot_id')->nullable()->after('missing_documents')
          ->constrained('signature_snapshots')->nullOnDelete();
    $table->foreignId('director_id')->nullable()->after('signature_snapshot_id')
          ->constrained('users')->nullOnDelete();
    $table->string('director_decision', 16)->default('pending')->after('director_id'); // pending|approved|rejected
    $table->text('director_note')->nullable()->after('director_decision');
    $table->json('extensions')->nullable()->after('director_note');
});
```

Status values used: `active|near_due|overdue|completed|cancelled` (string column, app-layer enforced).

#### Activity log — already migrated

`2026_05_12_040557_create_activity_log_table.php` already exists. Just attach `LogsActivity` trait to `InvoiceRequest`, `Commitment`, `UserSignature` models in step 8.

### 4.4 Pivot: invoice_types ↔ required document types

P0 minimal: keep as JSON column on `invoice_types.required_legal_documents = ["contract","handover","acceptance",...]`. Proper pivot is P2.

---

## 5. API Surface

Base: `/api/v1`. All require Sanctum bearer token except auth endpoints.

### 5.1 Auth (unchanged)
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### 5.2 Signature (NEW — P0)
- `GET /me/signature` → 200 with signature or 404 if not set
- `PUT /me/signature` → multipart (method + file OR text payload)
- `DELETE /me/signature`

Middleware `require.signature` blocks approve/reject/return/commit actions when signature missing; returns 428 Precondition Required with `{ "error": "signature_required" }`.

### 5.3 Invoice Requests (modified)
- `GET /invoice-requests` — role-scoped + status filters
- `POST /invoice-requests` — create draft
- `GET /invoice-requests/{id}` — detail + timeline summary
- `PUT /invoice-requests/{id}` — edit (only owner, only when status ∈ {draft, returned})
- `DELETE /invoice-requests/{id}` — soft delete (owner + draft only)
- `POST /invoice-requests/{id}/submit` — branch routing logic (§3)
- `POST /invoice-requests/{id}/approve` — accountant or director per status
- `POST /invoice-requests/{id}/reject` — body: `{ reason }` → status=rejected
- `POST /invoice-requests/{id}/return` — body: `{ reason }` → status=returned (NEW)
- `POST /invoice-requests/{id}/resubmit` — owner resubmits from returned
- `POST /invoice-requests/{id}/legal-documents` — multipart upload (NEW)
- `GET /invoice-requests/{id}/legal-documents` — list
- `DELETE /invoice-requests/{id}/legal-documents/{docId}` — owner + before submit
- `GET /invoice-requests/{id}/timeline` — activity log entries

### 5.4 Approvals queue
- `GET /approvals/pending` — accountant sees normal; director sees special; admin sees both
- `GET /approvals/history` — actions performed by current user

### 5.5 Contracts (NEW — read-only P0)
- `GET /contracts` — list with filters
- `GET /contracts/{id}` — detail with installments
- `GET /contracts/{id}/installments`
- `POST /contracts/{id}/installments/{installmentId}/create-invoice-request` → returns new draft invoice

### 5.6 Commitments
- `GET /commitments` — list
- `GET /commitments/{id}` — detail
- `POST /commitments` — create (linked to invoice request)
- `POST /commitments/{id}/extend` — body: `{ new_deadline, reason }`
- Approval handled implicitly through invoice approve at director step

### 5.7 Notifications
- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`

### 5.8 Dashboard (NEW — P0)
- `GET /dashboard` — returns role-appropriate aggregates:
  - employee: `{ my_drafts, my_pending, my_returned, my_approved, my_issued }`
  - manager: `{ kv3_pending, kv3_approved, kv3_returned, kv3_total_month }`
  - accountant: `{ pending_normal, returned_today, approved_today, awaiting_issue }`
  - director: `{ pending_special, commitments_overdue, approved_today }`

---

## 6. Validation Rules

- Signature upload: PNG/JPG only, max 2MB, dimensions reasonable (server-side check)
- Legal document upload: PDF/PNG/JPG/DOCX, max 10MB per file
- Return reason: required, min 10 chars
- Rejection reason: required, min 10 chars
- Submit on `pending_vpgd` requires `commitment_id` non-null
- Edit only allowed when `status ∈ {draft, returned}` and `owner_id = current_user_id`
- VAT rate accepted as `"0%"|"5%"|"8%"|"10%"` or decimal `0|0.05|0.08|0.10`; normalize to decimal in DB

---

## 7. Testing Strategy

Maintain green test suite at every step. New test files:

- `tests/Feature/Signature/SignatureSetupTest.php` — create/get/delete, validation
- `tests/Feature/Signature/SignatureGateTest.php` — approve/reject blocked without signature → 428
- `tests/Feature/Approval/NormalBranchTest.php` — legal complete → accountant flow
- `tests/Feature/Approval/SpecialBranchTest.php` — legal incomplete + commitment → director flow
- `tests/Feature/Approval/ReturnFlowTest.php` — return → owner edit → resubmit → re-branch
- `tests/Feature/Approval/ManagerReadOnlyTest.php` — manager can list/view but not approve
- `tests/Feature/Customer/ExtendedFieldsTest.php`
- `tests/Feature/Contract/ListAndCreateFromInstallmentTest.php`
- `tests/Feature/Upload/LegalDocumentUploadTest.php`
- `tests/Feature/Dashboard/AggregatesTest.php`
- `tests/Feature/Timeline/ActivityLogTest.php`

Update existing tests:
- `tests/Feature/InvoiceRequest/ApprovalFlowTest.php` — rewrite for new chain
- `tests/Feature/Rbac/PermissionMatrixTest.php` — new matrix per §3

---

## 8. Execution Order with Per-Task QA

Each task ends green before the next starts. QA = the exact commands/checks to run.

### Task 1 — Migrations (additive only)
- Files: 8 new migrations under `database/migrations/2026_05_12_06000X_*.php`
- Order: signatures → snapshots → contracts → payment_installments → contract_documents → invoice_request_legal_documents → alter invoice_requests (columns) → alter customers → extend commitments → add FKs on invoice_requests
- **QA**:
  - `php artisan migrate:fresh` → 0 errors
  - `php artisan migrate:fresh --seed` → 0 errors
  - `php artisan tinker --execute="Schema::hasColumn('invoice_requests','return_reason') ? 'OK' : 'FAIL';"` → `OK`

### Task 2 — Seeders & fixtures
- Add: 1 contract with 3 installments, customers with buyer fields, signature for demo users
- Remove: manager-as-approver fixture rows in `ApprovalSeeder`
- **QA**: `php artisan migrate:fresh --seed` succeeds; tinker `Contract::count() >= 1`, `PaymentInstallment::count() >= 3`

### Task 3 — Approval chain refactor
- Rewrite: `SubmitInvoiceRequestAction`, `ApproveInvoiceRequestAction`, policies, role gates
- Branch logic per §3
- **QA**: `php artisan test --filter=Approval` → all green; new tests `NormalBranchTest`, `SpecialBranchTest`, `ManagerReadOnlyTest` pass

### Task 4 — Status enum + return action
- Add: `App\Domain\InvoiceRequestStatus` constants class; `ReturnInvoiceRequestController`; `POST /invoice-requests/{id}/return` route; `POST /invoice-requests/{id}/resubmit` route
- **QA**: `php artisan test --filter=ReturnFlowTest` → green; manual: `curl -X POST .../return` with reason → 200; without reason → 422

### Task 5 — Signature subsystem
- Add: `UserSignature` model, `SignatureSnapshot` model, `SignatureController` (GET/PUT/DELETE `/me/signature`), `RequireSignature` middleware on approve/reject/return routes, snapshot creation on each action
- **QA**: `php artisan test --filter=Signature` → green; manual: approve without signature → 428; with signature → 200 + snapshot row created

### Task 6 — Customer extended fields
- Add: validation in `StoreCustomerRequest`/`UpdateCustomerRequest`, fields in `CustomerResource`
- **QA**: `php artisan test --filter=CustomerExtendedFieldsTest` → green

### Task 7 — Contracts & installments (read + create-from-installment)
- Add: `Contract` + `PaymentInstallment` Eloquent models, `ContractController`, `CreateInvoiceFromInstallmentAction`
- **QA**: `php artisan test --filter=Contract` → green; manual: `POST /contracts/{id}/installments/{iid}/create-invoice-request` returns draft with prefilled customer/contract/amount

### Task 8 — Activity log wiring + timeline endpoint
- Add: `LogsActivity` trait on `InvoiceRequest`, `Commitment`, `UserSignature`; `TimelineController`; `GET /invoice-requests/{id}/timeline`
- **QA**: `php artisan test --filter=ActivityLogTest` → green; manual: submit + approve flow, then GET timeline returns ≥3 entries with actor/action/note

### Task 9 — Legal document uploads
- Add: `InvoiceRequestLegalDocumentController`, multipart validation, storage in `storage/app/private/legal-docs/{request_id}/`
- **QA**: `php artisan test --filter=LegalDocumentUploadTest` → green; manual: upload PDF → 201 + file on disk; upload .exe → 422

### Task 10 — Dashboard aggregates
- Add: `DashboardController@index` switching on role; aggregate queries with 30-second cache
- **QA**: `php artisan test --filter=DashboardAggregatesTest` → green; manual: login per role, hit `/dashboard`, verify counts match seeded data

### Task 11 — Final verification gate
- **QA**:
  - `vendor/bin/pint` → clean (no diffs)
  - `php artisan test` → all green, 0 failures, 0 errors
  - `php artisan migrate:fresh --seed` → 0 errors
  - `php artisan route:list --path=api/v1` matches the endpoint list in §5

---

## 9. Acceptance Criteria

- [ ] `php artisan test` → all tests pass; new tests cover all bullets in §7
- [ ] `vendor/bin/pint` → clean
- [ ] `php artisan migrate:fresh --seed` → succeeds; demo data covers all roles + a contract with installments
- [ ] Manual API smoke (Postman/curl) verifies:
  - login as employee → create draft → upload legal doc → submit → status=pending
  - login as accountant → approve → status=approved
  - login as employee → create draft without legal → create commitment → submit → status=pending-vpgd
  - login as director → approve → status=approved
  - login without signature → approve attempt → 428
  - login as manager → approve attempt → 403; list/view succeed
  - return flow: return → owner edits → resubmit → re-routes correctly
- [ ] OpenAPI/typed contract document updated for FE consumption (file: `docs/api-contract.md`) — minimal table of endpoints + request/response shapes

---

## 10. Risk Register

| Risk | Mitigation |
|---|---|
| `status` column already string (not enum) | No `change()` needed; enforce values via `App\Domain\InvoiceRequestStatus::all()` + `Rule::in(...)` in FormRequests |
| Existing approval tests deeply tied to old chain | Replace wholesale per §7; do not patch |
| Signature middleware may break unrelated endpoints | Apply only to approve/reject/return/commit routes via explicit middleware group |
| Activitylog package not yet configured | Publish config + migration in step 8 |
| File storage path conventions | Use `storage/app/private/signatures/{user_id}.png` and `storage/app/private/legal-docs/{request_id}/{uuid}.{ext}` |
| FE may already call endpoints with kebab-case status | Confirm at wiring time; transform in API resource |

---

## 11. Out-of-Scope Reminders (for P1/P2 phases)

- S-Invoice push + retry + callback
- VFS posting + journal entries + reconciliation
- Reports/exports (revenue, legal compliance, reconciliation)
- Admin: invoice types CRUD, workflow config, email rules, SMTP config, integration credentials
- Audit log admin UI (raw activitylog table accessible for now)
- Email notifications (DB notifications only in P0)

---

## 12. Logical Change Batches (No-Commit Mode)

Per user directive: **NO git commits during P0+ execution**. Changes are grouped into logical batches so they can be committed atomically later. Each batch corresponds to a single task in §8 and is independently testable.

| Batch | Task | Scope | Files (approx) |
|---|---|---|---|
| B1 | T1 | Additive migrations | `database/migrations/2026_05_12_06000*.php` |
| B2 | T2 | Seeders + fixtures | `database/seeders/*.php` |
| B3 | T3 | Approval chain refactor | `app/Actions/{Submit,Approve}*`, `app/Policies/InvoiceRequestPolicy.php`, tests |
| B4 | T4 | Status enum + return/resubmit | `app/Domain/InvoiceRequestStatus.php`, `app/Http/Controllers/Api/V1/ReturnInvoiceRequestController.php`, `routes/api.php`, tests |
| B5 | T5 | Signature subsystem | `app/Models/{UserSignature,SignatureSnapshot}.php`, `app/Http/Controllers/Api/V1/SignatureController.php`, `app/Http/Middleware/RequireSignature.php`, tests |
| B6 | T6 | Customer extended fields | `app/Http/Requests/{Store,Update}CustomerRequest.php`, `app/Http/Resources/CustomerResource.php`, tests |
| B7 | T7 | Contracts + installments | `app/Models/{Contract,PaymentInstallment,ContractDocument}.php`, `app/Http/Controllers/Api/V1/ContractController.php`, `app/Actions/CreateInvoiceFromInstallmentAction.php`, tests |
| B8 | T8 | Activity log + timeline | Add `LogsActivity` trait to 3 models, `TimelineController.php`, tests |
| B9 | T9 | Legal document uploads | `app/Http/Controllers/Api/V1/LegalDocumentController.php`, `app/Models/InvoiceRequestLegalDocument.php`, tests |
| B10 | T10 | Dashboard aggregates | `app/Http/Controllers/Api/V1/DashboardController.php`, tests |
| B11 | T11 | Final verification | Pint format, `docs/api-contract.md` update |

**Working agreement**: Do not move to Batch N+1 until Batch N's QA (§8) passes. If a regression is introduced by Batch N, fix within Batch N before progressing. When user requests commits later, each batch maps to one atomic commit.
