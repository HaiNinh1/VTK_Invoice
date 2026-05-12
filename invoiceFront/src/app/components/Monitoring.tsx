import { useState, useEffect } from 'react';
import {
  RefreshCw, Eye, RotateCcw, AlertCircle, CheckCircle, Clock,
  Loader2, Send, FileText, X, Check, AlertTriangle, Code, FileCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';

interface MonitoringProps {
  initialTab?: 'sinvoice' | 'vfs';
}

export default function Monitoring({ initialTab = 'sinvoice' }: MonitoringProps) {
  const [activeTab, setActiveTab] = useState<'sinvoice' | 'vfs'>(initialTab);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVFSModal, setShowVFSModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailModalTab, setDetailModalTab] = useState<'info' | 'request' | 'response'>('info');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // Auto-refresh countdown
  useEffect(() => {
    if (autoRefresh && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(30);
      // Trigger refresh here
    }
  }, [autoRefresh, countdown]);

  // S-Invoice data
  const sinvoiceData = [
    { id: 'DN-2026-00156', customer: 'Tập đoàn VNPT', taxCode: '0100109106', amount: '2.695.000.000', approvalDate: '13/03/2026', status: 'completed', invoiceNo: 'AA/26E-00234', cqtCode: 'TBM200056789', error: null },
    { id: 'DN-2026-00155', customer: 'Viettel Construction JSC', taxCode: '0100987654', amount: '6.402.000.000', approvalDate: '13/03/2026', status: 'processing', invoiceNo: '', cqtCode: '', error: null },
    { id: 'DN-2026-00154', customer: 'Công ty CP Bưu chính VN', taxCode: '0100123456', amount: '1.375.000.000', approvalDate: '12/03/2026', status: 'error', invoiceNo: '', cqtCode: '', error: 'Lỗi kết nối API S-Invoice. Mã lỗi: 500' },
    { id: 'DN-2026-00153', customer: 'Viettel Telecom', taxCode: '0100109234', amount: '9.790.000.000', approvalDate: '12/03/2026', status: 'sent_cqt', invoiceNo: 'AA/26E-00232', cqtCode: 'TBM200056787', error: null },
    { id: 'DN-2026-00152', customer: 'VNPT Vinaphone', taxCode: '0100234567', amount: '3.465.000.000', approvalDate: '11/03/2026', status: 'processing', invoiceNo: '', cqtCode: '', error: null },
    { id: 'DN-2026-00151', customer: 'Viettel Global Investment', taxCode: '0100345678', amount: '13.640.000.000', approvalDate: '11/03/2026', status: 'completed', invoiceNo: 'AA/26E-00230', cqtCode: 'TBM200056785', error: null },
    { id: 'DN-2026-00150', customer: 'Viettel High Tech', taxCode: '0100456789', amount: '5.225.000.000', approvalDate: '10/03/2026', status: 'issued', invoiceNo: 'AA/26E-00229', cqtCode: '', error: null },
    { id: 'DN-2026-00149', customer: 'VNPT Technology', taxCode: '0100567890', amount: '6.820.000.000', approvalDate: '10/03/2026', status: 'completed', invoiceNo: 'AA/26E-00228', cqtCode: 'TBM200056783', error: null },
    { id: 'DN-2026-00148', customer: 'Viettel Networks', taxCode: '0100678901', amount: '3.179.000.000', approvalDate: '09/03/2026', status: 'waiting', invoiceNo: '', cqtCode: '', error: null },
    { id: 'DN-2026-00147', customer: 'Tập đoàn Bưu chính VN', taxCode: '0100789012', amount: '8.415.000.000', approvalDate: '09/03/2026', status: 'error', invoiceNo: '', cqtCode: '', error: 'MST không hợp lệ theo CQT' }
  ];

  // VFS data
  const vfsData = [
    { id: 'DN-2026-00156', customer: 'Tập đoàn VNPT', amount: '2.695.000.000', invoiceNo: 'AA/26E-00234', accountingDate: '14/03/2026', debitAccount: '131', creditAccount: '511', status: 'posted', voucherNo: 'PC-2026-00234' },
    { id: 'DN-2026-00155', customer: 'Viettel Construction JSC', amount: '6.402.000.000', invoiceNo: 'AA/26E-00233', accountingDate: '14/03/2026', debitAccount: '1311', creditAccount: '5113', status: 'pending', voucherNo: '' },
    { id: 'DN-2026-00153', customer: 'Viettel Telecom', amount: '9.790.000.000', invoiceNo: 'AA/26E-00232', accountingDate: '13/03/2026', debitAccount: '131', creditAccount: '511', status: 'posted', voucherNo: 'PC-2026-00232' },
    { id: 'DN-2026-00151', customer: 'Viettel Global Investment', amount: '13.640.000.000', invoiceNo: 'AA/26E-00230', accountingDate: '12/03/2026', debitAccount: '1311', creditAccount: '5113', status: 'posted', voucherNo: 'PC-2026-00230' },
    { id: 'DN-2026-00150', customer: 'Viettel High Tech', amount: '5.225.000.000', invoiceNo: 'AA/26E-00229', accountingDate: '11/03/2026', debitAccount: '131', creditAccount: '511', status: 'posted', voucherNo: 'PC-2026-00229' },
    { id: 'DN-2026-00149', customer: 'VNPT Technology', amount: '6.820.000.000', invoiceNo: 'AA/26E-00228', accountingDate: '11/03/2026', debitAccount: '1311', creditAccount: '5113', status: 'pending', voucherNo: '' },
    { id: 'DN-2026-00147', customer: 'Tập đoàn Bưu chính VN', amount: '8.415.000.000', invoiceNo: 'AA/26E-00227', accountingDate: '10/03/2026', debitAccount: '131', creditAccount: '511', status: 'error', voucherNo: '' }
  ];

  const sinvoiceStats = {
    waiting: sinvoiceData.filter(d => d.status === 'waiting').length,
    processing: sinvoiceData.filter(d => d.status === 'processing').length,
    completed: sinvoiceData.filter(d => d.status === 'completed').length,
    error: sinvoiceData.filter(d => d.status === 'error').length
  };

  const vfsStats = {
    pending: vfsData.filter(d => d.status === 'pending').length,
    posted: vfsData.filter(d => d.status === 'posted').length,
    error: vfsData.filter(d => d.status === 'error').length
  };

  const getSInvoiceStatusBadge = (status: string, error: string | null) => {
    const statusMap: Record<string, { bg: string; text: string; label: string; icon?: any }> = {
      waiting: { bg: '#F3F4F6', text: '#6B7280', label: 'Chờ đẩy', icon: Clock },
      processing: { bg: '#FEF3C7', text: '#92400E', label: 'Đang đẩy', icon: Loader2 },
      issued: { bg: '#DBEAFE', text: '#1E40AF', label: 'Đã xuất', icon: FileText },
      sent_cqt: { bg: '#D1FAE5', text: '#047857', label: 'Đã gửi CQT', icon: Send },
      completed: { bg: '#D1FAE5', text: '#065F46', label: 'Hoàn thành', icon: CheckCircle },
      error: { bg: '#FEE2E2', text: '#991B1B', label: 'Lỗi', icon: AlertCircle }
    };
    const s = statusMap[status];
    if (!s) return <span className="text-xs text-[#6B7280]">—</span>;
    const Icon = s.icon;
    
    return (
      <div className="flex items-center gap-2">
        <span 
          className={`inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium ${status === 'processing' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: s.bg, color: s.text }}
        >
          {Icon && <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />}
          {s.label}
        </span>
        {error && (
          <div className="group relative">
            <AlertCircle size={14} className="text-[#DC2626] cursor-help" />
            <div className="absolute left-0 top-6 w-64 bg-[#1F2937] text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              <div className="font-semibold mb-1">Chi tiết lỗi:</div>
              <div>{error}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getVFSStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'Chờ hạch toán' },
      posted: { bg: '#D1FAE5', text: '#065F46', label: 'Đã hạch toán' },
      error: { bg: '#FEE2E2', text: '#991B1B', label: 'Lỗi' }
    };
    const s = statusMap[status];
    if (!s) return <span className="text-xs text-[#6B7280]">—</span>;
    return (
      <span className="inline-flex items-center h-6 px-3 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Giám sát hệ thống</h1>
        <p className="text-sm text-[#6B7280] mt-1">Theo dõi trạng thái S-Invoice và hạch toán VFS</p>
      </div>

      {/* TABS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('sinvoice')}
            className={`flex-1 h-12 text-sm font-medium transition-all relative ${
              activeTab === 'sinvoice'
                ? 'text-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText size={16} />
              S-Invoice
            </span>
            {activeTab === 'sinvoice' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE0033]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vfs')}
            className={`flex-1 h-12 text-sm font-medium transition-all relative ${
              activeTab === 'vfs'
                ? 'text-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FileCheck size={16} />
              Hạch toán VFS
            </span>
            {activeTab === 'vfs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE0033]"></div>
            )}
          </button>
        </div>

        {/* S-INVOICE TAB */}
        {activeTab === 'sinvoice' && (
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                    <Clock size={20} className="text-[#6B7280]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#111827]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {sinvoiceStats.waiting}
                    </div>
                    <div className="text-xs text-[#6B7280]">Chờ đẩy</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFFBEB] rounded-lg p-4 border border-[#FCD34D]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                    <Loader2 size={20} className="text-[#D97706] animate-spin" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {sinvoiceStats.processing}
                    </div>
                    <div className="text-xs text-[#92400E]">Đang xử lý</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#ECFDF5] rounded-lg p-4 border border-[#6EE7B7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#16A34A]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {sinvoiceStats.completed}
                    </div>
                    <div className="text-xs text-[#065F46]">Hoàn thành</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FEF2F2] rounded-lg p-4 border border-[#FCA5A5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                    <AlertCircle size={20} className="text-[#DC2626]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {sinvoiceStats.error}
                    </div>
                    <div className="text-xs text-[#991B1B]">Lỗi</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-refresh Bar */}
            <div className="bg-[#F9FAFB] rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border border-[#E5E7EB]">
              <div className="flex items-center justify-between md:flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className={`text-[#6B7280] ${autoRefresh ? 'animate-spin' : ''}`} />
                    <span className="text-sm text-[#374151]">
                      {autoRefresh ? `Tự động làm mới sau ${countdown}s` : 'Đã tắt tự động làm mới'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`h-8 px-3 rounded text-xs font-medium ${
                      autoRefresh
                        ? 'bg-[#EE0033] text-white hover:bg-[#CC002B]'
                        : 'bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {autoRefresh ? 'Tắt' : 'Bật'}
                  </button>
                  <button
                    onClick={() => setCountdown(30)}
                    className="h-8 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6]"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              <span className="text-[10px] md:text-xs text-[#6B7280]">
                Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
              </span>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`h-8 px-3 rounded text-xs font-medium ${
                    autoRefresh
                      ? 'bg-[#EE0033] text-white hover:bg-[#CC002B]'
                      : 'bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {autoRefresh ? 'Tắt tự động' : 'Bật tự động'}
                </button>
                <button
                  onClick={() => setCountdown(30)}
                  className="h-8 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  Làm mới ngay
                </button>
              </div>
            </div>

            {/* Table - Desktop */}
            <div className="hidden md:block border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã ĐN</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Chủ đầu tư</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã số thuế</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Giá trị</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Ngày duyệt</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">TT S-Invoice</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Số HĐ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã CQT</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sinvoiceData.map((record) => (
                      <tr key={record.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#EE0033] whitespace-nowrap">{record.id}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{record.customer}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">{record.taxCode}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {record.amount}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{record.approvalDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getSInvoiceStatusBadge(record.status, record.error)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">
                          {record.invoiceNo || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">
                          {record.cqtCode || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowDetailModal(true);
                              }}
                              className="h-8 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              Chi tiết
                            </button>
                            {record.status === 'error' && (
                              <button className="h-8 px-3 bg-[#EE0033] text-white rounded text-xs font-medium hover:bg-[#CC002B] flex items-center gap-1.5">
                                <RotateCcw size={14} />
                                Thử lại
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table - Mobile */}
            <div className="md:hidden border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã ĐN</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Chủ đầu tư</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã số thuế</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Giá trị</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Ngày duyệt</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">TT S-Invoice</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Số HĐ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã CQT</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sinvoiceData.map((record) => (
                      <tr key={record.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#EE0033] whitespace-nowrap">{record.id}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{record.customer}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">{record.taxCode}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {record.amount}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{record.approvalDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getSInvoiceStatusBadge(record.status, record.error)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">
                          {record.invoiceNo || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">
                          {record.cqtCode || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowDetailModal(true);
                              }}
                              className="h-8 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              Chi tiết
                            </button>
                            {record.status === 'error' && (
                              <button className="h-8 px-3 bg-[#EE0033] text-white rounded text-xs font-medium hover:bg-[#CC002B] flex items-center gap-1.5">
                                <RotateCcw size={14} />
                                Thử lại
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VFS TAB */}
        {activeTab === 'vfs' && (
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#FFFBEB] rounded-lg p-4 border border-[#FCD34D]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                    <Clock size={20} className="text-[#D97706]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {vfsStats.pending}
                    </div>
                    <div className="text-xs text-[#92400E]">Chờ hạch toán</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#ECFDF5] rounded-lg p-4 border border-[#6EE7B7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#16A34A]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {vfsStats.posted}
                    </div>
                    <div className="text-xs text-[#065F46]">Đã hạch toán</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FEF2F2] rounded-lg p-4 border border-[#FCA5A5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                    <AlertCircle size={20} className="text-[#DC2626]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {vfsStats.error}
                    </div>
                    <div className="text-xs text-[#991B1B]">Lỗi</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Mã ĐN</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Chủ đầu tư</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Giá trị</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Số HĐ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">TK Nợ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">TK Có</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Ngày HT</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Số CT</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vfsData.map((record) => (
                      <tr key={record.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#EE0033] whitespace-nowrap">{record.id}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap">{record.customer}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] text-right whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {record.amount}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">{record.invoiceNo}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">{record.debitAccount}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">{record.creditAccount}</td>
                        <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{record.accountingDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getVFSStatusBadge(record.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151] whitespace-nowrap font-mono">
                          {record.voucherNo || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowVFSModal(true);
                              }}
                              className="h-8 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded text-xs font-medium hover:bg-[#F3F4F6] flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* S-INVOICE DETAIL MODAL */}
      {selectedRecord && (
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="md:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Chi tiết S-Invoice</DialogTitle>
              <DialogDescription>{selectedRecord.id}</DialogDescription>
            </DialogHeader>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E5E7EB] px-6">
              <button
                onClick={() => setDetailModalTab('info')}
                className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                  detailModalTab === 'info'
                    ? 'border-[#EE0033] text-[#EE0033]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                Thông tin HĐ
              </button>
              <button
                onClick={() => setDetailModalTab('request')}
                className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                  detailModalTab === 'request'
                    ? 'border-[#EE0033] text-[#EE0033]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                API Request
              </button>
              <button
                onClick={() => setDetailModalTab('response')}
                className={`h-12 px-4 text-sm font-medium border-b-2 transition-all ${
                  detailModalTab === 'response'
                    ? 'border-[#EE0033] text-[#EE0033]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                API Response
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailModalTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Mã đề nghị</label>
                      <div className="text-sm font-medium text-[#111827] mt-1">{selectedRecord.id}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Trạng thái</label>
                      <div className="mt-1">{getSInvoiceStatusBadge(selectedRecord.status, selectedRecord.error)}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-[#6B7280]">Chủ đầu tư</label>
                      <div className="text-sm font-medium text-[#111827] mt-1">{selectedRecord.customer}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Mã số thuế</label>
                      <div className="text-sm text-[#374151] mt-1 font-mono">{selectedRecord.taxCode}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Giá trị</label>
                      <div className="text-sm text-[#374151] mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedRecord.amount} đ</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Số hoá đơn</label>
                      <div className="text-sm text-[#374151] mt-1 font-mono">{selectedRecord.invoiceNo || 'Chưa có'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Mã CQT</label>
                      <div className="text-sm text-[#374151] mt-1 font-mono">{selectedRecord.cqtCode || 'Chưa có'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Ngày duyệt</label>
                      <div className="text-sm text-[#374151] mt-1">{selectedRecord.approvalDate}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280]">Thời gian đẩy</label>
                      <div className="text-sm text-[#374151] mt-1">{selectedRecord.approvalDate} 14:23:45</div>
                    </div>
                  </div>
                  {selectedRecord.error && (
                    <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-[#DC2626] mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-[#991B1B]">Lỗi xử lý</div>
                          <div className="text-sm text-[#991B1B] mt-1">{selectedRecord.error}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailModalTab === 'request' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Code size={16} className="text-[#6B7280]" />
                      <span className="text-sm font-medium text-[#374151]">Request Payload</span>
                    </div>
                    <button className="text-xs text-[#EE0033] font-medium hover:text-[#CC002B]">
                      Sao chép
                    </button>
                  </div>
                  <pre className="bg-[#1F2937] text-[#F3F4F6] p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "invoice": {
    "requestId": "${selectedRecord.id}",
    "invoiceType": "01",
    "templateCode": "AA/26E",
    "invoiceSeries": "AA/26E",
    "currency": "VND",
    "exchangeRate": 1,
    "buyer": {
      "name": "${selectedRecord.customer}",
      "taxCode": "${selectedRecord.taxCode}",
      "address": "57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội",
      "email": "contact@example.com",
      "phone": "0912345678"
    },
    "items": [
      {
        "lineNumber": 1,
        "description": "Dịch vụ tích hợp hệ thống",
        "unitPrice": ${(parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1).toFixed(0)},
        "quantity": 1,
        "unit": "Hợp đồng",
        "amount": ${(parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1).toFixed(0)},
        "taxRate": 10,
        "taxAmount": ${(parseFloat(selectedRecord.amount.replace(/\./g, '')) - (parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1)).toFixed(0)},
        "totalAmount": ${selectedRecord.amount.replace(/\./g, '')}
      }
    ],
    "totalAmountBeforeTax": ${(parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1).toFixed(0)},
    "totalTaxAmount": ${(parseFloat(selectedRecord.amount.replace(/\./g, '')) - (parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1)).toFixed(0)},
    "totalAmount": ${selectedRecord.amount.replace(/\./g, '')}
  }
}`}
                  </pre>
                </div>
              )}

              {detailModalTab === 'response' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Code size={16} className="text-[#6B7280]" />
                      <span className="text-sm font-medium text-[#374151]">Response Data</span>
                    </div>
                    <button className="text-xs text-[#EE0033] font-medium hover:text-[#CC002B]">
                      Sao chép
                    </button>
                  </div>
                  <pre className="bg-[#1F2937] text-[#F3F4F6] p-4 rounded-lg text-xs overflow-x-auto">
{selectedRecord.status === 'error' ? `{
  "status": "error",
  "errorCode": "500",
  "errorMessage": "${selectedRecord.error}",
  "timestamp": "${selectedRecord.approvalDate} 14:23:47"
}` : `{
  "status": "success",
  "invoice": {
    "invoiceNo": "${selectedRecord.invoiceNo}",
    "invoiceCode": "${selectedRecord.cqtCode}",
    "issueDate": "${selectedRecord.approvalDate}",
    "lookupCode": "A1B2C3D4E5F6",
    "reservationCode": "${selectedRecord.cqtCode}"
  },
  "timestamp": "${selectedRecord.approvalDate} 14:23:47"
}`}
                  </pre>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </Button>
              {selectedRecord.status === 'error' && (
                <Button className="bg-[#EE0033] text-white hover:bg-[#CC002B] flex items-center gap-2">
                  <RotateCcw size={16} />
                  Thử lại
                </Button>
              )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* VFS DETAIL MODAL */}
      {selectedRecord && (
      <Dialog open={showVFSModal} onOpenChange={setShowVFSModal}>
        <DialogContent className="md:max-w-[1000px]">
            <DialogHeader>
              <DialogTitle>Chi tiết hạch toán VFS</DialogTitle>
              <DialogDescription>{selectedRecord.id}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Transaction Table */}
              <div>
                <h4 className="text-sm font-semibold text-[#111827] mb-3">Bút toán hạch toán</h4>
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F3F4F6]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Diễn giải</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">TK Nợ</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">TK Có</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="px-4 py-3 text-sm text-[#374151]">Doanh thu cung cấp dịch vụ</td>
                        <td className="px-4 py-3 text-sm text-[#374151] font-mono">{selectedRecord.debitAccount}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] font-mono">{selectedRecord.creditAccount}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {(parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        </td>
                      </tr>
                      <tr className="border-b border-[#E5E7EB]">
                        <td className="px-4 py-3 text-sm text-[#374151]">Thuế GTGT đầu ra</td>
                        <td className="px-4 py-3 text-sm text-[#374151] font-mono">{selectedRecord.debitAccount}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] font-mono">3331</td>
                        <td className="px-4 py-3 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {(parseFloat(selectedRecord.amount.replace(/\./g, '')) - (parseFloat(selectedRecord.amount.replace(/\./g, '')) / 1.1)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        </td>
                      </tr>
                      <tr className="bg-[#F9FAFB] font-semibold">
                        <td className="px-4 py-3 text-sm text-[#111827]" colSpan={3}>Tổng cộng</td>
                        <td className="px-4 py-3 text-sm text-[#111827] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {selectedRecord.amount}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3-Way Reconciliation */}
              <div>
                <h4 className="text-sm font-semibold text-[#111827] mb-3">Đối soát 3 chiều</h4>
                <div className="bg-[#F9FAFB] rounded-lg p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Proposal */}
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-[#6B7280] uppercase">Đề nghị</div>
                        <CheckCircle size={16} className="text-[#16A34A]" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-[#6B7280]">Mã:</span>
                          <span className="ml-2 text-[#111827] font-medium">{selectedRecord.id}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">GT:</span>
                          <span className="ml-2 text-[#111827] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {selectedRecord.amount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">CĐT:</span>
                          <span className="ml-2 text-[#111827] text-xs">{selectedRecord.customer}</span>
                        </div>
                      </div>
                    </div>

                    {/* S-Invoice */}
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-[#6B7280] uppercase">S-Invoice</div>
                        <CheckCircle size={16} className="text-[#16A34A]" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-[#6B7280]">Số HĐ:</span>
                          <span className="ml-2 text-[#111827] font-medium font-mono">{selectedRecord.invoiceNo}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">GT:</span>
                          <span className="ml-2 text-[#111827] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {selectedRecord.amount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Ngày:</span>
                          <span className="ml-2 text-[#111827]">{selectedRecord.accountingDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* VFS */}
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-[#6B7280] uppercase">VFS</div>
                        {selectedRecord.status === 'posted' ? (
                          <CheckCircle size={16} className="text-[#16A34A]" />
                        ) : (
                          <X size={16} className="text-[#DC2626]" />
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-[#6B7280]">Số CT:</span>
                          <span className="ml-2 text-[#111827] font-medium font-mono">
                            {selectedRecord.voucherNo || 'Chưa có'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">GT:</span>
                          <span className="ml-2 text-[#111827] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {selectedRecord.amount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Ngày:</span>
                          <span className="ml-2 text-[#111827]">{selectedRecord.accountingDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrows */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-px bg-[#16A34A]"></div>
                      <CheckCircle size={14} className="text-[#16A34A]" />
                      <div className="w-12 h-px bg-[#16A34A]"></div>
                    </div>
                    <span className="text-xs font-medium text-[#16A34A]">Đồng bộ hoàn toàn</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowVFSModal(false)}
              >
                Đóng
              </Button>
              <Button className="bg-[#EE0033] text-white hover:bg-[#CC002B]">
                Xuất báo cáo
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}