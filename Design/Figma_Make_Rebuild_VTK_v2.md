# XÂY LẠI PHẦN MỀM XUẤT HOÁ ĐƠN VTK — FIGMA MAKE
> Tạo file Figma Make MỚI. Paste từng prompt theo thứ tự.
> KHÔNG dùng lại file cũ — bắt đầu sạch hoàn toàn.

---

# NGUYÊN TẮC THIẾT KẾ

- **Đối tượng dùng: người lowtech** — giao diện phải cực kỳ đơn giản, ít nút, ít thông tin trên 1 màn hình
- **Không có dashboard phức tạp** — trang chủ chỉ hiển thị danh sách việc cần làm
- **Màu Viettel Red #EE0033** là accent duy nhất. Nền trắng. Text đen/xám.
- **Font: Montserrat hoặc Inter** — sans-serif dễ đọc
- **KHÔNG có VFS / hạch toán** — đã bỏ
- **KHÔNG có luồng duyệt đặc biệt PGĐ** — Kế toán duyệt tất cả
- **CÓ module Quản lý Hợp đồng** — hồ sơ upload 1 lần, thừa kế sang đề nghị xuất HĐ

---

## PROMPT 1: KHUNG ỨNG DỤNG + NAVIGATION

```
Create a new React web application for VTK Invoice Management System.

DESIGN RULES — FOLLOW STRICTLY:
- Target users are LOW-TECH office workers (~200 people). Everything must be SIMPLE.
- Maximum 6 items in sidebar navigation. No nested menus. No sub-items.
- Use large text (14px minimum body, 16px for labels), large buttons (min height 44px), generous spacing
- Primary color: #EE0033 (Viettel Red). Background: white. Text: #111827 (dark) and #6B7280 (gray)
- Font: Inter or system sans-serif
- NO dark mode. NO complex animations. NO floating panels.
- Vietnamese language throughout. All labels, buttons, placeholders in Vietnamese.

APP STRUCTURE:

1. LEFT SIDEBAR (fixed, 240px wide, white background, subtle right border):
   - Logo area at top: "VTK" text in red + "Hoá đơn" text in gray
   - 6 navigation items with icons (Lucide icons, 20px):
     1. 📋 "Việc cần làm" (default active page) — icon: ClipboardList
     2. 📄 "Hợp đồng" — icon: FileText
     3. 📝 "Đề nghị xuất HĐ" — icon: FilePlus
     4. ✅ "Phê duyệt" — icon: CheckSquare
     5. 📊 "S-Invoice" — icon: Monitor
     6. ⚙️ "Cài đặt" — icon: Settings
   - Active item: red left border (3px), light red background (#FFF1F3), red text
   - Inactive: gray text, no background
   - Bottom of sidebar: user info — avatar circle (initials), name, role badge (colored)

2. TOP HEADER (fixed, 56px height, white, bottom border):
   - Left: Page title (bold, 18px)
   - Right: Role switcher dropdown (for demo), Notification bell, Avatar
   - Role switcher has 4 options: "Nhân viên", "Quản lý", "Kế toán", "Quản trị viên"
   - NO breadcrumbs. Just the page title.

3. MAIN CONTENT AREA:
   - White background, padding 24px
   - Max width 1200px, centered

4. ROLE STATE:
   - const [currentRole, setCurrentRole] = useState('accountant')
   - Sidebar items show/hide based on role:
     * "Nhân viên": sees Việc cần làm, Hợp đồng, Đề nghị xuất HĐ
     * "Quản lý": sees same as NV + can see department data
     * "Kế toán": sees all 6 items
     * "Quản trị viên": sees all 6 items

Create this shell with navigation working. Each page shows a placeholder "Trang [tên]" text for now. We will build each page in subsequent prompts.
```

---

## PROMPT 2: MASTER DATA (masterData.ts)

```
Create a file called masterData.ts that contains ALL demo data for the application. This is the SINGLE SOURCE OF TRUTH — every component imports from here.

CONTRACTS DATA (10 records):
Each contract has:
- id: "HD-2025-001" to "HD-2025-010"
- contractNumber: "15/2025/HĐKT-VTK" format
- customerName: Vietnamese company names (VNPT Hà Nội, Mobifone, FPT Telecom, LG Display HP, Samsung HCMC, Viettel Construction, BQLDA TP Hà Nội, Tổng Cty Điện lực, EVN HANOI, CMC Telecom)
- customerTaxCode: 10-digit MST
- customerAddress: Vietnamese addresses
- serviceType: "Tư vấn" | "Đo lường" | "Lắp đặt" | "Bảo trì"
- signDate: dates in 2025
- totalValue: numbers from 500M to 5B VND
- department: "KV1" to "KV5" and "DL", "DDL"
- status: "Đang thực hiện" | "Đã quyết toán" | "Đã thanh lý"
- documents: array of uploaded docs, each with:
  { id, name, group, uploadDate, fileName }
  Groups: "Hợp đồng", "Nghiệm thu", "Quyết toán", "Thanh toán"
  Pre-fill 3-5 documents per contract (mix of groups)

INVOICE REQUESTS DATA (15 records):
Each request has:
- id: "DN-2026-00101" to "DN-2026-00115"
- contractId: references a contract
- contractNumber, customerName, customerTaxCode, customerAddress (from contract)
- serviceType (from contract)
- valueBeforeVAT: number
- vatRate: 10
- vatAmount: calculated
- valueAfterVAT: calculated
- invoiceType: "Tạo mới" | "Điều chỉnh" | "Thay thế"
- paymentTerm: "Đợt 1" | "Đợt 2" | "Thanh toán cuối"
- department: from contract
- createdBy: Vietnamese names
- createdDate: dates in Q1 2026
- status: "Nháp" | "Chờ duyệt" | "Đã duyệt" | "Đã xuất HĐ" | "Từ chối" | "Trả lại bổ sung"
- legalChecklist: { total: 11, checked: number, items: array of { name, checked, group } }
  Mix: some 100%, some 60-80%, some 30%
- hasCommitment: boolean (true for records with checklist < 100%)
- commitmentDeadline: date string (if hasCommitment)
- approvedBy: name or null
- approvedDate: date or null
- sInvoiceNumber: "K26TYY0000xxx" or null
- sInvoiceTaxCode: "4A2B..." or null
- buyerEmail: email

USERS DATA:
- 5 users with name, role, department, hasSignature boolean

Export everything as named exports. Use TypeScript types.
```

---

## PROMPT 3: TRANG "VIỆC CẦN LÀM" (Home)

```
Build the "Việc cần làm" page — this is the HOME PAGE. It replaces the traditional dashboard.

DESIGN PHILOSOPHY: This is NOT a dashboard with charts. This is a TO-DO LIST showing what the user needs to act on RIGHT NOW.

FOR "Nhân viên" ROLE:
Show 3 simple sections (no charts, no stat cards):

Section 1 — "Đề nghị của tôi" (card list):
- Filter masterData invoiceRequests where createdBy = current user
- Show as simple card list (not table), each card:
  Top row: Mã ĐN (bold) + Status badge (right aligned)
  Middle: Tên CĐT
  Bottom: Giá trị (formatted VND) + Ngày tạo
- Maximum 5 most recent cards
- Link "Xem tất cả →" at bottom goes to Đề nghị xuất HĐ page

Section 2 — "Cần bổ sung hồ sơ" (only if any):
- Show requests where legalChecklist.checked < legalChecklist.total AND status = "Nháp"
- Each item: Mã ĐN + "Thiếu X hồ sơ" in orange text + link "Bổ sung →"
- If none: hide this section entirely

Section 3 — "Cam kết đang theo dõi" (only if any):
- Show requests where hasCommitment = true
- Each item: Mã ĐN + "Hạn: DD/MM/YYYY" + countdown badge (green/yellow/red)
- If none: hide this section

FOR "Kế toán" ROLE:
Section 1 — "Chờ tôi duyệt" (MOST PROMINENT):
- Large section at top
- Filter: status = "Chờ duyệt"
- Card list, each card:
  Mã ĐN + CĐT + Giá trị + Pháp lý "8/11" + [Xem & Duyệt] button
- Count badge in section title: "Chờ tôi duyệt (5)"

Section 2 — "S-Invoice cần xử lý" (only if errors):
- Requests where S-Invoice has errors
- If none: hide

Section 3 — "Đã duyệt gần đây":
- Last 5 approved by me
- Simple list: Mã ĐN + CĐT + Ngày duyệt

FOR "Quản lý" ROLE:
Same as Nhân viên but data filtered to department, not just personal.
Title: "Việc cần làm — TT Khu vực 3"

STYLING:
- NO charts, NO stat cards with big numbers, NO complex visualizations
- Just simple card lists with clear labels
- Each section has a clear title, optional count badge, and "Xem tất cả →" link
- Empty sections are HIDDEN (not shown with "Không có dữ liệu")
- White card backgrounds, subtle border, 12px rounded corners, 16px padding
- Status badges: Nháp (gray), Chờ duyệt (amber), Đã duyệt (blue), Đã xuất HĐ (green), Từ chối (red), Trả lại (orange dashed border)
```

---

## PROMPT 4: TRANG "HỢP ĐỒNG" (MỚI)

```
Build the "Hợp đồng" page — this is a NEW module for Contract Management.

PURPOSE: Manage contracts and their uploaded legal documents. When creating an invoice request, documents are INHERITED from the contract — user only uploads what's new.

LAYOUT — Simple 2-part design:

PART 1 — CONTRACT LIST (left or full width when no contract selected):
- Simple table (NOT complex data grid):
  Columns: Số HĐ | CĐT | Loại DV | Giá trị | Trạng thái | Hồ sơ
  "Hồ sơ" column shows "5/11 ✓" progress text (green if complete, orange if not)
- Search bar at top: placeholder "Tìm số HĐ, tên CĐT..."
- Filter: Trạng thái dropdown (Tất cả / Đang thực hiện / Đã quyết toán / Đã thanh lý)
- Click row → opens PART 2

PART 2 — CONTRACT DETAIL (replaces list, or right panel on wide screens):
- Back button "← Danh sách hợp đồng"
- Contract info card (read-only):
  Số HĐ, Ngày ký, CĐT, MST, Địa chỉ, Loại DV, Giá trị HĐ, TT Doanh thu, Trạng thái

- DOCUMENT MANAGEMENT SECTION (this is the key feature):
  Title: "Hồ sơ pháp lý hợp đồng"
  Progress bar: "7/11 đã có (64%)" with colored segments

  4 groups displayed as collapsible sections:

  Group "Hồ sơ Hợp đồng" (3 items):
  - Hợp đồng đã ký ✓ (uploaded: HĐ_15_2025.pdf, 12/01/2025) [Xem]
  - Phụ lục hợp đồng ✓ (uploaded: PL_HĐ_15.pdf, 15/01/2025) [Xem]
  - Biên bản đàm phán giá ✗ [Tải lên]

  Group "Hồ sơ Nghiệm thu" (3 items):
  - BB nghiệm thu khối lượng ✓ (uploaded) [Xem]
  - BB nghiệm thu hoàn thành ✗ [Tải lên]
  - Bảng tổng hợp KL nghiệm thu ✗ [Tải lên]

  Group "Hồ sơ Quyết toán" (3 items):
  - BB quyết toán ✗ [Tải lên]
  - Bảng tính GT quyết toán ✗ [Tải lên]
  - Xác nhận công nợ ✗ [Tải lên]

  Group "Thanh toán & Bảo lãnh" (2 items):
  - Đề nghị thanh toán ✗ [Tải lên]
  - BL thực hiện HĐ / BH ✗ [Tải lên]

  Each item shows:
  - Checkbox (checked = green ✓, unchecked = gray circle)
  - Document name
  - If uploaded: file name + date + [Xem] button (blue text)
  - If not: [Tải lên] button (gray outline)

  Upload is drag-and-drop zone OR click button. Accept PDF, DOC, JPG, max 20MB.

  Bottom: [Tạo đề nghị xuất HĐ từ hợp đồng này →] button (red, prominent)
  This button navigates to the Create Invoice page with contract data pre-filled.

ROLE ACCESS:
- Nhân viên: see contracts in their department, can upload docs for their contracts
- Quản lý: see all contracts in their department
- Kế toán: see all contracts
```

---

## PROMPT 5: TRANG "ĐỀ NGHỊ XUẤT HĐ" — DANH SÁCH

```
Build the "Đề nghị xuất HĐ" page — LIST VIEW.

SIMPLE TABLE (not complex data grid):
Columns: Mã ĐN | Số HĐ | CĐT | Giá trị sau VAT | Trạng thái | Pháp lý | Ngày tạo | Hành động

- "Trạng thái" shows colored badge
- "Pháp lý" shows "8/11" text (green if 100%, orange if <100%, red if <50%)
- "Hành động" shows icon buttons: [Xem] [Sửa] (only if Nháp)

TOP BAR:
- [+ Tạo đề nghị mới] button (red) — opens create form
- Search: "Tìm mã ĐN, số HĐ, tên CĐT..."
- Filter dropdown: Trạng thái (Tất cả / Nháp / Chờ duyệt / Đã duyệt / Đã xuất HĐ / Từ chối / Trả lại)

ROLE FILTERING:
- Nhân viên: only their own requests, hide "Người tạo" column
- Quản lý: department requests, show "Người tạo" column
- Kế toán: all requests

PAGINATION: Simple "Trang 1 / 3" with Prev/Next buttons. 10 items per page.

Click any row → navigate to detail/edit view (Prompt 6).
```

---

## PROMPT 6: TẠO / SỬA ĐỀ NGHỊ XUẤT HĐ

```
Build the Create/Edit Invoice Request form.

THIS IS THE MOST IMPORTANT SCREEN. Keep it simple but complete.

LAYOUT: Single column form (NOT multi-column). Max width 720px centered. 3 tabs at top.

TAB 1 — "Thông tin" (default):

Section "Hợp đồng liên quan":
- Dropdown "Chọn hợp đồng *" — searchable, shows: Số HĐ + CĐT
- When selected: auto-fill all contract info below (read-only gray fields):
  CĐT, MST, Địa chỉ, Loại DV, TT Doanh thu
- If navigated from Contract page → already pre-selected

Section "Thông tin quyết toán":
- Đợt thanh toán * (dropdown: Tạm ứng / Đợt 1 / Đợt 2 / Đợt 3 / Thanh toán cuối / 1 lần)
- Giá trị trước VAT * (number input, auto format VND with dots)
- Thuế suất * (dropdown: 0% / 5% / 8% / 10%)
- Giá trị VAT (auto calculated, read-only, green background)
- Giá trị sau VAT (auto calculated, read-only, green background)

Section "Thông tin xuất hoá đơn":
- Loại hoá đơn * (radio: Tạo mới / Điều chỉnh / Thay thế)
- IF Điều chỉnh or Thay thế selected → show: "Số HĐ gốc *" text input + "Lý do *" textarea
- Hình thức thanh toán * (dropdown: Chuyển khoản / Tiền mặt / Bù trừ)
- Email nhận HĐ * (email input, validated)
- Ghi chú (textarea, optional)

TAB 2 — "Hồ sơ pháp lý":

CRITICAL FEATURE — DOCUMENT INHERITANCE FROM CONTRACT:

At top, show info box (blue background, white text):
"📋 Hồ sơ từ hợp đồng {số HĐ}: Đã có {X}/{total} hồ sơ. Bạn chỉ cần bổ sung hồ sơ còn thiếu."

Below: Same checklist as Contract page, BUT:
- Items already uploaded in Contract → show as ✓ LOCKED (green check, file name, [Xem] button, CANNOT uncheck)
- Items NOT yet uploaded → show as unchecked with [Tải lên] button
- User can upload additional docs HERE — they are NEW docs for this specific request/payment term

Progress bar: "8/11 đã có (73%)" — counts BOTH inherited + newly uploaded

Bottom of Tab 2:
IF checklist < 100%:
  Show orange card: "Còn thiếu {X} hồ sơ. Bạn có thể tạo Cam kết bổ sung để gửi duyệt."
  Expandable section inside:
  - "Hạn bổ sung *" date input (must be future)
  - "Nội dung cam kết" textarea (pre-filled template)
  - [Tạo cam kết] button

IF checklist = 100%:
  Show green text: "✓ Đầy đủ hồ sơ pháp lý"

TAB 3 — "Xem trước HĐ":
- Simple preview of invoice in A4 format
- Watermark "BẢN NHÁP" if status = Nháp

BOTTOM STICKY BAR:
- [Lưu nháp] button (gray outline)
- [Gửi duyệt] button:
  * Green and enabled if checklist = 100%
  * Orange and enabled if checklist < 100% BUT has commitment → label: "Gửi duyệt (có cam kết)"
  * Gray and DISABLED if checklist < 100% AND no commitment

When viewing someone else's request (accountant viewing employee's request):
- ALL fields read-only
- Title: "Chi tiết đề nghị {mã}"
- Bottom bar: only [Quay lại] button
```

---

## PROMPT 7: TRANG "PHÊ DUYỆT"

```
Build the "Phê duyệt" page.

SIMPLIFIED — NO special approval flow. Accountant approves everything.

FOR "Kế toán" ROLE:

Simple tab layout:
- Tab "Chờ duyệt (5)" — main tab
- Tab "Đã duyệt"
- Tab "Đã từ chối"

"Chờ duyệt" tab:
Card list (NOT table). Each card:
- Left: Mã ĐN (bold) + CĐT name + Giá trị (formatted)
- Right: Status "Chờ duyệt" badge + Pháp lý "8/11" + [Xem & Duyệt →] button
- If has commitment: orange left border + "Có cam kết" small badge
- Cards sorted by date (oldest first = needs attention first)

Click [Xem & Duyệt →] → opens APPROVAL DETAIL VIEW:

Split layout: Left 60% (request info read-only) | Right 40% (approval sidebar)

LEFT PANEL:
- All info from Tab 1 of the request form (read-only)
- Checklist status: which docs are present, which are missing
- If has commitment: show commitment card (orange border) with deadline + content + signature

RIGHT PANEL — "Phê duyệt":
- Vertical timeline showing steps completed so far
- Accountant form:
  * Số CT ghi sổ (text input)
  * TK Doanh thu (dropdown: 5111 / 5112 / 5113)
  * TK Thuế (dropdown: 33311)
  * TK Phải thu (dropdown: 131 / 1311)
  * Ghi chú (textarea)
- 3 action buttons:
  [Duyệt ✓] — green button → confirmation modal with auto signature
  [Trả lại bổ sung] — orange outline → must enter reason
  [Từ chối] — red outline → must enter reason

"Đã duyệt" / "Đã từ chối" tabs:
- Simple list: Mã ĐN + CĐT + Ngày duyệt/từ chối + [Xem]

FOR "Nhân viên" / "Quản lý" ROLE:
- This page shows "Theo dõi trạng thái" instead of approval
- Read-only view: list of their (or department's) requests with status timeline
- NO approve/reject buttons
```

---

## PROMPT 8: TRANG "S-INVOICE"

```
Build the "S-Invoice" page — simple monitoring view.

Only visible to Kế toán and Quản trị viên.

SIMPLE LAYOUT:

Top: 4 count boxes in a row (small, not giant stat cards):
- "Chờ xuất: 3" (gray)
- "Đang xử lý: 1" (amber)
- "Thành công: 8" (green)
- "Lỗi: 2" (red)

Main: Simple table
Columns: Mã ĐN | CĐT | Giá trị | Trạng thái S-Invoice | Số HĐ | Mã CQT | Hành động

Status badges:
- "Chờ xuất" gray
- "Đang xử lý" amber with small spinner
- "Thành công" green with ✓
- "Lỗi" red with ✗

"Hành động" column:
- For "Lỗi": [Xem lỗi] + [Thử lại] buttons
- For "Thành công": [Xem chi tiết] button

Click [Xem lỗi] → simple modal:
- Error code + description + suggestion to fix
- [Đóng] + [Thử lại] buttons

Click [Xem chi tiết] → simple modal:
- Invoice info: Số HĐ, Mã CQT, Ngày xuất, CĐT, Giá trị
- [Đóng] button

Toggle at top right: "Tự động làm mới" switch (default off for simplicity)

NO complex tabs. NO API request/response JSON view (too technical for users).
```

---

## PROMPT 9: TRANG "CÀI ĐẶT"

```
Build the "Cài đặt" page — only for Kế toán and Quản trị viên.

Simple tab layout with 3 tabs:

Tab 1 — "Người dùng":
- Table: Họ tên | Email | Vai trò | Phòng ban | Chữ ký | Trạng thái
- "Chữ ký" shows "Đã có ✓" green or "Chưa có" gray
- [+ Thêm người dùng] button
- Simple — no complex CRUD, just display for demo

Tab 2 — "Hồ sơ pháp lý":
- Show checklist template per service type
- 4 service types in tabs: Tư vấn | Đo lường | Lắp đặt | Bảo trì
- Each shows list of required documents with [Sửa] [Xoá] icons
- [+ Thêm hồ sơ] button at bottom
- Simple list, no drag-to-reorder

Tab 3 — "Kết nối":
- 2 cards:
  Card "S-Invoice Viettel": Status ✅ Đã kết nối or ⚠ Chưa kết nối. [Kiểm tra] button.
  Card "Email SMTP": Status ✅ or ⚠. [Kiểm tra] button.
- NO VFS card (removed)
```

---

## PROMPT 10: CHỮ KÝ ĐIỆN TỬ + MODAL CHUNG

```
Build the shared components:

1. SIGNATURE SETUP (FirstTimeSignatureSetup component):
- Full-screen overlay (no sidebar, no header)
- Centered card, max 560px wide
- Title: "Thiết lập chữ ký điện tử"
- Subtitle: "Chữ ký sẽ được tự động gắn khi bạn duyệt hoặc cam kết"
- 3 simple tabs: "Vẽ tay" | "Nhập tên" | "Tải ảnh"
  * Vẽ tay: canvas 480x120, [Xoá] + [Hoàn tất]
  * Nhập tên: text input + 3 font previews to choose
  * Tải ảnh: upload zone PNG
- Preview at bottom: shows signature on a mini document mockup
- [Hoàn tất thiết lập] button — disabled until signature created

2. APPROVAL CONFIRMATION MODAL:
- Centered modal, 420px wide
- Icon: green shield ✓
- Title: "Xác nhận phê duyệt"
- Subtitle: "Đề nghị {mã ĐN}"
- Signature preview (from account): name + title + department + timestamp + lock icon
- [Huỷ] + [Xác nhận duyệt ✓] buttons

3. REJECT / RETURN MODAL:
- Same structure but red icon
- Textarea: "Lý do *" (required)
- [Huỷ] + [Xác nhận từ chối] or [Xác nhận trả lại] button

4. STATUS BADGES (shared component):
- Export as simple function: getStatusBadge(status) → returns correct colored badge
- Use consistently across ALL pages
- Pill shape: rounded-full, text-xs, font-medium, px-2.5, py-0.5

5. VIETNAMESE NUMBER FORMATTER:
- formatVND(number) → "2.450.000.000 đ"
- Use consistently in ALL tables and forms
```

---

## PROMPT 11: MOBILE RESPONSIVE

```
Add mobile responsive behavior to ALL pages. DO NOT change any desktop layout.

Rules — ONLY add responsive classes:

1. Sidebar: "hidden md:flex" → on mobile, show bottom tab bar (5 icons + labels, 48px height)
2. Tables: "hidden md:block" → on mobile, show card list instead
3. Forms: grid-cols-1 on mobile (already single column, just ensure inputs are full width)
4. Modals: nearly full screen on mobile (w-[95vw], bottom sheet style)
5. Font sizes: text-sm on mobile where needed
6. Main content: pb-16 on mobile (space for bottom tab bar)

Keep it simple — the app is already simple, just make sure it doesn't break on phone screens.
```

---

# THỨ TỰ PASTE

| # | Prompt | Kiểm tra |
|---|--------|----------|
| 1 | Khung + Navigation | Sidebar hiện 6 items, role switcher hoạt động? |
| 2 | Master Data | Không cần kiểm tra visual — chỉ data file |
| 3 | Việc cần làm | Chuyển role → nội dung thay đổi? |
| 4 | Hợp đồng | Xem danh sách → click → chi tiết + hồ sơ? |
| 5 | Đề nghị - Danh sách | Bảng hiện đúng, lọc hoạt động? |
| 6 | Đề nghị - Form | Chọn HĐ → auto fill? Tab 2 thừa kế hồ sơ? |
| 7 | Phê duyệt | KT thấy queue, NV thấy tracking? |
| 8 | S-Invoice | Bảng + modal lỗi? |
| 9 | Cài đặt | 3 tab hiện đúng? |
| 10 | Chữ ký + Modal | Modal duyệt/từ chối hoạt động? |
| 11 | Mobile | Không phá desktop? Bottom tab bar hiện? |

---

# KHÁC BIỆT SO VỚI BẢN CŨ

| Thay đổi | Bản cũ | Bản mới |
|----------|--------|---------|
| Dashboard | 6 stat cards + 2 charts | "Việc cần làm" — to-do list đơn giản |
| Hợp đồng | Không có | CÓ — quản lý HS pháp lý tại HĐ, thừa kế sang ĐN |
| Luồng duyệt | 2 nhánh (thường + PGĐ) | 1 nhánh — KT duyệt tất cả |
| VFS | Có module + đối soát | BỎ hoàn toàn |
| Giao diện | Phức tạp, nhiều biểu đồ | Đơn giản, ít thông tin, chữ to |
| Sidebar | 6–8 items + sub-items | 6 items phẳng, không sub-items |
| Bảng dữ liệu | 14 cột, phức tạp | 7–8 cột, đơn giản |
| Mobile | Sửa sau, hay lỗi | Thiết kế từ đầu |
