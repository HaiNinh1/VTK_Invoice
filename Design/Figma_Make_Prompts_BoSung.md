# PROMPT BỔ SUNG — TÍNH NĂNG CÒN THIẾU
> Paste SAU KHI đã hoàn thành 11 prompt gốc (Figma_Make_Rebuild_VTK_v2.md)
> Thứ tự: 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19

---

## PROMPT 12: QUẢN LÝ LOẠI HOÁ ĐƠN + CẤU HÌNH TÀI LIỆU BẮT BUỘC

```
IMPORTANT: This is a KEY CONFIGURATION module. It controls which documents are required for each invoice type. When an employee creates an invoice request, the legal checklist is DYNAMICALLY LOADED from this configuration — not hardcoded.

Add a new page "Loại hoá đơn" accessible from the Settings page (add as Tab 3, shift existing tabs).
Only visible to role "Kế toán" and "Quản trị viên".

LAYOUT:

LEFT PANEL (40%) — List of Invoice Types:
- Simple list of invoice types, each showing:
  Name (bold) + number of required documents (gray text: "11 tài liệu")
  Active/Inactive toggle
- Pre-populated with 4 types:
  1. "Lắp đặt công trình" — 11 tài liệu — Active
  2. "Tư vấn thiết kế" — 6 tài liệu — Active
  3. "Đo lường" — 7 tài liệu — Active
  4. "Bảo trì bảo dưỡng" — 4 tài liệu — Active
- [+ Thêm loại HĐ mới] button at bottom
- Click any type → shows detail in RIGHT PANEL

RIGHT PANEL (60%) — Document Configuration for Selected Type:

Header: Type name (editable text input) + Active/Inactive badge + [Lưu] [Xoá loại HĐ] buttons

Section "Tài liệu bắt buộc":
- Grouped list, each group is collapsible:

  For "Lắp đặt công trình" (example):
  
  Group "Hồ sơ Hợp đồng":
  ☑ Hợp đồng đã ký (bản scan)         [Bắt buộc ✓] [Sửa] [Xoá]
  ☑ Phụ lục hợp đồng                   [Không BB]   [Sửa] [Xoá]
  ☑ Biên bản đàm phán giá              [Bắt buộc ✓] [Sửa] [Xoá]
  [+ Thêm tài liệu vào nhóm này]

  Group "Hồ sơ Nghiệm thu":
  ☑ BB nghiệm thu khối lượng           [Bắt buộc ✓] [Sửa] [Xoá]
  ☑ BB nghiệm thu hoàn thành           [Bắt buộc ✓] [Sửa] [Xoá]
  ☑ Bảng tổng hợp KL nghiệm thu       [Bắt buộc ✓] [Sửa] [Xoá]
  [+ Thêm tài liệu vào nhóm này]

  Group "Hồ sơ Quyết toán":
  ☑ Biên bản quyết toán                [Bắt buộc ✓] [Sửa] [Xoá]
  ☑ Bảng tính giá trị quyết toán       [Bắt buộc ✓] [Sửa] [Xoá]
  ☑ Xác nhận công nợ                   [Bắt buộc ✓] [Sửa] [Xoá]
  [+ Thêm tài liệu vào nhóm này]

  Group "Thanh toán & Bảo lãnh":
  ☑ Đề nghị thanh toán                 [Bắt buộc ✓] [Sửa] [Xoá]
  ☑ BL thực hiện HĐ / Bảo hành        [Bắt buộc ✓] [Sửa] [Xoá]
  [+ Thêm tài liệu vào nhóm này]

  [+ Thêm nhóm mới]

- Each document item shows: checkbox (included/excluded), document name, required badge, edit/delete icons
- [Sửa] opens inline edit: rename document
- [Xoá] shows confirm popup
- [+ Thêm tài liệu] opens inline input: name + required toggle
- [+ Thêm nhóm mới] opens inline input for group name

"Thêm loại HĐ mới" dialog:
- Name input: "Tên loại hoá đơn *"
- Option: "Sao chép từ loại có sẵn" dropdown (None / Lắp đặt / Tư vấn / Đo lường / Bảo trì)
  If selected → pre-fill document list from that type
- [Huỷ] [Tạo] buttons

DATA CONNECTION — CRITICAL:
Store this config in masterData.ts as:
  invoiceTypeConfigs: Array<{
    id: string,
    name: string,
    active: boolean,
    documentGroups: Array<{
      groupName: string,
      documents: Array<{ id: string, name: string, required: boolean }>
    }>
  }>

This data is used by:
- Contract page (Prompt 4): shows checklist matching the contract's service type
- Create Invoice form (Prompt 6 Tab 2): loads checklist from this config based on selected contract's service type
- The checklist is NO LONGER hardcoded — it reads from invoiceTypeConfigs

UPDATE Prompt 6 behavior:
When user selects a contract in the invoice form → get contract.serviceType → find matching invoiceTypeConfig → load documentGroups as the checklist for Tab 2.
```

---

## PROMPT 13: MODULE XUẤT HOÁ ĐƠN (tách riêng khỏi S-Invoice)

```
The Excel spec separates "Xuất hoá đơn" from "S-Invoice monitoring". Add this as a SUB-FLOW within the existing "Đề nghị xuất HĐ" page, NOT a separate page (to keep navigation simple for lowtech users).

Add a new TAB to the invoice request list page:
Current: just one list
New: 2 tabs at top of the list page:
  Tab "Tất cả đề nghị" (existing list)
  Tab "Chờ xuất HĐ ({count})" — NEW

"Chờ xuất HĐ" tab shows:
- Filter: only requests with status = "Đã duyệt" (approved but not yet sent to S-Invoice)
- Simple card list (not table), each card:
  Left: Mã ĐN (bold) + CĐT + Giá trị sau VAT
  Right: [Xem trước HĐ] button (outline) + [Xuất hoá đơn →] button (red, prominent)
  Bottom text: "Duyệt bởi: Trần Thị B — 13/03/2026"

Click [Xem trước HĐ]:
- Opens modal showing invoice preview in A4 format:
  Header: "HOÁ ĐƠN GIÁ TRỊ GIA TĂNG" 
  Bên bán: Công ty CP Tư vấn và Dịch vụ Viettel, MST, địa chỉ
  Bên mua: CĐT info from request
  Bảng: STT | Tên hàng hoá dịch vụ | ĐVT | Số lượng | Đơn giá | Thành tiền
  Subtotal + VAT + Total
  Watermark "XEM TRƯỚC" faded across
- [Đóng] button

Click [Xuất hoá đơn →]:
- Opens confirmation modal:
  Title: "Xác nhận xuất hoá đơn"
  Summary: Mã ĐN, CĐT, MST, Giá trị, Email nhận HĐ
  Warning: "Sau khi xuất, hoá đơn sẽ được gửi lên S-Invoice để ký số và cấp mã. Không thể hoàn tác."
  Checkbox: "Tôi xác nhận thông tin trên là chính xác"
  [Huỷ] + [Xác nhận xuất ✓] (disabled until checkbox is checked)
- On confirm: status changes to "Đã xuất HĐ", card moves to S-Invoice monitoring page

This keeps navigation at 6 sidebar items (no new page needed) while separating the "review before export" step clearly.
```

---

## PROMPT 14: SỬA PROMPT 4 — BỔ SUNG CRUD HỢP ĐỒNG

```
UPDATE the "Hợp đồng" page (Prompt 4) to add missing CRUD features:

ADD [+ Thêm hợp đồng mới] button at top of the contract list.

FORM "Thêm hợp đồng mới" (opens as full page, NOT modal — form is too large for modal):
- Back button: "← Quay lại danh sách"
- Title: "Thêm hợp đồng mới"

Form fields (single column, max 720px):
Section "Thông tin hợp đồng":
- Số hợp đồng * (text, placeholder "VD: 15/2025/HĐKT-VTK")
- Loại hợp đồng * (dropdown from invoiceTypeConfigs: Lắp đặt / Tư vấn / Đo lường / Bảo trì / ...)
  → THIS LINKS TO Prompt 12 — dropdown options come from invoiceTypeConfigs
- Ngày ký * (date picker)
- Trạng thái (dropdown: Đang thực hiện / Đã quyết toán / Đã thanh lý)

Section "Thông tin khách hàng (CĐT)":
- Tên CĐT * (text)
- Mã số thuế * (text, validate 10 or 13 digits)
- Địa chỉ * (textarea)
- Người đại diện (text)
- Email (email)
- SĐT (tel)

Section "Giá trị hợp đồng":
- Giá trị hợp đồng * (number, auto format VND)
- Đơn vị tiền tệ (dropdown: VND / USD)
- Trung tâm doanh thu * (dropdown: KV1-KV8, Đo lường, Điện dân dụng...)

Section "Ghi chú":
- Ghi chú (textarea, optional)

Bottom: [Huỷ] + [Lưu hợp đồng] buttons

AFTER SAVING → redirect to contract detail page where user can start uploading documents.

ADD to contract detail page:
- [Sửa thông tin] button → opens same form pre-filled, in edit mode
- [Xoá hợp đồng] button (only if no invoice requests linked) → confirmation popup:
  "Hợp đồng này chưa có đề nghị xuất HĐ nào. Bạn có chắc muốn xoá?"
  [Huỷ] + [Xoá] (red)
  If contract HAS linked requests → button disabled, tooltip: "Không thể xoá — đã có đề nghị xuất HĐ liên quan"

ADD [Xuất Excel] button to contract list page:
- Exports visible list to .xlsx file

ADD "Tiến độ" tab to contract detail:
- Simple progress tracker:
  Step 1: Ký hợp đồng ✓ (date)
  Step 2: Nghiệm thu (% complete based on uploaded NT docs)
  Step 3: Quyết toán (% complete based on uploaded QT docs)
  Step 4: Xuất hoá đơn (count of linked invoice requests + their statuses)
  Step 5: Thanh toán (based on uploaded TT docs)
- Vertical timeline, each step shows: name + status + date/percentage
```

---

## PROMPT 15: SỬA PROMPT 5-6 — THU HỒI ĐỀ NGHỊ

```
UPDATE the invoice request functionality to add "Thu hồi" (recall/withdraw) feature.

In the invoice request LIST (Prompt 5):
- For requests with status = "Chờ duyệt", add a [Thu hồi] button (orange outline) in the action column
- This allows the employee to pull back a request they already submitted for approval

Click [Thu hồi] → confirmation popup:
- Title: "Thu hồi đề nghị"
- Text: "Đề nghị {mã ĐN} sẽ được chuyển về trạng thái Nháp. Bạn có thể sửa và gửi duyệt lại."
- [Huỷ] + [Xác nhận thu hồi] (orange button)

On confirm:
- Status changes from "Chờ duyệt" back to "Nháp"
- Request becomes editable again
- Notification sent to accountant: "{Tên NV} đã thu hồi đề nghị {mã ĐN}"

RULES:
- Only the CREATOR of the request can withdraw it
- Only works when status = "Chờ duyệt" (not after accountant has started reviewing)
- Cannot withdraw if accountant has already opened the detail view (optional: skip this rule for simplicity)

Also add to the request DETAIL view (Prompt 6):
- If viewing own request with status "Chờ duyệt" → show orange banner at top:
  "Đề nghị đang chờ phê duyệt. Bạn có thể thu hồi để sửa đổi."
  [Thu hồi đề nghị] button inside the banner
```

---

## PROMPT 16: TRANG QUẢN LÝ PHÁP LÝ (riêng)

```
Add "Quản lý pháp lý" as a NEW PAGE. This is a DEDICATED view for tracking legal document status across all contracts and requests — separate from the checklist embedded in forms.

UPDATE sidebar navigation:
Change from 6 items to 7 items:
1. Việc cần làm
2. Hợp đồng
3. Đề nghị xuất HĐ
4. Pháp lý ← NEW
5. Phê duyệt
6. S-Invoice
7. Cài đặt

Visibility: Kế toán, Quản lý, Quản trị viên (Nhân viên does NOT see this page — they manage docs in their own contracts/requests)

PAGE LAYOUT:

Top: 4 simple count boxes (small, same style as S-Invoice page):
- "Đủ hồ sơ: 12" (green)
- "Đang bổ sung: 5" (amber)
- "Thiếu: 8" (gray)
- "Quá hạn: 3" (red, bold)

Filter bar:
- Trạng thái PL: Tất cả / Đủ / Đang BS / Thiếu / Quá hạn
- Loại HĐ: Tất cả / Lắp đặt / Tư vấn / Đo lường / Bảo trì
- Trung tâm DT: Tất cả / KV1-KV8 / ...
- Search: "Tìm số HĐ, tên CĐT..."

Main table:
Columns: Số HĐ | CĐT | Loại HĐ | Tiến độ HS | Thiếu | Quá hạn | Hành động

- "Tiến độ HS" shows progress text: "8/11" with color (green ≥100%, amber 50-99%, red <50%)
- "Thiếu" shows count of missing docs
- "Quá hạn" shows count of overdue items (red badge) or "—" if none
- [Xem chi tiết] button

Click [Xem chi tiết] → expand row inline (accordion style, NOT navigate away):
Shows the full checklist for that contract:
- 4 groups, each document with: ✓/✗ icon + name + file info (if uploaded) + deadline (if set) + overdue badge
- Documents that are overdue: red text + "Quá hạn X ngày" badge
- [Tải lên] button next to missing docs (for accountant to upload on behalf)

ALERT SECTION (only if overdue items exist):
Below the count boxes, show a red alert card:
"⚠ Có {count} hồ sơ quá hạn bổ sung. Các hợp đồng: {list of contract numbers}"

EXPORT:
[Xuất báo cáo pháp lý] button at top right → exports the table to Excel with:
- All columns + expanded checklist per contract
- Summary row at bottom: totals
- Color coding preserved in Excel (red/amber/green cells)
```

---

## PROMPT 17: MODULE BÁO CÁO

```
Add "Báo cáo" functionality. To keep navigation simple (7 items max), add this as a TAB inside the "Việc cần làm" page for Kế toán/GĐ roles, NOT a separate sidebar item.

UPDATE "Việc cần làm" page for Kế toán role:
Add 2 tabs at top:
  Tab "Việc cần làm" (existing content)
  Tab "Báo cáo" (NEW)

"Báo cáo" tab — SIMPLE layout, no complex BI dashboard:

Filter bar:
- Kỳ báo cáo: Tháng / Quý / Năm (toggle buttons)
- Tháng/Quý/Năm selector
- Trung tâm DT: Tất cả / specific TT

3 report sections (vertical stack, NOT tabs):

Section 1 — "Tổng hợp đề nghị xuất HĐ":
- Simple summary table:
  | Trạng thái | Số lượng | Giá trị (VNĐ) |
  | Nháp | 5 | 12.500.000.000 |
  | Chờ duyệt | 3 | 8.200.000.000 |
  | Đã duyệt | 8 | 22.100.000.000 |
  | Đã xuất HĐ | 15 | 45.800.000.000 |
  | Từ chối | 2 | 3.100.000.000 |
  | TỔNG | 33 | 91.700.000.000 |
- Bar chart below: doanh thu đã xuất HĐ theo tháng (simple, single color #EE0033)

Section 2 — "Tình trạng pháp lý":
- Summary: "Tỷ lệ tuân thủ: 72%" with colored text (green/amber/red)
- Simple table:
  | TT Doanh thu | Tổng HĐ | Đủ HS | Thiếu | Quá hạn | Tỷ lệ |
  | KV1 | 5 | 4 | 1 | 0 | 80% |
  | KV3 | 8 | 5 | 2 | 1 | 63% |
  | ... |

Section 3 — "Tình trạng S-Invoice":
- Simple table:
  | Trạng thái | Số lượng |
  | Thành công | 12 |
  | Đang xử lý | 2 |
  | Lỗi | 1 |

Export buttons at top right:
- [Xuất Excel] — exports all 3 sections to Excel with proper formatting
- [Xuất PDF] — exports as PDF report with VTK header

Keep it SIMPLE. No interactive charts, no drill-down, no complex filters. Just clear summary tables + one bar chart. Target audience is lowtech users who need to print or email the report.
```

---

## PROMPT 18: TRUNG TÂM THÔNG BÁO

```
Build the notification system across the app.

1. NOTIFICATION DROPDOWN (in header, all pages):
- Bell icon in the top header with red badge showing unread count
- Click bell → dropdown (320px wide, max 400px tall, scrollable):
  Title row: "Thông báo" + [Đọc tất cả] link (blue text)
  List of notifications, each item:
  - Left: colored circle icon (green=approved, red=rejected, orange=returned/warning, blue=info)
  - Middle: message text (1-2 lines) + time ago ("2 phút trước", "1 giờ trước", "Hôm qua")
  - Unread: white bg with blue left border. Read: gray bg
  - Click notification → navigate to relevant page (e.g., click approval notification → go to that request)
  Bottom: [Xem tất cả thông báo →] link

2. NOTIFICATION CENTER (full page):
- Accessible from "Xem tất cả" link in dropdown
- Simple list layout (NOT a separate sidebar item — accessed via bell icon only)
- Filter tabs: Tất cả | Phê duyệt | Pháp lý | Hệ thống
- Each notification same as dropdown but with more space:
  Icon + Message + Timestamp + [Đánh dấu đã đọc] button per item
- Bulk action: [Đọc tất cả] at top
- Pagination: "Xem thêm" button at bottom (loads 20 more)

3. NOTIFICATION TRIGGERS (pre-populated demo data, 10 notifications):
- "Đề nghị DN-2026-00103 đã được duyệt bởi Trần Thị B" (green, 2 min ago)
- "Đề nghị DN-2026-00107 bị từ chối. Lý do: Thiếu BB quyết toán" (red, 1 hour ago)
- "Đề nghị DN-2026-00109 được trả lại để bổ sung" (orange, 3 hours ago)
- "Hoá đơn K26TYY0000145 xuất thành công trên S-Invoice" (green, yesterday)
- "Lỗi xuất HĐ DN-2026-00150: MST không hợp lệ" (red, yesterday)
- "Hồ sơ pháp lý HĐ-2025-003 sắp quá hạn (còn 3 ngày)" (orange, 2 days ago)
- "Cam kết CK-089 quá hạn 5 ngày — chưa bổ sung" (red, 3 days ago)
- "Bạn có 3 đề nghị mới chờ duyệt" (blue, 3 days ago)
- "Hệ thống: Kết nối S-Invoice đã được khôi phục" (gray, 5 days ago)
- "Chào mừng bạn đến với hệ thống Xuất hoá đơn VTK!" (blue, 1 week ago)

4. NOTIFICATION SETTINGS:
In "Cài đặt" page, add to existing tab structure a section "Thông báo":
- Toggle list: user can turn on/off each type
  ☑ Đề nghị được duyệt
  ☑ Đề nghị bị từ chối
  ☑ Đề nghị bị trả lại
  ☑ Hoá đơn xuất thành công
  ☑ Lỗi xuất hoá đơn
  ☑ Hồ sơ pháp lý sắp quá hạn
  ☑ Cam kết quá hạn
  ☐ Thông báo hệ thống (default off)
```

---

## PROMPT 19: HỒ SƠ CÁ NHÂN + ĐĂNG NHẬP + FRAMEWORK

```
Build 3 remaining framework features:

1. PROFILE PAGE:
- Accessible by clicking avatar in header → dropdown → "Hồ sơ cá nhân"
- NOT a sidebar item (accessed via avatar menu only)

Layout (simple, single column, max 640px centered):
- Avatar (large, 80px circle with initials, [Đổi ảnh] overlay on hover)
- Below avatar:
  Họ và tên * (text input)
  Email * (email input, read-only)
  Số điện thoại (tel input)
  Chức danh (text input)
  Phòng ban / Trung tâm (read-only, set by admin)
  Vai trò (read-only badge: Nhân viên / Quản lý / Kế toán / QTV)

- Section "Chữ ký điện tử":
  If has signature: preview + [Thay đổi chữ ký] button → opens signature modal from Prompt 10
  If no signature: "Chưa thiết lập" + [Thiết lập ngay] button

- Section "Thống kê tháng này" (simple 4 numbers in a row):
  Đề nghị tạo: 5 | Đã duyệt: 3 | Đang chờ: 1 | Bị từ chối: 1

- [Lưu thay đổi] button at bottom

2. LOGIN SCREEN:
- Full screen, white background
- Center card (400px wide):
  Top: "VTK" logo text (red) + "Hệ thống Xuất Hoá đơn" subtitle
  Form:
  - Email * (input with @ icon)
  - Mật khẩu * (password input with eye toggle)
  - [Đăng nhập] button (red, full width, 48px height)
  - "Quên mật khẩu?" link (gray, below button)
  Bottom: "© 2026 Công ty CP Tư vấn và Dịch vụ Viettel" text

  For DEMO: any email/password works → goes to main app
  After login: if user has no signature → redirect to FirstTimeSignatureSetup (Prompt 10)
  After login: if user has signature → go to "Việc cần làm" page

3. SKELETON LOADING + TOAST:
- Add skeleton loading animation to ALL tables and card lists:
  When data is "loading" (simulate 500ms delay), show gray shimmer blocks matching the layout
  3 skeleton rows for tables, 3 skeleton cards for card lists
  
- Add toast notification component (bottom-right corner):
  Success toast: green left border, check icon, message, auto-dismiss 3s
  Error toast: red left border, X icon, message, auto-dismiss 5s
  Info toast: blue left border, info icon, message, auto-dismiss 3s
  
  Trigger toasts for:
  - "Đã lưu thành công" (after save)
  - "Đã gửi duyệt" (after submit)
  - "Đã duyệt đề nghị" (after approve)
  - "Đã thu hồi đề nghị" (after withdraw)
  - "Lỗi: [message]" (on error)
```

---

# TỔNG HỢP SAU KHI BỔ SUNG

| # | Prompt | Module |
|---|--------|--------|
| 1-11 | Prompt gốc | Khung, Data, Việc cần làm, HĐ, ĐN (list+form), Phê duyệt, S-Invoice, Cài đặt, Chữ ký, Mobile |
| **12** | **Loại HĐ + Tài liệu BB** | **Cấu hình loại → tài liệu bắt buộc. Checklist động.** |
| **13** | **Xuất HĐ (tách)** | **Tab "Chờ xuất" + xem trước + xác nhận xuất** |
| **14** | **CRUD Hợp đồng** | **Thêm/sửa/xoá HĐ + export + tiến độ** |
| **15** | **Thu hồi đề nghị** | **NV thu hồi ĐN về Nháp khi đang chờ duyệt** |
| **16** | **Trang Pháp lý** | **Trang riêng: danh sách + lọc + cảnh báo + export** |
| **17** | **Báo cáo** | **Tab trong Việc cần làm: 3 bảng + 1 chart + export** |
| **18** | **Thông báo** | **Dropdown + trang full + 10 triggers + cài đặt** |
| **19** | **Hồ sơ + Đăng nhập + UX** | **Profile, Login, Skeleton, Toast** |

**Tổng: 19 prompt = coverage đầy đủ file Excel (trừ VFS đã bỏ)**

---

# SIDEBAR SAU KHI BỔ SUNG (7 items)

1. 📋 Việc cần làm (+ tab Báo cáo cho KT)
2. 📄 Hợp đồng (+ tab Chờ xuất gộp vào ĐN)
3. 📝 Đề nghị xuất HĐ (+ tab Chờ xuất HĐ)
4. 📑 Pháp lý ← MỚI
5. ✅ Phê duyệt
6. 📊 S-Invoice
7. ⚙️ Cài đặt (+ tab Loại HĐ)

Truy cập qua avatar (không chiếm sidebar): Hồ sơ cá nhân, Thông báo (bell), Đăng nhập/Đăng xuất
