import type { ReactNode } from 'react';
import { useState } from 'react';
import { 
  FileText, Clock, AlertTriangle, CheckCircle, TrendingUp, ArrowUpRight,
  Users
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useMasterInvoiceData } from '../data/masterInvoiceData';

interface DashboardManagerProps {
  getStatusBadge: (status: string) => ReactNode;
  getLegalIcon: (legal: string) => ReactNode;
}

export default function DashboardManager({ getStatusBadge, getLegalIcon }: DashboardManagerProps) {
  const { MASTER_INVOICE_DATA } = useMasterInvoiceData();
  // Filter data for KV3 (TT Khu vực 3) department
  const kv3Records = MASTER_INVOICE_DATA.filter(r => r.revenueCenter === 'KV3');
  
  // Calculate stats for KV3
  const kv3ThisMonth = kv3Records.filter(r => {
    // Simple month filter - in real app would check actual dates
    return true; // For now, show all KV3 records as "this month"
  });
  
  const kv3Pending = kv3Records.filter(r => r.status === 'pending');
  const kv3IncompleteLegal = kv3Records.filter(r => r.legalStatus.status !== 'complete');
  const kv3Issued = kv3Records.filter(r => r.status === 'issued' || r.status === 'accounted');
  const kv3TotalRevenue = kv3Records.reduce((sum, r) => sum + (r.afterVAT || 0), 0);

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

  // Chart data - filtered for KV3 only
  const barChartData = [
    { id: 'month-1', month: 'T8/2025', revenue: 0 },
    { id: 'month-2', month: 'T9/2025', revenue: 0 },
    { id: 'month-3', month: 'T10/2025', revenue: 0 },
    { id: 'month-4', month: 'T11/2025', revenue: 0 },
    { id: 'month-5', month: 'T12/2025', revenue: 0 },
    { id: 'month-6', month: 'T1/2026', revenue: kv3TotalRevenue / 1000000000 }
  ];

  // Legal status donut - KV3 only
  const kv3LegalComplete = kv3Records.filter(r => r.legalStatus.status === 'complete').length;
  const kv3LegalInsufficient = kv3Records.filter(r => r.legalStatus.status === 'insufficient').length;
  const kv3LegalSupplementing = kv3Records.filter(r => r.legalStatus.status === 'supplementing').length;
  const kv3LegalOverdue = kv3Records.filter(r => r.legalStatus.status === 'overdue').length;

  const donutChartData = [
    { id: 'legal-1', name: 'Đạt chuẩn', value: kv3LegalComplete, color: '#16A34A' },
    { id: 'legal-2', name: 'Thiếu 1-2 HS', value: kv3LegalInsufficient, color: '#D97706' },
    { id: 'legal-3', name: 'Đang xử lý', value: kv3LegalSupplementing, color: '#94A3B8' },
    { id: 'legal-4', name: 'Quá hạn', value: kv3LegalOverdue, color: '#DC2626' }
  ].filter(item => item.value > 0);

  // Get unique employees from KV3
  const kv3Employees = Array.from(new Set(kv3Records.map(r => r.creator)));
  const employeeStats = kv3Employees.map(employeeName => {
    const employeeRecords = kv3Records.filter(r => r.creator === employeeName);
    const thisMonthCount = employeeRecords.length;
    const legalCompliant = employeeRecords.filter(r => r.legalStatus.status === 'complete').length;
    const activeCommitments = employeeRecords.filter(r => r.commitment !== null).length;
    
    return {
      name: employeeName,
      monthRequests: thisMonthCount,
      legalCompliance: `${legalCompliant}/${thisMonthCount}`,
      activeCommitments: activeCommitments
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">
          Tổng quan — TT Khu vực 3
        </h1>
        <p className="text-sm text-[#6B7280]">
          Dữ liệu tổng hợp cho Trung tâm Khu vực 3
        </p>
      </div>

      {/* 5 Stat Cards - Department Level */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Department Requests This Month */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1F3] flex items-center justify-center">
              <FileText size={20} className="text-[#EE0033]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#111827] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {kv3ThisMonth.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Đề nghị phòng ban tháng này</div>
        </div>

        {/* Card 2: Pending Approval (Department) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <Clock size={20} className="text-[#D97706]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#D97706] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {kv3Pending.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Chờ phê duyệt (phòng ban)</div>
        </div>

        {/* Card 3: Incomplete Legal (Department) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#DC2626]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#DC2626] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {kv3IncompleteLegal.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Thiếu hồ sơ pháp lý</div>
        </div>

        {/* Card 4: Issued Invoices */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle size={20} className="text-[#16A34A]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-[#16A34A] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {kv3Issued.length}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Đã xuất HĐ</div>
        </div>

        {/* Card 5: Department Revenue */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#EDE9FE] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#7C3AED]" />
            </div>
          </div>
          <div className="text-[20px] font-bold text-[#111827] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(kv3TotalRevenue)}
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">Doanh thu phòng ban</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart - Revenue by Month (KV3 only) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#111827]">Doanh thu TT Khu vực 3 theo tháng</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => `${value.toFixed(1)} tỷ`}
              />
              <Bar dataKey="revenue" fill="#EE0033" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart - Legal Status (KV3 only) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#111827]">Tình trạng pháp lý phòng ban</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {donutChartData.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-[#6B7280]">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests Table - KV3 Only */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#111827]">Đề nghị gần đây — TT Khu vực 3</h3>
            <button className="text-sm text-[#EE0033] font-medium hover:underline flex items-center gap-1">
              Xem tất cả
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">Mã ĐN</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">Khách hàng</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">Người tạo</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">GT sau VAT</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">Trạng thái</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">Pháp lý</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] px-6 py-3 whitespace-nowrap">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {kv3Records.slice(0, 8).map((record) => (
                <tr key={record.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#111827] whitespace-nowrap">
                    {record.requestCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151] whitespace-nowrap">
                    {record.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151] whitespace-nowrap">
                    {record.creator}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#111827] whitespace-nowrap">
                    {formatCurrency(record.afterVAT)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLegalIcon(getLegalStatusLabel(record.legalStatus.status))}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280] whitespace-nowrap">
                    {record.createdDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Summary Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
            <Users size={20} className="text-[#1E40AF]" />
          </div>
          <h3 className="text-base font-semibold text-[#111827]">Nhân viên phòng ban</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-3 px-4">Họ tên</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-3 px-4">Số ĐN tháng</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-3 px-4">Pháp lý tuân thủ</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-3 px-4">Cam kết active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {employeeStats.map((emp, index) => (
                <tr key={index} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-[#111827]">{emp.name}</td>
                  <td className="py-3 px-4 text-sm text-[#374151]">{emp.monthRequests}</td>
                  <td className="py-3 px-4 text-sm text-[#374151]">{emp.legalCompliance}</td>
                  <td className="py-3 px-4 text-sm text-[#374151]">{emp.activeCommitments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
