import type { ReactNode } from 'react';
import { useState } from 'react';
import { 
  FileText, Clock, AlertTriangle, CheckCircle, TrendingUp, ArrowUpRight,
  Database, ChevronDown, Search
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useMasterInvoiceData } from '../data/masterInvoiceData';

interface DashboardCompanyProps {
  getStatusBadge: (status: string) => ReactNode;
  getLegalIcon: (legal: string) => ReactNode;
}

export default function DashboardCompany({ getStatusBadge, getLegalIcon }: DashboardCompanyProps) {
  const { MASTER_INVOICE_DATA, getMonthlyStats, getRecentRequests, getLegalStats, isLoading, isError } = useMasterInvoiceData();
  const [dataFilter, setDataFilter] = useState<string>('company-wide');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-sm text-[#6B7280]">Đang tải dữ liệu…</div>;
  }
  if (isError) {
    return <div className="p-8 text-sm text-[#DC2626]">Không tải được dữ liệu. Vui lòng thử lại.</div>;
  }

  // Derive stats from master data
  const stats = getMonthlyStats();
  const legalStats = getLegalStats();
  const recentRecords = getRecentRequests(8);
  const totalAmount = MASTER_INVOICE_DATA.reduce((sum, r) => sum + (r.afterVAT || 0), 0);
  const vfsPending = MASTER_INVOICE_DATA.filter(r => r.vfsStatus === 'pending' || r.vfsStatus === 'processing').length;

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

  // Chart data
  const barChartData = [
    { id: 'month-1', month: 'T8/2025', xuatHD: 35.2, dangXuLy: 8.5, choPheDuyet: 2.3, khac: 1.8 },
    { id: 'month-2', month: 'T9/2025', xuatHD: 38.7, dangXuLy: 6.2, choPheDuyet: 3.1, khac: 2.0 },
    { id: 'month-3', month: 'T10/2025', xuatHD: 42.1, dangXuLy: 7.8, choPheDuyet: 2.8, khac: 1.5 },
    { id: 'month-4', month: 'T11/2025', xuatHD: 39.5, dangXuLy: 9.2, choPheDuyet: 3.5, khac: 2.2 },
    { id: 'month-5', month: 'T12/2025', xuatHD: 44.8, dangXuLy: 6.9, choPheDuyet: 2.1, khac: 1.7 },
    { id: 'month-6', month: 'T1/2026', xuatHD: 45.2, dangXuLy: 8.3, choPheDuyet: 2.9, khac: 1.9 }
  ];

  const donutChartData = [
    { id: 'legal-1', name: 'Đạt chuẩn', value: 62, color: '#16A34A' },
    { id: 'legal-2', name: 'Thiếu 1-2 HS', value: 15, color: '#D97706' },
    { id: 'legal-3', name: 'Đang xử lý', value: 13, color: '#94A3B8' },
    { id: 'legal-4', name: 'Quá hạn', value: 10, color: '#DC2626' }
  ];

  // Recent requests data
  const recentRequests = [
    { id: 'DN-2026-00145', customer: 'VNPT Hà Nội', amount: '2.450.000.000', creator: 'Nguyễn Văn A', status: 'pending', legal: 'complete', date: '13/03/2026' },
    { id: 'DN-2026-00144', customer: 'Viettel Construction', amount: '5.820.000.000', creator: 'Trần Thị B', status: 'approved', legal: 'complete', date: '13/03/2026' },
    { id: 'DN-2026-00143', customer: 'Tập đoàn Bưu chính', amount: '1.250.000.000', creator: 'Lê Văn C', status: 'issued', legal: 'missing', date: '12/03/2026' },
    { id: 'DN-2026-00142', customer: 'Viettel Telecom', amount: '8.900.000.000', creator: 'Phạm Thị D', status: 'approved', legal: 'complete', date: '12/03/2026' },
    { id: 'DN-2026-00141', customer: 'VNPT Vinaphone', amount: '3.150.000.000', creator: 'Hoàng Văn E', status: 'pending', legal: 'overdue', date: '11/03/2026' },
    { id: 'DN-2026-00140', customer: 'Viettel Global', amount: '12.400.000.000', creator: 'Đỗ Thị F', status: 'issued', legal: 'complete', date: '11/03/2026' },
    { id: 'DN-2026-00139', customer: 'Viettel High Tech', amount: '4.750.000.000', creator: 'Vũ Văn G', status: 'rejected', legal: 'missing', date: '10/03/2026' },
    { id: 'DN-2026-00138', customer: 'VNPT Technology', amount: '6.200.000.000', creator: 'Bùi Thị H', status: 'approved', legal: 'complete', date: '10/03/2026' }
  ];

  return (
    <div className="space-y-6">
      {/* Title Area with Filter */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            Tổng quan — Toàn công ty
          </h1>
          <p className="text-sm text-[#6B7280]">
            Dữ liệu tổng hợp từ tất cả trung tâm và phòng ban
          </p>
        </div>

        {/* Data Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="h-10 px-4 bg-white border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
          >
            {dataFilter === 'company-wide' ? 'Toàn công ty' : 
             dataFilter.startsWith('region-') ? `TT Khu vực ${dataFilter.split('-')[1]}` :
             'Theo cá nhân'}
            <ChevronDown size={16} className={`transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterDropdownOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-10 py-2">
              <button
                onClick={() => { setDataFilter('company-wide'); setFilterDropdownOpen(false); }}
                className={`w-full h-9 px-4 text-left text-sm hover:bg-[#F3F4F6] ${dataFilter === 'company-wide' ? 'text-[#EE0033] font-medium bg-[#FFF1F3]' : 'text-[#374151]'}`}
              >
                Toàn công ty
              </button>
              <div className="h-px bg-[#E5E7EB] my-1"></div>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((region) => (
                <button
                  key={region}
                  onClick={() => { setDataFilter(`region-${region}`); setFilterDropdownOpen(false); }}
                  className={`w-full h-9 px-4 text-left text-sm hover:bg-[#F3F4F6] ${dataFilter === `region-${region}` ? 'text-[#EE0033] font-medium bg-[#FFF1F3]' : 'text-[#374151]'}`}
                >
                  TT Khu vực {region}
                </button>
              ))}
              <div className="h-px bg-[#E5E7EB] my-1"></div>
              <button
                onClick={() => { setDataFilter('personal'); setFilterDropdownOpen(false); }}
                className={`w-full h-9 px-4 text-left text-sm hover:bg-[#F3F4F6] ${dataFilter === 'personal' ? 'text-[#EE0033] font-medium bg-[#FFF1F3]' : 'text-[#374151]'}`}
              >
                <div className="flex items-center gap-2">
                  <Search size={14} />
                  Theo cá nhân...
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-[#FFFBEB] border border-[#D97706] rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-[#D97706]" />
          <span className="text-xs md:text-sm text-[#92400E]">
            Có 3 hồ sơ pháp lý quá hạn bổ sung. Vui lòng kiểm tra và xử lý.
          </span>
        </div>
        <button className="text-xs md:text-sm font-medium text-[#EE0033] hover:text-[#CC002B]">
          Xem chi tiết
        </button>
      </div>

      {/* 6 Stat Cards - Full Company View */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1F3] flex items-center justify-center">
              <FileText size={20} className="text-[#EE0033]" />
            </div>
            <span className="text-xs font-medium text-[#16A34A] flex items-center gap-1">
              +12% <ArrowUpRight size={12} />
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#111827] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>48</div>
          <div className="text-[13px] text-[#6B7280] mt-1">Tổng đề nghị tháng này</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <Clock size={20} className="text-[#D97706]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#D97706] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>12</div>
          <div className="text-[13px] text-[#6B7280] mt-1">Chờ phê duyệt</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#DC2626]" />
            </div>
            <span className="text-xs font-medium text-[#DC2626]">3 quá hạn</span>
          </div>
          <div className="text-[28px] font-bold text-[#DC2626] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>8</div>
          <div className="text-[13px] text-[#6B7280] mt-1">Thiếu hồ sơ pháp lý</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle size={20} className="text-[#16A34A]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#16A34A] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>31</div>
          <div className="text-[13px] text-[#6B7280] mt-1">Đã xuất HĐ tháng này</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center">
              <Database size={20} className="text-[#F97316]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#F97316] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>5</div>
          <div className="text-[13px] text-[#6B7280] mt-1">Chưa hạch toán VFS</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1F3] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#EE0033]" />
            </div>
            <span className="text-xs font-medium text-[#16A34A] flex items-center gap-1">
              +8,5% <ArrowUpRight size={12} />
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#EE0033] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>45,2 tỷ đ</div>
          <div className="text-[13px] text-[#6B7280] mt-1">Tổng doanh thu tháng</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3 bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Doanh thu xuất HĐ theo tháng</h3>
          <div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value) => `${value} tỷ đ`}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar key="bar-xuatHD" dataKey="xuatHD" name="Đã xuất HĐ" stackId="a" fill="#EE0033" radius={[0, 0, 0, 0]} />
                <Bar key="bar-dangXuLy" dataKey="dangXuLy" name="Đang xử lý" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} />
                <Bar key="bar-choPheDuyet" dataKey="choPheDuyet" name="Chờ phê duyệt" stackId="a" fill="#EAB308" radius={[0, 0, 0, 0]} />
                <Bar key="bar-khac" dataKey="khac" name="Khác" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Tình trạng pháp lý</h3>
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {donutChartData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-[135px] pointer-events-none">
            <div className="text-3xl font-bold text-[#111827]">62%</div>
            <div className="text-xs text-[#6B7280]">Đạt chuẩn</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-16">
            {donutChartData.map((item, index) => (
              <div key={`legend-${item.name}-${index}`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-[#6B7280]">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#111827]">Đề nghị gần đây</h3>
          <button className="text-sm font-medium text-[#EE0033] hover:text-[#CC002B] flex items-center gap-1">
            Xem tất cả <ArrowUpRight size={14} />
          </button>
        </div>
        
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Mã đề nghị</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Chủ đầu tư</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Giá trị</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Người tạo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Pháp lý</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#EE0033]">{request.id}</td>
                  <td className="px-6 py-4 text-sm text-[#374151]">{request.customer}</td>
                  <td className="px-6 py-4 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {request.amount} đ
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">{request.creator}</td>
                  <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {getLegalIcon(request.legal)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280]">{request.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="block md:hidden p-3 space-y-2">
          {recentRequests.map((request) => (
            <div key={request.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-[#EE0033]">{request.id}</span>
                <div>{getStatusBadge(request.status)}</div>
              </div>
              <div className="text-sm text-[#374151] mb-2 truncate">{request.customer}</div>
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{request.amount} đ</span>
                <div className="flex items-center gap-2">
                  <span>{request.date}</span>
                  {getLegalIcon(request.legal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}