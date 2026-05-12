# Git Workflow - VTK Invoice System

## 📋 Quick Commands

### 1. Push branch `develop` lên GitHub (Chạy lệnh này đầu tiên)

```bash
# Token có thể đã hết hạn, tạo token mới:
# https://github.com/settings/tokens/new
# Scopes: repo, workflow

# Push develop branch
git push https://YOUR_NEW_TOKEN@github.com/trongkhoa310/vtk-invoice-system.git develop
```

### 2. Bảo vệ branch `main` trên GitHub

1. Vào: https://github.com/trongkhoa310/vtk-invoice-system/settings/branches
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Bật:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 reviewer)
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
5. Save changes

### 3. Clone repository về máy local

```bash
git clone https://github.com/trongkhoa310/vtk-invoice-system.git
cd vtk-invoice-system
```

---

## 🌿 Branching Strategy

```
main (protected)
  ↑
  └── develop (integration)
        ↑
        ├── feature/fe-invoice-api-integration
        ├── feature/be-invoice-crud
        └── feature/fe-dashboard-optimization
```

### Branch Purposes

| Branch | Purpose | Deploy to | Protected |
|--------|---------|-----------|-----------|
| `main` | Production code | https://vtk-invoice.viettel.com | ✅ Yes |
| `develop` | Integration & testing | http://localhost:3000 | ❌ No |
| `feature/*` | Tính năng mới | Local only | ❌ No |
| `hotfix/*` | Sửa lỗi khẩn cấp | → main | ❌ No |

---

## 🔄 Development Workflow

### Scenario 1: Thêm tính năng Frontend

```bash
# 1. Checkout develop
git checkout develop
git pull origin develop

# 2. Tạo feature branch
git checkout -b feature/fe-add-search-filter

# 3. Làm việc...
# Edit files: src/app/components/InvoiceList.tsx

# 4. Commit
git add src/app/components/InvoiceList.tsx
git commit -m "feat(frontend): add advanced search filters"

# 5. Push
git push origin feature/fe-add-search-filter

# 6. Tạo Pull Request trên GitHub
# https://github.com/trongkhoa310/vtk-invoice-system/compare/develop...feature/fe-add-search-filter

# 7. Sau khi review → Merge vào develop
```

### Scenario 2: Thêm Backend API

```bash
# 1. Tạo branch từ develop
git checkout develop
git checkout -b feature/be-invoice-api

# 2. Tạo folder backend (lần đầu)
mkdir -p apps/backend/src/modules/invoices
mkdir -p apps/backend/prisma

# 3. Code backend...
# Create: apps/backend/src/modules/invoices/invoices.controller.ts

# 4. Commit
git add apps/backend/
git commit -m "feat(backend): add invoice CRUD API"

# 5. Push và tạo PR
git push origin feature/be-invoice-api
```

### Scenario 3: Tích hợp FE + BE

```bash
# 1. Trên develop, merge cả 2 features
git checkout develop
git pull origin feature/fe-invoice-api-integration
git pull origin feature/be-invoice-api

# 2. Test local
cd apps/backend && pnpm start:dev &  # Port 8000
cd apps/frontend && pnpm dev          # Port 3000

# 3. Nếu OK → Push develop
git push origin develop

# 4. Test kỹ trên develop trong 1-2 ngày

# 5. Merge develop → main (via PR)
# https://github.com/trongkhoa310/vtk-invoice-system/compare/main...develop
```

### Scenario 4: Hotfix khẩn cấp

```bash
# 1. Tạo hotfix từ main
git checkout main
git checkout -b hotfix/security-xss-fix

# 2. Fix bug
# Edit: src/app/components/InvoiceList.tsx

# 3. Commit
git add .
git commit -m "fix(security): sanitize user input to prevent XSS"

# 4. Merge trực tiếp vào main (PR nhanh)
git push origin hotfix/security-xss-fix
# Tạo PR → main (cần approve nhanh)

# 5. Sau khi merge main, sync lại develop
git checkout develop
git merge main
git push origin develop
```

---

## 🚀 Deploy Workflow

### Development (Local)

```bash
# Frontend only (hiện tại)
pnpm dev

# Frontend + Backend (tương lai)
docker-compose up
```

### Staging/UAT (Tương lai)

```bash
# Khi có server staging
git checkout develop
git push origin develop

# Auto deploy develop → https://staging-vtk-invoice.viettel.com
# Test UAT tại đây
```

### Production

```bash
# Chỉ deploy từ main
git checkout main
git merge develop    # Via PR only!
git push origin main

# Manual deployment hoặc CI/CD trigger
```

---

## 📊 Commit Message Convention

### Format

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

### Types

- `feat`: Tính năng mới
- `fix`: Sửa bug
- `docs`: Thay đổi documentation
- `style`: Format code (không ảnh hưởng logic)
- `refactor`: Refactor code
- `perf`: Cải thiện performance
- `test`: Thêm tests
- `chore`: Tasks khác (build, dependencies)

### Scopes

- `frontend`: Frontend code
- `backend`: Backend API
- `database`: Database schema
- `ci`: CI/CD pipeline
- `docs`: Documentation

### Examples

```bash
feat(frontend): add invoice export to Excel
fix(backend): resolve race condition in payment processing
docs(readme): update deployment instructions
refactor(frontend): simplify RBAC logic
perf(backend): add database indexes for invoice queries
```

---

## 🛡️ Best Practices

### DO ✅

1. **Luôn pull trước khi tạo branch mới**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **Commit nhỏ, thường xuyên**
   ```bash
   git add src/app/components/NewComponent.tsx
   git commit -m "feat(frontend): add NewComponent"
   ```

3. **Test trước khi push**
   ```bash
   pnpm run build  # Đảm bảo build thành công
   pnpm test       # Chạy tests (nếu có)
   ```

4. **Rebase trước khi merge** (giữ history sạch)
   ```bash
   git checkout feature/my-feature
   git rebase develop
   git push -f origin feature/my-feature
   ```

### DON'T ❌

1. ❌ **Không commit trực tiếp vào `main`**
   ```bash
   # WRONG
   git checkout main
   git add .
   git commit -m "quick fix"
   ```

2. ❌ **Không push code chưa test**
   ```bash
   # WRONG
   git add .
   git commit -m "WIP: broken code"
   git push
   ```

3. ❌ **Không commit secrets/tokens**
   ```bash
   # Kiểm tra .gitignore
   cat .gitignore
   # Đảm bảo .env được ignore
   ```

4. ❌ **Không force push `develop` hoặc `main`**
   ```bash
   # WRONG
   git push -f origin main
   ```

---

## 🔍 Useful Git Commands

### Xem trạng thái

```bash
git status                    # Files đã thay đổi
git log --oneline -10         # 10 commits gần nhất
git branch -a                 # Tất cả branches
git diff                      # Thay đổi chưa stage
git diff --staged             # Thay đổi đã stage
```

### Undo changes

```bash
# Undo file chưa commit
git checkout -- filename.ts

# Undo commit gần nhất (giữ changes)
git reset --soft HEAD~1

# Undo commit và xóa changes
git reset --hard HEAD~1

# Undo commit đã push (tạo commit mới)
git revert HEAD
```

### Sync với remote

```bash
# Fetch changes from remote
git fetch origin

# Update local branch
git pull origin develop

# Push local changes
git push origin feature/my-branch

# Delete remote branch
git push origin --delete feature/old-branch
```

### Stash (Tạm cất changes)

```bash
# Tạm cất changes
git stash

# Xem danh sách stash
git stash list

# Lấy lại stash
git stash pop

# Xóa stash
git stash drop
```

---

## 📞 Support

- **Git Issues**: https://github.com/trongkhoa310/vtk-invoice-system/issues
- **Documentation**: https://github.com/trongkhoa310/vtk-invoice-system/wiki
- **CI/CD**: `.github/workflows/` (tạo sau)

---

**Version**: 1.0.0  
**Last Updated**: May 11, 2026  
**Maintainer**: VTK Team
