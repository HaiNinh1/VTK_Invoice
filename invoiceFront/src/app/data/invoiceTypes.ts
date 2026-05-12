// INVOICE TYPE MANAGEMENT DATA
// Each invoice type has specific legal document requirements

export interface LegalDocumentItem {
  id: string;
  name: string;
  description: string;
  required: boolean; // Bắt buộc hay không
  enabled: boolean; // Áp dụng cho loại HĐ này hay không
}

export interface InvoiceType {
  id: string;
  code: string;
  name: string;
  description: string;
  serviceTypes: string[]; // Các loại dịch vụ áp dụng
  legalDocuments: LegalDocumentItem[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  totalInvoices: number; // Tổng số HĐ thuộc loại này
  complianceRate: number; // % đạt chuẩn pháp lý
}

// Master list of all possible legal documents (11 items)
export const ALL_LEGAL_DOCUMENTS: Omit<LegalDocumentItem, 'enabled'>[] = [
  {
    id: 'LD-01',
    name: 'Hợp đồng kinh tế',
    description: 'Hợp đồng ký kết giữa hai bên',
    required: true
  },
  {
    id: 'LD-02',
    name: 'Biên bản nghiệm thu',
    description: 'Biên bản xác nhận hoàn thành công việc',
    required: true
  },
  {
    id: 'LD-03',
    name: 'Biên bản bàn giao',
    description: 'Biên bản bàn giao sản phẩm/dịch vụ',
    required: true
  },
  {
    id: 'LD-04',
    name: 'Biên bản quyết toán',
    description: 'Biên bản quyết toán chi phí dự án',
    required: false
  },
  {
    id: 'LD-05',
    name: 'Phụ lục hợp đồng',
    description: 'Các phụ lục điều chỉnh hợp đồng (nếu có)',
    required: false
  },
  {
    id: 'LD-06',
    name: 'Giấy đề nghị thanh toán',
    description: 'Đề nghị thanh toán từ khách hàng',
    required: false
  },
  {
    id: 'LD-07',
    name: 'Chứng từ thanh toán',
    description: 'UNC, séc, lệnh chi, etc.',
    required: true
  },
  {
    id: 'LD-08',
    name: 'Giấy xác nhận công nợ',
    description: 'Xác nhận số dư công nợ với khách hàng',
    required: false
  },
  {
    id: 'LD-09',
    name: 'Cam kết pháp lý',
    description: 'Cam kết bổ sung hồ sơ trong thời hạn',
    required: false
  },
  {
    id: 'LD-10',
    name: 'Giấy uỷ quyền',
    description: 'Uỷ quyền ký kết/nhận hóa đơn (nếu có)',
    required: false
  },
  {
    id: 'LD-11',
    name: 'Tài liệu kỹ thuật',
    description: 'Bản vẽ, thông số kỹ thuật, báo cáo kỹ thuật',
    required: false
  }
];

// Predefined invoice types
export const INVOICE_TYPES: InvoiceType[] = [
  {
    id: 'IT-001',
    code: 'LAP_DAT',
    name: 'Lắp đặt',
    description: 'Hóa đơn cho dịch vụ lắp đặt thiết bị, hệ thống',
    serviceTypes: ['Lắp đặt', 'Lắp đặt thiết bị', 'Thi công lắp đặt'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-07', 'LD-09', 'LD-11'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '01/01/2026',
    updatedBy: 'Admin',
    updatedDate: '01/01/2026',
    totalInvoices: 3,
    complianceRate: 67
  },
  {
    id: 'IT-002',
    code: 'DO_LUONG',
    name: 'Đo lường',
    description: 'Hóa đơn cho dịch vụ đo lường, kiểm định',
    serviceTypes: ['Đo lường', 'Kiểm định', 'Đo đạc'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-07', 'LD-11'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '01/01/2026',
    updatedBy: 'Admin',
    updatedDate: '01/01/2026',
    totalInvoices: 2,
    complianceRate: 100
  },
  {
    id: 'IT-003',
    code: 'TU_VAN',
    name: 'Tư vấn',
    description: 'Hóa đơn cho dịch vụ tư vấn CNTT, quản lý dự án',
    serviceTypes: ['Tư vấn CNTT', 'Tư vấn dự án', 'Tư vấn kỹ thuật'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-04', 'LD-07'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '01/01/2026',
    updatedBy: 'Admin',
    updatedDate: '05/03/2026',
    totalInvoices: 5,
    complianceRate: 80
  },
  {
    id: 'IT-004',
    code: 'PHAT_TRIEN',
    name: 'Phát triển phần mềm',
    description: 'Hóa đơn cho dịch vụ phát triển, custom phần mềm',
    serviceTypes: ['Phát triển phần mềm', 'Custom phần mềm', 'Lập trình'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-04', 'LD-05', 'LD-07', 'LD-11'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '01/01/2026',
    updatedBy: 'Nguyễn Văn Admin',
    updatedDate: '10/03/2026',
    totalInvoices: 4,
    complianceRate: 75
  },
  {
    id: 'IT-005',
    code: 'BAO_TRI',
    name: 'Bảo trì',
    description: 'Hóa đơn cho dịch vụ bảo trì, bảo dưỡng định kỳ',
    serviceTypes: ['Bảo trì hệ thống', 'Bảo dưỡng', 'Vận hành'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-07', 'LD-08'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '01/01/2026',
    updatedBy: 'Admin',
    updatedDate: '01/01/2026',
    totalInvoices: 3,
    complianceRate: 67
  },
  {
    id: 'IT-006',
    code: 'TICH_HOP',
    name: 'Tích hợp hệ thống',
    description: 'Hóa đơn cho dịch vụ tích hợp, kết nối hệ thống',
    serviceTypes: ['Tích hợp hệ thống', 'Kết nối API', 'Đồng bộ dữ liệu'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-04', 'LD-07', 'LD-11'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '01/01/2026',
    updatedBy: 'Admin',
    updatedDate: '01/01/2026',
    totalInvoices: 2,
    complianceRate: 50
  },
  {
    id: 'IT-007',
    code: 'CLOUD',
    name: 'Dịch vụ Cloud',
    description: 'Hóa đơn cho dịch vụ cloud, hosting, infrastructure',
    serviceTypes: ['Dịch vụ Cloud', 'Cloud hosting', 'IaaS', 'SaaS'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-07', 'LD-08'].includes(doc.id)
    })),
    status: 'active',
    createdBy: 'Admin',
    createdDate: '15/02/2026',
    updatedBy: 'Admin',
    updatedDate: '15/02/2026',
    totalInvoices: 1,
    complianceRate: 100
  },
  {
    id: 'IT-008',
    code: 'DAO_TAO',
    name: 'Đào tạo',
    description: 'Hóa đơn cho dịch vụ đào tạo, huấn luyện người dùng',
    serviceTypes: ['Đào tạo', 'Training', 'Huấn luyện'],
    legalDocuments: ALL_LEGAL_DOCUMENTS.map(doc => ({
      ...doc,
      enabled: ['LD-01', 'LD-02', 'LD-03', 'LD-07'].includes(doc.id)
    })),
    status: 'inactive',
    createdBy: 'Admin',
    createdDate: '20/02/2026',
    updatedBy: 'Admin',
    updatedDate: '20/02/2026',
    totalInvoices: 0,
    complianceRate: 0
  }
];

// Helper function to get invoice type by service type
export const getInvoiceTypeByService = (serviceType: string): InvoiceType | undefined => {
  return INVOICE_TYPES.find(type =>
    type.status === 'active' && type.serviceTypes.includes(serviceType)
  );
};

// Helper function to get required documents for a service type
export const getRequiredDocuments = (serviceType: string): LegalDocumentItem[] => {
  const invoiceType = getInvoiceTypeByService(serviceType);
  if (!invoiceType) return [];

  return invoiceType.legalDocuments.filter(doc => doc.enabled);
};
