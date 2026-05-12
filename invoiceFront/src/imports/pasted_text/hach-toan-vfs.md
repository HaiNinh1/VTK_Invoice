Create a NEW page/frame "Hạch toán VFS" at 1440x900 for the VTK Invoice Management System. Viettel Red (#EE0033) brand. ALL text in Vietnamese.

This screen monitors automatic accounting synchronization from S-Invoice into VFS (Viettel Finance Solution). It shows which invoices have been accounted for and which have errors.

=== LEFT: Include the standard app sidebar (260px) with "Hạch toán VFS" nav item in ACTIVE state (bg #FFF1F3, left border 3px #EE0033, text #EE0033, Database icon). ===

=== TOP HEADER: Breadcrumb "Trang chủ / Hạch toán VFS" + standard header bar with bell, avatar, dark mode toggle ===

=== MAIN CONTENT (1180px width, 24px padding, bg #F9FAFB) ===

--- ROW 1: 4 STAT CARDS (single row, 16px gap) ---

Card 1: "Chờ hạch toán" — value "15" large 32px bold, icon Clock in Blue-100 circle, bg white, border Gray-200, border-radius 12px, shadow-sm
Card 2: "Đang hạch toán" — value "3" amber, icon RefreshCw spinning in Amber-100 circle
Card 3: "Đã hạch toán" — value "130" green, icon CheckCircle in Green-100 circle
Card 4: "Lỗi hạch toán" — value "2" red, icon AlertTriangle in Red-100 circle

--- ROW 2: AUTO-REFRESH BAR (48px, white bg card, border-radius 8px, flex between) ---

Left: Toggle switch "Tự động làm mới" ON + dropdown "30 giây ▾" (options: 15s/30s/60s/5 phút/Tắt)
Center: "Cập nhật lần cuối: 13/03/2026 14:32:15" 13px Gray-400
Right: [Làm mới] icon button (RefreshCw icon) + [Hạch toán thủ công hàng loạt] Red-600 outline button

--- ROW 3: DATA TABLE (white card, full width, border-radius 12px) ---

Filter bar (collapsible): Trạng thái select (Tất cả/Chờ/Đang/Đã HT/Lỗi) | TT Doanh thu select | Kế toán phụ trách select | Date range | Search "Tìm mã ĐN, số HĐ..."

Table columns (header bg #F9FAFB, 12px/600 UPPERCASE Gray-500):
| ☐ | Mã đề nghị | Số HĐ S-Invoice | Mã CQT | CĐT | Giá trị sau VAT | TK Nợ | TK Có | Số CT ghi sổ | Mã HĐ/Vụ việc | KT phụ trách | Trạng thái VFS | Ngày hạch toán | Hành động |

Generate 15 rows using the MASTER DATASET (consistent with other pages):
Row 1: DN-2026-00145 | K26TYY0000145 | 4A2B6C8D | VNPT Hà Nội | 2.695.000.000 | 131 | 5113 | CT-2026-0145 | VTK-HĐ-089 | Trần Thị B | "Đã HT" green badge | 13/03/2026 | [Xem]
Row 2: DN-2026-00146 | K26TYY0000146 | 5B3C7D9E | EVN Miền Bắc | 935.000.000 | 131 | 5112 | CT-2026-0146 | VTK-HĐ-090 | Trần Thị B | "Đã HT" green | 13/03/2026 | [Xem]
Row 3: DN-2026-00150 | — | — | LG Display HP | 6.380.000.000 | — | — | — | — | — | "Lỗi" red badge | — | [Thử lại] [Chi tiết lỗi]
Row 4: DN-2026-00155 | K26TYY0000155 | 7D5E9F1A | Nokia Networks | 1.210.000.000 | 131 | 5111 | CT-2026-0155 | VTK-HĐ-099 | Trần Thị B | "Đang HT" amber spinner | — | [—]
Row 5: DN-2026-00158 | K26TYY0000158 | 8E6F0G2B | Viettel Const | 9.350.000.000 | 131 | 5113 | CT-2026-0158 | VTK-HĐ-102 | Nguyễn Thị G | "Đang HT" amber | — | [—]
Rows 6-10: "Đã HT" green — various companies
Rows 11-15: "Chờ" gray — records still in S-Invoice pipeline

Error rows: red left border 3px. "Đang HT" rows: amber left border, subtle pulse bg.

Status badges:
- "Chờ" — bg #F3F4F6, text #6B7280
- "Đang HT" — bg #FEF3C7, text #92400E, left animated spinner 12px
- "Đã HT" — bg #D1FAE5, text #065F46, checkmark icon
- "Lỗi" — bg #FEE2E2, text #991B1B, warning icon

Actions column:
- "Đã HT": [Xem] eye icon button
- "Lỗi": [Thử lại] Red-600 small btn + [Chi tiết lỗi] outline small btn
- "Đang HT": no actions (grayed)
- "Chờ": [Đẩy thủ công] outline small btn

Pagination: "Hiển thị 1-15 / 150" + page size 20/50/100 + page buttons

--- MODAL 1: "Chi tiết bút toán hạch toán" (triggered by [Xem], 680px wide) ---

Header: "Chi tiết hạch toán — DN-2026-00145" 18px/600 + "Đã hạch toán ✓" green badge

Tab 1 "Bút toán":
Accounting entries table:
| STT | Diễn giải | TK Nợ | TK Có | Số tiền (đ) | Mã HĐ/VV |
| 1 | Ghi nhận doanh thu DV lắp đặt CT viễn thông | 131 (Phải thu KH) | 5113 (DT xây lắp) | 2.450.000.000 | VTK-HĐ-089 |
| 2 | Ghi nhận thuế GTGT đầu ra 10% | 131 (Phải thu KH) | 33311 (Thuế GTGT đầu ra) | 245.000.000 | VTK-HĐ-089 |
| | **Tổng cộng** | | | **2.695.000.000** | |

Tab 2 "Đối soát 3 chiều":
| Chỉ tiêu | Trên Đề nghị | Trên S-Invoice | Trên VFS | Khớp? |
| Giá trị trước VAT | 2.450.000.000 | 2.450.000.000 | 2.450.000.000 | ✓ green |
| Thuế GTGT | 245.000.000 | 245.000.000 | 245.000.000 | ✓ green |
| Tổng sau VAT | 2.695.000.000 | 2.695.000.000 | 2.695.000.000 | ✓ green |
| Số HĐ S-Invoice | — | K26TYY0000145 | K26TYY0000145 | ✓ green |
| Mã CQT | — | 4A2B6C8D | 4A2B6C8D | ✓ green |
Green ✓ = matched. Show a variant with ✕ red for mismatched values.

Tab 3 "Nhật ký":
Timeline: 
✅ Duyệt đề nghị — Trần Thị B — 13/03 15:42
✅ Xuất HĐ S-Invoice — Hệ thống — 13/03 15:43
✅ CQT cấp mã — S-Invoice — 13/03 15:44
✅ Đẩy sang VFS — Hệ thống — 13/03 15:45
✅ Hạch toán VFS — Hệ thống — 13/03 15:46

Footer: [Đóng] outline btn + [Xuất PDF bút toán] Red-600 outline btn

--- MODAL 2: "Chi tiết lỗi hạch toán" (triggered by [Chi tiết lỗi], 520px wide) ---

Red header bar: "❌ Lỗi hạch toán — DN-2026-00150"
Error info card (Red-50 bg):
- Mã lỗi: VFS-ERR-003
- Mô tả: "Không tìm thấy mã hợp đồng/vụ việc VTK-HĐ-094 trên VFS. Vui lòng kiểm tra mã HĐ đã được tạo trên VFS chưa."
- Thời gian lỗi: 13/03/2026 14:30:15
- Số lần thử: 3/3

Suggested fix: "1. Kiểm tra mã HĐ/VV trên VFS | 2. Cập nhật lại mã trên đề nghị | 3. Bấm Thử lại"

[Thử lại] Red-600 primary btn + [Hạch toán thủ công] amber outline btn + [Đóng] ghost btn