import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { ApiError } from '../../lib/api/errors';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(email, password);
      // AuthProvider state change unmounts LoginPage automatically.
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isValidation() && err.fields) {
          setFieldErrors(err.fields);
          setError(err.message);
        } else if (err.status === 401 || err.status === 422) {
          setError('Email hoặc mật khẩu không đúng.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#EE0033] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <div>
            <div className="font-semibold text-[#111827] text-lg">VTK Invoice</div>
            <div className="text-xs text-[#6B7280]">Viettel Tech Services</div>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-[#111827] mb-1">Đăng nhập</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Hệ thống quản lý đề nghị xuất hóa đơn
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
              placeholder="ten.ban@viettel.com.vn"
            />
            {fieldErrors.email?.map((m, i) => (
              <div key={i} className="text-xs text-[#DC2626] mt-1">
                {m}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent"
              placeholder="••••••••"
            />
            {fieldErrors.password?.map((m, i) => (
              <div key={i} className="text-xs text-[#DC2626] mt-1">
                {m}
              </div>
            ))}
          </div>

          {error && !Object.keys(fieldErrors).length && (
            <div className="text-sm text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#EE0033] text-white font-medium rounded-lg hover:bg-[#C8002B] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-xs text-[#9CA3AF] text-center">
          © 2026 Viettel VTK · Nội bộ
        </div>
      </div>
    </div>
  );
}
