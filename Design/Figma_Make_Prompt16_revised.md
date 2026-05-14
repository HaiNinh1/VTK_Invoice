# PROMPT 16 (SỬA LẠI): GỘP PHÁP LÝ VÀO ĐỀ NGHỊ XUẤT HĐ
> Thay thế Prompt 16 cũ (trang Pháp lý riêng)
> Pháp lý trở thành TAB trong trang "Đề nghị xuất HĐ"
> Sidebar giữ nguyên 6 items — KHÔNG thêm mục mới

---

```
UPDATE the "Đề nghị xuất HĐ" page to add legal document tracking as a tab.
DO NOT add any new sidebar navigation item. DO NOT create a separate page.

CURRENT TABS on this page (from Prompt 13):
  Tab "Tất cả đề nghị"
  Tab "Chờ xuất HĐ ({count})"

ADD a third tab:
  Tab "Tất cả đề nghị"
  Tab "Chờ xuất HĐ ({count})"
  Tab "Hồ sơ pháp lý" ← NEW

VISIBILITY: Tab "Hồ sơ pháp lý" only visible to roles "Kế toán", "Quản lý", "Quản trị viên".
Nhân viên does NOT see this tab — they manage their own docs in the contract detail and invoice form.

=== TAB "Hồ sơ pháp lý" CONTENT ===

TOP: 4 simple count boxes in a row (small, compact — same style as S-Invoice page):
- "Đủ hồ sơ: 12" (green text, light green bg)
- "Đang bổ sung: 5" (amber text, light amber bg)
- "Thiếu: 8" (gray text, light gray bg)
- "Quá hạn: 3" (red text, light red bg, bold)

Counts are calculated from all contracts in masterData.

ALERT BANNER (only if overdue > 0):
Red card below count boxes:
"⚠ Có {count} hồ sơ quá hạn bổ sung tại {list of contract numbers}"
This banner is dismissible (X button) but reappears on next page load if still relevant.

FILTER BAR (simple, single row):
- Trạng thái PL: dropdown (Tất cả / Đủ / Đang bổ sung / Thiếu / Quá hạn)
- Loại HĐ: dropdown (Tất cả / then options from invoiceTypeConfigs: Lắp đặt / Tư vấn / Đo lường / Bảo trì / ...)
- Trung tâm DT: dropdown (Tất cả / KV1 / KV2 / KV3 / ... )
- Search: text input "Tìm số HĐ, tên CĐT..."
For "Quản lý" role: TT DT filter is locked to their department.

MAIN TABLE:
Simple table with columns:
| Số HĐ | CĐT | Loại HĐ | Tiến độ HS | Thiếu | Quá hạn | Hành động |

- "Tiến độ HS": text "8/11" with inline color:
  11/11 = green text "Đủ ✓"
  6-10/11 = amber text
  0-5/11 = red text
- "Thiếu": number of missing docs, or "—" if none
- "Quá hạn": red badge with count, or "—"
- [Xem chi tiết] button in Hành động column

CLICK [Xem chi tiết] → EXPAND ROW INLINE (accordion style):
DO NOT navigate away. The row expands below to show the full checklist for that contract.

Expanded content:
- Contract summary line: "HĐ: 15/2025/HĐKT-VTK | CĐT: VNPT Hà Nội | Loại: Lắp đặt | Ký: 15/01/2025"

- Checklist displayed as 4 groups (from invoiceTypeConfigs for this contract's service type):

  ▼ Hồ sơ Hợp đồng (2/3)
  ✓ Hợp đồng đã ký — HĐ_15_2025.pdf — 12/01/2025 [Xem]
  ✓ Phụ lục hợp đồng — PL_HĐ_15.pdf — 15/01/2025 [Xem]
  ✗ Biên bản đàm phán giá — [Tải lên]

  ▼ Hồ sơ Nghiệm thu (1/3)
  ✓ BB nghiệm thu khối lượng — BBNT_KL.pdf — 20/02/2025 [Xem]
  ✗ BB nghiệm thu hoàn thành — [Tải lên]
  ✗ Bảng tổng hợp KL nghiệm thu — Quá hạn 12 ngày ⚠ — [Tải lên]

  (... other groups ...)

- Each ✓ item: green check + doc name + file name + upload date + [Xem] link (blue)
- Each ✗ item: gray circle + doc name + [Tải lên] button (gray outline)
- Overdue ✗ items: red text "Quá hạn X ngày ⚠" next to name, red border on the row
- Required items show small red asterisk *. Non-required show "(không bắt buộc)" gray text.

- Bottom of expanded section:
  [Đi đến hợp đồng →] link (navigates to contract detail page)
  [Thu gọn ▲] button to collapse

ACCOUNTANT UPLOAD: Kế toán CAN click [Tải lên] to upload docs on behalf of employees.
Quản lý can only VIEW, cannot upload.

EXPORT:
[Xuất báo cáo pháp lý] button at top right of the tab, next to filter bar.
Exports the table to Excel:
- All columns from the table
- Each contract has expanded rows showing individual document status
- Summary row at bottom: total contracts, total docs checked, total missing, total overdue
- Color coding in Excel: green cells for complete, red for overdue

PAGINATION: Same as main list — 10 items per page, simple Prev/Next.

=== SIDEBAR — KEEP AS IS ===
DO NOT add "Pháp lý" to sidebar. The 6 items remain:
1. Việc cần làm
2. Hợp đồng
3. Đề nghị xuất HĐ (now has 3 tabs internally)
4. Phê duyệt
5. S-Invoice
6. Cài đặt

=== DATA CONNECTION ===
The checklist items shown in the expanded row come from:
1. invoiceTypeConfigs (Prompt 12) — defines WHAT documents are needed for this service type
2. contract.documents (masterData) — defines which documents have ALREADY been uploaded
3. Match by document name — if uploaded doc matches a required doc name → show as ✓

This is the SAME logic used in Contract detail (Prompt 4) and Invoice form Tab 2 (Prompt 6) — just displayed in a read-only summary view aggregated across all contracts.
```

---

## CẬP NHẬT SIDEBAR CUỐI CÙNG (6 items, không đổi)

```
1. 📋 Việc cần làm        → Tab: Việc cần làm | Báo cáo (KT only)
2. 📄 Hợp đồng            → List + Detail + CRUD + Upload HS + Tiến độ
3. 📝 Đề nghị xuất HĐ     → Tab: Tất cả ĐN | Chờ xuất HĐ | Hồ sơ pháp lý (KT/QL)
4. ✅ Phê duyệt            → Queue + Detail + Approve/Reject/Return + Tracking (NV/QL)
5. 📊 S-Invoice            → Monitoring + Error detail + Retry
6. ⚙️ Cài đặt              → Tab: Người dùng | Loại HĐ & Tài liệu BB | Kết nối | Thông báo
```

Truy cập qua avatar/bell (không chiếm sidebar):
- Hồ sơ cá nhân (avatar → dropdown)
- Trung tâm thông báo (bell icon)
- Đăng nhập / Đăng xuất
