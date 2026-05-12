# Figma Make vs GitHub - Workflow Strategy

## 🎯 Chiến lược 2-Track (KHUYẾN NGHỊ)

### Track 1: Figma Make (Draft/Demo Environment)
**Mục đích**: Prototype, demo cho stakeholders, test UI/UX với nhiều roles

**Đặc điểm:**
- ✅ Code tồn tại trên Figma Make servers
- ✅ Dễ dàng share link demo: `https://figma.com/make/...`
- ✅ Update real-time khi edit trong Figma Make
- ✅ **KHÔNG bị ảnh hưởng** bởi Git push/pull
- ✅ Phục vụ demo cho: Employee, Manager, Accountant, Director, Admin
- ⚠️ Không có version control
- ⚠️ Không deploy production được

**Use cases:**
- Demo cho Product Owner/Stakeholders
- Test UI/UX flow với mock data
- Rapid prototyping
- A/B testing design variations

### Track 2: GitHub Repository (Production Code)
**Mục đích**: Source control, collaboration, deploy production

**Đặc điểm:**
- ✅ Full version control với Git
- ✅ Team collaboration (Pull Requests, Code Review)
- ✅ CI/CD integration
- ✅ Deploy to production servers
- ✅ Backup và disaster recovery
- ⚠️ Cần setup môi trường để chạy local
- ⚠️ Không có live preview URL như Figma Make

**Use cases:**
- Production deployment
- Team development
- Code review process
- Long-term maintenance

---

## 🔄 Workflow Đề xuất

### Phase 1: Prototyping (Figma Make)

```
1. Design trong Figma → Import vào Figma Make
2. Develop features trong Figma Make
3. Test với mock data
4. Share link demo: https://figma.com/make/jzkeDylBS7MsSM74wvlnHo/...
5. Collect feedback từ stakeholders
```

**Khi nào dùng:**
- Giai đoạn đầu dự án
- Thử nghiệm tính năng mới
- Demo cho leadership
- UI/UX testing

### Phase 2: Production Ready (GitHub)

```
1. Export code từ Figma Make
2. Commit vào GitHub repository
3. Code review với team
4. Merge vào branch develop
5. Test integration với Backend
6. Deploy to staging/production
```

**Khi nào dùng:**
- Tính năng đã approved
- Chuẩn bị deploy production
- Team collaboration
- Integration với Backend/Database

---

## 📋 Workflow Chi tiết cho VTK Invoice System

### Scenario 1: Thêm tính năng mới vào Figma Make (Draft)

```bash
# KHÔNG CẦN Git commands!
# 1. Mở Figma Make: https://figma.com/make/jzkeDylBS7MsSM74wvlnHo/...
# 2. Edit code trực tiếp trong Figma Make editor
# 3. Test ngay với preview
# 4. Share link với team để review
# 5. GIỮ NGUYÊN trong Figma Make cho demo

# ✅ Code trong Figma Make KHÔNG thay đổi
# ✅ GitHub repo KHÔNG bị ảnh hưởng
```

**Ưu điểm:**
- Nhanh chóng
- Không ảnh hưởng production
- Dễ rollback (undo trong Figma Make)
- Stakeholders xem được ngay

### Scenario 2: Đưa tính năng từ Figma Make → GitHub (Production)

```bash
# 1. Export code từ Figma Make (copy/paste hoặc download)
# 2. Paste vào local repository
cd /path/to/vtk-invoice-system

# 3. Tạo feature branch
git checkout develop
git checkout -b feature/new-feature-from-figma

# 4. Thêm code đã export
# Copy từ Figma Make → src/app/components/NewFeature.tsx

# 5. Test local
pnpm dev

# 6. Commit
git add src/app/components/NewFeature.tsx
git commit -m "feat(frontend): add NewFeature from Figma Make prototype"

# 7. Push và tạo PR
git push origin feature/new-feature-from-figma

# 8. Code review → Merge vào develop → main
```

### Scenario 3: Giữ Figma Make làm "Demo Environment" vĩnh viễn

**Chiến lược:**

```
FIGMA MAKE (Demo Environment)
├─ Chỉ dùng để demo cho stakeholders
├─ Mock data đầy đủ cho 5 roles
├─ UI/UX prototype
└─ KHÔNG deploy production

        │ (Manual sync khi cần)
        ↓

GITHUB REPOSITORY (Production Code)
├─ Production-ready code
├─ Real API integration
├─ Database connection
└─ Deploy to servers
```

**Quy tắc:**
1. ✅ Figma Make: Luôn giữ bản demo đầy đủ tính năng
2. ✅ GitHub: Chỉ merge code đã approved và production-ready
3. ✅ Sync thủ công khi cần (copy/paste code)
4. ❌ KHÔNG tự động sync 2 chiều

---

## 🛡️ Tránh Conflicts

### ❌ KHÔNG NÊN: Auto-sync 2 chiều

```
Figma Make ←──────→ GitHub
   (Auto sync sẽ gây conflict!)
```

**Tại sao?**
- Figma Make có thể có code experimental
- GitHub có thể có code đã refactor
- 2 môi trường phục vụ mục đích khác nhau

### ✅ NÊN: Manual sync 1 chiều

```
Figma Make ─────→ GitHub
   (Copy code đã approve)

GitHub ────────X Figma Make
   (KHÔNG sync ngược lại)
```

**Lý do:**
- Figma Make = Draft environment (experimental)
- GitHub = Production environment (stable)
- Chỉ đưa code stable từ draft → production

---

## 📊 So sánh 2 Environments

| Feature | Figma Make | GitHub + Local Dev |
|---------|------------|-------------------|
| **Purpose** | Prototype, Demo | Production Code |
| **Version Control** | ❌ Không | ✅ Git History |
| **Team Collaboration** | Share link | Pull Requests |
| **Preview URL** | ✅ Live link | ❌ Localhost only |
| **Mock Data** | ✅ Sẵn có | ✅ Phải setup |
| **Backend Integration** | ❌ Không | ✅ Có |
| **Deploy Production** | ❌ Không | ✅ Có |
| **Multi-role Demo** | ✅ Dễ dàng | ⚠️ Cần config |
| **Performance** | ⚠️ Preview only | ✅ Optimized |
| **Database** | ❌ Mock only | ✅ Real DB |
| **CI/CD** | ❌ Không | ✅ Có |

---

## 🎯 Khuyến nghị cho VTK Invoice System

### Giữ Figma Make cho Demo

**Mục đích:**
- Demo cho leadership/stakeholders
- Test UI flow với 5 roles (Employee, Manager, Accountant, Director, Admin)
- Rapid prototyping tính năng mới
- A/B testing design

**Action:**
- ✅ GIỮ NGUYÊN code trong Figma Make
- ✅ KHÔNG pull/push Git trong Figma Make
- ✅ Tiếp tục develop draft features trong Figma Make
- ✅ Share link demo: `https://figma.com/make/...`

### Dùng GitHub cho Production

**Mục đích:**
- Deploy lên server thật
- Integration với Backend API
- Team development
- Version control

**Action:**
- ✅ Clone repository về local: `git clone https://github.com/trongkhoa310/vtk-invoice-system.git`
- ✅ Setup local dev environment
- ✅ Develop production features
- ✅ CI/CD deployment

### Sync Strategy (Manual)

**Khi nào sync Figma Make → GitHub:**
1. Tính năng mới được approve bởi stakeholders
2. UI/UX đã finalize
3. Code đã test kỹ trong Figma Make
4. Chuẩn bị deploy production

**Cách sync:**
```bash
# 1. Copy code từ Figma Make
# 2. Paste vào local repository
# 3. Test local
# 4. Commit và push
git add .
git commit -m "feat: sync approved feature from Figma Make"
git push origin feature/from-figma-make
```

**Khi nào KHÔNG sync:**
- Code đang experimental
- Chưa được approve
- Chỉ dùng để demo
- Breaking changes chưa ready

---

## 🚀 Deployment Strategy

### Track 1: Figma Make (Demo)

```
Figma Design → Figma Make → Share Link
                    ↓
         Demo to Stakeholders
                    ↓
              Get Feedback
                    ↓
         (Iterate in Figma Make)
```

**Không cần:**
- Git commands
- Local setup
- Backend integration

**URL:** `https://figma.com/make/jzkeDylBS7MsSM74wvlnHo/...`

### Track 2: GitHub (Production)

```
Local Dev → Git Commit → Push to GitHub
                              ↓
                        Code Review (PR)
                              ↓
                      Merge to develop
                              ↓
                    Integration Testing
                              ↓
                      Merge to main
                              ↓
                   Deploy to Production
```

**Cần:**
- Git workflow
- Local dev environment
- Backend API
- Database
- Server infrastructure

**URL:** `https://vtk-invoice.viettel.com` (production)

---

## 💡 Best Practices

### DO ✅

1. **Sử dụng Figma Make cho:**
   - Quick demos
   - UI/UX prototyping
   - Stakeholder reviews
   - Role-based view testing (5 roles)

2. **Sử dụng GitHub cho:**
   - Production deployment
   - Team collaboration
   - Backend integration
   - Long-term maintenance

3. **Manual sync khi:**
   - Feature đã được approve
   - Code đã test kỹ
   - Chuẩn bị deploy production

### DON'T ❌

1. ❌ **KHÔNG auto-sync Figma Make ↔ GitHub**
   - Sẽ gây conflicts
   - Mất code experimental trong Figma Make
   - Khó debug

2. ❌ **KHÔNG deploy Figma Make code trực tiếp lên production**
   - Chưa optimize
   - Chưa review
   - Chưa test integration

3. ❌ **KHÔNG xóa code trong Figma Make sau khi sync**
   - Giữ lại để demo
   - Dùng cho reference
   - Stakeholders vẫn cần truy cập

---

## 🔐 Security Note

### Figma Make (Public Demo)
- ⚠️ Code có thể visible cho người có link
- ⚠️ Không commit secrets/API keys
- ⚠️ Chỉ dùng mock data

### GitHub (Production)
- ✅ Private repository (nếu cần)
- ✅ Use `.env` for secrets
- ✅ `.gitignore` sensitive files
- ✅ Real API keys chỉ ở production server

---

## 📞 FAQ

### Q1: Nếu tôi push code lên GitHub, Figma Make có bị ảnh hưởng không?
**A:** ❌ KHÔNG. Figma Make và GitHub hoàn toàn độc lập.

### Q2: Tôi có thể pull code từ GitHub vào Figma Make không?
**A:** ⚠️ CÓ thể import thủ công, nhưng KHÔNG khuyến nghị. Giữ Figma Make làm draft environment.

### Q3: Code nào tôi nên giữ trong Figma Make?
**A:** Code đang experimental, draft features, demo cho stakeholders. GIỮ ĐẦY ĐỦ 5 role views.

### Q4: Làm sao để team member khác truy cập Figma Make?
**A:** Share link: `https://figma.com/make/jzkeDylBS7MsSM74wvlnHo/...`

### Q5: Tôi có cần 2 bản code khác nhau?
**A:** ✅ CÓ. Figma Make = Draft, GitHub = Production. 2 mục đích khác nhau.

---

## 📚 Resources

- **Figma Make Documentation**: https://help.figma.com/hc/en-us/articles/figma-make
- **GitHub Workflow**: `GIT_WORKFLOW.md`
- **Deployment Plan**: `DEPLOYMENT_PLAN.md`
- **Current Figma Make**: https://figma.com/make/jzkeDylBS7MsSM74wvlnHo/...

---

**Version**: 1.0.0  
**Last Updated**: May 11, 2026  
**Author**: VTK Team + Claude Sonnet 4.5
