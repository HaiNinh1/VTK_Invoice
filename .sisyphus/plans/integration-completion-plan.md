# VTK_Invoice — Full Integration & Completion Plan

**Created:** 2026-05-12
**Scope:** Make `invoiceBack` (Laravel 13.8) + `invoiceFront` (React 18 / Vite 6) **100% wired, runnable, and shippable**.
**Author:** Sisyphus (with Oracle validation).

---

## 0. Current State Snapshot

### Backend — `invoiceBack` (substantially complete)

| Aspect | Status |
|---|---|
| Framework | Laravel **13.8.0** (PHP 8.4.15) |
| Auth | Sanctum **bearer-token** login (cookie SPA also possible — both wired in CORS/sanctum config but unused) |
| Permissions | spatie/laravel-permission v7 — `role`, `permission`, `role_or_permission`, `require.signature` middleware aliases registered |
| Routes | **71 API routes** under `/api/v1` prefix |
| Migrations | **27** migrations, all `Ran` (MySQL @ port 3307, db `vtkinvoice`) |
| Tests | **190 / 191** passing — 1 failure: `Phase4\InvoiceTypeCrudTest::test_non_admin_without_catalog_manage_cannot_access_invoice_type_admin_routes` (expects 403, gets 200) |
| Controllers | Auth, Approval, Commitment, Contract, Customer, Dashboard, InvoiceRequest, InvoiceRequestAction, InvoiceRequestLegalDocument, InvoiceType, LegalDocument, Notification, ServiceType, Signature, Timeline, Reports/LegalCompliance |
| Models | 18 (Approval, Commitment, Contract, ContractDocument, Customer, Department, InvoiceRequest, InvoiceRequestDocument, InvoiceRequestLegalDocument, InvoiceType, LegalDocument, PaymentInstallment, RevenueCenter, ServiceType, SignatureSnapshot, User, UserSignature, AuditApproval) |
| Seeders | Roles, departments, users, catalog, contracts, signatures, invoice requests |
| Missing domain code | S-Invoice integration, VFS accounting, PDF/Excel export, User/Role admin APIs, Settings/email-template APIs |
| Missing packages | `barryvdh/laravel-dompdf`, `maatwebsite/excel`, no OpenAPI generator |
| Env divergence | `.env` = MySQL, `.env.example` = SQLite; `COMMITMENT_MAX_EXTENSIONS` missing from example |
| storage:link | **NOT linked** |
| API docs | `docs/api-contract.md` exists but stale vs 71-route surface |

### Frontend — `invoiceFront`

| Aspect | Status |
|---|---|
| Framework | React 18.3.1, Vite 6.3.5, TypeScript (`strict:false`), Tailwind v4 |
| Routing | **No router used** — `react-router@7` installed but unwired; nav driven by `activeNav` state in `App.tsx` |
| API client | `lib/api/client.ts` — axios, bearer-only (`withCredentials:false`), 401 → token clear + `auth:unauthorized` event |
| Server state | TanStack Query v5 with sensible defaults + invalidation |
| Endpoint wrappers | `auth`, `dashboard`, `invoiceRequests`, `masters` (customers/catalog/contracts), `notifications`, `signature` |
| Missing wrappers | `commitments`, `reports`, legal-doc/service-type admin writes, `/health` |
| Auth | `AuthProvider` reads token from `localStorage`, calls `/auth/me`, exposes `primaryRole`, `hasRole`, `hasPermission` |
| Wired screens | LoginPage, mobile CreateInvoiceForm, ApprovalRoleBased, signature flow, NotificationCenter (partial) |
| Static/mock screens | Desktop CreateInvoiceRoleBased, ContractManagement, InvoiceTypeManagement, LegalTracking, DashboardCompany/Manager (partial), Reports, InvoiceExport, Monitoring (S-Invoice), AccountingVFS, Settings |
| Forms | react-hook-form installed but mostly unused; **no zod**, no resolvers; validation via HTML + backend echoes |
| UI kit | shadcn-style under `components/ui/` (no `components.json`) + Radix primitives. **MUI v7 also installed** (bloat risk) |
| Theme | `theme.css` defines tokens; dark-mode toggle does NOT apply `.dark` class; no `ThemeProvider` |
| Demo role switcher | Present in `App.tsx` — can locally override backend role (must remove or DEV-gate) |
| Bundle | `dist/` exists; JS = 1.29 MB unminified — review chunking once MUI removed |

### Critical gaps

1. ~30% of UI screens still consume static/mock data despite wrappers existing.
2. Three UI domains (S-Invoice, VFS, Exports, Settings/Admin) have **no backend at all**.
3. No URL routing → no deep links, no browser back/refresh on detail views, no email/notification linking.
4. No client-side schema validation layer.
5. Demo role switcher leaks demo behavior into real auth UX.
6. Test suite not green.

---

## 1. Decisions Required From User (BLOCKING)

These shape Phase D's size dramatically. Plan continues regardless, but answers determine effort.

| # | Decision | Options | Default if unanswered |
|---|---|---|---|
| **Q1** | **S-Invoice (Vietnamese e-invoice) integration scope** | (a) Full integration with a real S-Invoice provider (VNPT/Misa/Viettel) — **8-15 days** / (b) Local status-tracking table only (record S-Invoice number, send-status, response) — **2 days** / (c) UI-only placeholder, no backend — **0 days** | **(b)** local tracking |
| **Q2** | **VFS Accounting export scope** | (a) Real integration / file generation to accounting system — **4-8 days** / (b) Local export tracking + downloadable CSV — **2 days** / (c) UI-only — **0 days** | **(b)** local export |
| **Q3** | **PDF / Excel export** | (a) Both formats, full invoice + reports — **3-4 days** / (b) PDF only for invoices — **1.5 days** / (c) Defer | **(a)** both |
| **Q4** | **User/Role admin in Settings** | (a) Full admin CRUD + role assignment — **3 days** / (b) Read-only listing — **1 day** / (c) Defer | **(a)** full |
| **Q5** | **Email templates & notification preferences in Settings** | (a) Full DB-backed templates with editor UI — **2-3 days** / (b) Static seed templates, only preferences DB-backed — **1 day** / (c) Defer | **(b)** |
| **Q6** | **Auth mode for production** | (a) Bearer token (current) — keep / (b) Cookie SPA Sanctum — switch (+1 day, HttpOnly cookies, requires `withCredentials:true` + CSRF flow) | **(a)** bearer — already wired end-to-end |
| **Q7** | **Catalog-read authorization (resolves failing test)** | (a) Reads open to any authenticated user → fix test / (b) Admin/manager-only reads → fix routes (breaks frontend dropdowns unless dropdown endpoints are added) | **(a)** open reads — UI dropdowns depend on this |
| **Q8** | **Routing** | (a) Migrate to react-router v7 with deep-linkable URLs (Oracle strongly recommends — **2 days**) / (b) Keep `activeNav` only | **(a)** migrate — deep links are non-negotiable for an invoice/notification system |
| **Q9** | **i18n** | (a) Add `react-i18next` and extract VN strings — **2-3 days** / (b) Keep VN-only hardcoded | **(b)** VN-only for now |
| **Q10** | **Remove MUI** | (a) Yes (saves ~300 KB gzipped) / (b) Keep | **(a)** remove |

---

## 2. Phase Plan

Total effort with defaults: **~22-28 working days** (one engineer).

```
A. Backend stabilization        (1-2 d)  ──┐
B. Frontend foundation          (3-4 d)  ──┤  Phase A & B can overlap day 2-3
   B0 Routing migration
   B1 Theme/admin/MUI cleanup
   B2 Validation layer (zod)
   B3 Missing API wrappers
   B4 Shared query-key + permission contract
C. Wire static screens          (5-7 d)  ── parallelizable AFTER B done
D. Backend extensions           (5-10 d) ── starts mid-C; sized by Q1-Q5
E. Polish, smoke, deploy        (3-4 d)
F. (Optional) i18n              (2-3 d)
```

---

### Phase A — Backend stabilization (1-2 days)

**Goal:** Green test suite, accurate env, accurate docs, production-shaped config.

**A1. Resolve failing catalog-read test (Q7).**
- **Default (Q7=a):** Update `tests/Feature/Phase4/InvoiceTypeCrudTest.php::test_non_admin_without_catalog_manage_cannot_access_invoice_type_admin_routes` — split the assertion: only `POST/PUT/DELETE/toggle-status` should 403; `GET /api/v1/invoice-types` and `GET /api/v1/invoice-types/{id}` should 200 for any authenticated user.
- Add a new test that explicitly asserts authenticated users can read the catalog.
- Verify: `php artisan test --filter=InvoiceTypeCrudTest`.

**A2. Align `.env.example` with operational reality.**
- Switch default to MySQL (matching `.env`) but leave SQLite as documented alternative in commented section.
- Add `FRONTEND_URL=http://localhost:5173`.
- Add `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173`.
- Add `APP_URL=http://127.0.0.1:8000` (replace generic `http://localhost`).
- Add `COMMITMENT_MAX_EXTENSIONS=2`.
- Add `SESSION_DOMAIN=`, `SESSION_SAME_SITE=lax`, `SESSION_SECURE_COOKIE=false` placeholders.

**A3. Run storage setup.**
- `php artisan storage:link` for public assets (logos, public docs).
- **Do NOT expose** legal documents / signatures / invoice PDFs via `storage:link` — keep them under `storage/app/private` and serve via authenticated controller actions (`Signature::download`, etc.). Audit `LegalDocumentController` and `InvoiceRequestLegalDocumentController` to confirm they stream files through `Response::download($path)` rather than redirect to public URLs. **Fix any direct public exposure.**

**A4. Regenerate API contract documentation.**
- Run `php artisan route:list --path=api/v1 --json > docs/routes.snapshot.json`.
- Replace `docs/api-contract.md` with a generated section per route. Include for each: HTTP method, path, middleware (auth/role/permission), `FormRequest` validation rules, success response shape (use `JsonResource::toArray` source), error envelopes (the JSON exception handler in `bootstrap/app.php` defines validation/auth/authorization/500 formats — document them once at the top).
- Add request/response examples for the 10 most-used endpoints (login, list invoices, create invoice, approve, dashboard, customers list, contracts list, invoice types list, notifications list, /me/signature).

**A5. Add health-check assertion to test suite.**
- Add `tests/Feature/HealthTest.php` asserting `GET /api/v1/health` returns 200 + `{"status":"ok"}` shape.

**A6. Verify CORS + Sanctum config matches Q6 decision.**
- If Q6=a (bearer): document that `withCredentials` is false on client, `supports_credentials=true` is harmless but unused; do NOT call `/sanctum/csrf-cookie`.
- If Q6=b (cookie): document the SPA cookie flow, set `SESSION_DOMAIN`, ensure same registrable domain in production.

**Exit criteria:** `php artisan test` = 0 failures. `.env.example` covers every key. `docs/api-contract.md` reflects all 71 routes. No public exposure of private files.

---

### Phase B — Frontend foundation (3-4 days)

**Goal:** Establish shared primitives BEFORE parallelizing screen work. Oracle's hard requirement.

**B0. Minimal React Router migration (Q8=a — 1.5 days).**
- Install nothing new (react-router 7 already installed).
- Create `src/app/router.tsx` with `createBrowserRouter`.
- Route shape (keep flat — match existing nav keys):
  ```
  /                       → redirect to /dashboard
  /login                  → LoginPage
  /dashboard              → DashboardSwitcher (picks Employee/Manager/Company by role)
  /invoices               → InvoiceListRoleBased
  /invoices/new           → CreateInvoiceForm
  /invoices/:id           → InvoiceDetail (new; extract from list)
  /invoices/:id/edit      → CreateInvoiceForm (edit mode)
  /invoices/export        → InvoiceExport
  /contracts              → ContractManagement
  /contracts/:id          → ContractDetail
  /invoice-types          → InvoiceTypeManagement
  /approval               → ApprovalRoleBased
  /approval/:id           → ApprovalDetail
  /legal                  → LegalTracking
  /legal/:id              → LegalRequestDetail
  /accounting             → AccountingVFS
  /monitoring/sinvoice    → Monitoring (sinvoice tab)
  /reports                → Reports
  /settings               → Settings
  /settings/users         → Settings (users tab) — gated by admin
  /notifications          → NotificationCenter
  /profile                → UserProfile
  /onboarding/signature   → FirstTimeSignatureSetup
  ```
- `AppShell` becomes the route guard: unauthenticated → `<Navigate to="/login" replace />`; authenticated without signature → `<Navigate to="/onboarding/signature" />`.
- Create `<ProtectedRoute requiredPermission="..." requiredRole="..." />` HOC component.
- Keep `App.tsx` layout (sidebar, header, mobile bottom-nav) but derive `activeNav` from `useLocation().pathname` — preserves existing UX while gaining URLs.
- Sidebar `<NavLink>` items use `to="/contracts"` etc.

**B1. Remove demo role switcher.**
- In `App.tsx`, delete the role-switcher UI block.
- Replace `const [userRole, setUserRole] = useState(auth.primaryRole)` with `const userRole = auth.primaryRole`.
- If devs still want it, gate behind `import.meta.env.DEV` and label "DEV ONLY".

**B2. Theme provider + dark mode fix.**
- Add `src/app/ThemeProvider.tsx`. Use `next-themes` (already installed) with `attribute="class"`, default `system`, storage key `vtk-theme`.
- Wire in `main.tsx` between `QueryProvider` and `AuthProvider`.
- Update dark-mode toggle in header to use `useTheme()` from `next-themes`.
- Verify `.dark { ... }` selectors in `theme.css` actually apply.

**B3. Remove MUI (Q10=a).**
- `grep -r "from '@mui" src/` → expect zero or near-zero results.
- Replace any incidental MUI imports with shadcn equivalents.
- `pnpm remove @mui/material @mui/icons-material @emotion/react @emotion/styled`.
- Run `pnpm build` to confirm no broken imports and observe bundle size delta.

**B4. Validation layer with zod + react-hook-form.**
- `pnpm add zod @hookform/resolvers`.
- Create `src/lib/validation/` with one schema file per domain: `auth.ts`, `invoiceRequest.ts`, `contract.ts`, `customer.ts`, `invoiceType.ts`, `commitment.ts`.
- Each schema mirrors the matching Laravel `FormRequest` rules (parse from `docs/api-contract.md` produced in A4).
- Refactor `LoginPage` and `CreateInvoiceForm` to use `useForm({ resolver: zodResolver(schema) })` as exemplars. Other screens follow in Phase C.

**B5. Missing API endpoint wrappers.**
- Add `src/lib/api/endpoints/commitments.ts`:
  - `getCommitments(invoiceRequestId)` → `GET /invoice-requests/{id}/commitments`
  - `createCommitment(invoiceRequestId, payload)` → `POST /invoice-requests/{id}/commitments`
  - `getCommitment(id)` → `GET /commitments/{id}`
  - `extendCommitment(id, payload)` → `POST /commitments/{id}/extend`
  - `decideCommitment(id, payload)` → `POST /commitments/{id}/decide`
  - `remindCommitment(id)` → `POST /commitments/{id}/remind`
- Add `src/lib/api/endpoints/reports.ts`:
  - `getLegalComplianceReport(filters)` → `GET /reports/legal-compliance`
  - `approveLegalComplianceReport(payload)` → `POST /reports/legal-compliance/approve`
- Extend `masters.ts` admin write endpoints:
  - Legal documents: `createLegalDocument`, `updateLegalDocument`, `deleteLegalDocument`
  - Service types: `createServiceType`, `updateServiceType`, `deleteServiceType`, `getServiceType`
  - Contracts: `patchContract`, `patchInstallment` (PATCH variants)
- Add hooks in `lib/api/queries.ts` for every new endpoint, mirroring existing patterns.
- Add `getHealth()` for boot-time backend liveness check (display banner on failure).

**B6. Shared query-key factory + permission contract (Oracle blocker for Phase C).**
- Create `src/lib/api/queryKeys.ts`:
  ```ts
  export const qk = {
    auth: { me: ['auth','me'] as const },
    dashboard: () => ['dashboard'] as const,
    invoices: {
      all: ['invoice-requests'] as const,
      list: (f) => ['invoice-requests','list',f] as const,
      detail: (id) => ['invoice-requests','detail',id] as const,
      timeline: (id) => ['invoice-requests','timeline',id] as const,
      legalDocs: (id) => ['invoice-requests','legal-docs',id] as const,
    },
    contracts: { all: ['contracts'] as const, detail: (id)=>['contracts',id] as const, installments:(id)=>['contracts',id,'installments'] as const, documents:(id)=>['contracts',id,'documents'] as const },
    customers: { all:['customers'] as const, detail:(id)=>['customers',id] as const },
    catalog: { invoiceTypes:['invoice-types'] as const, serviceTypes:['service-types'] as const, legalDocs:['legal-documents'] as const },
    approvals: { pending:['approvals','pending'] as const },
    commitments: { byInvoice:(id)=>['commitments','by-invoice',id] as const, detail:(id)=>['commitments',id] as const },
    notifications: { all:['notifications'] as const },
    signature: { me:['signature','me'] as const },
    reports: { legalCompliance:(f)=>['reports','legal-compliance',f] as const },
  };
  ```
- Refactor existing `queries.ts` to use `qk.*` and centralize invalidation maps (e.g., `onApprove` → invalidate invoices.all + approvals.pending + dashboard + notifications).
- Create `src/lib/auth/permissions.ts` listing every permission string the UI checks. Map UI features → permissions/roles. Provide `<Can permission="..." role="..."/>` component for conditional rendering.
- Clear all React Query cache on logout: `queryClient.clear()` inside `AuthProvider.logout()`.

**Exit criteria:** Routing works for every screen with browser back/refresh. Login, mobile create-invoice, and at least one admin form use zod. No MUI imports. Dark mode toggles real `.dark` class. All backend domains have a frontend hook. `pnpm build` succeeds.

---

### Phase C — Wire static screens to existing backend (5-7 days, parallelizable post-B)

Each ticket: replace static data → call existing hooks → handle loading/error/empty → wire mutations with optimistic UI where safe → add zod schemas to forms.

**C1. ContractManagement (1 day)**
- File: `src/app/components/ContractManagement.tsx`.
- Remove import of static `CONTRACTS` from `app/data/contractData.ts`.
- Use `useContracts()`, `useContract(id)`, `useCreateContract`, `useUpdateContract`, `useDeleteContract`.
- Add installments sub-view: `useInstallments(contractId)`, `useCreateInstallment`, `useUpdateInstallment`, `useDeleteInstallment`, `useCreateInvoiceFromInstallment`.
- Add contract documents sub-view: `useContractDocuments(contractId)`, `useUploadContractDocument`, `useDeleteContractDocument`.
- Add zod schema `contractSchema`, `installmentSchema`.
- Gate write actions with `<Can permission="contract.manage" />`.

**C2. InvoiceTypeManagement (0.5 day)**
- File: `src/app/components/InvoiceTypeManagement.tsx`.
- Remove static `INVOICE_TYPES` and `ALL_LEGAL_DOCUMENTS` imports.
- Use `useInvoiceTypes`, `useCreateInvoiceType`, `useUpdateInvoiceType`, `useDeleteInvoiceType`, `useToggleInvoiceTypeStatus`.
- Legal-doc admin section (if Q4≥b): `useLegalDocuments`, plus admin writes from B5.
- Gate with `<Can permission="catalog.manage" />`.

**C3. Unify CreateInvoice (0.5 day)**
- Goal: kill desktop `CreateInvoiceRoleBased` create flow; reuse `CreateInvoiceForm` for both desktop and mobile.
- Approach: keep `CreateInvoiceRoleBased` as the *view/edit* role-based detail screen if its role-conditional logic adds value; otherwise extract that logic into `<InvoiceDetail>` and delete `CreateInvoiceRoleBased`.
- Route `/invoices/new` → `<CreateInvoiceForm mode="create" />`.
- Route `/invoices/:id/edit` → `<CreateInvoiceForm mode="edit" invoiceId={id} />`.
- Add zod `createInvoiceSchema` + `updateInvoiceSchema`.

**C4. InvoiceDetail (0.5 day, new file)**
- New: `src/app/components/InvoiceDetail.tsx` for route `/invoices/:id`.
- Use `useInvoiceRequest(id)`, `useTimeline(id)`, `useInvoiceLegalDocuments(id)`, plus commitments via `useCommitmentsByInvoice(id)`.
- Action buttons: Submit / Approve / Reject / Return / Resubmit (visibility by role + permission + status).
- Replace any current "open detail in modal" patterns to navigate to this route.

**C5. LegalTracking (1 day)**
- File: `src/app/components/LegalTracking.tsx`.
- Remove dependency on `masterInvoiceData`.
- Use `useInvoiceRequests({ filter: 'legal_incomplete' })` (verify backend filter exists or add query-param filter via `spatie/laravel-query-builder`).
- For each request: `useInvoiceLegalDocuments(id)`, upload/delete actions, commitments panel using `useCommitmentsByInvoice(id)` + `useCreateCommitment` + `useExtendCommitment` + `useDecideCommitment`.
- Commitment max-extensions UI hint sourced from a `/health` or new `/config` endpoint, or hardcoded to match `COMMITMENT_MAX_EXTENSIONS`.

**C6. Dashboards (1 day)**
- Files: `DashboardEmployee`, `DashboardManager`, `DashboardCompany`.
- Use `useDashboard(role)`.
- Replace static chart arrays with backend-returned series.
- If backend's `DashboardController::index` doesn't already vary by role, extend it (small backend change — log as A7 if needed).

**C7. NotificationCenter (0.5 day)**
- File: `src/app/components/NotificationCenter.tsx`.
- Verify `useNotifications`, `useMarkRead`, `useMarkAllRead` fully wired (likely already).
- Add navigation: clicking an invoice notification routes to `/invoices/{id}` (now possible after B0).
- Add unread badge in header sourced from `useNotifications().data?.unread_count`.

**C8. Reports (0.5 day)**
- File: `src/app/components/Reports.tsx`.
- Use `useLegalComplianceReport(filters)` and `useApproveLegalComplianceReport`.
- Filters: date range, department, status. Use backend query-params.
- Export buttons stubbed; real export wiring happens in Phase D (D3).

**C9. UserProfile + Settings core sections (0.5 day)**
- `UserProfile`: use `useMe()`, `useChangePassword`, `useSignature`, `useUpdateSignature`.
- `Settings` non-admin sections: only wire those that have backends today (profile, signature, change password). Admin/users/roles/email-templates go in Phase D.

**Exit criteria:** No file under `src/app/components` imports from `src/app/data/contractData.ts` or `src/app/data/invoiceTypes.ts` for production rendering. `masterInvoiceData` provider becomes a thin pass-through over query hooks (or is deleted). All wired forms use zod. Every list shows loading/empty/error states.

---

### Phase D — Backend extensions for missing domains (5-10 days, sized by Q1-Q5)

Start D0 immediately after A4 (route docs done) so user can answer Q1-Q5 with full context.

**D0. Scope discovery & decisions (0.5 day)**
- Present this plan to user, collect answers for Q1-Q5.
- Document chosen scope in `.sisyphus/plans/integration-completion-plan.md` (append).
- Branch the rest of Phase D accordingly.

**D1. S-Invoice (Q1)**

*If Q1=b — local tracking (default, 2 days):*
- Migration: `2026_05_15_000001_add_sinvoice_fields_to_invoice_requests.php`
  - `sinvoice_number` nullable string, `sinvoice_status` enum (pending, issued, replaced, cancelled, failed), `sinvoice_issued_at` nullable timestamp, `sinvoice_response_payload` nullable json, `sinvoice_error_message` nullable text.
- Update `InvoiceRequest` model fillable + casts.
- New `SInvoiceController` with: `POST /invoice-requests/{id}/sinvoice/send` (records intent, status=pending), `POST /invoice-requests/{id}/sinvoice/mark-issued` (sets number + issued_at), `POST /invoice-requests/{id}/sinvoice/cancel`.
- Update `InvoiceRequestResource` to expose s-invoice fields.
- Frontend `Monitoring.tsx` switches from mock to `useInvoiceRequests({ filter: 'has_sinvoice' })` and per-row actions.

*If Q1=a — real integration: add as separate sub-plan, sized after provider selection.*

**D2. VFS Accounting (Q2)**

*If Q2=b — local export tracking (default, 2 days):*
- Migration: `add_vfs_fields_to_invoice_requests` — `vfs_status` enum, `vfs_exported_at`, `vfs_batch_id`.
- Controller: `VfsExportController@batch` accepts a list of invoice IDs, marks them exported, returns a CSV stream of accounting lines.
- Route: `POST /api/v1/vfs/export-batch`.
- Frontend `AccountingVFS.tsx` wired to list filtered invoices + bulk-select + trigger batch export.

**D3. PDF & Excel export (Q3, default 3-4 days)**
- `composer require barryvdh/laravel-dompdf maatwebsite/excel`.
- Blade templates: `resources/views/pdf/invoice-request.blade.php`, `resources/views/pdf/legal-compliance-report.blade.php`.
- Excel exports: `App\Exports\InvoiceRequestsExport`, `App\Exports\LegalComplianceExport`.
- New routes:
  - `GET /api/v1/invoice-requests/{id}/pdf`
  - `GET /api/v1/invoice-requests/export.xlsx?filters=...`
  - `GET /api/v1/reports/legal-compliance/export.{pdf,xlsx}?filters=...`
- Routes use the existing auth+permission middleware. Streamed responses; do not save to disk unless caching.
- Frontend: add `useDownloadInvoicePdf(id)` etc. using `axios({ responseType: 'blob' })` and trigger browser download.

**D4. User/Role admin (Q4, default 3 days)**
- New `UserController` (admin only):
  - `GET /api/v1/admin/users` — paginated, searchable
  - `POST /api/v1/admin/users` — create with role assignment
  - `GET /api/v1/admin/users/{id}`
  - `PUT /api/v1/admin/users/{id}`
  - `DELETE /api/v1/admin/users/{id}` (soft delete; preserve audit references)
  - `POST /api/v1/admin/users/{id}/assign-role`
  - `POST /api/v1/admin/users/{id}/reset-password`
- New `RoleController`:
  - `GET /api/v1/admin/roles` — list roles + permissions
  - `GET /api/v1/admin/permissions` — list known permissions
- Authorization: all gated by `role:admin`.
- Form requests + resource transformers + feature tests for all endpoints.
- Frontend wrappers + Settings admin tab.

**D5. Email templates / notification preferences (Q5, default 1 day for b)**
- Migration: `create_notification_preferences_table` (user_id, channel, event, enabled).
- Controller: `NotificationPreferenceController` with index/update.
- Endpoints: `GET /api/v1/me/notification-preferences`, `PUT /api/v1/me/notification-preferences`.
- Use preferences inside `InvoicePendingApprovalNotification::via()` and `CommitmentReminderNotification::via()`.

**Exit criteria:** Every UI feature has a real backend. `php artisan test` green including new D-suite tests. Frontend has no remaining mock-data imports.

---

### Phase E — Polish, smoke test, deploy (3-4 days)

**E1. End-to-end smoke (1.5 days)**
- Per role (admin, manager, accountant, director, employee), exercise the happy path:
  1. Login → /auth/me → land on role-specific dashboard
  2. Create invoice request → submit → approver receives notification
  3. Approver opens detail via notification → approve
  4. Verify dashboard counts update
  5. Trigger PDF export
  6. (admin) Create user, assign role
  7. Logout → token cleared, query cache cleared, redirected to /login
- Document playbook in `docs/smoke-test.md`.

**E2. Production env templates**
- `invoiceBack/.env.production.example` with placeholder DB, real APP_URL, prod FRONTEND_URL, prod SANCTUM_STATEFUL_DOMAINS, SESSION_DOMAIN, SESSION_SECURE_COOKIE=true, MAIL_MAILER=smtp.
- `invoiceFront/.env.production.example` with `VITE_API_URL=https://api.example.com/api/v1`.

**E3. Deployment docs**
- Create root `README.md` (currently only "# VTK_Invoice") with:
  - Architecture diagram (text)
  - Backend setup: clone → composer install → cp .env.example .env → key:generate → migrate --seed → storage:link → serve
  - Frontend setup: pnpm install → cp .env.example .env.local → pnpm dev (or build)
  - Default seeded users + passwords
  - Deployment: backend (php-fpm + nginx), frontend (static build to nginx/cdn)

**E4. CI scaffolding (optional but recommended)**
- `.github/workflows/backend.yml`: PHP 8.4, MySQL service, run `composer install`, copy env, migrate, `php artisan test`.
- `.github/workflows/frontend.yml`: pnpm install, `pnpm build`.

**E5. Final cleanup**
- Remove `dist/` from git (it should be `.gitignore`'d — verify).
- Strip dev console.logs.
- Run `pnpm build` → review bundle analyzer; target < 800 KB JS.
- Run `php artisan optimize:clear && php artisan config:cache && php artisan route:cache` smoke.

---

### Phase F (Optional) — Internationalization (2-3 days)

Only if Q9=a.
- `pnpm add react-i18next i18next`.
- Extract Vietnamese strings from components to `src/locales/vi/*.json`.
- Provide `en` skeleton.
- Language switcher in Settings.

---

## 3. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| S-Invoice integration scope creep (Q1=a) | Med | High | Lock scope in writing before D1 starts; treat as separate engagement |
| Permission contract misalignment between backend Spatie and frontend `<Can>` | High | Med | Define permission list in `permissions.ts` from `RolePermissionSeeder` source of truth; add E2E test per role |
| React Query cache pollution across user sessions | Med | Med | `queryClient.clear()` on logout (B6) — non-negotiable |
| Static-data adapters silently re-introduced during C | Med | Low | Lint rule: ban imports from `src/app/data/contractData` and `invoiceTypes` after Phase C complete; CI fail |
| Private file exposure via `storage:link` | Med | **High** (legal/financial PII) | A3 explicitly forbids public symlink for legal/signature/invoice files; audit during A3 |
| Route migration breaks existing demo nav UX | Low | Low | Derive `activeNav` from `useLocation` in B0; UI looks identical |
| MUI removal misses transitive usage | Low | Low | Pre-removal grep + post-removal build check |
| `.env.example` divergence regresses | Low | Med | Add CI step: assert every `env(...)` call has matching key in `.env.example` |
| Bearer token XSS exposure | Low | High | A4 documents XSS posture; consider migrating to HttpOnly cookie SPA (Q6=b) if security review demands |

---

## 4. Acceptance Criteria (Definition of Done)

The project is **100% complete** when ALL of the following hold:

1. ✅ `cd invoiceBack && php artisan test` — 0 failures, 0 errors.
2. ✅ `cd invoiceBack && php artisan migrate:status` — all migrations Ran on a fresh DB.
3. ✅ `cd invoiceBack && php artisan db:seed && php artisan serve` boots cleanly, `/api/v1/health` returns 200.
4. ✅ `cd invoiceFront && pnpm install && pnpm build` — 0 errors, no console errors.
5. ✅ `pnpm dev` + backend running: every nav target loads, fetches real data, shows loading/empty/error states.
6. ✅ Login → logout → login as different role → cache is clean, role-specific UI renders correctly.
7. ✅ For each role (admin, manager, accountant, director, employee), the smoke-test playbook in `docs/smoke-test.md` passes.
8. ✅ No imports from `src/app/data/contractData.ts` or `src/app/data/invoiceTypes.ts` in production component code.
9. ✅ `grep -r "@mui" invoiceFront/src` returns no matches.
10. ✅ Every endpoint listed in `docs/api-contract.md` has a frontend wrapper in `src/lib/api/endpoints/`.
11. ✅ Root `README.md` documents full setup; both `.env.example` files cover every required key.
12. ✅ Demo role switcher is either removed or gated behind `import.meta.env.DEV`.
13. ✅ Browser back/refresh works on every screen.
14. ✅ Dark mode actually toggles `.dark` and affects component theming.
15. ✅ User-decision answers Q1-Q5 are reflected in delivered code; UI screens for chosen scope are fully wired; UI screens for deferred scope are clearly labeled "Coming soon" or removed.

---

## 5. Suggested Execution Order

**Day 1-2:** Phase A complete + start B0 (routing).
**Day 3-4:** B0 finish, B1-B3 (cleanup, theme, MUI), present plan to user for Q1-Q5.
**Day 5-6:** B4-B6 (zod, wrappers, query keys, permissions).
**Day 7-12:** Phase C in parallel with start of D0/D1/D2 (small backend tickets) — split by domain.
**Day 13-18:** Remainder of Phase D (D3 exports, D4 admin, D5 prefs).
**Day 19-22:** Phase E (smoke, env, README, CI, cleanup).
**Day 23+:** Optional Phase F (i18n).

---

## 6. Open Questions for User

Please respond to Q1-Q10 in **Section 1** above. Without answers, defaults will be applied and Phase D will be sized accordingly. The most consequential are **Q1 (S-Invoice scope)** and **Q8 (routing)** — both can multiply effort.
