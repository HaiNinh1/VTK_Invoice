import { useState, useEffect } from 'react';
import { 
  Clock, RefreshCw, CheckCircle, AlertTriangle, Eye, RotateCcw, 
  FileText, ChevronDown, ChevronUp, Search, Filter, X, Download
} from 'lucide-react';
import { MASTER_INVOICE_DATA } from '../data/masterInvoiceData';
import type { InvoiceRequest } from '../data/masterInvoiceData';

interface AccountingVFSProps {
  viewport: 'desktop' | 'tablet' | 'mobile';
}

// Accounting status badge component
function AccountingStatusBadge({ status }: { status: 'pending' | 'processing' | 'completed' | 'error' }) {
  const configs = {
    pending: {
      bg: '#F3F4F6',
      text: '#6B7280',
      label: 'Chờ',
      icon: null
    },
    processing: {
      bg: '#FEF3C7',
      text: '#92400E',
      label: 'Đang HT',
      icon: <RefreshCw size={12} className="animate-spin" />
    },
    completed: {
      bg: '#D1FAE5',
      text: '#065F46',
      label: 'Đã HT',
      icon: <CheckCircle size={12} />
    },
    error: {
      bg: '#FEE2E2',
      text: '#991B1B',
      label: 'Lỗi',
      icon: <AlertTriangle size={12} />
    }
  };

  const config = configs[status];

  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export default function AccountingVFS({ viewport }: AccountingVFSProps) {
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [refreshDropdownOpen, setRefreshDropdownOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'accounting' | 'reconciliation' | 'timeline'>('accounting');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [accountantFilter, setAccountantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock accounting data based on master dataset
  const accountingData = MASTER_INVOICE_DATA.slice(0, 15).map((record, index) => {
    let vfsStatus: 'pending' | 'processing' | 'completed' | 'error' = 'completed';
    
    if (index === 2) vfsStatus = 'error';
    if (index === 3 || index === 4) vfsStatus = 'processing';
    if (index >= 10) vfsStatus = 'pending';
    
    // Safe extraction of request ID parts
    const requestIdParts = record.requestCode ? record.requestCode.split('-') : ['DN', '2026', '00000'];
    const requestIdNumber = requestIdParts[2] || '00000';
    
    return {
      requestId: record.requestCode,
      customer: record.customer,
      amount: record.afterVAT || 0,
      beforeVAT: record.beforeVAT || 0,
      vatAmount: (record.afterVAT || 0) - (record.beforeVAT || 0),
      vfsStatus,
      sInvoiceNumber: vfsStatus !== 'pending' && vfsStatus !== 'error' ? `K26TYY${String(index).padStart(6, '0')}` : '—',
      cqtCode: vfsStatus !== 'pending' && vfsStatus !== 'error' ? ['4A2B6C8D', '5B3C7D9E', '6C4D8E0F', '7D5E9F1A', '8E6F0G2B'][index % 5] : '—',
      debitAccount: vfsStatus === 'completed' ? '131' : '—',
      creditAccount: vfsStatus === 'completed' ? ['5113', '5112', '5111'][index % 3] : '—',
      voucherNumber: vfsStatus === 'completed' ? `CT-2026-${requestIdNumber}` : '—',
      projectCode: vfsStatus === 'completed' ? `VTK-HĐ-${String(89 + index).padStart(3, '0')}` : '—',
      accountant: ['Trần Thị B', 'Nguyễn Thị G', 'Lê Văn H'][index % 3],
      accountingDate: vfsStatus === 'completed' ? '13/03/2026' : '—',
      errorCode: vfsStatus === 'error' ? 'VFS-ERR-003' : null,
      errorMessage: vfsStatus === 'error' ? 'Không tìm thấy mã hợp đồng/vụ việc trên VFS' : null,
      retryCount: vfsStatus === 'error' ? 3 : 0
    };
  });

  // Calculate stats
  const stats = {
    pending: accountingData.filter(r => r.vfsStatus === 'pending').length,
    processing: accountingData.filter(r => r.vfsStatus === 'processing').length,
    completed: accountingData.filter(r => r.vfsStatus === 'completed').length,
    error: accountingData.filter(r => r.vfsStatus === 'error').length
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalMs = refreshInterval === 'off' ? 0 : parseInt(refreshInterval) * 1000;
    if (intervalMs === 0) return;

    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  // Filter data
  const filteredData = accountingData.filter(record => {
    if (statusFilter !== 'all' && record.vfsStatus !== statusFilter) return false;
    if (searchQuery && !record.requestId.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !record.sInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
            <Clock size={20} className="text-[#2563EB]" />
          </div>
          <div>
            <div className="text-[32px] font-bold text-[#2563EB]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.pending}
            </div>
            <div className="text-[13px] text-[#6B7280] mt-1">Chờ hạch toán</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
            <RefreshCw size={20} className="text-[#D97706] animate-spin" />
          </div>
          <div>
            <div className="text-[32px] font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.processing}
            </div>
            <div className="text-[13px] text-[#6B7280] mt-1">Đang hạch toán</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
            <CheckCircle size={20} className="text-[#16A34A]" />
          </div>
          <div>
            <div className="text-[32px] font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.completed}
            </div>
            <div className="text-[13px] text-[#6B7280] mt-1">Đã hạch toán</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <AlertTriangle size={20} className="text-[#DC2626]" />
          </div>
          <div>
            <div className="text-[32px] font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.error}
            </div>
            <div className="text-[13px] text-[#6B7280] mt-1">Lỗi hạch toán</div>
          </div>
        </div>
      </div>

      {/* Auto-refresh Bar */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-4 flex items-center justify-between h-[56px]">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div 
              className={`w-11 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-[#EE0033]' : 'bg-[#D1D5DB]'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform m-0.5 ${autoRefresh ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-[#374151]">Tự động làm mới</span>
          </label>

          <div className="relative">
            <button
              onClick={() => setRefreshDropdownOpen(!refreshDropdownOpen)}
              className="h-8 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
            >
              {refreshInterval === '15' ? '15 giây' :
               refreshInterval === '30' ? '30 giây' :
               refreshInterval === '60' ? '60 giây' :
               refreshInterval === '300' ? '5 phút' : 'Tắt'}
              <ChevronDown size={14} />
            </button>

            {refreshDropdownOpen && (
              <div className="absolute left-0 top-10 w-32 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-10 py-1">
                {[
                  { value: '15', label: '15 giây' },
                  { value: '30', label: '30 giây' },
                  { value: '60', label: '60 giây' },
                  { value: '300', label: '5 phút' },
                  { value: 'off', label: 'Tắt' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setRefreshInterval(option.value);
                      setRefreshDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[#F3F4F6] ${
                      refreshInterval === option.value ? 'text-[#EE0033] font-medium bg-[#FFF1F3]' : 'text-[#374151]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-[#9CA3AF]">
          Cập nhật lần cuối: {formatTime(lastUpdated)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="h-8 px-3 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
          <button className="h-8 px-3 bg-white border border-[#EE0033] text-[#EE0033] rounded-lg text-sm font-medium hover:bg-[#FFF1F3] transition-colors">
            Hạch toán thủ công hàng loạt
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        {/* Filter Bar */}
        <div className="border-b border-[#E5E7EB]">
          <button
            onClick={() => setFilterExpanded(!filterExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#6B7280]" />
              <span className="text-sm font-medium text-[#374151]">Bộ lọc</span>
            </div>
            {filterExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {filterExpanded && (
            <div className="px-6 pb-4 grid grid-cols-5 gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ</option>
                <option value="processing">Đang HT</option>
                <option value="completed">Đã HT</option>
                <option value="error">Lỗi</option>
              </select>

              <select 
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white"
              >
                <option value="all">TT Doanh thu</option>
                <option value="1">TT Khu vực 1</option>
                <option value="2">TT Khu vực 2</option>
              </select>

              <select 
                value={accountantFilter}
                onChange={(e) => setAccountantFilter(e.target.value)}
                className="h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white"
              >
                <option value="all">Kế toán phụ trách</option>
                <option value="b">Trần Thị B</option>
                <option value="g">Nguyễn Thị G</option>
                <option value="h">Lê Văn H</option>
              </select>

              <input
                type="date"
                className="h-10 px-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white"
              />

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Tìm mã ĐN, số HĐ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] bg-white placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#D1D5DB]" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã đề nghị</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Số HĐ S-Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã CQT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">CĐT</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Giá trị sau VAT</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">TK Nợ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">TK Có</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Số CT ghi sổ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã HĐ/VV</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">KT phụ trách</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trạng thái VFS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ngày HT</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record) => (
                <tr 
                  key={record.requestId}
                  className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors ${
                    record.vfsStatus === 'error' ? 'border-l-4 border-l-[#DC2626]' : ''
                  } ${
                    record.vfsStatus === 'processing' ? 'border-l-4 border-l-[#F59E0B] bg-[#FFFBEB]/30' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#D1D5DB]" />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#EE0033]">{record.requestId}</td>
                  <td className="px-4 py-3 text-sm text-[#374151]">{record.sInvoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] font-mono">{record.cqtCode}</td>
                  <td className="px-4 py-3 text-sm text-[#374151]">{record.customer}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {record.amount.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151] text-center font-mono">{record.debitAccount}</td>
                  <td className="px-4 py-3 text-sm text-[#374151] text-center font-mono">{record.creditAccount}</td>
                  <td className="px-4 py-3 text-sm text-[#374151]">{record.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm text-[#374151]">{record.projectCode}</td>
                  <td className="px-4 py-3 text-sm text-[#374151]">{record.accountant}</td>
                  <td className="px-4 py-3">
                    <AccountingStatusBadge status={record.vfsStatus} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{record.accountingDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {record.vfsStatus === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} className="text-[#6B7280]" />
                        </button>
                      )}
                      {record.vfsStatus === 'error' && (
                        <>
                          <button className="h-7 px-2.5 bg-[#EE0033] text-white rounded text-xs font-medium hover:bg-[#CC002B] transition-colors">
                            Thử lại
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowErrorModal(true);
                            }}
                            className="h-7 px-2.5 border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] transition-colors"
                          >
                            Chi tiết lỗi
                          </button>
                        </>
                      )}
                      {record.vfsStatus === 'processing' && (
                        <span className="text-xs text-[#9CA3AF]">—</span>
                      )}
                      {record.vfsStatus === 'pending' && (
                        <button className="h-7 px-2.5 border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] transition-colors">
                          Đẩy thủ công
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            Hiển thị 1-{filteredData.length} / 150
          </div>
          <div className="flex items-center gap-2">
            <select className="h-8 px-2 border border-[#D1D5DB] rounded text-sm">
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
            <div className="flex gap-1">
              <button className="w-8 h-8 border border-[#D1D5DB] rounded hover:bg-[#F3F4F6] text-sm">1</button>
              <button className="w-8 h-8 border border-[#D1D5DB] rounded hover:bg-[#F3F4F6] text-sm">2</button>
              <button className="w-8 h-8 border border-[#D1D5DB] rounded hover:bg-[#F3F4F6] text-sm">3</button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-[#111827]">
                  Chi tiết hạch toán — {selectedRecord.requestId}
                </h3>
                <AccountingStatusBadge status={selectedRecord.vfsStatus} />
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#E5E7EB] px-6 flex gap-6">
              <button
                onClick={() => setDetailTab('accounting')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'accounting'
                    ? 'border-[#EE0033] text-[#EE0033]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                Bút toán
              </button>
              <button
                onClick={() => setDetailTab('reconciliation')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'reconciliation'
                    ? 'border-[#EE0033] text-[#EE0033]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                Đối soát 3 chiều
              </button>
              <button
                onClick={() => setDetailTab('timeline')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'timeline'
                    ? 'border-[#EE0033] text-[#EE0033]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                Nhật ký
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'accounting' && (
                <div>
                  <table className="w-full border border-[#E5E7EB] rounded-lg">
                    <thead>
                      <tr className="bg-[#F9FAFB]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">STT</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Diễn giải</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">TK Nợ</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">TK Có</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Số tiền (đ)</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Mã HĐ/VV</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="px-4 py-3 text-sm text-[#374151]">1</td>
                        <td className="px-4 py-3 text-sm text-[#374151]">Ghi nhận doanh thu DV lắp đặt CT viễn thông</td>
                        <td className="px-4 py-3 text-sm text-center font-mono">131</td>
                        <td className="px-4 py-3 text-sm text-center font-mono">5113</td>
                        <td className="px-4 py-3 text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(selectedRecord.amount / 1.1).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">{selectedRecord.projectCode}</td>
                      </tr>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="px-4 py-3 text-sm text-[#374151]">2</td>
                        <td className="px-4 py-3 text-sm text-[#374151]">Ghi nhận thuế GTGT đầu ra 10%</td>
                        <td className="px-4 py-3 text-sm text-center font-mono">131</td>
                        <td className="px-4 py-3 text-sm text-center font-mono">33311</td>
                        <td className="px-4 py-3 text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(selectedRecord.amount * 0.1 / 1.1).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">{selectedRecord.projectCode}</td>
                      </tr>
                      <tr className="bg-[#F9FAFB] font-semibold">
                        <td className="px-4 py-3 text-sm" colSpan={4}>Tổng cộng</td>
                        <td className="px-4 py-3 text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {selectedRecord.amount.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'reconciliation' && (
                <div>
                  <table className="w-full border border-[#E5E7EB] rounded-lg">
                    <thead>
                      <tr className="bg-[#F9FAFB]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Chỉ tiêu</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Trên Đề nghị</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Trên S-Invoice</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Trên VFS</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase border-b border-[#E5E7EB]">Khớp?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Giá trị trước VAT', value: Math.round(selectedRecord.amount / 1.1) },
                        { label: 'Thuế GTGT', value: Math.round(selectedRecord.amount * 0.1 / 1.1) },
                        { label: 'Tổng sau VAT', value: selectedRecord.amount }
                      ].map((item, index) => (
                        <tr key={index} className="border-b border-[#E5E7EB]">
                          <td className="px-4 py-3 text-sm text-[#374151]">{item.label}</td>
                          <td className="px-4 py-3 text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.value.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.value.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.value.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CheckCircle size={18} className="text-[#16A34A] mx-auto" />
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="px-4 py-3 text-sm text-[#374151]">Số HĐ S-Invoice</td>
                        <td className="px-4 py-3 text-sm text-right text-[#9CA3AF]">—</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{selectedRecord.sInvoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{selectedRecord.sInvoiceNumber}</td>
                        <td className="px-4 py-3 text-center">
                          <CheckCircle size={18} className="text-[#16A34A] mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-[#374151]">Mã CQT</td>
                        <td className="px-4 py-3 text-sm text-right text-[#9CA3AF]">—</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{selectedRecord.cqtCode}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{selectedRecord.cqtCode}</td>
                        <td className="px-4 py-3 text-center">
                          <CheckCircle size={18} className="text-[#16A34A] mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'timeline' && (
                <div className="space-y-4">
                  {[
                    { status: 'success', label: 'Duyệt đề nghị', user: 'Trần Thị B', time: '13/03 15:42' },
                    { status: 'success', label: 'Xuất HĐ S-Invoice', user: 'Hệ thống', time: '13/03 15:43' },
                    { status: 'success', label: 'CQT cấp mã', user: 'S-Invoice', time: '13/03 15:44' },
                    { status: 'success', label: 'Đẩy sang VFS', user: 'Hệ thống', time: '13/03 15:45' },
                    { status: 'success', label: 'Hạch toán VFS', user: 'Hệ thống', time: '13/03 15:46' }
                  ].map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                          <CheckCircle size={16} className="text-[#16A34A]" />
                        </div>
                        {index < 4 && <div className="w-0.5 h-8 bg-[#E5E7EB]"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="text-sm font-medium text-[#111827]">{event.label}</div>
                        <div className="text-xs text-[#6B7280] mt-1">
                          {event.user} — {event.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="h-10 px-4 border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors"
              >
                Đóng
              </button>
              <button className="h-10 px-4 border border-[#EE0033] text-[#EE0033] rounded-lg text-sm font-medium hover:bg-[#FFF1F3] transition-colors flex items-center gap-2">
                <Download size={16} />
                Xuất PDF bút toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[520px]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#DC2626] rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-semibold">
                  Lỗi hạch toán — {selectedRecord.requestId}
                </h3>
              </div>
              <button 
                onClick={() => setShowErrorModal(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-lg p-4 space-y-3">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#991B1B] min-w-[100px]">Mã lỗi:</span>
                  <span className="text-sm text-[#991B1B] font-mono">{selectedRecord.errorCode}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#991B1B] min-w-[100px]">Mô tả:</span>
                  <span className="text-sm text-[#991B1B]">{selectedRecord.errorMessage}. Vui lòng kiểm tra mã HĐ đã được tạo trên VFS chưa.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#991B1B] min-w-[100px]">Thời gian lỗi:</span>
                  <span className="text-sm text-[#991B1B]">13/03/2026 14:30:15</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-[#991B1B] min-w-[100px]">Số lần thử:</span>
                  <span className="text-sm text-[#991B1B]">{selectedRecord.retryCount}/3</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#FFFBEB] border border-[#F59E0B] rounded-lg">
                <div className="text-sm font-medium text-[#92400E] mb-2">Hướng dẫn xử lý:</div>
                <ol className="text-sm text-[#92400E] space-y-1 list-decimal list-inside">
                  <li>Kiểm tra mã HĐ/VV trên VFS</li>
                  <li>Cập nhật lại mã trên đề nghị</li>
                  <li>Bấm Thử lại</li>
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="h-10 px-4 text-[#6B7280] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors"
              >
                Đóng
              </button>
              <button className="h-10 px-4 border border-[#F59E0B] text-[#D97706] rounded-lg text-sm font-medium hover:bg-[#FFFBEB] transition-colors">
                Hạch toán thủ công
              </button>
              <button className="h-10 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] transition-colors flex items-center gap-2">
                <RotateCcw size={16} />
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}