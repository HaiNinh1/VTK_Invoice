# VTK Invoice System

Hệ thống quản lý hóa đơn điện tử cho Viettel Tech Services với màu đỏ Viettel (#EE0033) làm màu chủ đạo và giao diện tiếng Việt.

## 🎯 Tính năng chính

### ✅ Đã hoàn thành

#### 1. Dashboard theo Role
- **Dashboard Employee**: Dữ liệu cá nhân
- **Dashboard Manager**: Dữ liệu theo Revenue Center (KV3)
- **Dashboard Company**: Dữ liệu toàn công ty (Accountant/Director/Admin)

#### 2. Quản lý Đề nghị xuất HĐ
- Danh sách hóa đơn role-based với RBAC
- Tạo/Sửa/Xóa đề nghị
- Modal chi tiết với đầy đủ thông tin
- Filter: Revenue Center, Status, Service Type, Legal Status, Creator, Date Range

#### 3. Quản lý Hợp đồng ⭐ NEW
- Quản lý hợp đồng với thanh toán theo đợt
- **Hồ sơ pháp lý master**: Upload 1 lần, dùng chung cho tất cả đợt
- **Hồ sơ riêng đợt**: Chỉ upload giấy tờ bổ sung cho từng đợt
- Tracking tiến độ: Tổng xuất HĐ, Đã thanh toán, Còn lại
- Tạo đề nghị xuất HĐ từ đợt thanh toán

#### 4. Quản lý Loại hóa đơn ⭐ NEW
- 8 loại hóa đơn predefined (Lắp đặt, Đo lường, Tư vấn, Phát triển, Bảo trì, Tích hợp, Cloud, Đào tạo)
- 11 loại tài liệu pháp lý master
- Cấu hình yêu cầu tài liệu cho từng loại HĐ
- Tracking compliance rate theo loại

#### 5. Xuất hóa đơn ⭐ NEW
- Xuất file PDF/Excel
- In ấn hóa đơn
- Xem trước (preview)
- 3 template: Chuẩn, Chi tiết, Đơn giản
- Cấu hình: Header/Footer, Logo, Chữ ký, Khổ giấy, Hướng trang

#### 6. Quản lý pháp lý
- 11 items checklist pháp lý CRITICAL
- Theo dõi cam kết pháp lý
- Filter theo trạng thái: Đầy đủ, Thiếu hồ sơ, Quá hạn, Đang bổ sung

#### 7. Phê duyệt
- Phê duyệt hóa đơn (Accountant/Director/Admin)
- Theo dõi duyệt phòng ban (Manager)
- Theo dõi duyệt (Employee)

#### 8. S-Invoice Integration
- Monitoring xuất HĐ lên S-Invoice
- Tracking: Chờ đẩy, Đang đẩy, Đã xuất, Đã gửi CQT, Hoàn thành, Lỗi

#### 9. Hạch toán VFS
- Đồng bộ hạch toán lên VFS
- Tracking: Pending, Processing, Posted

#### 10. Báo cáo & Analytics
- Báo cáo toàn diện theo role
- Charts: Bar chart, Donut chart
- Center Report (Manager)

#### 11. Settings & Admin
- Ma trận phân quyền 5 roles x 16 permissions
- User management với role assignment
- Cột "Quản lý" (orange-100 bg, orange-700 text)

## 🎨 Kiến trúc

### RBAC - 5 Roles
- **Employee** (Nhân viên): Dữ liệu cá nhân
- **Manager** (Quản lý): Dữ liệu Revenue Center
- **Accountant** (Kế toán): Toàn công ty + Phê duyệt
- **Director** (Giám đốc): Toàn công ty + Quyền cao nhất
- **Admin** (Quản trị viên): Toàn công ty + Quản lý hệ thống

### Single Shared Dataset
- **MASTER_INVOICE_DATA**: 20 bản ghi hóa đơn master
- **CONTRACTS**: 4 hợp đồng mẫu
- **INVOICE_TYPES**: 8 loại hóa đơn
- **ALL_LEGAL_DOCUMENTS**: 11 loại tài liệu pháp lý

### UI Components
- Radix UI Dialog cho tất cả modals
- Status badges sử dụng hex colors chuẩn
- Dashboard tách theo role
- Navigation items filter theo quyền
- Role switcher với badges màu
- Auto-redirect khi user mất quyền truy cập

## 🚀 Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **State Management**: React useState/useEffect
- **Build**: Vite

## 📂 Cấu trúc thư mục

```
src/
├── app/
│   ├── components/
│   │   ├── DashboardEmployee.tsx
│   │   ├── DashboardManager.tsx
│   │   ├── DashboardCompany.tsx
│   │   ├── InvoiceListRoleBased.tsx
│   │   ├── CreateInvoiceRoleBased.tsx
│   │   ├── ContractManagement.tsx ⭐ NEW
│   │   ├── InvoiceTypeManagement.tsx ⭐ NEW
│   │   ├── InvoiceExport.tsx ⭐ NEW
│   │   ├── LegalTracking.tsx
│   │   ├── Approval.tsx
│   │   ├── Monitoring.tsx
│   │   ├── AccountingVFS.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── data/
│   │   ├── masterInvoiceData.ts (20 records)
│   │   ├── contractData.ts ⭐ NEW (4 contracts)
│   │   └── invoiceTypes.ts ⭐ NEW (8 types, 11 docs)
│   └── App.tsx
└── styles/
    └── theme.css
```

## 🎯 Workflow nghiệp vụ

### Thanh toán theo đợt (Contract-based)

```
1. Tạo Hợp đồng
   └─ Upload Hồ sơ master (1 lần)
      ├─ Hợp đồng kinh tế
      ├─ Phụ lục (nếu có)
      └─ Giấy uỷ quyền

2. Định nghĩa các đợt thanh toán
   ├─ Đợt 1: 30% - Sau ký HĐ
   ├─ Đợt 2: 40% - Nghiệm thu giai đoạn 1
   └─ Đợt 3: 30% - Nghiệm thu cuối

3. Xuất HĐ từ đợt
   ├─ Kế thừa: Hồ sơ master từ hợp đồng ✅
   └─ Upload thêm: Giấy tờ riêng đợt này
      (VD: BB nghiệm thu, Đề nghị TT)

4. Tracking
   ├─ Tiến độ thanh toán: X%
   ├─ Đã xuất HĐ: Y VNĐ
   └─ Còn lại: Z VNĐ
```

## 📊 Demo Data

### Master Invoice Dataset
- 20 bản ghi hóa đơn
- Phân bổ revenue center cho demo:
  - KV3: 5 records (Manager demo)
  - KV1, KV2, KV4: phân bổ còn lại
- Creators: Nguyễn Văn A, Trần Thị B, Lê Văn C, Phạm Thị D, v.v.

### Contracts
- CT-001: VNPT Hà Nội - 16.5B (3 đợt, 64% tiến độ)
- CT-002: EVN Miền Bắc - 8.8B (3 đợt, 18% tiến độ)
- CT-003: Viettel Telecom - 3.96B (4 đợt quý, 23% tiến độ)
- CT-004: Bệnh viện 108 - 5.5B (2 đợt, draft)

## 🎨 Design System

### Colors
- **Primary**: #EE0033 (Viettel Red)
- **Success**: #16A34A
- **Warning**: #F59E0B
- **Error**: #DC2626
- **Info**: #1D4ED8

### Role Colors
- Employee: Gray (#F3F4F6 bg, #4B5563 text)
- Manager: Orange (#FED7AA bg, #C2410C text)
- Accountant: Blue (#DBEAFE bg, #1D4ED8 text)
- Director: Red (#FFF1F3 bg, #EE0033 text)
- Admin: Purple (#F3E8FF bg, #7C3AED text)

## 👥 Contributors

- **Frontend Development**: Claude Sonnet 4.5
- **Product Owner**: VTK Team
- **Design System**: Viettel Brand Guidelines

## 📝 License

Internal use only - Viettel Tech Services

---

**Version**: 1.0.0  
**Last Updated**: May 11, 2026  
**Status**: Production Ready ✅
