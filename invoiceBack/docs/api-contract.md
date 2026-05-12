# API Contract — P0+ Backend

All endpoints are under `/api/v1` and require Sanctum auth except `POST /auth/login` and `GET /health`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Login and issue token |
| GET | `/auth/me` | Current user, roles, permissions |
| POST | `/auth/logout` | Revoke current token |
| POST | `/auth/change-password` | Change own password |
| GET/POST | `/invoice-requests` | List/create invoice requests |
| GET/PUT/PATCH/DELETE | `/invoice-requests/{id}` | Read/update/delete invoice request |
| POST | `/invoice-requests/{id}/submit` | Submit draft/returned; normal → `pending`, special → `pending-vpgd` |
| POST | `/invoice-requests/{id}/approve` | Accountant/director approval; requires signature |
| POST | `/invoice-requests/{id}/reject` | Terminal reject; requires signature |
| POST | `/invoice-requests/{id}/return` | Return for supplement; requires signature + reason |
| POST | `/invoice-requests/{id}/resubmit` | Resubmit returned request |
| GET | `/invoice-requests/{id}/timeline` | Activity timeline |
| GET/POST/DELETE | `/invoice-requests/{id}/legal-documents` | List/upload/delete legal docs |
| GET | `/approvals/pending` | Role-scoped pending queue |
| GET/PUT/POST/DELETE | `/me/signature` | Manage own signature |
| GET/POST/PUT | `/customers` | Customer list/create/update with buyer fields |
| GET | `/contracts` | List contracts |
| GET | `/contracts/{id}` | Contract detail with installments |
| GET | `/contracts/{id}/installments` | Contract installment list |
| POST | `/contracts/{id}/installments/{iid}/create-invoice-request` | Create draft from installment |
| GET | `/dashboard` | Role-scoped cached aggregates |
| GET/POST | `/notifications` | List/read notifications |

Status values are stored as snake_case in DB (`pending_vpgd`) and returned as kebab-case in API (`pending-vpgd`).
