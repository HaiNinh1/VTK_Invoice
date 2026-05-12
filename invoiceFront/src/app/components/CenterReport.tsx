import { useState } from 'react';
import {
  ArrowLeft, Star, Calendar, ChevronDown, Download, ArrowUpRight,
  ArrowDownRight, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function CenterReport() {
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Center revenue data
  const centerRevenueData = [
    { name: 'TT Khu vực 1', revenue: 45.8, invoices: 78, compliance: 92, commitments: 12, trend: '+8.5' },
    { name: 'TT Khu vực 2', revenue: 38.5, invoices: 65, compliance: 88, commitments: 9, trend: '+5.2' },
    { name: 'TT Khu vực 3', revenue: 35.2, invoices: 58, compliance: 95, commitments: 15, trend: '+12.3' },
    { name: 'TT Khu vực 4', revenue: 28.9, invoices: 48, compliance: 82, commitments: 7, trend: '-2.1' },
    { name: 'TT Khu vực 5', revenue: 25.3, invoices: 42, compliance: 78, commitments: 5, trend: '+3.8' },
    { name: 'TT Khu vực 6', revenue: 22.7, invoices: 38, compliance: 86, commitments: 8, trend: '+6.4' },
    { name: 'TT Khu vực 7', revenue: 18.4, invoices: 32, compliance: 90, commitments: 6, trend: '+4.2' },
    { name: 'TT Khu vực 8', revenue: 15.2, invoices: 26, compliance: 84, commitments: 4, trend: '+1.9' }
  ];

  // Individual employees data for TT Khu vực 3
  const employeeData = [
    { name: 'Nguyễn Văn A', role: 'Trưởng phòng', requests: 18, revenue: '8.200.000.000', onTime: 16, late: 2, commitments: 5, rating: 'good' },
    { name: 'Trần Thị B', role: 'Kế toán trưởng', requests: 15, revenue: '6.800.000.000', onTime: 15, late: 0, commitments: 3, rating: 'good' },
    { name: 'Lê Văn C', role: 'Nhân viên', requests: 12, revenue: '5.200.000.000', onTime: 11, late: 1, commitments: 4, rating: 'good' },
    { name: 'Phạm Thị D', role: 'Nhân viên', requests: 10, revenue: '4.500.000.000', onTime: 9, late: 1, commitments: 2, rating: 'good' },
    { name: 'Hoàng Văn E', role: 'Nhân viên', requests: 9, revenue: '3.900.000.000', onTime: 8, late: 1, commitments: 1, rating: 'average' },
    { name: 'Đỗ Thị F', role: 'Nhân viên', requests: 8, revenue: '2.800.000.000', onTime: 7, late: 1, commitments: 0, rating: 'average' },
    { name: 'Vũ Văn G', role: 'Nhân viên', requests: 7, revenue: '2.100.000.000', onTime: 5, late: 2, commitments: 0, rating: 'needs-improvement' },
    { name: 'Bùi Thị H', role: 'Nhân viên', requests: 6, revenue: '1.700.000.000', onTime: 5, late: 1, commitments: 0, rating: 'average' },
    { name: 'Đinh Văn I', role: 'Nhân viên', requests: 5, revenue: '1.200.000.000', onTime: 4, late: 1, commitments: 0, rating: 'average' },
    { name: 'Dương Thị K', role: 'Nhân viên', requests: 4, revenue: '980.000.000', onTime: 3, late: 1, commitments: 0, rating: 'needs-improvement' },
    { name: 'Ngô Văn L', role: 'Nhân viên', requests: 3, revenue: '750.000.000', onTime: 2, late: 1, commitments: 0, rating: 'needs-improvement' },
    { name: 'Phan Thị M', role: 'Nhân viên', requests: 3, revenue: '650.000.000', onTime: 3, late: 0, commitments: 0, rating: 'good' },
    { name: 'Tô Văn N', role: 'Nhân viên', requests: 2, revenue: '420.000.000', onTime: 2, late: 0, commitments: 0, rating: 'good' },
    { name: 'Lý Thị O', role: 'Nhân viên', requests: 2, revenue: '380.000.000', onTime: 1, late: 1, commitments: 0, rating: 'needs-improvement' },
    { name: 'Mai Văn P', role: 'Nhân viên', requests: 1, revenue: '250.000.000', onTime: 1, late: 0, commitments: 0, rating: 'good' }
  ];

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'good':
        return (
          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] font-medium">
            <Star size={12} className="fill-[#065F46]" />
            Tốt
          </div>
        );
      case 'average':
        return (
          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] font-medium">
            <Star size={12} className="fill-[#92400E]" />
            Trung bình
          </div>
        );
      case 'needs-improvement':
        return (
          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#FEE2E2] text-[#991B1B] font-medium">
            <Star size={12} />
            Cần cải thiện
          </div>
        );
    }
  };

  if (selectedCenter) {
    // SUB-VIEW 2: Individual drill-down
    return (
      <div className="p-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCenter(null)}
              className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#6B7280]" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">{selectedCenter} — Chi tiết theo cá nhân</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">Hiệu suất và tuân thủ theo từng nhân viên</p>
            </div>
          </div>
          <button className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] flex items-center gap-2">
            <Download size={14} />
            Xuất báo cáo
          </button>
        </div>

        {/* Employee Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F3F4F6]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Họ tên</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Chức danh</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Số ĐN tạo</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Tổng giá trị</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Đúng hạn PL</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trễ hạn PL</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Cam kết</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((employee, index) => (
                  <tr key={index} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-[#EE0033] hover:underline">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">{employee.role}</td>
                    <td className="px-6 py-4 text-sm text-[#374151] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {employee.requests}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#374151] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {employee.revenue}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#D1FAE5] text-[#065F46] text-xs font-medium">
                        {employee.onTime}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {employee.late > 0 ? (
                        <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                          {employee.late}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#374151] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {employee.commitments > 0 ? employee.commitments : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getRatingBadge(employee.rating)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW 1: By Center
  return (
    <div className="p-6 space-y-6">
      {/* Filter Bar */}
      <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Time Period Toggle */}
          <div className="flex gap-1 bg-white rounded-lg p-1 border border-[#E5E7EB]">
            <button
              onClick={() => setReportPeriod('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                reportPeriod === 'month'
                  ? 'bg-[#EE0033] text-white'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setReportPeriod('quarter')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                reportPeriod === 'quarter'
                  ? 'bg-[#EE0033] text-white'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Quý
            </button>
            <button
              onClick={() => setReportPeriod('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                reportPeriod === 'year'
                  ? 'bg-[#EE0033] text-white'
                  : 'text-[#6B7280] hover:text-[#374151]'
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
                className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] w-36"
                defaultValue="01/01/2026"
              />
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
            <span className="text-[#9CA3AF]">—</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Đến ngày"
                className="h-9 pl-9 pr-3 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] w-36"
                defaultValue="13/03/2026"
              />
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
          </div>

          {/* Center Select */}
          <div className="relative">
            <select className="h-9 px-3 pr-8 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0033] appearance-none bg-white">
              <option>Tất cả TT Doanh thu</option>
              {centerRevenueData.map((center, idx) => (
                <option key={idx}>{center.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>

          <div className="flex-1"></div>

          {/* Action Button */}
          <button className="h-9 px-4 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] transition-colors">
            Xem
          </button>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h3 className="text-base font-semibold text-[#111827] mb-4">Doanh thu theo Trung tâm</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={centerRevenueData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: any, name: any) => {
                if (name === 'revenue') return [`${value} tỷ đ`, 'Doanh thu'];
                return [value, name];
              }}
            />
            <Bar dataKey="revenue" fill="#EE0033" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h3 className="text-base font-semibold text-[#111827]">Bảng xếp hạng Trung tâm</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase w-16">Hạng</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Trung tâm</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Tổng doanh thu</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Số HĐ</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Tỷ lệ tuân thủ PL</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Cam kết active</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {centerRevenueData.map((center, index) => {
                const isPositive = parseFloat(center.trend) >= 0;
                const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                return (
                  <tr
                    key={index}
                    className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer"
                    onClick={() => setSelectedCenter(center.name)}
                  >
                    <td className="px-6 py-4 text-center">
                      {index < 3 ? (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-white font-bold text-sm"
                          style={{ backgroundColor: medalColors[index] }}
                        >
                          {index + 1}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto bg-[#F3F4F6] text-[#6B7280] font-semibold text-sm">
                          {index + 1}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#EE0033] hover:underline">{center.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#111827] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {center.revenue} tỷ đ
                    </td>
                    <td className="px-6 py-4 text-sm text-[#374151] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {center.invoices}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center h-7 px-3 rounded-full text-sm font-semibold ${
                          center.compliance >= 95
                            ? 'bg-[#D1FAE5] text-[#065F46]'
                            : center.compliance >= 80
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {center.compliance}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#374151] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {center.commitments}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {isPositive ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
                        {center.trend}%
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
  );
}