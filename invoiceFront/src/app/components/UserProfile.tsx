import { useState } from 'react';
import { Mail, Phone, Edit3, Upload, Bell, Lock, X } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useSignature, useChangePassword } from '../../lib/api/queries';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  director: 'Giám đốc',
  accountant: 'Kế toán viên',
  manager: 'Trưởng đơn vị',
  employee: 'Nhân viên',
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-3)
    .join('')
    .toUpperCase();
}

export default function UserProfile() {
  const { user, primaryRole } = useAuth();
  const signatureQuery = useSignature();
  const changePassword = useChangePassword();

  const [notificationSettings, setNotificationSettings] = useState({
    approvalEmail: true,
    legalReminder: true,
    dailyDigest: false,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const displayName = user?.name ?? '—';
  const initials = user ? initialsOf(user.name) : '';
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole;
  const departmentName = user?.department?.name ?? user?.revenue_center?.name ?? '—';
  const email = user?.email ?? '—';
  // No phone field on User type yet; show employee_code as a fallback secondary identifier.
  const secondaryId = user?.employee_code ?? '';

  const signature = signatureQuery.data;
  const hasSignature = !!signature?.data_path;

  async function handleSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      setPwError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    try {
      await changePassword.mutateAsync(pwForm);
      setPwSuccess(true);
      setPwForm({ old_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-2xl font-semibold text-[#111827]">Hồ sơ cá nhân</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý thông tin và cài đặt tài khoản của bạn</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto p-6">
        <div className="flex gap-6">
          {/* LEFT COLUMN */}
          <div className="w-[360px] space-y-6 flex-shrink-0">
            {/* Profile Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="relative group mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#EE0033] to-[#CC002B] flex items-center justify-center text-white text-3xl font-semibold mx-auto">
                  {initials || '—'}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    <Upload size={14} />
                    Thay ảnh
                  </span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-[#111827] mb-2">{displayName}</h2>
                <div className="inline-flex items-center h-6 px-3 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-medium mb-2">
                  {roleLabel}
                </div>
                <p className="text-sm text-[#6B7280]">{departmentName}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-[#9CA3AF] flex-shrink-0" />
                  <span className="text-[#374151] truncate">{email}</span>
                </div>
                {secondaryId && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-[#9CA3AF] flex-shrink-0" />
                    <span className="text-[#374151]">Mã NV: {secondaryId}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full h-10 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center gap-2 transition-colors mb-2"
              >
                <Lock size={14} />
                Đổi mật khẩu
              </button>
              <button
                disabled
                title="Sửa thông tin cá nhân — sắp ra mắt"
                className="w-full h-10 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#9CA3AF] flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Edit3 size={14} />
                Sửa thông tin
              </button>
            </div>

            {/* Signature Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-4">Chữ ký của tôi</h3>

              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 mb-3">
                <div className="h-[60px] flex items-center justify-center">
                  {signatureQuery.isLoading && (
                    <span className="text-xs text-[#9CA3AF]">Đang tải...</span>
                  )}
                  {!signatureQuery.isLoading && !hasSignature && (
                    <span className="text-xs text-[#9CA3AF]">Chưa có chữ ký</span>
                  )}
                  {hasSignature && (
                    <div
                      className="text-2xl text-[#374151]"
                      style={{ fontFamily: 'Brush Script MT, cursive' }}
                    >
                      {displayName}
                    </div>
                  )}
                </div>
              </div>

              {hasSignature && signature?.method && (
                <div className="text-xs text-[#6B7280] mb-4 text-center">
                  Phương thức: {signature.method === 'draw' ? 'Vẽ tay' : signature.method === 'text' ? 'Văn bản' : 'Tải lên'}
                </div>
              )}

              <button
                disabled
                title="Quản lý chữ ký — vào trang Cài đặt → Chữ ký"
                className="w-full h-9 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#9CA3AF] cursor-not-allowed"
              >
                {hasSignature ? 'Thay đổi chữ ký' : 'Tạo chữ ký'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 space-y-6">
            {/* Notification Settings */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={20} className="text-[#EE0033]" />
                <h3 className="text-base font-semibold text-[#111827]">Cài đặt thông báo</h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'approvalEmail' as const, title: 'Email khi duyệt/từ chối', desc: 'Nhận email khi đề nghị của bạn được duyệt hoặc từ chối' },
                  { key: 'legalReminder' as const, title: 'Email nhắc nhở pháp lý', desc: 'Nhận email nhắc nhở khi hồ sơ pháp lý sắp hết hạn' },
                  { key: 'dailyDigest' as const, title: 'Daily digest', desc: 'Nhận tổng hợp hoạt động hàng ngày vào 8:00 sáng' },
                ].map((row, idx, arr) => (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between py-3 ${idx !== arr.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                  >
                    <div>
                      <div className="text-sm font-medium text-[#111827] mb-0.5">{row.title}</div>
                      <div className="text-xs text-[#6B7280]">{row.desc}</div>
                    </div>
                    <button
                      onClick={() =>
                        setNotificationSettings((prev) => ({ ...prev, [row.key]: !prev[row.key] }))
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notificationSettings[row.key] ? 'bg-[#EE0033]' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notificationSettings[row.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-4">
                Lưu ý: Tùy chọn thông báo hiện chỉ lưu cục bộ. Tích hợp backend sẽ được bổ sung trong giai đoạn tiếp theo.
              </p>
            </div>

            {/* Permissions / Roles */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#111827] mb-4">Vai trò & quyền</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {(user?.roles ?? []).map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-medium"
                  >
                    {ROLE_LABELS[r] ?? r}
                  </span>
                ))}
                {(user?.roles ?? []).length === 0 && (
                  <span className="text-xs text-[#9CA3AF]">Chưa được gán vai trò</span>
                )}
              </div>
              <div className="text-xs text-[#6B7280]">
                Số quyền: <span className="font-medium text-[#111827]">{user?.permissions?.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827]">Đổi mật khẩu</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPwError(null);
                  setPwSuccess(false);
                }}
                className="text-[#9CA3AF] hover:text-[#374151]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={pwForm.old_password}
                  onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={pwForm.new_password_confirmation}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, new_password_confirmation: e.target.value }))
                  }
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033]"
                />
              </div>
              {pwError && (
                <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="text-sm text-[#16A34A] bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-3">
                  Đổi mật khẩu thành công.
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPwError(null);
                    setPwSuccess(false);
                  }}
                  className="h-9 px-4 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="h-9 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] disabled:opacity-50"
                >
                  {changePassword.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
