# VTK Invoice System - Deployment Architecture

## 🏗️ Kiến trúc hiện tại vs Tương lai

### Hiện tại (Figma Make - v1.0.0)
- Frontend only với mock data
- Chạy trên Vite dev server
- Không có persistence (reload = mất data)

### Tương lai (Production)
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │ ───> │   Backend API   │ ───> │   Database      │
│   (React)       │      │   (NestJS)      │      │   (PostgreSQL)  │
│   Port 3000     │      │   Port 8000     │      │   Port 5432     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                         │
         └────────────────────────┴─────────────────────────┘
                    External Services Integration
                    ├── S-Invoice API
                    ├── VFS Accounting
                    └── File Storage (S3/MinIO)
```

## 📁 Cấu trúc Monorepo đề xuất

```
vtk-invoice-system/
├── apps/
│   ├── frontend/              # Code từ Figma Make
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/
│   │   │   │   ├── data/      # Mock data (xóa sau khi có API)
│   │   │   │   └── services/  # API calls
│   │   │   └── styles/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/               # API mới
│       ├── src/
│       │   ├── modules/
│       │   │   ├── invoices/
│       │   │   ├── contracts/
│       │   │   ├── users/
│       │   │   └── auth/
│       │   ├── database/
│       │   │   └── migrations/
│       │   └── main.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/                   # Shared code
│   └── types/                 # TypeScript types chung
│       └── src/
│           ├── invoice.types.ts
│           ├── contract.types.ts
│           └── user.types.ts
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
│
├── docker-compose.yml         # Local development
├── pnpm-workspace.yaml
└── README.md
```

## 🌿 Git Branching Strategy

### Main Branches
- `main` - Production code (protected)
- `develop` - Integration branch
- `staging` - UAT environment

### Feature Branches
- `feature/fe-dashboard-api-integration` - Frontend features
- `feature/be-invoice-crud` - Backend features
- `hotfix/security-patch` - Urgent fixes

### Workflow
```bash
# Tạo feature từ develop
git checkout develop
git pull origin develop
git checkout -b feature/fe-invoice-list-api

# Làm việc...
git add .
git commit -m "feat(frontend): integrate invoice list API"

# Push và tạo PR
git push origin feature/fe-invoice-list-api

# PR: feature/fe-invoice-list-api → develop
# Sau khi approve → merge vào develop
# Định kỳ: develop → staging → main
```

## 🚀 Deployment Environments

### 1. Development (Local)
```bash
# Frontend: http://localhost:3000
cd apps/frontend && pnpm dev

# Backend: http://localhost:8000
cd apps/backend && pnpm start:dev

# Database: PostgreSQL on Docker
docker-compose up -d postgres
```

### 2. Staging (UAT)
- **Frontend**: https://staging-vtk-invoice.viettel.com
- **Backend**: https://staging-api-vtk-invoice.viettel.com
- **Branch**: `staging`
- **Purpose**: Testing trước khi lên Production

### 3. Production
- **Frontend**: https://vtk-invoice.viettel.com
- **Backend**: https://api-vtk-invoice.viettel.com
- **Branch**: `main`
- **Deploy**: Manual trigger sau approval

## 🔄 Migration từ Mock Data sang API

### Phase 1: Tạo Service Layer (Frontend)
```typescript
// apps/frontend/src/services/invoice.service.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const invoiceService = {
  async getAll() {
    // Development: Mock data
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
      return MASTER_INVOICE_DATA;
    }
    
    // Production: Real API
    const response = await fetch(`${API_BASE}/api/invoices`);
    return response.json();
  }
};
```

### Phase 2: Backend Implementation
```typescript
// apps/backend/src/modules/invoices/invoices.controller.ts
@Get()
async findAll(@Request() req) {
  const userRole = req.user.role;
  const userId = req.user.id;
  
  // RBAC filtering
  if (userRole === 'employee') {
    return this.invoicesService.findByCreator(userId);
  } else if (userRole === 'manager') {
    return this.invoicesService.findByRevenueCenter(req.user.revenueCenter);
  }
  
  return this.invoicesService.findAll();
}
```

### Phase 3: Cleanup Mock Data
- Xóa `src/app/data/masterInvoiceData.ts`
- Xóa `src/app/data/contractData.ts`
- Xóa `src/app/data/invoiceTypes.ts`

## 🐳 Docker Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: ./apps/backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/vtk_invoice
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=vtk_invoice
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 📊 Impact Analysis

### Frontend Optimization ảnh hưởng gì?
✅ **KHÔNG ảnh hưởng Figma Make** - Chỉ cải thiện performance
- Code splitting
- Lazy loading
- Bundle optimization
- Image optimization

### Backend Development ảnh hưởng gì?
⚠️ **CẦN tách branch** - Figma Make không chạy được BE code
- API endpoints
- Database queries
- Authentication logic
- Business logic

### Khuyến nghị
1. **Frontend optimization** → Commit trực tiếp vào `main`
2. **Backend development** → Tạo folder `apps/backend/` trong repo hiện tại
3. **Integration** → Tạo branch `develop` để test FE + BE cùng nhau

## 🎯 Next Steps

### Immediate (Tuần này)
1. Tạo branch `develop` từ `main`
2. Tạo folder structure cho backend
3. Setup Docker cho local development

### Short-term (Tháng này)
1. Implement Backend API cho Invoice CRUD
2. Migrate Frontend từ mock data sang API calls
3. Setup CI/CD pipeline

### Long-term (Quý này)
1. S-Invoice integration
2. VFS Accounting sync
3. Performance optimization
4. Security hardening
