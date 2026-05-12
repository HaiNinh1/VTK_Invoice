import { useState } from 'react';
import {
  Users, GitBranch, CheckSquare, PenTool, Link, Clock,
  Plus, Trash2, GripVertical, ChevronRight, Check, X,
  AlertTriangle, Settings as SettingsIcon, Download, Upload,
  Search, Filter, Calendar, Eye, Info, Mail, Shield, CheckCircle, Minus as MinusIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';

interface SettingsProps {
  userRole?: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function Settings({ userRole = 'admin' }: SettingsProps) {
  const [activeSubNav, setActiveSubNav] = useState<'permissions' | 'matrix' | 'workflow' | 'checklist' | 'signature' | 'connections' | 'logs' | 'email'>('permissions');
  const [emailTemplateModal, setEmailTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureTab, setSignatureTab] = useState<'draw' | 'text' | 'upload'>('draw');
  const [checklistServiceType, setChecklistServiceType] = useState<'consulting' | 'measurement' | 'installation' | 'maintenance'>('consulting');
  const [hasSignature, setHasSignature] = useState(true); // Toggle to test empty state
  const [selectedFont, setSelectedFont] = useState<'script' | 'serif' | 'handwritten' | 'print'>('script');

  // User permissions data
  const usersData = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@viettel.com.vn', department: 'Phòng Kế toán', center: 'TT Khu vực 1', role: 'Admin', active: true },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@viettel.com.vn', department: 'Phòng Kế toán', center: 'TT Khu vực 1', role: 'KT', active: true },
    { id: 3, name: 'Lê Văn C', email: 'levanc@viettel.com.vn', department: 'Phòng Kinh doanh', center: 'TT Khu vực 2', role: 'NV', active: true },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@viettel.com.vn', department: 'Phòng Kinh doanh', center: 'TT Khu vực 3', role: 'QL', active: true },
    { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@viettel.com.vn', department: 'Ban Giám đốc', center: 'Trụ sở chính', role: 'GĐ', active: true },
    { id: 6, name: 'Đỗ Thị F', email: 'dothif@viettel.com.vn', department: 'Phòng Kế toán', center: 'TT Khu vực 1', role: 'KT', active: true },
    { id: 7, name: 'Vũ Văn G', email: 'vuvang@viettel.com.vn', department: 'Phòng Kỹ thuật', center: 'TT Khu vực 2', role: 'NV', active: false },
    { id: 8, name: 'Bùi Thị H', email: 'buithih@viettel.com.vn', department: 'Phòng Kinh doanh', center: 'TT Khu vực 3', role: 'NV', active: true },
    { id: 9, name: 'Ngô Văn I', email: 'ngovani@viettel.com.vn', department: 'Phòng Kế toán', center: 'TT Khu vực 2', role: 'KT', active: true },
    { id: 10, name: 'Phan Thị J', email: 'phanthij@viettel.com.vn', department: 'Ban Giám đốc', center: 'Trụ sở chính', role: 'GĐ', active: true }
  ];

  // Checklist items by service type
  const checklistData = {
    consulting: [
      { id: 1, name: 'Hợp đồng dịch vụ', group: 'Hợp đồng', required: true, deadline: 3 },
      { id: 2, name: 'Biên bản nghiệm thu', group: 'Nghiệm thu', required: true, deadline: 5 },
      { id: 3, name: 'Báo cáo tư vấn', group: 'Kỹ thuật', required: true, deadline: 7 },
      { id: 4, name: 'Phụ lục kỹ thuật', group: 'Kỹ thuật', required: false, deadline: 3 }
    ],
    measurement: [
      { id: 1, name: 'Hợp đồng đo lường', group: 'Hợp đồng', required: true, deadline: 3 },
      { id: 2, name: 'Biên bản đo đạc', group: 'Nghiệm thu', required: true, deadline: 5 },
      { id: 3, name: 'Báo cáo kết quả đo', group: 'Kỹ thuật', required: true, deadline: 7 }
    ],
    installation: [
      { id: 1, name: 'Hợp đồng lắp đặt', group: 'Hợp đồng', required: true, deadline: 3 },
      { id: 2, name: 'Biên bản nghiệm thu', group: 'Nghiệm thu', required: true, deadline: 5 },
      { id: 3, name: 'Chứng từ giao nhận', group: 'Giao nhận', required: true, deadline: 2 }
    ],
    maintenance: [
      { id: 1, name: 'Hợp đồng bảo trì', group: 'Hợp đồng', required: true, deadline: 3 },
      { id: 2, name: 'Báo cáo bảo trì', group: 'Kỹ thuật', required: true, deadline: 7 }
    ]
  };

  // Activity logs
  const activityLogs = [
    { id: 1, timestamp: '13/03/2026 15:23:45', user: 'Nguyễn Văn A', action: 'Phê duyệt', target: 'DN-2026-00156', details: 'Đã duyệt đề nghị xuất HĐ', ip: '192.168.1.101' },
    { id: 2, timestamp: '13/03/2026 14:15:32', user: 'Trần Thị B', action: 'Tạo mới', target: 'DN-2026-00156', details: 'Tạo đề nghị xuất HĐ mới', ip: '192.168.1.102' },
    { id: 3, timestamp: '13/03/2026 13:42:18', user: 'Hoàng Văn E', action: 'Cập nhật', target: 'Quy trình duyệt', details: 'Thay đổi người duyệt bước 3', ip: '192.168.1.105' },
    { id: 4, timestamp: '13/03/2026 11:30:55', user: 'Nguyễn Văn A', action: 'Xuất hoá đơn', target: 'DN-2026-00155', details: 'Đẩy dữ liệu lên S-Invoice', ip: '192.168.1.101' },
    { id: 5, timestamp: '13/03/2026 10:22:14', user: 'Đỗ Thị F', action: 'Kiểm tra', target: 'DN-2026-00154', details: 'Soát xét hồ sơ pháp lý', ip: '192.168.1.106' },
    { id: 6, timestamp: '12/03/2026 16:45:33', user: 'Phan Thị J', action: 'Từ chối', target: 'DN-2026-00153', details: 'Từ chối do thiếu hồ sơ', ip: '192.168.1.110' },
    { id: 7, timestamp: '12/03/2026 15:12:27', user: 'Nguyễn Văn A', action: 'Cấu hình', target: 'Kết nối VFS', details: 'Kiểm tra kết nối VFS', ip: '192.168.1.101' },
    { id: 8, timestamp: '12/03/2026 14:03:51', user: 'Trần Thị B', action: 'Tạo mới', target: 'DN-2026-00152', details: 'Tạo đề nghị xuất HĐ mới', ip: '192.168.1.102' },
    { id: 9, timestamp: '12/03/2026 11:25:09', user: 'Hoàng Văn E', action: 'Phê duyệt', target: 'DN-2026-00151', details: 'Đã duyệt đề nghị xuất HĐ', ip: '192.168.1.105' },
    { id: 10, timestamp: '12/03/2026 10:18:44', user: 'Ngô Văn I', action: 'Cập nhật', target: 'DN-2026-00150', details: 'Cập nhật thông tin khách hàng', ip: '192.168.1.109' },
    { id: 11, timestamp: '11/03/2026 16:52:21', user: 'Nguyễn Văn A', action: 'Phân quyền', target: 'Vũ Văn G', details: 'Vô hiệu hoá tài khoản', ip: '192.168.1.101' },
    { id: 12, timestamp: '11/03/2026 15:37:16', user: 'Bùi Thị H', action: 'Tạo mới', target: 'DN-2026-00149', details: 'Tạo đề nghị xuất HĐ mới', ip: '192.168.1.108' },
    { id: 13, timestamp: '11/03/2026 14:28:03', user: 'Đỗ Thị F', action: 'Kiểm tra', target: 'DN-2026-00148', details: 'Soát xét hồ sơ pháp lý', ip: '192.168.1.106' },
    { id: 14, timestamp: '11/03/2026 11:15:39', user: 'Hoàng Văn E', action: 'Cấu hình', target: 'Checklist pháp lý', details: 'Thêm hồ sơ bắt buộc mới', ip: '192.168.1.105' },
    { id: 15, timestamp: '11/03/2026 09:42:55', user: 'Nguyễn Văn A', action: 'Xuất hoá đơn', target: 'DN-2026-00147', details: 'Đẩy dữ liệu lên S-Invoice', ip: '192.168.1.101' }
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* HEADER */}
      <div className="shrink-0 pb-4">
        <h1 className="text-2xl font-semibold text-[#111827]">Cài đặt hệ thống</h1>
        <p className="text-sm text-[#6B7280] mt-1">Quản trị và cấu hình hệ thống VTK Invoice</p>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* LEFT SUB-NAV */}
        <aside className="w-[200px] shrink-0 bg-white border border-[#E5E7EB] rounded-xl p-3 self-start">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSubNav('permissions')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'permissions'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <Users size={16} className={activeSubNav === 'permissions' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Người dùng</span>
            </button>

            {(userRole === 'admin' || userRole === 'director') && (
              <button
                onClick={() => setActiveSubNav('matrix')}
                className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeSubNav === 'matrix'
                    ? 'bg-[#FFF1F3] text-[#EE0033]'
                    : 'text-[#374151] hover:bg-[#F3F4F6]'
                }`}
              >
                <Shield size={16} className={activeSubNav === 'matrix' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
                <span>Ma trận quyền</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubNav('workflow')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'workflow'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <GitBranch size={16} className={activeSubNav === 'workflow' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Quy trình duyệt</span>
            </button>

            <button
              onClick={() => setActiveSubNav('checklist')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'checklist'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <CheckSquare size={16} className={activeSubNav === 'checklist' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Checklist pháp lý</span>
            </button>

            <button
              onClick={() => setActiveSubNav('signature')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'signature'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <PenTool size={16} className={activeSubNav === 'signature' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Chữ ký số</span>
            </button>

            <button
              onClick={() => setActiveSubNav('connections')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'connections'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <Link size={16} className={activeSubNav === 'connections' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Kết nối</span>
            </button>

            <button
              onClick={() => setActiveSubNav('logs')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'logs'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <Clock size={16} className={activeSubNav === 'logs' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Nhật ký</span>
            </button>

            <button
              onClick={() => setActiveSubNav('email')}
              className={`w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all ${
                activeSubNav === 'email'
                  ? 'bg-[#FFF1F3] text-[#EE0033]'
                  : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <Mail size={16} className={activeSubNav === 'email' ? 'text-[#EE0033]' : 'text-[#6B7280]'} />
              <span>Thông báo Email</span>
            </button>
          </nav>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 min-h-0 bg-white border border-[#E5E7EB] rounded-xl overflow-y-auto">
          {/* PERMISSIONS */}
          {activeSubNav === 'permissions' && (
            <div>
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Quản lý phân quyền</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Quản lý người dùng và vai trò trong hệ thống</p>
                </div>
                <button className="h-9 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2">
                  <Plus size={16} />
                  Thêm người dùng
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Họ tên</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Phòng ban</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Phòng/TT</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Vai trò</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.map((user) => (
                      <tr key={user.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm font-medium text-[#374151]">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-[#374151]">{user.department}</td>
                        <td className="px-6 py-4 text-sm text-[#374151]">{user.center}</td>
                        <td className="px-6 py-4">
                          <select 
                            className="h-8 px-2 pr-8 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white"
                            value={user.role}
                            onChange={() => {}}
                          >
                            <option value="NV">Nhân viên</option>
                            <option value="QL">Quản lý</option>
                            <option value="KT">Kế toán</option>
                            <option value="GĐ">Giám đốc</option>
                            <option value="Admin">Quản trị viên</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                user.active ? 'bg-[#16A34A]' : 'bg-[#D1D5DB]'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  user.active ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button className="h-8 px-3 text-[#EE0033] text-sm font-medium hover:bg-[#FFF1F3] rounded">
                              Sửa
                            </button>
                            <button className="h-8 px-3 text-[#DC2626] text-sm font-medium hover:bg-[#FEE2E2] rounded">
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PERMISSION MATRIX */}
              <div className="p-6 border-t-4 border-[#E5E7EB] bg-[#FAFBFC]">
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-[#111827] flex items-center gap-2">
                    Ma trận phân quyền
                    <span className="text-xs font-normal text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded">
                      Có thể chỉnh sửa
                    </span>
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-1">Cấu hình chi tiết quyền truy cập cho từng vai trò</p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F9FAFB]">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-[#374151] w-[350px]">Chức năng</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-[#374151] w-[130px]">
                          <div>Nhân viên</div>
                          <div className="text-xs font-normal text-[#6B7280] mt-0.5">NV</div>
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-[#374151] w-[130px]">
                          <div>Kế toán</div>
                          <div className="text-xs font-normal text-[#6B7280] mt-0.5">KT</div>
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-[#374151] w-[130px]">
                          <div>Giám đốc</div>
                          <div className="text-xs font-normal text-[#6B7280] mt-0.5">GĐ</div>
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-[#374151] w-[130px]">
                          <div>Quản trị</div>
                          <div className="text-xs font-normal text-[#6B7280] mt-0.5">Admin</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Xem đề nghị của mình</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Xem đề nghị toàn công ty</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Tạo đề nghị mới</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Sửa đề nghị (nháp)</td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs font-medium text-[#1D4ED8] bg-[#DBEAFE] px-2 py-1 rounded inline-block">
                            Của mình
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 5 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Upload hồ sơ pháp lý</td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs font-medium text-[#1D4ED8] bg-[#DBEAFE] px-2 py-1 rounded inline-block">
                            Của mình
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 6 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Tạo cam kết bổ sung</td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs font-medium text-[#1D4ED8] bg-[#DBEAFE] px-2 py-1 rounded inline-block">
                            Của mình
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                      </tr>

                      {/* Row 7 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Duyệt thường (kế toán)</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                      </tr>

                      {/* Row 8 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Duyệt đặc biệt (Giám đốc)</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                      </tr>

                      {/* Row 9 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Xem S-Invoice</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 10 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Xem Hạch toán VFS</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 11 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Xem Báo cáo toàn công ty</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 12 */}
                      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Quản trị hệ thống</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>

                      {/* Row 13 */}
                      <tr className="hover:bg-[#FAFBFC]">
                        <td className="px-6 py-3 text-sm text-[#374151]">Quản lý người dùng</td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center mx-auto transition-colors">
                            <span className="text-[#9CA3AF] font-bold text-lg">—</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="w-8 h-8 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] flex items-center justify-center mx-auto transition-colors">
                            <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Save Button & Note */}
                <div className="mt-6">
                  <button className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2">
                    <Check size={16} />
                    Lưu thay đổi quyền
                  </button>
                  <p className="text-[13px] text-[#9CA3AF] mt-3">
                    Thay đổi quyền áp dụng ngay lập tức cho tất cả người dùng thuộc vai trò.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PERMISSION MATRIX */}
          {activeSubNav === 'matrix' && (
            <div>
              <div className="p-6 border-b border-[#E5E7EB]">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Ma trận phân quyền hệ thống</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Xem chi tiết quyền hạn của từng vai trò trong hệ thống</p>
                </div>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border border-[#E5E7EB] rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#F9FAFB]">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-[#111827] border-b border-r border-[#E5E7EB] w-[300px]">
                          Chức năng
                        </th>
                        <th className="text-center px-6 py-4 border-b border-r border-[#E5E7EB] w-[140px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#111827]">Nhân viên</span>
                            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[#DBEAFE] text-[#1E40AF]">
                              EMPLOYEE
                            </span>
                          </div>
                        </th>
                        <th className="text-center px-6 py-4 border-b border-r border-[#E5E7EB] w-[140px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#111827]">Quản lý</span>
                            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[#FED7AA] text-[#C2410C] border border-[#FED7AA]">
                              MANAGER
                            </span>
                          </div>
                        </th>
                        <th className="text-center px-6 py-4 border-b border-r border-[#E5E7EB] w-[140px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#111827]">Kế toán</span>
                            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[#FEF3C7] text-[#92400E]">
                              ACCOUNTANT
                            </span>
                          </div>
                        </th>
                        <th className="text-center px-6 py-4 border-b border-r border-[#E5E7EB] w-[140px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#111827]">Giám đốc</span>
                            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[#DDD6FE] text-[#5B21B6]">
                              DIRECTOR
                            </span>
                          </div>
                        </th>
                        <th className="text-center px-6 py-4 border-b border-[#E5E7EB] w-[140px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#111827]">Quản trị</span>
                            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-[#FEE2E2] text-[#991B1B]">
                              ADMIN
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem đề nghị của mình
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem đề nghị phòng ban
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem đề nghị toàn công ty
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Tạo đề nghị mới
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 5 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Sửa đề nghị (nháp, của mình)
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#1D4ED8]">Của mình</span>
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#1D4ED8]">Của mình</span>
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 6 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Upload hồ sơ pháp lý
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#1D4ED8]">Của mình</span>
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#1D4ED8]">Của mình</span>
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 7 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Tạo cam kết bổ sung
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#1D4ED8]">Của mình</span>
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <span className="text-xs font-medium text-[#1D4ED8]">Của mình</span>
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 8 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Theo dõi duyệt phòng ban
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 9 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Duyệt thường (Kế toán)
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 10 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Duyệt đặc biệt (Giám đốc)
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 11 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem S-Invoice
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 12 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem hạch toán VFS
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 13 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem báo cáo phòng ban
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 14 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Xem báo cáo toàn công ty
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 15 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-b border-r border-[#E5E7EB] font-medium">
                          Quản trị hệ thống
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-r border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-b border-[#E5E7EB]">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>

                      {/* Row 16 */}
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-6 py-4 text-sm text-[#374151] border-r border-[#E5E7EB] font-medium">
                          Quản lý người dùng
                        </td>
                        <td className="px-6 py-4 text-center border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center border-r border-[#E5E7EB]">
                          <MinusIcon size={20} className="text-[#9CA3AF] mx-auto" strokeWidth={2.5} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CheckCircle size={20} className="text-[#16A34A] mx-auto" strokeWidth={2.5} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Note */}
                <div className="mt-6 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg flex items-start gap-3">
                  <Info size={18} className="text-[#6B7280] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#6B7280]">
                    <p className="font-medium text-[#374151] mb-1">Ma trận quyền mặc định</p>
                    <p>Đây là cấu hình phân quyền tiêu chuẩn của hệ thống VTK Invoice. Liên hệ Quản trị viên để thay đổi quyền hạn theo yêu cầu nghiệp vụ cụ thể của công ty.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WORKFLOW */}
          {activeSubNav === 'workflow' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#111827]">Cấu hình quy trình phê duyệt</h2>
                <p className="text-sm text-[#6B7280] mt-1">Thiết lập các bước và người xử lý trong quy trình</p>
              </div>

              {/* Workflow Steps */}
              <div className="flex items-stretch gap-4 mb-8 overflow-x-auto pb-4">
                {/* Step 1 */}
                <div className="flex-shrink-0 w-[220px] bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#EE0033] text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#16A34A]">
                      <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">Tạo đề nghị</h3>
                  <div className="space-y-2 text-xs text-[#6B7280]">
                    <div>
                      <span className="block mb-1">Người xử lý:</span>
                      <select className="w-full h-7 px-2 border border-[#D1D5DB] rounded text-xs">
                        <option>Nhân viên kinh doanh</option>
                      </select>
                    </div>
                    <div>
                      <span className="block mb-1">Thời gian: 1 ngày</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <ChevronRight size={24} className="text-[#D1D5DB]" />
                </div>

                {/* Step 2 */}
                <div className="flex-shrink-0 w-[220px] bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#EE0033] text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#16A34A]">
                      <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">KT soát xét</h3>
                  <div className="space-y-2 text-xs text-[#6B7280]">
                    <div>
                      <span className="block mb-1">Người xử lý:</span>
                      <select className="w-full h-7 px-2 border border-[#D1D5DB] rounded text-xs">
                        <option>Kế toán viên</option>
                      </select>
                    </div>
                    <div>
                      <span className="block mb-1">Thời gian: 2 ngày</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <ChevronRight size={24} className="text-[#D1D5DB]" />
                </div>

                {/* Step 3 */}
                <div className="flex-shrink-0 w-[220px] bg-[#FFF1F3] border-2 border-[#EE0033] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#EE0033] text-white flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#16A34A]">
                      <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">PGĐ phê duyệt *</h3>
                  <div className="space-y-2 text-xs text-[#6B7280]">
                    <div>
                      <span className="block mb-1">Người xử lý:</span>
                      <select className="w-full h-7 px-2 border border-[#D1D5DB] rounded text-xs">
                        <option>Phó giám đốc</option>
                      </select>
                    </div>
                    <div>
                      <span className="block mb-1">Thời gian: 1 ngày</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <ChevronRight size={24} className="text-[#D1D5DB]" />
                </div>

                {/* Step 4 */}
                <div className="flex-shrink-0 w-[220px] bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#EE0033] text-white flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#16A34A]">
                      <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">S-Invoice tự động</h3>
                  <div className="text-xs text-[#6B7280]">
                    <p>Đẩy dữ liệu lên hệ thống S-Invoice tự động sau khi phê duyệt</p>
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <ChevronRight size={24} className="text-[#D1D5DB]" />
                </div>

                {/* Step 5 */}
                <div className="flex-shrink-0 w-[220px] bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#EE0033] text-white flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#16A34A]">
                      <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">VFS tự động</h3>
                  <div className="text-xs text-[#6B7280]">
                    <p>Tự động hạch toán vào VFS sau khi xuất hoá đơn thành công</p>
                  </div>
                </div>
              </div>

              {/* Special Toggles */}
              <div className="bg-[#F9FAFB] rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Cấu hình đặc biệt</h3>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E7EB]">
                  <div>
                    <div className="text-sm font-medium text-[#374151]">Bắt buộc PGĐ duyệt khi thiếu hồ sơ pháp lý</div>
                    <div className="text-xs text-[#6B7280] mt-1">Yêu cầu phê duyệt từ PGĐ khi có cam kết bổ sung hồ sơ</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#16A34A]">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E7EB]">
                  <div>
                    <div className="text-sm font-medium text-[#374151]">Cho phép xuất HĐ có cam kết bổ sung</div>
                    <div className="text-xs text-[#6B7280] mt-1">Cho phép xuất hoá đơn khi có cam kết bổ sung hồ sơ sau</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#16A34A]">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E7EB]">
                  <div>
                    <div className="text-sm font-medium text-[#374151]">Tự động gửi email thông báo</div>
                    <div className="text-xs text-[#6B7280] mt-1">Gửi email tự động cho người xử lý khi có đề nghị mới</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#D1D5DB]">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CHECKLIST */}
          {activeSubNav === 'checklist' && (
            <div>
              <div className="p-6 border-b border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827]">Quản lý checklist pháp lý</h2>
                <p className="text-sm text-[#6B7280] mt-1">Cấu hình danh sách hồ sơ theo từng loại dịch vụ</p>
              </div>

              {/* Service Type Tabs */}
              <div className="flex border-b border-[#E5E7EB] px-6">
                <button
                  onClick={() => setChecklistServiceType('consulting')}
                  className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                    checklistServiceType === 'consulting'
                      ? 'border-[#EE0033] text-[#EE0033]'
                      : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  Tư vấn
                </button>
                <button
                  onClick={() => setChecklistServiceType('measurement')}
                  className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                    checklistServiceType === 'measurement'
                      ? 'border-[#EE0033] text-[#EE0033]'
                      : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  Đo lường
                </button>
                <button
                  onClick={() => setChecklistServiceType('installation')}
                  className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                    checklistServiceType === 'installation'
                      ? 'border-[#EE0033] text-[#EE0033]'
                      : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  Lắp đặt
                </button>
                <button
                  onClick={() => setChecklistServiceType('maintenance')}
                  className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                    checklistServiceType === 'maintenance'
                      ? 'border-[#EE0033] text-[#EE0033]'
                      : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  Bảo trì
                </button>
              </div>

              {/* Checklist Items */}
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  {checklistData[checklistServiceType].map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors">
                      <button className="cursor-grab hover:bg-[#E5E7EB] p-1 rounded">
                        <GripVertical size={16} className="text-[#9CA3AF]" />
                      </button>
                      
                      <input
                        type="text"
                        value={item.name}
                        className="flex-1 h-8 px-3 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] bg-white"
                      />

                      <select 
                        className="h-8 px-2 pr-8 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white w-[140px]"
                        value={item.group}
                      >
                        <option value="Hợp đồng">Hợp đồng</option>
                        <option value="Kỹ thuật">Kỹ thuật</option>
                        <option value="Nghiệm thu">Nghiệm thu</option>
                        <option value="Giao nhận">Giao nhận</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={item.required} className="w-4 h-4 text-[#EE0033] border-[#D1D5DB] rounded focus:ring-[#EE0033]" />
                        <span className="text-xs text-[#6B7280] whitespace-nowrap">Bắt buộc</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6B7280] whitespace-nowrap">Hạn:</span>
                        <input
                          type="number"
                          value={item.deadline}
                          className="w-14 h-8 px-2 border border-[#D1D5DB] rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                        />
                        <span className="text-xs text-[#6B7280]">ngày</span>
                      </div>

                      <button className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="w-full h-10 border-2 border-dashed border-[#D1D5DB] rounded-lg text-sm font-medium text-[#6B7280] hover:border-[#EE0033] hover:text-[#EE0033] transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Thêm hồ sơ
                </button>
              </div>
            </div>
          )}

          {/* SIGNATURE */}
          {activeSubNav === 'signature' && (
            <div>
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Quản lý chữ ký số</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Mỗi tài khoản chỉ cần tạo chữ ký 1 lần. Chữ ký sẽ tự động gắn vào các văn bản khi bạn phê duyệt hoặc cam kết.</p>
                </div>
                <button 
                  onClick={() => setSignatureModalOpen(true)}
                  className="h-9 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2"
                >
                  <Plus size={16} />
                  Tạo chữ ký mới
                </button>
              </div>

              {/* Info Banner */}
              <div className="mx-6 mt-6 p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg flex items-start gap-3">
                <div className="text-lg">💡</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1E40AF] mb-1">Chữ ký tự động</div>
                  <div className="text-xs text-[#1E40AF]">
                    Chữ ký này sẽ tự động xuất hiện trên: <strong>Biên bản phê duyệt</strong>, <strong>Cam kết bổ sung hồ sơ</strong>, <strong>Văn bản xác nhận</strong>.
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Current User's Signature */}
                  <div className="border-2 border-[#EE0033] rounded-lg p-4 relative">
                    <span className="absolute -top-2 left-3 px-2 py-0.5 bg-[#EE0033] text-white text-[10px] font-semibold rounded">
                      ĐANG SỬ DỤNG
                    </span>
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <h3 className="text-sm font-semibold text-[#374151]">Nguyễn Văn A</h3>
                      <span className="text-xs px-2 py-1 bg-[#D1FAE5] text-[#065F46] rounded">Tài khoản của bạn</span>
                    </div>
                    <div className="h-24 bg-[#F9FAFB] rounded border border-[#E5E7EB] flex items-center justify-center mb-3">
                      <div className="text-[#374151] font-serif italic text-2xl">Nguyễn Văn A</div>
                    </div>
                    <div className="text-xs text-[#6B7280] mb-3">
                      Tạo lúc: 10/03/2026 14:25:33
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSignatureModalOpen(true)}
                        className="flex-1 h-8 text-xs bg-[#EE0033] text-white rounded hover:bg-[#CC002B]"
                      >
                        Thay đổi chữ ký
                      </button>
                    </div>
                  </div>

                  {/* Other User Example */}
                  <div className="border border-[#E5E7EB] rounded-lg p-4 opacity-60">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#374151]">Hoàng Văn E</h3>
                      <span className="text-xs px-2 py-1 bg-[#F3F4F6] text-[#6B7280] rounded">Giám đốc</span>
                    </div>
                    <div className="h-24 bg-[#F9FAFB] rounded border border-[#E5E7EB] flex items-center justify-center mb-3">
                      <div className="text-[#374151] font-serif italic text-2xl">Hoàng Văn E</div>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mb-3">
                      Chỉ quản trị viên có thể chỉnh sửa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONNECTIONS */}
          {activeSubNav === 'connections' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#111827]">Quản lý kết nối hệ thống</h2>
                <p className="text-sm text-[#6B7280] mt-1">Cấu hình kết nối với các hệ thống bên ngoài</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* S-Invoice */}
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <div className="p-6 bg-[#ECFDF5] border-b border-[#6EE7B7]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#111827]">S-Invoice</h3>
                        <p className="text-xs text-[#6B7280] mt-1">Hệ thống xuất hoá đơn điện tử</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#16A34A] flex items-center justify-center">
                        <Check size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-medium">
                      <div className="w-2 h-2 rounded-full bg-[#16A34A]"></div>
                      Đã kết nối
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="text-xs">
                      <span className="text-[#6B7280]">URL:</span>
                      <div className="text-[#374151] mt-1 font-mono text-[11px] break-all">
                        https://api.sinvoice.viettel.vn
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-[#6B7280]">Đồng bộ cuối:</span>
                      <div className="text-[#374151] mt-1">13/03/2026 15:42:33</div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button className="flex-1 h-8 text-xs bg-white border border-[#D1D5DB] text-[#374151] rounded hover:bg-[#F3F4F6]">
                        Kiểm tra
                      </button>
                      <button className="flex-1 h-8 text-xs bg-[#EE0033] text-white rounded hover:bg-[#CC002B]">
                        Cấu hình
                      </button>
                    </div>
                  </div>
                </div>

                {/* VFS */}
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <div className="p-6 bg-[#ECFDF5] border-b border-[#6EE7B7]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#111827]">VFS</h3>
                        <p className="text-xs text-[#6B7280] mt-1">Hệ thống tài chính kế toán</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#16A34A] flex items-center justify-center">
                        <Check size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-medium">
                      <div className="w-2 h-2 rounded-full bg-[#16A34A]"></div>
                      Đã kết nối
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="text-xs">
                      <span className="text-[#6B7280]">URL:</span>
                      <div className="text-[#374151] mt-1 font-mono text-[11px] break-all">
                        https://vfs.viettel.vn/api
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-[#6B7280]">Đồng bộ cuối:</span>
                      <div className="text-[#374151] mt-1">13/03/2026 14:28:17</div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button className="flex-1 h-8 text-xs bg-white border border-[#D1D5DB] text-[#374151] rounded hover:bg-[#F3F4F6]">
                        Kiểm tra
                      </button>
                      <button className="flex-1 h-8 text-xs bg-[#EE0033] text-white rounded hover:bg-[#CC002B]">
                        Cấu hình
                      </button>
                    </div>
                  </div>
                </div>

                {/* VOF */}
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <div className="p-6 bg-[#FFFBEB] border-b border-[#FCD34D]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#111827]">VOF</h3>
                        <p className="text-xs text-[#6B7280] mt-1">Hệ thống quản lý văn bản</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#D97706] flex items-center justify-center">
                        <AlertTriangle size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FEF3C7] text-[#92400E] rounded-full text-xs font-medium">
                      <div className="w-2 h-2 rounded-full bg-[#D97706]"></div>
                      Chưa kết nối
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="text-xs">
                      <span className="text-[#6B7280]">URL:</span>
                      <div className="text-[#9CA3AF] mt-1 font-mono text-[11px]">
                        Chưa cấu hình
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-[#6B7280]">Đồng bộ cuối:</span>
                      <div className="text-[#9CA3AF] mt-1">—</div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button className="flex-1 h-8 text-xs bg-white border border-[#D1D5DB] text-[#9CA3AF] rounded cursor-not-allowed">
                        Kiểm tra
                      </button>
                      <button className="flex-1 h-8 text-xs bg-[#EE0033] text-white rounded hover:bg-[#CC002B]">
                        Cấu hình
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGS */}
          {activeSubNav === 'logs' && (
            <div>
              <div className="p-6 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111827]">Nhật ký hoạt động</h2>
                    <p className="text-sm text-[#6B7280] mt-1">Theo dõi các hoạt động trong hệ thống</p>
                  </div>
                  <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
                    <Download size={16} />
                    Xuất báo cáo
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      className="w-full h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Từ ngày"
                      className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] w-36"
                    />
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                  <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                    <option>Tất cả người dùng</option>
                    <option>Nguyễn Văn A</option>
                    <option>Trần Thị B</option>
                  </select>
                  <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                    <option>Tất cả hành động</option>
                    <option>Tạo mới</option>
                    <option>Phê duyệt</option>
                    <option>Từ chối</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Thời gian</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Người dùng</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Hành động</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Đối tượng</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Chi tiết</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                        <td className="px-6 py-3 text-xs text-[#6B7280] whitespace-nowrap font-mono">{log.timestamp}</td>
                        <td className="px-6 py-3 text-sm text-[#374151] whitespace-nowrap">{log.user}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center h-6 px-2.5 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-[#EE0033] font-medium whitespace-nowrap">{log.target}</td>
                        <td className="px-6 py-3 text-sm text-[#6B7280]">{log.details}</td>
                        <td className="px-6 py-3 text-xs text-[#6B7280] font-mono whitespace-nowrap">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EMAIL NOTIFICATIONS */}
          {activeSubNav === 'email' && (
            <div>
              <div className="p-6 border-b border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827]">Cấu hình thông báo Email</h2>
                <p className="text-sm text-[#6B7280] mt-1">Quản lý email tự động và cài đặt nhận thông báo</p>
              </div>

              {/* SECTION 1: Email triggers */}
              <div className="p-6 border-b border-[#E5E7EB]">
                <h3 className="text-[18px] font-semibold text-[#111827] mb-4">Cấu hình gửi Email tự động</h3>
                
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F3F4F6]">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Sự kiện</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Người nhận</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mẫu email</th>
                        <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase w-32">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { event: 'Đề nghị mới được tạo', recipient: 'Kế toán phụ trách', template: 'Thông báo đề nghị mới', enabled: true },
                        { event: 'Đề nghị được gửi duyệt', recipient: 'Kế toán phụ trách', template: 'Yêu cầu soát xét', enabled: true },
                        { event: 'Đề nghị được duyệt', recipient: 'Người tạo đề nghị', template: 'Thông báo đã duyệt', enabled: true },
                        { event: 'Đề nghị bị từ chối', recipient: 'Người tạo đề nghị', template: 'Thông báo từ chối + lý do', enabled: true },
                        { event: 'Đề nghị được trả lại', recipient: 'Người tạo đề nghị', template: 'Yêu cầu bổ sung + lý do', enabled: true },
                        { event: 'Hoá đơn đã xuất trên S-Invoice', recipient: 'Người tạo + CĐT (email buyer)', template: 'HĐ đính kèm PDF', enabled: true },
                        { event: 'Hạch toán VFS hoàn thành', recipient: 'Kế toán phụ trách', template: 'Xác nhận hạch toán', enabled: false },
                        { event: 'Hồ sơ pháp lý sắp hết hạn (3 ngày)', recipient: 'Người tạo đề nghị', template: 'Nhắc nhở bổ sung HS', enabled: true },
                        { event: 'Hồ sơ pháp lý quá hạn', recipient: 'Người tạo + Kế toán + PGĐ', template: 'Cảnh báo quá hạn', enabled: true },
                        { event: 'Cam kết sắp đến hạn (7 ngày)', recipient: 'Người cam kết', template: 'Nhắc nhở cam kết', enabled: true },
                        { event: 'Cam kết quá hạn', recipient: 'Người cam kết + PGĐ', template: 'Cảnh báo quá hạn CK', enabled: true },
                        { event: 'Lỗi xuất HĐ S-Invoice', recipient: 'Kế toán phụ trách', template: 'Thông báo lỗi + mã lỗi', enabled: true }
                      ].map((rule, idx) => (
                        <tr key={idx} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                          <td className="px-6 py-4 text-sm text-[#374151]">{rule.event}</td>
                          <td className="px-6 py-4 text-sm text-[#6B7280]">{rule.recipient}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                setSelectedTemplate(rule.template);
                                setEmailTemplateModal(true);
                              }}
                              className="text-sm text-[#1D4ED8] hover:underline"
                            >
                              {rule.template}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button
                                onClick={() => {}}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  rule.enabled ? 'bg-[#16A34A]' : 'bg-[#D1D5DB]'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    rule.enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button className="mt-4 h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
                  <Plus size={16} />
                  Thêm quy tắc mới
                </button>
              </div>

              {/* SECTION 3: SMTP Configuration */}
              <div className="p-6 border-b border-[#E5E7EB]">
                <h3 className="text-[16px] font-semibold text-[#111827] mb-4">Cấu hình máy chủ Email (SMTP)</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">SMTP Server</label>
                    <input
                      type="text"
                      defaultValue="smtp.gmail.com"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">Port</label>
                    <input
                      type="text"
                      defaultValue="587"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">Mã hoá</label>
                    <select className="w-full h-10 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                      <option>TLS</option>
                      <option>SSL</option>
                      <option>None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">Tài khoản</label>
                    <input
                      type="text"
                      defaultValue="no-reply@vtk.com.vn"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">Mật khẩu</label>
                    <input
                      type="password"
                      defaultValue="••••••••••••"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2">Email gửi đi</label>
                    <input
                      type="text"
                      defaultValue="no-reply@vtk.com.vn"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#374151] mb-2">Tên hiển thị</label>
                    <input
                      type="text"
                      defaultValue="VTK Invoice System"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <button className="h-10 px-6 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                    Gửi email thử
                  </button>
                  <button className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B]">
                    Lưu cấu hình
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#16A34A]">
                  <Check size={16} className="flex-shrink-0" />
                  <span>Kết nối SMTP thành công — gửi thử OK lúc 13/03/2026</span>
                </div>
              </div>

              {/* SECTION 4: Personal preferences */}
              <div className="p-6">
                <h3 className="text-[16px] font-semibold text-[#111827] mb-4">Cài đặt nhận thông báo của tôi</h3>
                
                <div className="space-y-3 mb-4">
                  {[
                    { label: 'Nhận email khi đề nghị được duyệt/từ chối', checked: true },
                    { label: 'Nhận email nhắc nhở hồ sơ pháp lý', checked: true },
                    { label: 'Nhận email nhắc nhở cam kết', checked: true },
                    { label: 'Nhận email tổng hợp cuối ngày (daily digest)', checked: false },
                    { label: 'Nhận email khi có đề nghị mới cần duyệt (chỉ Kế toán/GĐ)', checked: false }
                  ].map((pref, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={pref.checked}
                        className="w-5 h-5 rounded border-[#D1D5DB] text-[#EE0033] focus:ring-[#EE0033] cursor-pointer"
                      />
                      <span className="text-sm text-[#374151]">{pref.label}</span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-[#9CA3AF]">
                  Một số email bắt buộc không thể tắt (quá hạn pháp lý, lỗi hệ thống).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EMAIL TEMPLATE MODAL */}
      <Dialog open={emailTemplateModal} onOpenChange={setEmailTemplateModal}>
        <DialogContent className="md:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Xem trước mẫu Email</DialogTitle>
          </DialogHeader>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Email Headers */}
              <div className="mb-6 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-[#6B7280] w-20">Subject:</span>
                  <span className="text-sm text-[#111827] flex-1">VTK — Đề nghị xuất HĐ DN-2026-00145 đã được duyệt</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-[#6B7280] w-20">From:</span>
                  <span className="text-sm text-[#111827] flex-1">VTK Invoice System &lt;no-reply@vtk.com.vn&gt;</span>
                </div>
              </div>

              {/* Email Preview */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                {/* Header Banner */}
                <div className="h-16 bg-[#EE0033] flex items-center px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                      <span className="text-[#EE0033] font-bold text-lg">V</span>
                    </div>
                    <div className="text-white">
                      <div className="font-semibold text-lg">VTK</div>
                      <div className="text-xs opacity-90">Invoice System</div>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6 bg-white">
                  <p className="text-sm text-[#374151] mb-4">Kính gửi anh/chị <strong>Nguyễn Văn A</strong>,</p>
                  
                  <p className="text-sm text-[#374151] mb-6">
                    Đề nghị xuất hoá đơn mã <strong className="text-[#EE0033]">DN-2026-00145</strong> đã được phê duyệt bởi <strong>Trần Thị B — Kế toán thanh toán</strong> vào lúc <strong>13/03/2026 15:42</strong>.
                  </p>

                  {/* Summary Table */}
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 mb-6">
                    <div className="text-xs font-semibold text-[#6B7280] uppercase mb-3">Thông tin đề nghị</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Chủ đầu tư:</span>
                        <span className="text-[#111827] font-medium">VNPT Hà Nội</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Giá trị:</span>
                        <span className="text-[#111827] font-medium">4.752.000.000 ₫</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Loại dịch vụ:</span>
                        <span className="text-[#111827] font-medium">Dịch vụ Cloud</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mb-6">
                    <button className="h-10 px-6 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B]">
                      Xem chi tiết trên hệ thống
                    </button>
                  </div>

                  <div className="text-center text-xs text-[#9CA3AF] pt-4 border-t border-[#E5E7EB]">
                    Đây là email tự động từ Hệ thống Quản lý Xuất Hoá đơn VTK.
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline">Sửa mẫu</Button>
              <Button onClick={() => setEmailTemplateModal(false)} className="bg-[#EE0033] text-white hover:bg-[#CC002B]">
                Đóng
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SIGNATURE MODAL */}
      <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
        <DialogContent className="md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Thiết lập chữ ký cho tài khoản</DialogTitle>
          </DialogHeader>
          <div className="px-6">
            <div className="flex items-start gap-2 p-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-lg">
              <AlertTriangle size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#92400E]">
                Chữ ký mới sẽ thay thế chữ ký hiện tại và tự động áp dụng cho tất cả văn bản sau này.
              </p>
            </div>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-[#E5E7EB] px-6">
            <button
              onClick={() => setSignatureTab('draw')}
              className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                signatureTab === 'draw'
                  ? 'border-[#EE0033] text-[#EE0033]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Vẽ tay
            </button>
            <button
              onClick={() => setSignatureTab('text')}
              className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                signatureTab === 'text'
                  ? 'border-[#EE0033] text-[#EE0033]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Chữ ký văn bản
            </button>
            <button
              onClick={() => setSignatureTab('upload')}
              className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                signatureTab === 'upload'
                  ? 'border-[#EE0033] text-[#EE0033]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Tải ảnh lên
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {signatureTab === 'draw' && (
              <div>
                <div className="border-2 border-dashed border-[#D1D5DB] rounded-lg h-64 bg-white flex items-center justify-center mb-4">
                  <span className="text-[#9CA3AF] text-sm">Vẽ chữ ký của bạn ở đây</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-9 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                    Xoá
                  </button>
                  <button className="flex-1 h-9 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                    Làm mới
                  </button>
                </div>
              </div>
            )}

            {signatureTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">Nhập tên của bạn</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">Chọn font chữ</label>
                  <select className="w-full h-10 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white" value={selectedFont} onChange={(e) => setSelectedFont(e.target.value as 'script' | 'serif' | 'handwritten' | 'print')}>
                    <option value="script" style={{ fontFamily: 'cursive' }}>Dancing Script</option>
                    <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
                    <option value="handwritten" style={{ fontFamily: 'monospace' }}>Monospace</option>
                    <option value="print" style={{ fontFamily: 'sans-serif' }}>Sans-serif</option>
                  </select>
                </div>
                <div className="border border-[#E5E7EB] rounded-lg h-48 bg-[#F9FAFB] flex items-center justify-center">
                  <div className="text-4xl font-serif italic text-[#374151]">Nguyễn Văn A</div>
                </div>
              </div>
            )}

            {signatureTab === 'upload' && (
              <div>
                <div className="border-2 border-dashed border-[#D1D5DB] rounded-lg p-12 text-center hover:border-[#EE0033] transition-colors cursor-pointer">
                  <Upload size={48} className="mx-auto text-[#9CA3AF] mb-4" />
                  <p className="text-sm text-[#6B7280] mb-2">
                    Kéo thả file hoặc <span className="text-[#EE0033] font-medium">chọn file</span>
                  </p>
                  <p className="text-xs text-[#9CA3AF]">PNG, JPG (tối đa 2MB)</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button className="bg-[#EE0033] text-white hover:bg-[#CC002B]">
              Lưu chữ ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}