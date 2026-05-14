# VTK Invoice — Backend Laravel Master Plan

> **Cách dùng**: Paste toàn bộ file này (hoặc reference `@Design/BACKEND_PLAN.md`) vào tin nhắn đầu tiên của session Claude mới. Yêu cầu agent: "Đọc plan này, xác nhận hiểu, list 12 entities + 9 bước, rồi bắt đầu bước 1." Agent sẽ tự lập todo, implement theo thứ tự, test mỗi bước.

## 0. Bối cảnh

**Hệ thống**: VTK Invoice — quản lý hoá đơn điện tử nội bộ doanh nghiệp Việt Nam, tích hợp cổng Viettel S-Invoice.

**Frontend** (đã xong, mock localStorage): `C:\Works\VTK_Invoice\invoiceFront\` — React 18 + Vite + Tailwind + React Router 7. Source quan trọng cần đọc trước:
- `src/data/masterData.js` — toàn bộ seed shape (USERS, CONTRACTS, INVOICE_REQUESTS, INVOICE_TYPE_CONFIGS, ROLE_LABELS, CURRENT_USER_BY_ROLE)
- `src/context/RequestsContext.jsx` — workflow state machine FE đang áp
- `src/context/ContractsContext.jsx` — document mutations
- `src/context/InvoiceTypesContext.jsx` — CRUD types/groups/templates
- `src/context/NotificationsContext.jsx` — 9 notification kinds + KIND_TO_CATEGORY
- Spec gốc: `C:\Works\VTK_Invoice\Design\Figma_Make_Prompt*.md`

**Backend**: Laravel 11 mới tạo. Nhiệm vụ — thay localStorage bằng REST API thật, đảm bảo 100% chức năng frontend chạy không sửa code FE.

## 1. Stack & Conventions (KHÔNG được lệch)

| Mục | Giá trị |
|---|---|
| Framework | Laravel 11 (PHP 8.3+) |
| Auth | Laravel Sanctum (token-based, SPA mode) |
| DB | MySQL 8 hoặc MariaDB 10.6+ |
| Authorization | Policies + Gates; role enum trên `users.role` |
| Validation | FormRequest classes (cấm `request()->validate()` inline) |
| API response | Resource classes (`App\Http\Resources\*`) |
| Response shape | `{ ok: boolean, data?: any, reason?: string, errors?: object }` — match `RequestsContext` của FE |
| Money column | `decimal(18,0)` VND nguyên (khớp seed `4500000000`) |
| Request ID | `R-YYMM-XXX` format (e.g., `R-2603-014`) — generate trong observer |
| Contract ID | `HD-NNNNNN` |
| Timezone | `Asia/Ho_Chi_Minh` |
| Locale | `vi` |
| Storage | `local` dev, `s3` prod; folders `contracts/{id}/`, `requests/{id}/`, `signatures/{user_id}/` |
| Test framework | Pest (preferred); coverage ≥ 85% trên `app/Services` + `app/Http/Controllers` |
| Queue | `database` driver dev, `redis` prod |
| API base | `/api/v1` |
| CORS | allow `http://localhost:5173` + production domain |

## 2. Domain Models — 12 entities

Tạo migrations + Eloquent models + factories + seeders cho từng entity.

### 2.1 `users`

| Column | Type | Notes |
|---|---|---|
| id | bigint pk | |
| name | string(120) | |
| email | string unique | |
| password | string | bcrypt |
| role | enum | `employee`, `manager`, `accountant`, `admin` |
| department | string(20) | `KV1..KV8`, `DL`, `DDL`, `TC`, `IT` |
| phone | string nullable | |
| title | string nullable | |
| has_signature | bool default false | |
| signature_path | string nullable | |
| remember_token, timestamps | | |

### 2.2 `contracts`

| Column | Type | Notes |
|---|---|---|
| id | string(20) pk | `HD-NNNNNN` |
| contract_number | string | |
| customer_name | string | |
| customer_tax_code | string(20) | |
| customer_address | text nullable | |
| signed_date | date | |
| value | decimal(18,0) | VND |
| department | string(20) | |
| revenue_center | string(20) | |
| service_type | string | foreign-like reference to `invoice_types.service_type` (soft) |
| status | enum | `Đang thực hiện`, `Hoàn thành`, `Tạm dừng` |
| created_by_id | fk users | |
| timestamps | | |

Index: `(department)`, `(status)`, `(service_type)`.

### 2.3 `contract_documents`

| Column | Type |
|---|---|
| id | string pk `doc-{contract}-{ts}-{rand}` |
| contract_id | fk contracts onDelete cascade |
| name | string |
| group_name | string |
| file_name | string |
| file_path | string |
| mime | string |
| size | int |
| uploaded_by_id | fk users nullable |
| uploaded_at | timestamp |
| timestamps | |

### 2.4 `invoice_types`

| Column | Type |
|---|---|
| id | string pk `IT-{slug}` |
| name | string |
| service_type | string unique |
| active | bool default true |
| timestamps | |

### 2.5 `document_groups`

`id` bigint, `invoice_type_id` fk cascade, `name` string, `sort_order` int, timestamps.

### 2.6 `document_templates`

`id` bigint, `document_group_id` fk cascade, `name`, `required` bool, `sort_order` int, timestamps.

### 2.7 `requests`

| Column | Type | Notes |
|---|---|---|
| id | string pk `R-YYMM-XXX` | auto-gen observer |
| contract_id | fk contracts | |
| customer_name, customer_tax_code, customer_address | snapshot strings | tránh lệch nếu HĐ sửa |
| value_before_vat | decimal(18,0) | |
| vat_rate | tinyInt | `8` or `10` |
| vat_amount | decimal(18,0) | computed |
| value_after_vat | decimal(18,0) | computed |
| payment_term | enum | `Tạm ứng`, `Đợt 1..3`, `Thanh toán cuối`, `1 lần` |
| payment_method | enum | `Chuyển khoản`, `Tiền mặt`, `Bù trừ` |
| invoice_kind | enum | `Tạo mới`, `Điều chỉnh`, `Thay thế` |
| original_invoice_number | string nullable | required khi kind != `Tạo mới` |
| adjustment_reason | text nullable | required khi kind != `Tạo mới` |
| buyer_email | string nullable | |
| notes | text nullable | |
| status | enum | 6 values (xem 2.7.1) |
| has_commitment | bool default false | |
| commitment_text | text nullable | |
| commitment_deadline | date nullable | |
| created_by_id | fk users | |
| submitted_at, recalled_at | timestamps nullable | |
| timestamps | | |

#### 2.7.1 Status enum (EXACT strings — frontend so sánh literal)

```
Nháp, Chờ duyệt, Đã duyệt, Đã xuất HĐ, Từ chối, Trả lại bổ sung
```

### 2.8 `request_documents`

| Column | Type |
|---|---|
| id | bigint pk |
| request_id | fk cascade |
| name | string |
| file_path | string nullable |
| file_name | string nullable |
| checked | bool default false |
| inherited_from_contract_doc_id | fk contract_documents nullable |
| uploaded_at | timestamp nullable |
| timestamps | |

Business rule: nếu `inherited_from_contract_doc_id` không null → `checked` luôn true và không cho uncheck/delete qua API.

### 2.9 `approvals`

| Column | Type |
|---|---|
| request_id | pk fk |
| approved_by_id | fk users |
| approved_at | timestamp |
| accounting_ref_no | string (required) |
| account_revenue | string default `5113` |
| account_tax | string default `33311` |
| account_receivable | string default `131` |
| approval_note | text nullable |
| signature_snapshot | json | `{name, role_label, department, timestamp}` |

### 2.10 `rejections` (đa hình: từ chối + trả lại bổ sung)

| Column | Type |
|---|---|
| id | bigint pk |
| request_id | fk |
| kind | enum `reject`, `return` |
| reason | text (required, min 3 chars) |
| by_id | fk users |
| at | timestamp |

### 2.11 `s_invoices`

| Column | Type |
|---|---|
| id | bigint pk |
| request_id | fk unique |
| s_invoice_number | string unique nullable | gateway cấp |
| s_invoice_tax_code | string(20) nullable | `4A2B{4 digits}` |
| status | enum | `Đang xử lý`, `Thành công`, `Lỗi` |
| error_message | text nullable | |
| gateway_response_json | json nullable | |
| exported_at | timestamp | |
| last_synced_at | timestamp nullable | |

### 2.12 `notifications` + `notification_settings`

**`notifications`**:

| Column | Type |
|---|---|
| id | uuid pk |
| user_id | fk |
| kind | enum (9 values, xem dưới) |
| title | string |
| description | text nullable |
| data_json | json | chứa `to` (route) + payload |
| read_at | timestamp nullable |
| created_at | timestamp |

**Kind enum (EXACT, match FE)**:
```
pendingApproval, approved, rejected, returned,
exportSuccess, exportError, legalDueSoon, commitmentOverdue, system
```

**`notification_settings`**:

| Column | Type |
|---|---|
| user_id | fk |
| key | string (1 trong 9 kinds) |
| enabled | bool |
| unique(user_id, key) | |

Default values: tất cả `true` trừ `system = false`.

## 3. API Contracts — chi tiết từng endpoint

Tất cả endpoints require Sanctum auth trừ `POST /auth/login` và webhook.

### 3.1 Auth & Profile

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{email, password}` | `{token, user}` |
| POST | `/auth/logout` | — | `{ok:true}` |
| GET | `/auth/me` | — | `{user}` (include `has_signature`) |
| POST | `/auth/change-password` | `{current, new, confirm}` | `{ok, reason?}` |
| PUT | `/profile` | `{name, phone, title}` | `{user}` (email/dept/role readonly) |
| POST | `/profile/signature` | multipart `{file}` | `{ok}`, set `has_signature=true` |

### 3.2 Users (admin only)

`GET /users` (paginate 20), `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`.

### 3.3 Contracts

**Role scope** (middleware `ScopeByRole`):
- `employee` / `manager` → `where department = auth.department`
- `accountant` / `admin` → all

| Method | Path | Notes |
|---|---|---|
| GET | `/contracts?status=&department=&q=&page=` | scoped |
| POST | `/contracts` | accountant/admin/manager-of-dept |
| GET | `/contracts/{id}` | 403 nếu out-of-department và role không phải accountant/admin |
| PUT | `/contracts/{id}` | accountant/admin only |
| DELETE | `/contracts/{id}` | admin only; chặn nếu có requests liên quan |
| POST | `/contracts/{id}/documents` | multipart `{name, group_name, file}`; max 20MB; mime: pdf/doc/docx/jpg/png |
| DELETE | `/contracts/{id}/documents/{doc_id}` | |
| GET | `/contracts/export?format=xlsx` | real .xlsx via PhpSpreadsheet |

### 3.4 Invoice Types (accountant/admin)

| Method | Path | Body |
|---|---|---|
| GET | `/invoice-types` | |
| POST | `/invoice-types` | `{name, service_type, copy_from_id?}` — clone documentGroups nếu copy_from_id |
| PUT | `/invoice-types/{id}` | `{name?, service_type?, active?}` |
| DELETE | `/invoice-types/{id}` | chặn nếu có contracts với `service_type` này |
| POST | `/invoice-types/{id}/groups` | `{name}` |
| PUT | `/document-groups/{id}` | `{name}` |
| DELETE | `/document-groups/{id}` | cascade delete templates |
| POST | `/document-groups/{id}/templates` | `{name, required}` |
| PUT | `/document-templates/{id}` | `{name?, required?}` |
| DELETE | `/document-templates/{id}` | |

### 3.5 Requests

**Role scope tương tự contracts**, thêm: `employee` chỉ thấy `where created_by_id = auth.id`.

| Method | Path | Body | Business rule |
|---|---|---|---|
| GET | `/requests?status=&q=&page=` | | scoped |
| POST | `/requests` | full request payload | tự inherit `request_documents` từ `contract_documents` matching by `LOWER(name)`; set `status='Nháp'` |
| GET | `/requests/{id}` | | creator OR same-dept OR accountant/admin |
| PUT | `/requests/{id}` | | **chỉ khi status ∈ {`Nháp`, `Trả lại bổ sung`}** |
| POST | `/requests/{id}/submit` | | creator only; status `Nháp/Trả lại` → `Chờ duyệt`; push `pendingApproval` cho mọi accountant/admin |
| POST | `/requests/{id}/recall` | | **creator only + status='Chờ duyệt'**; trả `{ok:false, reason:'Chỉ người tạo mới được thu hồi'}` nếu sai |
| POST | `/requests/{id}/approve` | `{accounting_ref_no, account_revenue, account_tax, account_receivable, approval_note}` | accountant/admin; **legal gate** (xem §4.3); set status=`Đã duyệt`, tạo `approvals` row |
| POST | `/requests/{id}/reject` | `{reason}` min:3 | accountant/admin; tạo `rejections{kind:reject}`, status=`Từ chối` |
| POST | `/requests/{id}/return` | `{reason}` min:3 | accountant/admin; tạo `rejections{kind:return}`, status=`Trả lại bổ sung` |
| POST | `/requests/{id}/export` | `{simulate_error?}` | accountant/admin; status `Đã duyệt`→`Đã xuất HĐ`; allocate s_invoice; dispatch `IssueSInvoiceJob` |
| POST | `/requests/{id}/retry-export` | | chỉ khi `s_invoices.status='Lỗi'`; dispatch lại job |
| POST | `/requests/{id}/documents` | multipart per-doc upload | |

### 3.6 S-Invoice

| Method | Path | Notes |
|---|---|---|
| GET | `/s-invoices?status=&q=&page=` | filter by `Đang xử lý`/`Thành công`/`Lỗi` |
| GET | `/s-invoices/{id}` | detail |
| POST | `/s-invoices/{id}/sync` | re-poll Viettel |
| POST | `/webhooks/viettel-sinvoice` | **public**, HMAC SHA256 verify header `X-Viettel-Signature`; update status + push notifications |

### 3.7 Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications?category=all\|approval\|legal\|system&page=` | 20/page; mapping kind→category xem §2.12 |
| POST | `/notifications/{id}/read` | |
| POST | `/notifications/mark-all-read` | |
| GET | `/notifications/settings` | trả về 9 keys |
| PUT | `/notifications/settings` | partial patch |

### 3.8 Settings — Connections

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/settings/connections` | | `{s_invoice: {...}, smtp: {...}}` (masked password) |
| PUT | `/settings/connections/s-invoice` | `{endpoint, tax_code, username, password}` | |
| POST | `/settings/connections/s-invoice/test` | | `{ok, message}` (ping Viettel) |
| PUT | `/settings/connections/smtp` | `{host, port, username, password, from}` | |
| POST | `/settings/connections/smtp/test` | `{to}` | gửi mail test |

### 3.9 Reports

`GET /reports/summary?period=month|quarter|year&year=&center=` →
```json
{
  "request_status_breakdown": { "Nháp": 3, "Chờ duyệt": 5, "Đã duyệt": 8, "Đã xuất HĐ": 12, "Từ chối": 1, "Trả lại bổ sung": 2 },
  "legal_status":             { "complete": 15, "partial": 7, "missing": 3, "overdue": 1 },
  "s_invoice_status":         { "success": 10, "error": 1, "processing": 1 },
  "monthly_bars": [
    { "month": 1, "count": 12, "value": 4500000000 },
    { "month": 2, "count": 18, "value": 6200000000 }
  ]
}
```

`GET /reports/export?format=xlsx&type=request_summary|legal_status` → real .xlsx.

## 4. Business Rules (BẮT BUỘC enforce server-side — không trust FE)

### 4.1 Role scoping list endpoints
Middleware `ScopeByRole` apply tự động vào index queries của `contracts`, `requests`.

### 4.2 State machine `RequestStateMachine`
Service class với matrix:

| From | To | Trigger | Authorized roles | Extra guard |
|---|---|---|---|---|
| `Nháp` | `Chờ duyệt` | submit | creator | — |
| `Trả lại bổ sung` | `Chờ duyệt` | submit (resubmit) | creator | — |
| `Chờ duyệt` | `Nháp` | recall | creator | — |
| `Chờ duyệt` | `Đã duyệt` | approve | accountant, admin | legal gate (§4.3) |
| `Chờ duyệt` | `Từ chối` | reject | accountant, admin | reason ≥ 3 chars |
| `Chờ duyệt` | `Trả lại bổ sung` | return | accountant, admin | reason ≥ 3 chars |
| `Đã duyệt` | `Đã xuất HĐ` | export | accountant, admin | — |

Bất kỳ chuyển không khớp matrix → throw `App\Exceptions\InvalidStateTransition` → middleware/handler trả `{ok:false, reason:'...'}` 422.

### 4.3 Legal completeness gate (approve)
```php
$legalComplete  = $req->documents->where('checked', true)->count() >= $req->documents->count();
$commitmentOk   = $req->has_commitment
                  && $req->commitment_deadline
                  && $req->commitment_deadline->gte(today());
if (!($legalComplete || $commitmentOk)) {
    return ['ok' => false, 'reason' => 'Hồ sơ pháp lý thiếu và không có cam kết hợp lệ'];
}
```

### 4.4 Notification triggers (Observer trên `Request`)

| Event | Recipients | Kind |
|---|---|---|
| `RequestSubmitted` | tất cả accountant + admin | `pendingApproval` |
| `RequestApproved` | creator | `approved` |
| `RequestRejected` | creator | `rejected` |
| `RequestReturned` | creator | `returned` |
| `SInvoiceSuccess` (từ webhook) | creator + kế toán | `exportSuccess` |
| `SInvoiceFailed` | kế toán + admin | `exportError` |
| Scheduled `notifications:check-deadlines` (daily 07:00) | creator | `legalDueSoon` (deadline ≤ 3 ngày), `commitmentOverdue` (đã quá hạn) |

Tôn trọng `notification_settings`: nếu user tắt key đó → không tạo row.

### 4.5 Inherited document lock
`request_documents` có `inherited_from_contract_doc_id` khác null:
- `checked = true` luôn
- API `PATCH/DELETE` → 422 `{ok:false, reason:'Tài liệu kế thừa không thể chỉnh sửa'}`

### 4.6 File upload security
- Validate mime: pdf/doc/docx/jpg/png
- Max size: 20MB
- Random filename `{ulid}.{ext}`
- Virus scan placeholder (`ClamAV` driver nếu có; dev có thể skip với env flag)
- Store path không expose user_id trực tiếp; access qua signed URL `route('files.show', ['id' => ...])` 5 phút

### 4.7 ID generators
- Request ID: observer `creating` → `R-{Y(2)}{M(2)}-{seq3}` (atomic counter per month, DB lock)
- Contract ID: tương tự `HD-{seq6}`
- S-Invoice number: sequence `SI-{seq8}`, tax_code = `4A2B{rand4}`

## 5. Integrations

### 5.1 Viettel S-Invoice
- Config file `config/viettel.php`, ENV: `VIETTEL_ENDPOINT`, `VIETTEL_USERNAME`, `VIETTEL_PASSWORD`, `VIETTEL_TAX_CODE`, `VIETTEL_DRIVER` (`fake|real`)
- Service: `App\Services\SInvoice\ViettelClient`
- Methods: `issue(Request $r): IssueResult`, `query(string $number): QueryResult`, `cancel(string $number)`
- **`FakeViettelDriver`** (default dev): luôn return success sau 2s, ngẫu nhiên 10% fail (`SImulator` random) để test retry flow
- **Real driver** (`RealViettelDriver`): implement SOAP/REST theo doc Viettel — placeholder cho prod, throw `NotImplementedException` nếu thiếu credential
- Queue job `App\Jobs\IssueSInvoiceJob` (queue=`s-invoice`, retry 3 lần với backoff 30/60/120s)

### 5.2 SMTP
- `Mail::send(new TestConnectionMail(), 'to@email')` cho endpoint test
- Mailables: `RequestApprovedMail`, `RequestRejectedMail`, `RequestReturnedMail`, `SInvoiceSuccessMail`, `SInvoiceErrorMail`
- Fire từ Notification observer khi user setting `email_alerts=true`

## 6. Authorization (Policies)

Tạo policies: `ContractPolicy`, `RequestPolicy`, `InvoiceTypePolicy`, `UserPolicy`.

Ví dụ `RequestPolicy`:
```php
public function view(User $u, Request $r): bool {
    if (in_array($u->role, ['accountant','admin'])) return true;
    if ($u->id === $r->created_by_id) return true;
    if ($u->role === 'manager' && $u->department === $r->contract->department) return true;
    return false;
}
public function update(User $u, Request $r): bool {
    return $u->id === $r->created_by_id && in_array($r->status, ['Nháp','Trả lại bổ sung']);
}
public function approve(User $u, Request $r): bool {
    return in_array($u->role, ['accountant','admin']) && $r->status === 'Chờ duyệt';
}
public function recall(User $u, Request $r): bool {
    return $u->id === $r->created_by_id && $r->status === 'Chờ duyệt';
}
```

## 7. Seed Data (BẮT BUỘC tạo)

`DatabaseSeeder` phải tạo:

### Users (match frontend `CURRENT_USER_BY_ROLE`)
| ID | Name | Email | Role | Dept |
|---|---|---|---|---|
| u1 | Nguyễn Văn An | an.nv@vtk.vn | employee | KV3 |
| u2 | Trần Thị Bình | binh.tt@vtk.vn | accountant | TC |
| u3 | Lê Quang Cường | cuong.lq@vtk.vn | manager | KV3 |
| u4 | Phạm Thuý Dung | dung.pt@vtk.vn | admin | IT |
| u5 | Hoàng Minh Hải | hai.hm@vtk.vn | employee | KV1 |

Mật khẩu mặc định: `password123` (in trong `.env.example`).

### Invoice Types
Ít nhất 3: "Dịch vụ tư vấn" (`tu-van`), "Bán hàng hoá" (`hang-hoa`), "Dịch vụ xây lắp" (`xay-lap`). Mỗi loại có 2-3 documentGroups (Pháp lý cơ bản, Nghiệm thu, Quyết toán) với 3-5 templates mỗi group.

### Contracts (8+ bản, phân bổ qua KV1/KV3/KV5)
Mỗi contract có 5-15 `contract_documents` upload sẵn (sinh file giả `.pdf` trong storage seed).

### Requests (15+ bản, phân bổ qua đủ 6 status)
- ≥ 2 `Nháp`, ≥ 3 `Chờ duyệt`, ≥ 4 `Đã duyệt`, ≥ 4 `Đã xuất HĐ`, ≥ 1 `Từ chối`, ≥ 1 `Trả lại bổ sung`
- ≥ 1 có cam kết quá hạn → trigger `commitmentOverdue` notification
- ≥ 1 có cam kết deadline trong 2 ngày → trigger `legalDueSoon`

### S-Invoices
- 1 status `Thành công` (có sInvoiceNumber + taxCode)
- 1 status `Lỗi` (có error_message) → test retry flow

## 8. Definition of Done (DoD)

Backend HOÀN THÀNH chỉ khi mọi mục tick:

- [ ] `php artisan migrate:fresh --seed` chạy clean trên DB trống, không lỗi
- [ ] `php artisan test` PASS, coverage ≥ 85% trên `app/Services` + `app/Http/Controllers`
- [ ] **Feature test ma trận role** cho mọi endpoint: 4 roles × 3 outcomes (happy / forbidden / validation-fail)
- [ ] **State machine test**: mọi transition hợp lệ + invalid transitions từ chối với reason đúng
- [ ] **Legal gate test**: approve bị block khi missing docs + không cam kết; pass khi có cam kết hợp lệ
- [ ] **Recall guard test**: non-creator bị reject; status không phải `Chờ duyệt` bị reject
- [ ] **Notification trigger test**: tạo request → submit → đếm rows `notifications` đúng số kế toán/admin
- [ ] **Webhook test**: gọi `/webhooks/viettel-sinvoice` với HMAC sai → 401; đúng → cập nhật status
- [ ] **OpenAPI/Swagger** generated tại `/api/docs` (dùng `darkaonline/l5-swagger` HOẶC `knuckleswtf/scribe`)
- [ ] **Postman collection** export tại `docs/postman_collection.json` với example requests
- [ ] **README** đầy đủ:
  - Setup: `composer install`, `.env`, `php artisan key:generate`
  - DB: `migrate:fresh --seed`
  - Run: `php artisan serve` + `php artisan queue:work --queue=s-invoice,default`
  - Test: `php artisan test --coverage`
  - Schedule (cho deadline notifications): hướng dẫn cron `* * * * * php artisan schedule:run`
  - ENV vars list (DB, Sanctum, Viettel, SMTP)
- [ ] **CORS** config cho `http://localhost:5173` + production domain
- [ ] **Sanctum stateful domain** cấu hình đúng cho FE
- [ ] **Smoke test với FE**: chạy `npm run dev` của FE pointing tới backend này, đăng nhập u2 (accountant), submit→approve→export 1 request, S-Invoice success → KHÔNG sửa code FE

## 9. Implementation Order — 9 bước

Mỗi bước: implement → test → commit. **KHÔNG đi bước sau khi test bước trước fail.**

### Bước 1 — Foundation (Schema + Seed)
- Tạo TOÀN BỘ 12 migrations + factories + seeder
- `migrate:fresh --seed` PASS
- Smoke: `php artisan tinker` → `User::count() === 5`, `Request::pluck('status')->unique()->count() === 6`

### Bước 2 — Auth + Profile + Users
- Sanctum config, login/logout/me/change-password
- Profile update + signature upload
- Users CRUD (admin policy)
- Tests: login với 5 user demo PASS; admin tạo user mới PASS; non-admin tạo user → 403

### Bước 3 — Contracts + Invoice Types
- Contract CRUD + role scope middleware + document upload
- InvoiceType CRUD + groups + templates + copy-from
- Tests: employee KV3 chỉ thấy contracts KV3; out-of-dept access → 403; document upload + delete

### Bước 4 — Request State Machine (CORE)
- Service `RequestStateMachine` với matrix transitions
- Test **state machine riêng** trước (unit test, không qua controller): 7 transitions hợp lệ + ≥ 5 invalid → reject đúng
- Sau đó endpoints: GET list/show, POST create, PUT update, submit, recall, approve (+ legal gate), reject, return
- Tests: ma trận role × status

### Bước 5 — Notifications + Observer
- 9 notification kinds + settings table
- Observer trên Request fire events
- Scheduled command `notifications:check-deadlines`
- Tests: submit request → đếm rows `notifications` cho mọi accountant/admin; approve → creator nhận `approved`; setting tắt → không tạo row

### Bước 6 — S-Invoice + Viettel Mock + Webhook
- `FakeViettelDriver` + `IssueSInvoiceJob`
- Endpoint export + retry-export
- Webhook receiver với HMAC verify
- Tests: export → s_invoices row created status=`Đang xử lý`; job complete → status=`Thành công` + push notification; simulate_error=true → status=`Lỗi`, retry hoạt động

### Bước 7 — Reports + Excel Export
- Aggregation queries cho summary
- PhpSpreadsheet xuất .xlsx (contracts list + reports)
- Tests: summary đúng với seed data; xlsx file mở được trong Excel

### Bước 8 — Settings/Connections + SMTP
- Config storage (encrypted password)
- Test endpoints (s-invoice ping + smtp send)
- Tests: test endpoints không lưu password vào DB nếu test fail

### Bước 9 — Docs + Final Smoke
- Generate Swagger/OpenAPI
- Export Postman collection
- Update README với hướng dẫn setup
- **FE smoke test cuối**: dùng FE thật chạy hết user journey, không sửa code FE

## 10. Cấm tuyệt đối (anti-patterns)

1. ❌ `Model::all()` không phân trang trên list endpoint
2. ❌ `request()->validate()` inline trong controller — luôn FormRequest
3. ❌ Hardcode role string trong controller — luôn Policy/Gate
4. ❌ Return Eloquent model trực tiếp — luôn Resource
5. ❌ Commit `.env` thật (chỉ `.env.example`)
6. ❌ Skip authorization "vì sẽ làm sau"
7. ❌ Trust input FE cho `status`, `role`, `created_by_id` — luôn set từ `auth()->user()`
8. ❌ Bịa endpoint Viettel — nếu không có doc → dùng `FakeViettelDriver`, document rõ ràng
9. ❌ Catch exception rồi swallow — log + rethrow hoặc return rõ ràng
10. ❌ N+1 query — luôn eager load `with(...)` cho relations dùng trong response

## 11. Phụ lục — File reference từ Frontend

Đọc các file này trước khi bắt đầu code để đảm bảo shape khớp 100%:

| FE file | Cung cấp gì cho BE |
|---|---|
| `invoiceFront/src/data/masterData.js` | Seed shape USERS, CONTRACTS, INVOICE_REQUESTS, INVOICE_TYPE_CONFIGS, ROLE_LABELS |
| `invoiceFront/src/context/RequestsContext.jsx` | Workflow API signatures + return shape (đặc biệt `{ok, reason?, sInvoiceNumber}`) |
| `invoiceFront/src/context/ContractsContext.jsx` | Document mutations addDocument/updateDocument/deleteDocument |
| `invoiceFront/src/context/InvoiceTypesContext.jsx` | Type/group/template CRUD signatures |
| `invoiceFront/src/context/NotificationsContext.jsx` | 9 kinds + KIND_TO_CATEGORY mapping cho ThongBao tabs |
| `invoiceFront/src/pages/SInvoice.jsx` | Filter logic 4 tabs, retry flow expectation |
| `invoiceFront/src/pages/PheDuyet.jsx` | Approval form fields (`accounting_ref_no`, 3 accounts, `approval_note`) |
| `invoiceFront/src/pages/DeNghiForm.jsx` | Request payload structure, inheritance behavior |
| `Design/Figma_Make_Prompt*.md` | Original spec (19 prompts), check khi có ambiguity |

## 12. Kickoff Command (paste vào session mới sau plan này)

```
Bạn là senior Laravel engineer. Đọc kỹ @Design/BACKEND_PLAN.md.

Trước khi viết code:
1. Liệt kê 12 entities với column chính + 1 dòng mô tả
2. Liệt kê 9 bước implementation theo thứ tự
3. Xác nhận đã đọc xong các file FE reference ở §11
4. Tạo todo list theo 9 bước

Sau xác nhận, bắt đầu Bước 1 (Foundation). Mỗi bước hoàn thành → chạy test → commit → báo cáo → mới sang bước kế tiếp. KHÔNG batch nhiều bước.
```

---

**Phiên bản**: 1.0 · **Tác giả plan**: Frontend session  · **Ngày**: 2026-05
