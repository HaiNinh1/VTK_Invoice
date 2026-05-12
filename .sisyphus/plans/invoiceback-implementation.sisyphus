# VTK Invoice — Backend Implementation Plan (invoiceBack)

Target stack already scaffolded: Laravel 13, PHP 8.3, MySQL (DB_PORT 3307, db `laravel`).
Frontend (invoiceFront): React + TS + Vite, consumes JSON REST API.

---

## 1. Goals & Scope

### Goals
- Provide a REST JSON API that fully backs the existing React frontend (VTK Invoice).
- Implement RBAC (5 roles) and Revenue Center scoping.
- Persist all domain data currently mocked in `invoiceFront/src/app/data/*.ts`
  (invoice requests, contracts + installments, invoice types, legal documents,
  commitments, approvals, S-Invoice + VFS sync status).
- Provide file upload/download for legal documents (master + per-installment + per-request).
- Provide export endpoints (PDF / Excel) for invoices.
- Provide stubs/integration hooks for S-Invoice (issuance) and VFS (accounting) sync.
- Auditable: track creator/updater and a generic audit log per change.

### In-scope (MVP)
Auth, RBAC, users, revenue centers, departments, customers, invoice types,
legal documents catalog, contracts + installments + contract documents,
invoice requests + per-request documents, approval workflow,
commitments, S-Invoice + VFS status tracking, exports (PDF/Excel), reports endpoints,
notifications (DB-backed, polling), audit log.

### Out-of-scope (MVP)
Real S-Invoice / VFS production credentials (use mock/sandbox driver).
SSO. Real-time push (WebSockets) — polling for notifications.
CI/CD provider configuration.

---

## 2. High-Level Architecture & Technology Choices

- **Framework**: Laravel 13 (already scaffolded).
- **Language**: PHP 8.3.
- **DB**: MySQL 8 on 127.0.0.1:3307 (already configured in `.env`).
- **Auth**: Laravel Sanctum (SPA cookie auth + personal access tokens for tools).
- **Authorization**: `spatie/laravel-permission` (roles + permissions matrix 5×16).
- **API style**: REST JSON under `/api/v1/*`. Pagination via `?page=&per_page=`.
- **Validation**: FormRequest classes per endpoint.
- **Response shaping**: Eloquent API Resources (`App\Http\Resources\*`).
- **Filtering/sorting**: `spatie/laravel-query-builder` (whitelist filters/sorts).
- **File storage**: `storage/app/private/{contracts,invoice-requests}/...` via Laravel filesystem (driver `local` for dev; `s3` ready).
- **PDF export**: `barryvdh/laravel-dompdf`.
- **Excel export**: `maatwebsite/excel`.
- **Async**: Laravel queue (driver `database` — already in `.env`) for S-Invoice push, VFS sync, exports >2s.
- **Logs**: Laravel default stack; structured channel `invoice` for domain events.
- **Activity log**: `spatie/laravel-activitylog`.
- **CORS**: `config/cors.php` allowing `http://localhost:5173` (Vite dev).
- **Testing**: PHPUnit 12 (already installed). Pest optional later.
- **Code style**: Laravel Pint (already installed).

### Layering
```
Routes (api.php)
   └─ Controller (thin) ── FormRequest (validate) ── Resource (shape)
                  └─ Service (App\Services\*)  ── domain logic, transactions
                            └─ Repository / Eloquent Model
                            └─ External clients (App\Integrations\SInvoice, App\Integrations\Vfs)
                            └─ Events / Jobs / Notifications
```

---

## 3. Required Services & Dependencies

### Composer packages to add
- `laravel/sanctum`
- `spatie/laravel-permission`
- `spatie/laravel-query-builder`
- `spatie/laravel-activitylog`
- `barryvdh/laravel-dompdf`
- `maatwebsite/excel`
- `league/flysystem-aws-s3-v3` (optional, prod)
- (dev) `barryvdh/laravel-ide-helper`

### External services (driver-abstracted, mock by default)
- **S-Invoice gateway**: HTTP client wrapper, configurable base URL + token in `.env`. Sandbox/mock driver returns synthetic codes (e.g. `K26TYY00000NN`).
- **VFS accounting**: HTTP client wrapper, mock driver toggles status `pending → processing → posted`.
- **Mail**: existing `MAIL_*` (log driver in dev).
- **MySQL**: already configured.

---

## 4. Domain Model & Database Schema

All tables use `id` (bigint, auto-inc), `created_at`, `updated_at`, soft deletes where useful, and `created_by` / `updated_by` (FK users) where the entity is user-authored.

### 4.1 Users / RBAC

- `users`: id, name, email (unique), email_verified_at, password, phone, employee_code, department_id (FK), revenue_center_id (FK, nullable), avatar_path, is_active, remember_token, timestamps.
- `roles`, `permissions`, `model_has_roles`, `role_has_permissions`, `model_has_permissions` — via spatie/permission migrations.
- Seed roles: `employee`, `manager`, `accountant`, `director`, `admin`.
- Seed permissions: matrix 16 capabilities (see §5.3).

### 4.2 Org

- `departments`: id, code (unique), name, parent_id (nullable), timestamps.
- `revenue_centers`: id, code (unique, e.g. `KV1..KV5`), name, manager_user_id (FK), timestamps.

### 4.3 Catalog

- `customers`: id, name, tax_code (unique), address, contact_name, contact_phone, contact_email, timestamps.
- `service_types`: id, code, name (Lắp đặt, Đo lường, Tư vấn, Phát triển, Bảo trì, Tích hợp, Cloud, Đào tạo).
- `legal_documents` (catalog of 11 LD-01..LD-11): id, code (unique), name, description, default_required (bool), timestamps.
- `invoice_types`: id, code (unique), name, description, status (`active|inactive`), created_by, updated_by, timestamps.
- `invoice_type_legal_document` (pivot): invoice_type_id, legal_document_id, required (bool), enabled (bool).
- `invoice_type_service_type` (pivot): invoice_type_id, service_type_id.

### 4.4 Contracts

- `contracts`: id, code (unique), name, customer_id, service_type_id, total_value (decimal 18,2), tax_rate (decimal 5,2), total_value_after_tax (decimal 18,2), sign_date, start_date, end_date, revenue_center_id, project_manager_id (FK users), status (`draft|active|completed|terminated`), totals_cache (json: total_invoiced, total_paid, remaining), created_by, updated_by, timestamps, deleted_at.
- `payment_installments`: id, contract_id, sequence (int), name, percentage (decimal 5,2), amount (decimal 18,2), condition (text), due_date, status (`pending|invoiced|paid`), invoice_request_id (nullable FK), paid_date (nullable), timestamps.
- `contract_documents`: id, contract_id, payment_installment_id (nullable; null = master doc), legal_document_id (nullable; for typed docs), name, file_path, file_size, mime_type, uploaded_by, uploaded_at, timestamps. Index `(contract_id, payment_installment_id)`.

### 4.5 Invoice Requests

- `invoice_requests`: id, request_code (unique, e.g. `DN-2026-00145`), invoice_no (nullable until issued), invoice_type_id, customer_id, service_type_id, contract_id (nullable), payment_installment_id (nullable), revenue_center_id, creator_id (FK users), department_id, before_vat (decimal 18,2), tax_rate (decimal 5,2), after_vat (decimal 18,2), status (`draft|pending|pending-vpgd|approved|issued|rejected|accounted`), legal_status_cache (json: completed, total, status), s_invoice_status (`none|pending|processing|sent-to-cqt|completed|error`), s_invoice_code (nullable), s_invoice_error (nullable text), vfs_status (`none|pending|processing|posted`), notes (text nullable), created_by, updated_by, timestamps, deleted_at. Indexes on `(status, revenue_center_id)`, `(creator_id)`, `(created_at)`.
- `invoice_request_documents`: id, invoice_request_id, legal_document_id (nullable), name, file_path, file_size, mime_type, uploaded_by, uploaded_at, timestamps.
- `commitments`: id, invoice_request_id (nullable; commitments may exist standalone), code (unique), content (text), status (`active|near-due|overdue|fulfilled`), deadline, created_by, timestamps.

### 4.6 Workflow

- `approvals`: id, invoice_request_id, approver_id (FK users), step (int, e.g. 1=dept, 2=accountant, 3=director), action (`pending|approved|rejected`), comment (text nullable), acted_at, timestamps. Unique `(invoice_request_id, step)`.
- `notifications` (Laravel default `notifications` table).
- `activity_log` (spatie default).

### 4.7 Migrations order
1. spatie/permission tables
2. departments, revenue_centers
3. users (extend)
4. customers, service_types, legal_documents
5. invoice_types + pivots
6. contracts, payment_installments, contract_documents
7. invoice_requests, invoice_request_documents, commitments
8. approvals
9. notifications, activity_log

---

## 5. API Design

### 5.1 Conventions
- Base path: `/api/v1`.
- Auth: Sanctum bearer token (`Authorization: Bearer <token>`) OR SPA cookie session.
- All endpoints return JSON. Errors follow:
  ```json
  { "message": "Human readable", "errors": { "field": ["..."] } }
  ```
- List endpoints: `?page=1&per_page=20&sort=-created_at&filter[status]=approved&filter[revenue_center]=KV3&search=VNPT`.
- Money fields: integers VND OR decimal strings — choose **decimal string** to avoid JS precision loss; document in OpenAPI.
- Dates: ISO 8601 in API, formatted `dd/MM/yyyy` on UI (frontend handles).

### 5.2 Endpoints

#### Auth
- `POST   /auth/login`            → `{ email, password }` → `{ token, user }`
- `POST   /auth/logout`           → 204
- `GET    /auth/me`               → current user + roles + permissions
- `POST   /auth/refresh`          → new token (optional)
- `POST   /auth/change-password`  → `{ old, new }`

#### Users & RBAC (admin/director)
- `GET    /users`
- `POST   /users`                 → create, assign role + revenue_center
- `GET    /users/{id}`
- `PUT    /users/{id}`
- `DELETE /users/{id}`
- `POST   /users/{id}/roles`       → set roles
- `GET    /roles`
- `GET    /permissions`
- `PUT    /roles/{id}/permissions` → update matrix

#### Org
- `GET/POST/PUT/DELETE /departments`
- `GET/POST/PUT/DELETE /revenue-centers`

#### Catalog
- `GET/POST/PUT/DELETE /customers`
- `GET/POST/PUT/DELETE /service-types`
- `GET/POST/PUT/DELETE /legal-documents`
- `GET/POST/PUT/DELETE /invoice-types`
  - `PUT /invoice-types/{id}/legal-documents` → set required/enabled mapping
  - `GET /invoice-types/{id}/compliance` → compliance rate

#### Contracts
- `GET    /contracts`              filters: status, revenue_center, customer, search
- `POST   /contracts`
- `GET    /contracts/{id}`         includes installments + masterDocuments
- `PUT    /contracts/{id}`
- `DELETE /contracts/{id}` (soft)
- `POST   /contracts/{id}/installments`
- `PUT    /contracts/{id}/installments/{instId}`
- `DELETE /contracts/{id}/installments/{instId}`
- `POST   /contracts/{id}/documents` (multipart, `is_master` flag, optional `installment_id`)
- `DELETE /contracts/{id}/documents/{docId}`
- `GET    /contracts/{id}/documents/{docId}/download`
- `POST   /contracts/{id}/installments/{instId}/create-invoice-request` → creates an `invoice_requests` row inheriting master docs.

#### Invoice Requests
- `GET    /invoice-requests`       filters: status, revenue_center, service_type, legal_status, creator, date_from, date_to. Auto-scoped by role (employee = own; manager = revenue_center; accountant/director/admin = all).
- `POST   /invoice-requests`
- `GET    /invoice-requests/{id}`
- `PUT    /invoice-requests/{id}` (only `draft`/`rejected`)
- `DELETE /invoice-requests/{id}` (soft, only draft)
- `POST   /invoice-requests/{id}/submit`     → `draft → pending`
- `POST   /invoice-requests/{id}/approve`    → step++ until `approved`
- `POST   /invoice-requests/{id}/reject`     → `rejected`
- `POST   /invoice-requests/{id}/issue`      → enqueue S-Invoice push → `pending-vpgd → issued`
- `POST   /invoice-requests/{id}/post-vfs`   → enqueue VFS sync → `accounted`
- `POST   /invoice-requests/{id}/documents`  (multipart)
- `DELETE /invoice-requests/{id}/documents/{docId}`
- `GET    /invoice-requests/{id}/documents/{docId}/download`
- `GET    /invoice-requests/{id}/export?format=pdf|xlsx&template=standard|detailed|simple`
- `GET    /invoice-requests/{id}/preview?template=...` (HTML preview)
- `GET    /invoice-requests/{id}/approvals`
- `GET    /invoice-requests/{id}/activity`

#### Commitments
- `GET    /commitments`
- `POST   /commitments`
- `PUT    /commitments/{id}`
- `DELETE /commitments/{id}`

#### Approval queues (role-filtered)
- `GET    /approvals/pending`     queue for current user role/step

#### Monitoring (S-Invoice / VFS)
- `GET    /monitoring/s-invoice`  list with filters by `s_invoice_status`
- `POST   /monitoring/s-invoice/{requestId}/retry`
- `GET    /monitoring/vfs`
- `POST   /monitoring/vfs/{requestId}/retry`

#### Reports
- `GET /reports/dashboard?scope=employee|center|company` → KPIs
- `GET /reports/revenue?group_by=month|center|service_type&from=&to=`
- `GET /reports/legal-compliance`
- `GET /reports/center/{id}` (manager)
- `GET /reports/export?type=...&format=xlsx`

#### Notifications
- `GET    /notifications?unread=1`
- `POST   /notifications/{id}/read`
- `POST   /notifications/read-all`

#### Settings / Audit
- `GET /audit?model=&model_id=&actor=&from=&to=`

### 5.3 RBAC Matrix (5 roles × 16 permissions)

Permissions (slug):
`invoice.view.own`, `invoice.view.center`, `invoice.view.all`,
`invoice.create`, `invoice.update`, `invoice.delete`,
`invoice.approve.dept`, `invoice.approve.accountant`, `invoice.approve.director`,
`invoice.issue` (push S-Invoice), `invoice.account` (VFS),
`contract.manage`, `invoice_type.manage`, `user.manage`,
`report.view.center`, `report.view.company`.

Role assignment:
- **Employee**: view.own, create, update (draft only).
- **Manager**: + view.center, approve.dept, report.view.center.
- **Accountant**: + view.all, approve.accountant, issue, account, report.view.company.
- **Director**: + approve.director, contract.manage, invoice_type.manage.
- **Admin**: all permissions + user.manage.

Enforced via:
- Route middleware `permission:invoice.create`.
- Policies (`InvoiceRequestPolicy`, `ContractPolicy`, …) for row-level checks (own / center / all).
- Global query scopes (`ScopeByRevenueCenter`) auto-applied based on auth role.

### 5.4 Example payloads

**POST /invoice-requests**
```json
{
  "invoice_type_id": 1,
  "customer_id": 12,
  "service_type_id": 1,
  "contract_id": 5,
  "payment_installment_id": 11,
  "before_vat": "2450000000.00",
  "tax_rate": "10.00",
  "after_vat": "2695000000.00",
  "notes": "Đợt 1 VNPT",
  "documents": [/* multipart upload separately */]
}
```

**Response (Resource)**
```json
{
  "data": {
    "id": 145,
    "request_code": "DN-2026-00145",
    "invoice_no": null,
    "status": "draft",
    "customer": { "id": 12, "name": "VNPT Hà Nội", "tax_code": "0100686209" },
    "service_type": "Lắp đặt",
    "revenue_center": "KV3",
    "creator": { "id": 7, "name": "Nguyễn Văn A" },
    "before_vat": "2450000000.00",
    "tax_rate": "10.00",
    "after_vat": "2695000000.00",
    "legal_status": { "completed": 8, "total": 11, "status": "supplementing" },
    "commitment": null,
    "s_invoice_status": "none",
    "vfs_status": "none",
    "created_at": "2026-03-10T08:12:00Z"
  }
}
```

---

## 6. Backend Folder / File Structure

```
invoiceBack/
├── app/
│   ├── Console/Commands/
│   │   ├── SyncSInvoicePending.php
│   │   └── SyncVfsPending.php
│   ├── Enums/
│   │   ├── InvoiceStatus.php
│   │   ├── SInvoiceStatus.php
│   │   ├── VfsStatus.php
│   │   └── ApprovalAction.php
│   ├── Events/
│   │   ├── InvoiceRequestSubmitted.php
│   │   ├── InvoiceRequestApproved.php
│   │   └── InvoiceRequestIssued.php
│   ├── Exceptions/Handler.php
│   ├── Exports/
│   │   ├── InvoiceRequestExport.php
│   │   └── RevenueReportExport.php
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── AuthController.php
│   │   │   ├── UserController.php
│   │   │   ├── RoleController.php
│   │   │   ├── DepartmentController.php
│   │   │   ├── RevenueCenterController.php
│   │   │   ├── CustomerController.php
│   │   │   ├── ServiceTypeController.php
│   │   │   ├── LegalDocumentController.php
│   │   │   ├── InvoiceTypeController.php
│   │   │   ├── ContractController.php
│   │   │   ├── ContractInstallmentController.php
│   │   │   ├── ContractDocumentController.php
│   │   │   ├── InvoiceRequestController.php
│   │   │   ├── InvoiceRequestDocumentController.php
│   │   │   ├── InvoiceRequestActionController.php (submit/approve/reject/issue/post-vfs)
│   │   │   ├── InvoiceExportController.php
│   │   │   ├── CommitmentController.php
│   │   │   ├── ApprovalController.php
│   │   │   ├── MonitoringController.php
│   │   │   ├── ReportController.php
│   │   │   └── NotificationController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureJsonResponse.php
│   │   │   └── ScopeByRevenueCenter.php
│   │   ├── Requests/                 (one FormRequest per write endpoint)
│   │   │   └── …
│   │   └── Resources/
│   │       ├── UserResource.php
│   │       ├── InvoiceRequestResource.php
│   │       ├── ContractResource.php
│   │       └── …
│   ├── Integrations/
│   │   ├── SInvoice/
│   │   │   ├── SInvoiceClient.php (interface)
│   │   │   ├── HttpSInvoiceClient.php
│   │   │   └── MockSInvoiceClient.php
│   │   └── Vfs/
│   │       ├── VfsClient.php
│   │       ├── HttpVfsClient.php
│   │       └── MockVfsClient.php
│   ├── Jobs/
│   │   ├── PushInvoiceToSInvoice.php
│   │   ├── PostInvoiceToVfs.php
│   │   └── GenerateInvoiceExport.php
│   ├── Models/
│   │   ├── User.php (HasRoles trait)
│   │   ├── Department.php
│   │   ├── RevenueCenter.php
│   │   ├── Customer.php
│   │   ├── ServiceType.php
│   │   ├── LegalDocument.php
│   │   ├── InvoiceType.php
│   │   ├── Contract.php
│   │   ├── PaymentInstallment.php
│   │   ├── ContractDocument.php
│   │   ├── InvoiceRequest.php
│   │   ├── InvoiceRequestDocument.php
│   │   ├── Commitment.php
│   │   └── Approval.php
│   ├── Notifications/
│   │   ├── InvoicePendingApprovalNotification.php
│   │   └── InvoiceIssuedNotification.php
│   ├── Policies/
│   │   ├── InvoiceRequestPolicy.php
│   │   ├── ContractPolicy.php
│   │   ├── InvoiceTypePolicy.php
│   │   └── UserPolicy.php
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   ├── AuthServiceProvider.php
│   │   └── IntegrationServiceProvider.php (bind S-Invoice/VFS interfaces)
│   ├── Services/
│   │   ├── InvoiceRequestService.php
│   │   ├── ContractService.php
│   │   ├── ApprovalService.php
│   │   ├── LegalComplianceService.php
│   │   ├── InvoiceCodeGenerator.php  (e.g. DN-{yyyy}-{####})
│   │   ├── ReportService.php
│   │   └── ExportService.php
│   └── Support/
│       └── Money.php
├── bootstrap/
├── config/
│   ├── cors.php (allow http://localhost:5173)
│   ├── sanctum.php
│   ├── permission.php
│   └── integrations.php  (s_invoice + vfs base_url, driver, mock toggle)
├── database/
│   ├── factories/   (one per model)
│   ├── migrations/  (per §4.7)
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RolePermissionSeeder.php
│       ├── DepartmentRevenueCenterSeeder.php
│       ├── UserSeeder.php   (1 per role for demo)
│       ├── CatalogSeeder.php (service_types, legal_documents, invoice_types)
│       ├── CustomerSeeder.php
│       ├── ContractSeeder.php (4 contracts from contractData.ts)
│       └── InvoiceRequestSeeder.php (20 records from masterInvoiceData.ts)
├── routes/
│   ├── api.php   (versioned, grouped by middleware)
│   └── console.php
├── storage/app/private/{contracts,invoice-requests}/
├── tests/
│   ├── Feature/
│   │   ├── Auth/LoginTest.php
│   │   ├── InvoiceRequest/CreateInvoiceRequestTest.php
│   │   ├── InvoiceRequest/ListScopingTest.php
│   │   ├── InvoiceRequest/ApprovalFlowTest.php
│   │   ├── InvoiceRequest/IssueToSInvoiceTest.php
│   │   ├── Contract/ContractInstallmentTest.php
│   │   ├── Contract/UploadDocumentTest.php
│   │   ├── InvoiceType/LegalDocMappingTest.php
│   │   ├── Reports/DashboardTest.php
│   │   └── Rbac/PermissionMatrixTest.php
│   └── Unit/
│       ├── Services/InvoiceCodeGeneratorTest.php
│       ├── Services/LegalComplianceServiceTest.php
│       └── Integrations/MockSInvoiceClientTest.php
└── .env (existing) / .env.example (update)
```

---

## 7. Development Environment Setup & Local Run

### Prerequisites
- PHP 8.3 + ext-pdo_mysql, ext-mbstring, ext-bcmath, ext-gd, ext-zip
- Composer 2.x
- MySQL 8 (running on 127.0.0.1:3307, db `laravel`, user `root`, pwd `vtkinvoice` per existing `.env`)
- Node 20+ (optional, only if using Vite assets in backend — frontend has its own)

### One-time setup
```
cd invoiceBack
composer install
cp .env.example .env        # (already exists)
php artisan key:generate    # already done
php artisan migrate --seed
php artisan storage:link
php artisan passport:install  # NOT used; using Sanctum
```

### Add packages
```
composer require laravel/sanctum spatie/laravel-permission spatie/laravel-query-builder spatie/laravel-activitylog barryvdh/laravel-dompdf maatwebsite/excel
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider"
php artisan migrate
```

### Run dev
```
composer dev          # already aliased: serve + queue + pail + npm (vite). For backend-only:
php artisan serve --host=127.0.0.1 --port=8000
php artisan queue:work --tries=3
```

### Frontend wiring
- Frontend `.env` should set `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`.
- Backend `config/cors.php`: `paths => ['api/*', 'sanctum/csrf-cookie']`, `allowed_origins => ['http://localhost:5173']`, `supports_credentials => true`.

---

## 8. Testing Strategy

### Layers
- **Unit** (`tests/Unit`): pure logic — code generator, compliance calculator, money formatting, mock S-Invoice transitions.
- **Feature** (`tests/Feature`): HTTP-level via `actingAs($user)` + `postJson(...)`. Use SQLite in-memory (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) in `phpunit.xml` for speed; mark MySQL-only tests with a group when needed.
- **Integration**: Real HTTP to mock S-Invoice/VFS using Laravel `Http::fake()`.
- **E2E** (optional, later): Pest + browser via Dusk OR rely on frontend Playwright suite hitting `php artisan serve`.

### Coverage targets
- Services: ≥90%.
- Controllers/Policies: every status branch covered.
- RBAC: matrix test asserts each (role, permission) combination.

### Example test cases
1. **LoginTest**: valid creds → 200 + token; invalid → 422.
2. **PermissionMatrixTest** (data-provider 5×16): each role hitting protected route returns 200 or 403 per matrix.
3. **ListScopingTest**:
   - Employee sees only own requests.
   - Manager(KV3) sees only KV3 requests.
   - Accountant sees all.
4. **CreateInvoiceRequestTest**: 
   - draft created, code auto-generated `DN-YYYY-#####`.
   - rejects when `before_vat` ≤ 0.
   - inherits contract master docs when `contract_id` provided.
5. **ApprovalFlowTest**: submit → manager approves → accountant approves → director approves → status `approved`. Wrong-step approver → 403.
6. **IssueToSInvoiceTest**: dispatches `PushInvoiceToSInvoice` job; with `MockSInvoiceClient` request gets `s_invoice_code` and `s_invoice_status=completed`.
7. **ContractInstallmentTest**: create contract with 3 installments summing to 100%; reject if sum > 100%.
8. **UploadDocumentTest**: master doc visible from all installments; per-installment doc not visible to others.
9. **LegalComplianceServiceTest** (unit): given invoice_type with 11 required docs and 8 uploaded → status `supplementing`, completed=8/11.
10. **DashboardTest**: KPIs match seeded data per role scope.

---

## 9. Task Breakdown, Effort, Milestones

Effort key: S ≤ 0.5d, M ≈ 1d, L ≈ 2d.

### Milestone M1 — Foundation (2–3 days)
1. (S) Install & configure Sanctum, spatie/permission, query-builder, activitylog.
2. (S) Configure CORS for Vite origin.
3. (M) Add base middleware: `EnsureJsonResponse`, `ScopeByRevenueCenter`.
4. (M) Migrations: departments, revenue_centers, customers, service_types, legal_documents.
5. (S) Extend `users` migration (department_id, revenue_center_id, employee_code, is_active).
6. (S) Seeders: roles & permissions matrix (§5.3), demo users (one per role).
7. (S) `AuthController` + tests.

### Milestone M2 — Catalog (1–2 days)
8. (M) `invoice_types` + pivots, model, controller, policy, FormRequests, Resource.
9. (S) Endpoints `GET/POST/PUT/DELETE /invoice-types` + LD mapping endpoint.
10. (S) Seed 8 invoice types + 11 legal documents from `invoiceTypes.ts`.
11. (S) Tests: `LegalDocMappingTest`.

### Milestone M3 — Contracts (2–3 days)
12. (M) Migrations: contracts, payment_installments, contract_documents.
13. (M) Models + relations + `ContractService` (totals cache recompute).
14. (M) Endpoints CRUD + installments + documents (multipart) + download.
15. (S) `create-invoice-request` action that inherits master docs.
16. (S) Seed 4 contracts from `contractData.ts`.
17. (M) Tests: `ContractInstallmentTest`, `UploadDocumentTest`.

### Milestone M4 — Invoice Requests core (3–4 days)
18. (M) Migrations: invoice_requests, invoice_request_documents, commitments.
19. (M) `InvoiceCodeGenerator` (atomic, per-year sequence) + tests.
20. (M) Model + Policy + Resource + FormRequests.
21. (M) CRUD endpoints with role-aware list scope.
22. (M) Document upload/download endpoints.
23. (S) `LegalComplianceService` to compute `legal_status_cache`.
24. (M) Seed 20 invoice requests from `masterInvoiceData.ts`.
25. (M) Tests: create / list scoping / compliance.

### Milestone M5 — Approval workflow (1–2 days)
26. (M) `ApprovalService`: submit/approve/reject with step state machine.
27. (S) Endpoints `submit/approve/reject` + `GET /approvals/pending`.
28. (S) Notifications: `InvoicePendingApprovalNotification` to next approver.
29. (M) Tests: `ApprovalFlowTest`, queue assertions.

### Milestone M6 — S-Invoice & VFS integration (2 days)
30. (S) `config/integrations.php` + bindings (Mock by default).
31. (M) `PushInvoiceToSInvoice` + `PostInvoiceToVfs` jobs with retries.
32. (S) Endpoints `issue`, `post-vfs`, monitoring endpoints + retry.
33. (M) Tests with `Http::fake()` and queue assertions.

### Milestone M7 — Exports & Preview (1–2 days)
34. (M) PDF templates (Blade → DomPDF) for 3 layouts (standard/detailed/simple).
35. (S) Excel export via maatwebsite/excel.
36. (S) `GenerateInvoiceExport` job for large exports; sync for single invoice.
37. (S) Tests: PDF non-empty, Excel headers correct.

### Milestone M8 — Reports & Notifications & Audit (1–2 days)
38. (M) `ReportService`: dashboard (employee/center/company), revenue grouping, legal compliance.
39. (S) Notification endpoints (DB-backed).
40. (S) Activity log auto-wired on key models.
41. (S) Tests: `DashboardTest`.

### Milestone M9 — Hardening (1 day)
42. (S) Rate limiting (`throttle:api`).
43. (S) Request logging channel `invoice`.
44. (S) Pint + static checks pass.
45. (S) OpenAPI spec generation (e.g. `darkaonline/l5-swagger` or hand-written `openapi.yaml`) — optional but recommended.

**Total estimate**: ~14–20 dev-days for one engineer.

### Priorities
P0 = M1, M4, M5 (login + create + approve = MVP demo).
P1 = M2, M3, M6.
P2 = M7, M8, M9.

---

## 10. Deployment & Runtime Considerations

### Build & release
1. `composer install --no-dev --optimize-autoloader`
2. `php artisan config:cache route:cache view:cache event:cache`
3. `php artisan migrate --force`
4. `php artisan storage:link`

### Process model
- Web: `php-fpm` behind Nginx OR `php artisan serve` for dev only.
- Queue worker: `php artisan queue:work --tries=3 --timeout=120` (systemd / supervisor).
- Scheduler: `* * * * * php artisan schedule:run` (for retry sweeps of S-Invoice / VFS).

### Env (prod)
- `APP_ENV=production`, `APP_DEBUG=false`, strong `APP_KEY`.
- `DB_*` to managed MySQL.
- `FILESYSTEM_DISK=s3` (optional) with KMS-encrypted bucket.
- `SANCTUM_STATEFUL_DOMAINS=app.vtk.example.com`.
- `INTEGRATIONS_SINVOICE_DRIVER=http`, base URL + token.
- `INTEGRATIONS_VFS_DRIVER=http`, base URL + token.

### Backups
- Daily mysqldump.
- Snapshot of `storage/app/private` (or rely on S3 versioning).

### Observability
- Laravel logs → file/stdout; aggregate to ELK or Loki.
- Health endpoint `GET /api/v1/health` (DB + queue + storage ping).

---

## 11. Risk Areas & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| S-Invoice / VFS API specs unknown or unstable | Blocks issue/account flows | Driver pattern + Mock driver; integrate behind feature flag; defer real creds to dedicated milestone. |
| Decimal precision (VND amounts billions) | Money corruption | Store `decimal(18,2)`; transport as strings; never use JS Number on FE. |
| Race condition on invoice_code generation | Duplicate codes | Use DB transaction + `SELECT … FOR UPDATE` on a `sequences` row OR Redis `INCR`. |
| File upload abuse (size/MIME) | Storage blowup, RCE | Validate MIME + size (≤25MB), store outside webroot in `storage/app/private`, signed URL downloads. |
| Authorization bugs leak cross-center data | Data breach | Global scope `ScopeByRevenueCenter` + policy tests for every role on every endpoint. |
| Large list endpoints slow (20→thousands rows) | Bad UX | Indexes on `(status, revenue_center_id, created_at)`; cursor pagination optional later. |
| PDF generation memory spikes | OOM | Queue exports, cap concurrency, stream output. |
| Vietnamese locale in PDFs (diacritics) | Garbled text | Embed Unicode font (DejaVu / Inter) in DomPDF config. |
| Migration drift between envs | Bugs in prod | `migrate --force` only via deploy pipeline; never `migrate:fresh` in prod. |
| RBAC matrix changes break existing data | Permission lockout | All permissions seeded via idempotent seeder; matrix change requires migration + seeder run. |

---

## 12. Acceptance Criteria (per major feature)

### Auth & RBAC
- A user can log in with email + password and receive a Sanctum token.
- `GET /auth/me` returns roles + flat permission list.
- A user with role `employee` is denied (`403`) on `POST /users`.
- The permission matrix test passes for all 5 × 16 combinations.

### Users / Org
- Admin can CRUD users, assign role + revenue_center.
- Deactivated user (`is_active=false`) cannot login.

### Invoice Types
- Admin/Director can create an invoice type and link N legal documents with `(required, enabled)` flags.
- `GET /invoice-types/{id}/compliance` returns % of issued invoices meeting required docs.

### Contracts
- Director/Admin can create a contract with ≥1 installments summing ≤100% (≤ allowed for buffer? — spec: =100%, validated).
- Master documents uploaded once are visible from each installment payload.
- Creating an invoice request from an installment inherits master docs into the request payload (`POST /contracts/{id}/installments/{instId}/create-invoice-request`).

### Invoice Requests
- Employee can create + edit own draft.
- Auto-generated code matches `DN-YYYY-#####` and is unique under concurrency (load test 50 concurrent creates passes).
- Status transitions enforced: only `draft → pending`, `pending → pending-vpgd|rejected`, `pending-vpgd → approved|rejected`, `approved → issued`, `issued → accounted`.
- Legal status cache reflects uploaded vs required documents per invoice type.

### Approval workflow
- Each step is recorded in `approvals` with actor and timestamp.
- Wrong-step or wrong-role approver gets `403`.
- Approver and creator receive DB notifications on state change.

### S-Invoice / VFS
- `POST /invoice-requests/{id}/issue` enqueues a job; with mock driver the request reaches `s_invoice_status=completed` and gets a synthetic `s_invoice_code`.
- Retry endpoint re-enqueues failed jobs.
- Monitoring list filters by status correctly.

### Exports
- `GET /invoice-requests/{id}/export?format=pdf` returns `application/pdf` with non-zero length and Vietnamese diacritics rendering correctly.
- `format=xlsx` returns valid spreadsheet openable in Excel.

### Reports
- Employee dashboard shows only their KPIs.
- Manager dashboard shows only their revenue_center KPIs.
- Company dashboard totals match sum of all invoice_requests in seeded set.

### Notifications & Audit
- Submitting an invoice creates a notification for the next approver visible in `GET /notifications?unread=1`.
- Every state-changing action produces an entry in `activity_log` retrievable via `GET /audit`.

### Cross-cutting
- All endpoints return JSON; validation errors return `422` with `errors` map.
- No endpoint exceeds 500ms p95 on seeded dataset (local).
- Pint passes, PHPUnit suite green.

---

## 13. Implementation Order Checklist (linear, ready for execution)

```
[ ] M1.1  composer require sanctum, spatie/permission, query-builder, activitylog
[ ] M1.2  publish vendor configs, run base migrations
[ ] M1.3  CORS config for http://localhost:5173 (+credentials)
[ ] M1.4  Migrations: departments, revenue_centers, extend users
[ ] M1.5  Seeders: roles, permissions matrix, demo users (5)
[ ] M1.6  AuthController + LoginTest + PermissionMatrixTest
[ ] M2.1  Migrations: customers, service_types, legal_documents, invoice_types (+pivots)
[ ] M2.2  Models + Resources + Controllers + Policies
[ ] M2.3  Seed catalog (8 invoice types, 11 legal docs)
[ ] M3.1  Migrations: contracts, payment_installments, contract_documents
[ ] M3.2  ContractService + endpoints + uploads + downloads
[ ] M3.3  Seed 4 contracts; tests
[ ] M4.1  Migrations: invoice_requests, invoice_request_documents, commitments
[ ] M4.2  InvoiceCodeGenerator + LegalComplianceService
[ ] M4.3  CRUD endpoints + role-scoped list + document endpoints
[ ] M4.4  Seed 20 invoice requests; tests
[ ] M5.1  Migrations: approvals
[ ] M5.2  ApprovalService + submit/approve/reject endpoints + notifications
[ ] M5.3  Tests
[ ] M6.1  config/integrations.php + Mock + Http clients (S-Invoice, VFS)
[ ] M6.2  Jobs + endpoints + monitoring
[ ] M6.3  Http::fake tests
[ ] M7.1  PDF Blade templates (3) + DomPDF font + Excel export
[ ] M7.2  Export job + endpoints + tests
[ ] M8.1  ReportService + endpoints
[ ] M8.2  Notification endpoints + activity log + audit endpoint
[ ] M9.1  Rate limiting, logging channel, OpenAPI (optional), Pint
[ ] M9.2  Health endpoint, final test run, prepare deploy notes
```

---

End of plan.
