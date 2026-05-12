# VTK Invoice API Contract — v1

Base URL: `http://127.0.0.1:8000/api/v1` (configurable via `APP_URL`).

Auth: Sanctum personal access tokens (bearer). All endpoints below require
`Authorization: Bearer <token>` unless otherwise noted.

Response envelopes follow Laravel API resource conventions:
- Single resources: `{ "data": { ... } }`.
- Collections: `{ "data": [ ... ], "meta": { ... }, "links": { ... } }` when paginated;
  otherwise `{ "data": [ ... ] }`.
- Validation errors (HTTP 422): `{ "message": "...", "errors": { "field": ["..."] } }`.
- Auth errors (HTTP 401): `{ "message": "Unauthenticated." }`.
- Authorization errors (HTTP 403): `{ "message": "..." }`.
- Not found (HTTP 404): `{ "message": "..." }`.

CORS: see `config/cors.php` — origins driven by `FRONTEND_URL` and
`http://127.0.0.1:5173`. `supports_credentials = true` (cookie auth allowed),
but the React SPA currently uses bearer tokens and `withCredentials: false`.

Signature gate: routes marked **[sig]** call `RequireSignature` middleware —
the acting user must have an active signature on file (`/me/signature`).

Role/permission gate notation:
- `role:admin` → Spatie role check.
- `perm:invoice.create` → Spatie permission check.
- `role_or_perm:admin|catalog.manage|invoice_type.manage` → matches any.

---

## 0. Public

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check. Returns `{ status, time }`. |
| POST | `/auth/login` | Login. `throttle:6,1`. Body: `{ email, password }`. Returns `{ token, user }`. |

## 1. Authenticated session

| Method | Path | Description |
|---|---|---|
| GET | `/auth/me` | Current user payload (roles + permissions). |
| POST | `/auth/logout` | Revoke current access token. |
| POST | `/auth/change-password` | Body `{ current_password, password, password_confirmation }`. |

## 2. Signature

| Method | Path | Description |
|---|---|---|
| GET | `/me/signature` | Read current user's signature metadata. |
| PUT \| POST | `/me/signature` | Create/replace signature. Body `{ text }` or upload. |
| DELETE | `/me/signature` | Remove signature. |

## 3. Customers

| Method | Path | Description |
|---|---|---|
| GET | `/customers` | List with `search`, pagination. |
| POST | `/customers` | Create. |
| GET | `/customers/{customer}` | Show. |
| PUT | `/customers/{customer}` | Update. |

## 4. Catalog reads (open to any authenticated user)

| Method | Path | Description |
|---|---|---|
| GET | `/invoice-types` | List active invoice types. Filters: `search`, `status`. |
| GET | `/invoice-types/{invoiceType}` | Show with legal docs + service types. |
| GET | `/legal-documents` | List. |
| GET | `/legal-documents/{legalDocument}` | Show. |
| GET | `/service-types` | List. |
| GET | `/service-types/{serviceType}` | Show. |

## 5. Catalog writes — `role_or_perm:admin|catalog.manage|invoice_type.manage`

| Method | Path | Description |
|---|---|---|
| POST | `/invoice-types` | Create. |
| PUT | `/invoice-types/{invoiceType}` | Update. |
| DELETE | `/invoice-types/{invoiceType}` | Soft delete. Blocked (409) if referenced. |
| POST | `/invoice-types/{invoiceType}/toggle-status` | Toggle active/inactive. |
| POST | `/legal-documents` | Create. |
| PUT | `/legal-documents/{legalDocument}` | Update. |
| DELETE | `/legal-documents/{legalDocument}` | Delete. |
| POST | `/service-types` | Create. |
| PUT | `/service-types/{serviceType}` | Update. |
| DELETE | `/service-types/{serviceType}` | Delete. |

## 6. Dashboard & Reports

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Role-scoped aggregates. |
| GET | `/reports/legal-compliance` | `perm:report.view.company`. Aggregated legal compliance. |
| POST | `/reports/legal-compliance/approve` | **[sig]** `perm:report.view.company`. |

## 7. Contracts

| Method | Path | Description |
|---|---|---|
| GET | `/contracts` | List. Filters: `search`, `status`, `customer_id`. |
| POST | `/contracts` | Create. |
| GET | `/contracts/{contract}` | Show with aggregated installments. |
| PUT\|PATCH | `/contracts/{contract}` | Update. |
| DELETE | `/contracts/{contract}` | Delete (soft). |
| GET | `/contracts/{contract}/installments` | List installments. |
| POST | `/contracts/{contract}/installments` | Create. |
| PUT\|PATCH | `/contracts/{contract}/installments/{installment}` | Update. |
| DELETE | `/contracts/{contract}/installments/{installment}` | Blocked (409) if linked to invoice request. |
| GET | `/contracts/{contract}/documents` | List uploaded contract documents. |
| POST | `/contracts/{contract}/documents` | Upload (multipart `file`, `kind`). |
| GET | `/contracts/{contract}/documents/{document}/download` | Authenticated download. |
| DELETE | `/contracts/{contract}/documents/{document}` | Delete. |
| POST | `/contracts/{contract}/installments/{installment}/create-invoice-request` | `perm:invoice.create`. |

## 8. Invoice Requests (CRUD)

| Method | Path | Permission |
|---|---|---|
| GET | `/invoice-requests` | — (scoped by role). |
| GET | `/invoice-requests/{invoiceRequest}` | — |
| POST | `/invoice-requests` | `perm:invoice.create` |
| PUT\|PATCH | `/invoice-requests/{invoiceRequest}` | `perm:invoice.update` |
| DELETE | `/invoice-requests/{invoiceRequest}` | — |

### Workflow actions

| Method | Path | Gate |
|---|---|---|
| POST | `/invoice-requests/{invoiceRequest}/submit` | — |
| POST | `/invoice-requests/{invoiceRequest}/approve` | **[sig]** `perm:invoice.approve.accountant\|invoice.approve.director` |
| POST | `/invoice-requests/{invoiceRequest}/reject` | **[sig]** same |
| POST | `/invoice-requests/{invoiceRequest}/return` | **[sig]** `perm:invoice.return` |
| POST | `/invoice-requests/{invoiceRequest}/resubmit` | — |

### Sub-resources

| Method | Path | Description |
|---|---|---|
| GET | `/invoice-requests/{invoiceRequest}/timeline` | Activity log. |
| GET | `/invoice-requests/{invoiceRequest}/legal-documents` | List uploaded legal docs. |
| POST | `/invoice-requests/{invoiceRequest}/legal-documents` | Upload (multipart `file`, `document_type`). |
| GET | `/invoice-requests/{invoiceRequest}/legal-documents/{document}/download` | Authenticated download. |
| DELETE | `/invoice-requests/{invoiceRequest}/legal-documents/{document}` | Delete. |

## 9. Commitments

| Method | Path | Gate |
|---|---|---|
| GET | `/invoice-requests/{invoiceRequest}/commitments` | — |
| POST | `/invoice-requests/{invoiceRequest}/commitments` | **[sig]** `perm:commitment.create` |
| GET | `/commitments/{commitment}` | — |
| POST | `/commitments/{commitment}/extend` | **[sig]** `perm:commitment.extend` |
| POST | `/commitments/{commitment}/decide` | **[sig]** `perm:commitment.approve` |
| POST | `/commitments/{commitment}/remind` | `perm:commitment.remind` |

`config('commitments.max_extensions')` caps extension attempts (default 2).

## 10. Approvals queue

| Method | Path | Description |
|---|---|---|
| GET | `/approvals/pending` | Pending items for the current user (role-scoped). |

## 11. Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | List (with pagination). |
| POST | `/notifications/{id}/read` | Mark single. |
| POST | `/notifications/read-all` | Mark all read. |

---

## Auth flow (bearer)

1. `POST /auth/login` → `{ token, user }`. Persist token in client storage.
2. Send `Authorization: Bearer <token>` on every subsequent request.
3. On HTTP 401: discard the token, redirect to login.
4. `POST /auth/logout` revokes the token server-side.

The frontend additionally listens for the in-process `auth:unauthorized`
DOM event dispatched by `lib/api/client.ts` on 401 responses.

## File storage

Uploads (legal documents, contract documents, signature snapshots) are stored
on the **private** `local` disk under `storage/app/private/`. They are NEVER
exposed through `public/storage` symlinks. Frontend must use the
authenticated download endpoints listed above; never construct direct paths.

## Validation conventions

- Money fields are positive numerics (`before_vat`, `after_vat`, `tax_rate`).
- File uploads (`multipart/form-data`):
  - `legal_documents`: `pdf,jpg,jpeg,png,doc,docx,xls,xlsx`, ≤ 10 MB.
- Date fields use ISO-8601 strings.
- Enums (see `app/Enums/`):
  - `InvoiceStatus`, `SInvoiceStatus`, `VfsStatus`, `ApprovalAction`,
    `ApprovalStep`, `InvoiceRequestStatus`.

## Route snapshot

Authoritative current routes: `docs/routes.snapshot.json` (regenerate with
`php artisan route:list --path=api/v1 --json > docs/routes.snapshot.json`).
