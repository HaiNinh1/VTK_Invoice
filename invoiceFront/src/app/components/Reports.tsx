import { useState } from 'react';
import {
  TrendingUp, FileText, Calendar, ChevronDown, Download, ArrowUpRight,
  ArrowDownRight, CheckCircle, AlertTriangle, XCircle, ArrowLeft, Star
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import CenterReport from './CenterReport';
import { MASTER_INVOICE_DATA, getLegalStats } from '../data/masterInvoiceData';

type UserRole = 'employee' | 'manager' | 'accountant' | 'director' | 'admin';

interface ReportsProps {
  userRole?: UserRole;
}

export default function Reports({ userRole = 'accountant' }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'legal' | 'center' | 'reconciliation'>('revenue');
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);

  // Manager department filtering
  const MANAGER_DEPARTMENT = 'KV3';
  const isManager = userRole === 'manager';
  
  // Filter master data for manager
  const filteredMasterData = isManager
    ? MASTER_INVOICE_DATA.filter(r => r.revenueCenter === MANAGER_DEPARTMENT)
    : MASTER_INVOICE_DATA;

  // Revenue data
  const revenueMonthlyData = [
    { month: 'T1/26', xuatHD: 18.2, choPheDuyet: 2.1, tuChoi: 0.8, khac: 1.2 },
    { month: 'T2/26', xuatHD: 20.5, choPheDuyet: 1.8, tuChoi: 0.6, khac: 1.0 },
    { month: 'T3/26', xuatHD: 22.3, choPheDuyet: 2.3, tuChoi: 0.9, khac: 1.4 },
    { month: 'T4/26', xuatHD: 19.7, choPheDuyet: 1.9, tuChoi: 0.7, khac: 1.1 },
    { month: 'T5/26', xuatHD: 23.8, choPheDuyet: 2.2, tuChoi: 0.8, khac: 1.3 },
    { month: 'T6/26', xuatHD: 21.4, choPheDuyet: 2.0, tuChoi: 0.7, khac: 1.2 }
  ];

  const revenueDistributionData = [
    { name: 'Tích hợp hệ thống', value: 35, color: '#EE0033' },
    { name: 'Tư vấn CNTT', value: 28, color: '#F97316' },
    { name: 'Dịch vụ Cloud', value: 22, color: '#EAB308' },
    { name: 'Bảo trì', value: 15, color: '#94A3B8' }
  ];

  const yoyComparisonData = [
    { month: 'T1', year2025: 16.2, year2026: 18.2 },
    { month: 'T2', year2025: 18.1, year2026: 20.5 },
    { month: 'T3', year2025: 19.8, year2026: 22.3 },
    { month: 'T4', year2025: 17.5, year2026: 19.7 },
    { month: 'T5', year2025: 20.2, year2026: 23.8 },
    { month: 'T6', year2025: 18.9, year2026: 21.4 }
  ];

  const topCustomersData = [
    { name: 'Tập đoàn VNPT', value: 45.3 },
    { name: 'Viettel Telecom', value: 38.7 },
    { name: 'Viettel Construction', value: 32.5 },
    { name: 'VNPT Technology', value: 28.9 },
    { name: 'Viettel Global', value: 25.2 }
  ];

  const monthlyRevenueTable = [
    { month: 'Tháng 1/2026', invoices: 28, revenue: '18.200.000.000', avgPerInvoice: '650.000.000', growth: '+8.2' },
    { month: 'Tháng 2/2026', invoices: 31, revenue: '20.500.000.000', avgPerInvoice: '661.290.323', growth: '+12.6' },
    { month: 'Tháng 3/2026', invoices: 34, revenue: '22.300.000.000', avgPerInvoice: '655.882.353', growth: '+8.8' },
    { month: 'Tháng 4/2026', invoices: 29, revenue: '19.700.000.000', avgPerInvoice: '679.310.345', growth: '-11.7' },
    { month: 'Tháng 5/2026', invoices: 36, revenue: '23.800.000.000', avgPerInvoice: '661.111.111', growth: '+20.8' },
    { month: 'Tháng 6/2026', invoices: 32, revenue: '21.400.000.000', avgPerInvoice: '668.750.000', growth: '-10.1' },
    { month: 'Tháng 7/2025', invoices: 26, revenue: '17.200.000.000', avgPerInvoice: '661.538.462', growth: '+5.2' },
    { month: 'Tháng 8/2025', invoices: 30, revenue: '19.800.000.000', avgPerInvoice: '660.000.000', growth: '+15.1' },
    { month: 'Tháng 9/2025', invoices: 33, revenue: '21.900.000.000', avgPerInvoice: '663.636.364', growth: '+10.6' },
    { month: 'Tháng 10/2025', invoices: 31, revenue: '20.600.000.000', avgPerInvoice: '664.516.129', growth: '-5.9' },
    { month: 'Tháng 11/2025', invoices: 29, revenue: '19.100.000.000', avgPerInvoice: '658.620.690', growth: '-7.3' },
    { month: 'Tháng 12/2025', invoices: 35, revenue: '23.200.000.000', avgPerInvoice: '662.857.143', growth: '+21.5' }
  ];

  // Legal compliance data — DERIVED FROM MASTER DATA
  const legalStats = getLegalStats();
  const centerNameMap: Record<string, string> = {
    'KV1': 'TT Hà Nội',
    'KV2': 'TT Đà Nẵng',
    'KV3': 'TT TP.HCM',
    'KV4': 'CN Hải Phòng',
    'KV5': 'CN Cần Thơ',
    'KV6': 'CN Nghệ An',
    'KV7': 'CN Bình Dương',
  };

  // Group master data by revenueCenter for legal compliance
  const centerGroups = filteredMasterData.reduce<Record<string, typeof filteredMasterData>>((acc, r) => {
    if (!acc[r.revenueCenter]) acc[r.revenueCenter] = [];
    acc[r.revenueCenter].push(r);
    return acc;
  }, {});

  const complianceByCenterDerived = Object.entries(centerGroups)
    .map(([key, records]) => {
      const total = records.length;
      const complete = records.filter(r => r.legalStatus.status === 'complete').length;
      const supplementing = records.filter(r => r.legalStatus.status === 'supplementing').length;
      const insufficient = records.filter(r => r.legalStatus.status === 'insufficient').length;
      const overdue = records.filter(r => r.legalStatus.status === 'overdue').length;
      const partial = supplementing + insufficient;
      const completePercent = total > 0 ? Math.round((complete / total) * 100) : 0;
      return {
        center: centerNameMap[key] || key,
        centerKey: key,
        total,
        complete,
        partial,
        missing: overdue,
        completeCount: complete,
        supplementing,
        insufficient,
        overdue,
        compliance: total > 0 ? Math.round((complete / total) * 1000) / 10 : 0,
        // Simulated trend based on compliance level
        trend: complete >= total ? '+3.2' : overdue > 0 ? '-2.5' : partial > 0 ? '+0.8' : '+1.5',
        // For chart display as percentage
        completePercent,
        partialPercent: total > 0 ? Math.round((partial / total) * 100) : 0,
        missingPercent: total > 0 ? Math.round((overdue / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.compliance - a.compliance);

  const overallCompliance = legalStats.total > 0
    ? Math.round((legalStats.complete / legalStats.total) * 100)
    : 0;

  const centersAbove95 = complianceByCenterDerived.filter(c => c.compliance >= 95).length;
  const centersBetween80_95 = complianceByCenterDerived.filter(c => c.compliance >= 80 && c.compliance < 95).length;
  const centersBelow80 = complianceByCenterDerived.filter(c => c.compliance < 80).length;

  // Chart data for horizontal stacked bar
  const complianceChartData = complianceByCenterDerived.map(c => ({
    center: c.center,
    complete: c.completePercent,
    partial: c.partialPercent,
    missing: c.missingPercent,
  }));

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return { bg: '#D1FAE5', text: '#065F46' };
    if (compliance >= 80) return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#FEE2E2', text: '#991B1B' };
  };

  const GaugeChart = ({ value }: { value: number }) => {
    // SVG arc helper: center (cx,cy), radius r, from startAngle to endAngle (degrees, 0=right, CCW)
    const cx = 100, cy = 100, r = 70, sw = 16;
    const polarToCart = (angleDeg: number) => ({
      x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
      y: cy - r * Math.sin((angleDeg * Math.PI) / 180),
    });
    const arcPath = (startDeg: number, endDeg: number) => {
      const s = polarToCart(startDeg);
      const e = polarToCart(endDeg);
      const sweep = startDeg - endDeg;
      const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
      return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    };
    // Gauge spans from 180° (left) to 0° (right) — a semicircle
    // Zones: 0-33% = red, 33-66% = yellow, 66-100% = green
    const needleAngle = 180 - (value / 100) * 180;
    const needleLen = r - sw / 2 - 6;
    const needleTip = {
      x: cx + needleLen * Math.cos((needleAngle * Math.PI) / 180),
      y: cy - needleLen * Math.sin((needleAngle * Math.PI) / 180),
    };
    const gaugeColor = value >= 80 ? '#16A34A' : value >= 50 ? '#D97706' : '#DC2626';

    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-56 h-auto">
          {/* Background track */}
          <path d={arcPath(180, 0)} fill="none" stroke="#E5E7EB" strokeWidth={sw} strokeLinecap="round" />
          {/* Red zone: 0-33% → 180° to 120° */}
          <path d={arcPath(180, 120)} fill="none" stroke="#FCA5A5" strokeWidth={sw} strokeLinecap="butt" />
          {/* Yellow zone: 33-66% → 120° to 60° */}
          <path d={arcPath(120, 60)} fill="none" stroke="#FDE68A" strokeWidth={sw} strokeLinecap="butt" />
          {/* Green zone: 66-100% → 60° to 0° */}
          <path d={arcPath(60, 0)} fill="none" stroke="#86EFAC" strokeWidth={sw} strokeLinecap="butt" />
          {/* Needle */}
          <line
            x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y}
            stroke="#374151" strokeWidth="3" strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={cx} cy={cy} r="6" fill="#374151" />
          <circle cx={cx} cy={cy} r="3" fill="#FFFFFF" />
          {/* Value text */}
          <text x={cx} y={cy + 24} textAnchor="middle" fill={gaugeColor}
            style={{ fontSize: '22px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {value}%
          </text>
          <text x={cx} y={cy + 38} textAnchor="middle" fill="#6B7280" style={{ fontSize: '9px' }}>
            Tuân thủ pháp lý
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Báo cáo & Phân tích</h1>
        <p className="text-sm text-[#6B7280] mt-1">Thống kê và phân tích chi tiết hoạt động xuất hoá đơn</p>
      </div>

      {/* TABS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex-1 h-12 text-sm font-medium transition-all relative ${
              activeTab === 'revenue'
                ? 'text-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <TrendingUp size={16} />
              Doanh thu
            </span>
            {activeTab === 'revenue' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE0033]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`flex-1 h-12 text-sm font-medium transition-all relative ${
              activeTab === 'legal'
                ? 'text-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              Pháp lý
            </span>
            {activeTab === 'legal' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE0033]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('center')}
            className={`flex-1 h-12 text-sm font-medium transition-all relative ${
              activeTab === 'center'
                ? 'text-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText size={16} />
              {isManager ? 'Theo Cá nhân' : 'Theo TT/CN'}
            </span>
            {activeTab === 'center' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE0033]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex-1 h-12 text-sm font-medium transition-all relative ${
              activeTab === 'reconciliation'
                ? 'text-[#EE0033]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              Đối soát
            </span>
            {activeTab === 'reconciliation' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE0033]"></div>
            )}
          </button>
        </div>

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div className="p-6 space-y-6">
            {/* Filter Bar */}
            <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 flex-wrap">
                {/* Time Period Toggle */}
                <div className="flex gap-1 bg-white rounded-lg p-1 border border-[#E5E7EB]">
                  <button
                    onClick={() => setTimePeriod('month')}
                    className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded transition-colors ${
                      timePeriod === 'month'
                        ? 'bg-[#EE0033] text-white'
                        : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    Tháng
                  </button>
                  <button
                    onClick={() => setTimePeriod('quarter')}
                    className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded transition-colors ${
                      timePeriod === 'quarter'
                        ? 'bg-[#EE0033] text-white'
                        : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    Quý
                  </button>
                  <button
                    onClick={() => setTimePeriod('year')}
                    className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded transition-colors ${
                      timePeriod === 'year'
                        ? 'bg-[#EE0033] text-white'
                        : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    Năm
                  </button>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Từ ngày"
                      className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent w-36"
                      defaultValue="01/01/2026"
                    />
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                  <span className="text-[#9CA3AF]">—</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Đến ngày"
                      className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] focus:border-transparent w-36"
                      defaultValue="13/03/2026"
                    />
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </div>

                {/* Selects */}
                <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                  <option>Tất cả trung tâm</option>
                  <option>TT Hà Nội</option>
                  <option>TT TP.HCM</option>
                </select>

                <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
                  <option>Tất cả loại dịch vụ</option>
                  <option>Tích hợp hệ thống</option>
                  <option>Tư vấn CNTT</option>
                </select>

                <div className="flex-1"></div>

                {/* Action Buttons */}
                <button className="h-9 px-4 bg-[#EE0033] text-white rounded-lg text-sm font-medium hover:bg-[#CC002B] flex items-center gap-2">
                  <FileText size={14} />
                  <span className="hidden md:inline">Xem báo cáo</span>
                  <span className="md:hidden">Báo cáo</span>
                </button>
                <button className="hidden md:flex h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] items-center gap-2">
                  <Download size={14} />
                  Xuất Excel
                </button>
                <button className="hidden md:flex h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] items-center gap-2">
                  <Download size={14} />
                  Xuất PDF
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Tổng doanh thu</div>
                <div className="text-3xl font-bold text-[#EE0033]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  245,8 tỷ đ
                </div>
                <div className="flex items-center gap-1 text-xs text-[#16A34A] mt-2">
                  <ArrowUpRight size={12} />
                  <span>12,5% so với kỳ trước</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Số hoá đơn</div>
                <div className="text-3xl font-bold text-[#111827]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  342
                </div>
                <div className="flex items-center gap-1 text-xs text-[#16A34A] mt-2">
                  <ArrowUpRight size={12} />
                  <span>8,2% so với kỳ trước</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Trung bình/HĐ</div>
                <div className="text-3xl font-bold text-[#111827]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  718 triệu
                </div>
                <div className="flex items-center gap-1 text-xs text-[#16A34A] mt-2">
                  <ArrowUpRight size={12} />
                  <span>3,8% so với kỳ trước</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Tăng trưởng</div>
                <div className="text-3xl font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  +12,5%
                </div>
                <div className="flex items-center gap-1 text-xs text-[#6B7280] mt-2">
                  <ArrowUpRight size={12} />
                  <span>So với cùng kỳ năm trước</span>
                </div>
              </div>
            </div>

            {/* Charts Grid 2x2 */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stacked Bar Chart */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 overflow-x-auto">
                <h3 className="text-base font-semibold text-[#111827] mb-4">Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => `${value} tỷ đ`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          xuatHD: 'Đã xuất HĐ',
                          choPheDuyet: 'Chờ phê duyệt',
                          tuChoi: 'Từ chối',
                          khac: 'Khác'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Bar dataKey="xuatHD" name="Đã xuất HĐ" stackId="a" fill="#EE0033" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="choPheDuyet" name="Chờ phê duyệt" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="tuChoi" name="Từ chối" stackId="a" fill="#EAB308" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="khac" name="Khác" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Chart */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-4">Phân bổ theo loại dịch vụ</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={revenueDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {revenueDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {revenueDistributionData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-[#6B7280]">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Chart YoY */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-4">So sánh cùng kỳ năm trước</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={yoyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => `${value} tỷ đ`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => value === 'year2025' ? 'Năm 2025' : 'Năm 2026'}
                    />
                    <Line type="monotone" dataKey="year2025" stroke="#94A3B8" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="year2026" stroke="#EE0033" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Horizontal Bar Chart - Top 5 */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-4">Top 5 khách hàng</h3>
                <div className="space-y-3">
                  {topCustomersData.map((customer, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#374151] font-medium">{customer.name}</span>
                        <span className="text-[#6B7280]" style={{ fontVariantNumeric: 'tabular-nums' }}>{customer.value} tỷ đ</span>
                      </div>
                      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#EE0033] rounded-full"
                          style={{ width: `${(customer.value / 45.3) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB]">
                <h3 className="text-base font-semibold text-[#111827]">Bảng tổng hợp 12 tháng</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Kỳ</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Số HĐ</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Doanh thu</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">TB/HĐ</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Tăng trưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRevenueTable.map((row, index) => {
                      const isPositive = parseFloat(row.growth) >= 0;
                      return (
                        <tr key={index} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                          <td className="px-6 py-3 text-sm font-medium text-[#374151]">{row.month}</td>
                          <td className="px-6 py-3 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.invoices}
                          </td>
                          <td className="px-6 py-3 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.revenue}
                          </td>
                          <td className="px-6 py-3 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.avgPerInvoice}
                          </td>
                          <td className="px-6 py-3 text-sm text-right">
                            <span 
                              className={`inline-flex items-center gap-1 font-medium ${
                                isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {row.growth}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LEGAL COMPLIANCE TAB */}
        {activeTab === 'legal' && (
          <div className="p-6 space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Tổng đề nghị</div>
                <div className="text-[28px] font-bold text-[#111827]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {legalStats.total}
                </div>
                <div className="text-[13px] text-[#6B7280] mt-1">Đề nghị trong hệ thống</div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Đầy đủ hồ sơ</div>
                <div className="text-[28px] font-bold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {legalStats.complete}
                </div>
                <div className="text-[13px] text-[#6B7280] mt-1">{legalStats.completePercentage}% tổng số</div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Đang bổ sung</div>
                <div className="text-[28px] font-bold text-[#D97706]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {legalStats.supplementing + legalStats.insufficient}
                </div>
                <div className="text-[13px] text-[#6B7280] mt-1">Bổ sung: {legalStats.supplementing} · Thiếu: {legalStats.insufficient}</div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="text-xs font-medium text-[#6B7280] uppercase mb-2">Quá hạn</div>
                <div className="text-[28px] font-bold text-[#DC2626]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {legalStats.overdue}
                </div>
                <div className="text-[13px] text-[#6B7280] mt-1">Cần xử lý ngay</div>
              </div>
            </div>

            {/* Gauge and Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-6 text-center">Tỷ lệ tuân thủ chung</h3>
                <GaugeChart value={overallCompliance} />
                <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Đạt chuẩn (≥95%)</span>
                    <span className="font-semibold text-[#16A34A]">{centersAbove95} TT/CN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Cần cải thiện (80-95%)</span>
                    <span className="font-semibold text-[#EAB308]">{centersBetween80_95} TT/CN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Chưa đạt (&lt;80%)</span>
                    <span className="font-semibold text-[#DC2626]">{centersBelow80} TT/CN</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#111827] mb-4">Tuân thủ theo trung tâm/chi nhánh</h3>
                <ResponsiveContainer width="100%" height={Math.max(complianceChartData.length * 50, 200)}>
                  <BarChart data={complianceChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} domain={[0, 100]} />
                    <YAxis dataKey="center" type="category" tick={{ fill: '#6B7280', fontSize: 11 }} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => `${value}%`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value: string) => {
                        const labels: Record<string, string> = {
                          complete: 'Đầy đủ',
                          partial: 'Đang bổ sung',
                          missing: 'Quá hạn'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Bar dataKey="complete" name="Đầy đủ" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="partial" name="Đang bổ sung" stackId="a" fill="#EAB308" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="missing" name="Quá hạn" stackId="a" fill="#DC2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Compliance Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#111827]">Chi tiết tuân thủ pháp lý theo TT/CN</h3>
                <span className="text-xs text-[#6B7280]">Dữ liệu từ {legalStats.total} đề nghị</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trung tâm/CN</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Tổng ĐN</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Đầy đủ</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Bổ sung</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Quá hạn</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">% Tuân thủ</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase">Xu hướng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceByCenterDerived.map((row, index) => {
                      const colors = getComplianceColor(row.compliance);
                      const isPositiveTrend = parseFloat(row.trend) >= 0;
                      return (
                        <tr key={row.centerKey} className="border-b border-[#E5E7EB] hover:bg-[#FFF1F3] transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-[#374151]">{row.center}</td>
                          <td className="px-4 py-3 text-sm text-[#374151] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.total}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#16A34A] text-center font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.complete}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#D97706] text-center font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.partial}
                          </td>
                          <td className="px-4 py-3 text-sm text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {row.missing > 0 ? (
                              <span className="text-[#DC2626] font-medium">{row.missing}</span>
                            ) : (
                              <span className="text-[#6B7280]">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span 
                              className="inline-flex items-center h-7 px-3 rounded-full text-sm font-semibold"
                              style={{ backgroundColor: colors.bg, color: colors.text, fontVariantNumeric: 'tabular-nums' }}
                            >
                              {row.compliance}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span 
                              className={`inline-flex items-center gap-1 text-sm font-medium ${
                                isPositiveTrend ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {isPositiveTrend ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {row.trend}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Summary row */}
                    <tr className="bg-[#F9FAFB] font-semibold">
                      <td className="px-6 py-3 text-sm text-[#111827]">Toàn hệ thống</td>
                      <td className="px-4 py-3 text-sm text-[#111827] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {legalStats.total}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#16A34A] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {legalStats.complete}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D97706] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {legalStats.supplementing + legalStats.insufficient}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#DC2626] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {legalStats.overdue}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span 
                          className="inline-flex items-center h-7 px-3 rounded-full text-sm font-semibold"
                          style={{ 
                            backgroundColor: getComplianceColor(overallCompliance).bg, 
                            color: getComplianceColor(overallCompliance).text,
                            fontVariantNumeric: 'tabular-nums' 
                          }}
                        >
                          {overallCompliance}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-[#6B7280]">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* OTHER TABS PLACEHOLDER */}
        {activeTab === 'center' && (
          <CenterReport />
        )}

        {activeTab === 'reconciliation' && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F3F4F6] mb-4">
              <FileText size={32} className="text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              Báo cáo Đối soát
            </h3>
            <p className="text-sm text-[#6B7280]">Chức năng đang được phát triển</p>
          </div>
        )}
      </div>

      {/* Manager information note */}
      {isManager && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#C2410C] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#C2410C]">Phạm vi báo cáo</div>
            <div className="text-xs text-[#9A3412] mt-1">
              Báo cáo hiển thị dữ liệu TT Khu vực 3. Liên hệ Kế toán để xem báo cáo toàn công ty.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}