import { useAuth } from '../lib/auth/AuthProvider';
import LoginPage from './pages/LoginPage';
import App from './App';
import { MasterInvoiceDataProvider } from './data/masterInvoiceData';

export default function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#F9FAFB]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#EE0033] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-[#6B7280]">Đang tải…</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <MasterInvoiceDataProvider>
      <App />
    </MasterInvoiceDataProvider>
  );
}
