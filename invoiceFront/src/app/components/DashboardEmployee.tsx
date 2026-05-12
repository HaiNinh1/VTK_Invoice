import { FileText, Clock, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { MASTER_INVOICE_DATA, getMonthlyStats, getRecentRequests } from '../data/masterInvoiceData';

interface DashboardEmployeeProps {
  getStatusBadge: (status: string) => JSX.Element;
  getLegalIcon: (legal: string) => JSX.Element;
}

export default function DashboardEmployee({ getStatusBadge, getLegalIcon }: DashboardEmployeeProps) {
  // Filter data for current employee (Nguyễn Văn A)
  const myRecords = MASTER_INVOICE_DATA.filter(r => r.creator === 'Nguyễn Văn A');
  const myPending = myRecords.filter(r => r.status === 'pending');
  const myIssued = myRecords.filter(r => r.status === 'issued' || r.status === 'accounted');
  const myIncompleteLegal = myRecords.filter(r => r.legalStatus.status !== 'complete');
  const myActiveCommitments = myRecords.filter(r => r.commitment !== null);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} tỷ đ`;
    }
    return value.toLocaleString('vi-VN') + ' đ';
  };

  const getLegalStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'complete': 'complete',
      'insufficient': 'missing',
      'overdue': 'overdue',
      'supplementing': 'committed'
    };
    return map[status] || 'complete';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">
          Tổng quan — Đề nghị của tôi
        </h1>
        <p className="text-sm text-[#6B7280]">
          Xin chào, Nguyễn Văn A. Đây là tổng hợp đề nghị của bạn.
        </p>
      </div>

      {/* Stat Cards - 4 cards only for employees */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1F3] flex items-center justify-center">
              <FileText size={20} className="text-[#EE0033]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#111827] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {myRecords.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Đề nghị của tôi</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <Clock size={20} className="text-[#D97706]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#D97706] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {myPending.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Chờ phê duyệt</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#DC2626]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#DC2626] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {myIncompleteLegal.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Hồ sơ cần bổ sung</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle size={20} className="text-[#16A34A]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#16A34A] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {myIssued.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Đã xuất HĐ</div>
        </div>
      </div>

      {/* Active Commitments Section */}
      {myActiveCommitments.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">📝 Cam kết đang theo dõi</h2>
            <span className="text-xs text-[#6B7280]">{myActiveCommitments.length} cam kết</span>
          </div>
          <div className="space-y-3">
            {myActiveCommitments.map((record) => (
              <div 
                key={record.id}
                className="flex items-center justify-between p-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#111827] mb-1">
                    {record.requestCode} — {record.customer}
                  </div>
                  <div className="text-xs text-[#92400E]">
                    Cam kết: {record.commitment?.code} • Hạn: {record.commitment?.deadline} ({record.commitment?.daysRemaining} ngày)
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  record.commitment?.status === 'overdue' 
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : record.commitment?.status === 'near-due'
                    ? 'bg-[#FED7AA] text-[#EA580C]'
                    : 'bg-[#D1FAE5] text-[#16A34A]'
                }`}>
                  {record.commitment?.status === 'overdue' ? 'Quá hạn' : 
                   record.commitment?.status === 'near-due' ? 'Sắp hết hạn' : 'Còn hạn'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Requests Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#111827]">Đề nghị của tôi</h3>
          <span className="text-sm text-[#6B7280]">{myRecords.length} đề nghị</span>
        </div>
        
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã đề nghị</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Chủ đầu tư</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Dịch vụ</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Giá trị sau VAT</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Pháp lý</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {myRecords.map((record) => (
                <tr key={record.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#EE0033]">{record.requestCode}</td>
                  <td className="px-6 py-4 text-sm text-[#374151]">{record.customer}</td>
                  <td className="px-6 py-4 text-sm text-[#374151]">{record.serviceType}</td>
                  <td className="px-6 py-4 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {(record.afterVAT || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {getLegalIcon(getLegalStatusLabel(record.legalStatus.status))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280]">{record.createdDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="block md:hidden p-3 space-y-2">
          {myRecords.map((record) => (
            <div key={record.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-[#EE0033]">{record.requestCode}</span>
                <div>{getStatusBadge(record.status)}</div>
              </div>
              <div className="text-sm text-[#374151] mb-2 truncate">{record.customer}</div>
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(record.afterVAT || 0).toLocaleString('vi-VN')} đ</span>
                <div className="flex items-center gap-2">
                  <span>{record.createdDate}</span>
                  {getLegalIcon(getLegalStatusLabel(record.legalStatus.status))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}