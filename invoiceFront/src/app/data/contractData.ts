// CONTRACT MANAGEMENT DATA
// Manages contracts with multiple payment installments

export interface PaymentInstallment {
  id: string;
  name: string; // Đợt 1, Đợt 2, Đợt cuối
  percentage: number; // % của tổng giá trị hợp đồng
  amount: number; // Số tiền của đợt này
  condition: string; // Điều kiện thanh toán
  dueDate: string; // Hạn thanh toán
  status: 'pending' | 'invoiced' | 'paid'; // Trạng thái
  invoiceRequestId?: string; // ID đề nghị xuất HĐ (nếu đã tạo)
  invoiceNo?: string; // Số HĐ (nếu đã xuất)
  paidDate?: string; // Ngày thanh toán (nếu đã TT)
  specificDocuments: string[]; // Giấy tờ riêng của đợt này
}

export interface ContractDocument {
  id: string;
  name: string;
  type: string; // Loại giấy tờ (theo LD-01, LD-02...)
  uploadDate: string;
  uploadBy: string;
  fileUrl?: string; // URL file (demo)
  isMaster: boolean; // true = dùng chung cho tất cả đợt, false = chỉ cho 1 đợt
  installmentId?: string; // Nếu là giấy tờ riêng của đợt
}

export interface Contract {
  id: string;
  code: string; // Mã hợp đồng
  name: string; // Tên hợp đồng
  customer: string;
  taxCode: string;
  serviceType: string;
  totalValue: number; // Tổng giá trị hợp đồng (trước thuế)
  taxRate: string;
  totalValueAfterTax: number;
  signDate: string; // Ngày ký
  startDate: string; // Ngày bắt đầu
  endDate: string; // Ngày kết thúc
  revenueCenter: string;
  projectManager: string; // Người quản lý dự án
  status: 'active' | 'completed' | 'terminated' | 'draft';

  // Payment installments
  installments: PaymentInstallment[];

  // Master documents (dùng chung cho tất cả đợt)
  masterDocuments: ContractDocument[];

  // Progress tracking
  totalInvoiced: number; // Tổng đã xuất HĐ
  totalPaid: number; // Tổng đã thanh toán
  remainingAmount: number; // Còn lại

  // Metadata
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

// Sample contracts data
export const CONTRACTS: Contract[] = [
  {
    id: 'CT-001',
    code: 'HĐ-2026-001',
    name: 'Hợp đồng tích hợp hệ thống quản lý VNPT',
    customer: 'VNPT Hà Nội',
    taxCode: '0100686209',
    serviceType: 'Tích hợp hệ thống',
    totalValue: 15000000000,
    taxRate: '10%',
    totalValueAfterTax: 16500000000,
    signDate: '01/01/2026',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    revenueCenter: 'KV3',
    projectManager: 'Nguyễn Văn A',
    status: 'active',
    installments: [
      {
        id: 'INS-001-1',
        name: 'Đợt 1: Khởi động dự án',
        percentage: 30,
        amount: 4500000000,
        condition: 'Sau khi ký hợp đồng và bàn giao mặt bằng',
        dueDate: '15/02/2026',
        status: 'paid',
        invoiceRequestId: 'DN-2026-00145',
        invoiceNo: 'VTK-089',
        paidDate: '20/02/2026',
        specificDocuments: ['Biên bản bàn giao mặt bằng', 'Giấy đề nghị thanh toán đợt 1']
      },
      {
        id: 'INS-001-2',
        name: 'Đợt 2: Nghiệm thu giai đoạn 1',
        percentage: 40,
        amount: 6000000000,
        condition: 'Sau khi nghiệm thu giai đoạn 1',
        dueDate: '15/06/2026',
        status: 'invoiced',
        invoiceRequestId: 'DN-2026-00150',
        invoiceNo: 'VTK-095',
        specificDocuments: ['Biên bản nghiệm thu giai đoạn 1', 'Báo cáo tiến độ', 'Giấy đề nghị thanh toán đợt 2']
      },
      {
        id: 'INS-001-3',
        name: 'Đợt 3: Nghiệm thu cuối và bàn giao',
        percentage: 30,
        amount: 4500000000,
        condition: 'Sau khi nghiệm thu toàn bộ và bàn giao hệ thống',
        dueDate: '31/12/2026',
        status: 'pending',
        specificDocuments: ['Biên bản nghiệm thu cuối cùng', 'Biên bản bàn giao hệ thống', 'Tài liệu hướng dẫn sử dụng']
      }
    ],
    masterDocuments: [
      {
        id: 'DOC-001-M1',
        name: 'Hợp đồng kinh tế số 01/2026/HĐ-VNPT',
        type: 'LD-01',
        uploadDate: '01/01/2026',
        uploadBy: 'Nguyễn Văn A',
        isMaster: true
      },
      {
        id: 'DOC-001-M2',
        name: 'Phụ lục 01 - Điều chỉnh phạm vi công việc',
        type: 'LD-05',
        uploadDate: '15/03/2026',
        uploadBy: 'Nguyễn Văn A',
        isMaster: true
      },
      {
        id: 'DOC-001-M3',
        name: 'Giấy uỷ quyền ký HĐ',
        type: 'LD-10',
        uploadDate: '01/01/2026',
        uploadBy: 'Nguyễn Văn A',
        isMaster: true
      }
    ],
    totalInvoiced: 10500000000,
    totalPaid: 4500000000,
    remainingAmount: 6000000000,
    createdBy: 'Nguyễn Văn A',
    createdDate: '01/01/2026',
    updatedBy: 'Nguyễn Văn A',
    updatedDate: '15/03/2026'
  },
  {
    id: 'CT-002',
    code: 'HĐ-2026-002',
    name: 'Hợp đồng phát triển phần mềm quản lý EVN',
    customer: 'EVN Miền Bắc',
    taxCode: '0100100079',
    serviceType: 'Phát triển phần mềm',
    totalValue: 8000000000,
    taxRate: '10%',
    totalValueAfterTax: 8800000000,
    signDate: '15/01/2026',
    startDate: '20/01/2026',
    endDate: '20/07/2026',
    revenueCenter: 'KV1',
    projectManager: 'Trần Thị B',
    status: 'active',
    installments: [
      {
        id: 'INS-002-1',
        name: 'Đợt 1: Ký hợp đồng',
        percentage: 20,
        amount: 1600000000,
        condition: 'Sau 7 ngày ký hợp đồng',
        dueDate: '22/01/2026',
        status: 'paid',
        invoiceRequestId: 'DN-2026-00146',
        invoiceNo: 'VTK-090',
        paidDate: '30/01/2026',
        specificDocuments: ['Giấy đề nghị thanh toán đợt 1']
      },
      {
        id: 'INS-002-2',
        name: 'Đợt 2: Bàn giao module 1',
        percentage: 50,
        amount: 4000000000,
        condition: 'Sau khi nghiệm thu module 1',
        dueDate: '20/05/2026',
        status: 'pending',
        specificDocuments: ['Biên bản nghiệm thu module 1', 'Source code module 1', 'Tài liệu kỹ thuật module 1']
      },
      {
        id: 'INS-002-3',
        name: 'Đợt 3: Nghiệm thu toàn bộ',
        percentage: 30,
        amount: 2400000000,
        condition: 'Sau khi nghiệm thu toàn bộ hệ thống',
        dueDate: '20/07/2026',
        status: 'pending',
        specificDocuments: ['Biên bản nghiệm thu tổng thể', 'Biên bản bàn giao', 'Tài liệu đào tạo']
      }
    ],
    masterDocuments: [
      {
        id: 'DOC-002-M1',
        name: 'Hợp đồng số 02/2026/HĐ-EVN',
        type: 'LD-01',
        uploadDate: '15/01/2026',
        uploadBy: 'Trần Thị B',
        isMaster: true
      },
      {
        id: 'DOC-002-M2',
        name: 'Yêu cầu kỹ thuật chi tiết',
        type: 'LD-11',
        uploadDate: '15/01/2026',
        uploadBy: 'Trần Thị B',
        isMaster: true
      }
    ],
    totalInvoiced: 1600000000,
    totalPaid: 1600000000,
    remainingAmount: 7200000000,
    createdBy: 'Trần Thị B',
    createdDate: '15/01/2026',
    updatedBy: 'Trần Thị B',
    updatedDate: '20/01/2026'
  },
  {
    id: 'CT-003',
    code: 'HĐ-2026-003',
    name: 'Hợp đồng bảo trì hệ thống Viettel Store',
    customer: 'Viettel Telecom',
    taxCode: '0100109106',
    serviceType: 'Bảo trì hệ thống',
    totalValue: 3600000000,
    taxRate: '10%',
    totalValueAfterTax: 3960000000,
    signDate: '01/02/2026',
    startDate: '01/02/2026',
    endDate: '31/01/2027',
    revenueCenter: 'KV2',
    projectManager: 'Lê Văn C',
    status: 'active',
    installments: [
      {
        id: 'INS-003-1',
        name: 'Quý 1/2026',
        percentage: 25,
        amount: 900000000,
        condition: 'Cuối quý 1',
        dueDate: '31/03/2026',
        status: 'invoiced',
        invoiceRequestId: 'DN-2026-00148',
        invoiceNo: 'VTK-092',
        specificDocuments: ['Báo cáo bảo trì quý 1', 'Biên bản nghiệm thu quý 1']
      },
      {
        id: 'INS-003-2',
        name: 'Quý 2/2026',
        percentage: 25,
        amount: 900000000,
        condition: 'Cuối quý 2',
        dueDate: '30/06/2026',
        status: 'pending',
        specificDocuments: ['Báo cáo bảo trì quý 2', 'Biên bản nghiệm thu quý 2']
      },
      {
        id: 'INS-003-3',
        name: 'Quý 3/2026',
        percentage: 25,
        amount: 900000000,
        condition: 'Cuối quý 3',
        dueDate: '30/09/2026',
        status: 'pending',
        specificDocuments: ['Báo cáo bảo trì quý 3', 'Biên bản nghiệm thu quý 3']
      },
      {
        id: 'INS-003-4',
        name: 'Quý 4/2026',
        percentage: 25,
        amount: 900000000,
        condition: 'Cuối quý 4',
        dueDate: '31/12/2026',
        status: 'pending',
        specificDocuments: ['Báo cáo bảo trì quý 4', 'Biên bản nghiệm thu quý 4', 'Báo cáo tổng kết năm']
      }
    ],
    masterDocuments: [
      {
        id: 'DOC-003-M1',
        name: 'Hợp đồng bảo trì 2026',
        type: 'LD-01',
        uploadDate: '01/02/2026',
        uploadBy: 'Lê Văn C',
        isMaster: true
      }
    ],
    totalInvoiced: 900000000,
    totalPaid: 0,
    remainingAmount: 3060000000,
    createdBy: 'Lê Văn C',
    createdDate: '01/02/2026',
    updatedBy: 'Lê Văn C',
    updatedDate: '15/03/2026'
  },
  {
    id: 'CT-004',
    code: 'HĐ-2026-004',
    name: 'Hợp đồng lắp đặt thiết bị CCTV - Bệnh viện 108',
    customer: 'Bệnh viện Trung ương Quân đội 108',
    taxCode: '0100456789',
    serviceType: 'Lắp đặt',
    totalValue: 5000000000,
    taxRate: '10%',
    totalValueAfterTax: 5500000000,
    signDate: '10/03/2026',
    startDate: '15/03/2026',
    endDate: '15/09/2026',
    revenueCenter: 'KV3',
    projectManager: 'Phạm Thị D',
    status: 'draft',
    installments: [
      {
        id: 'INS-004-1',
        name: 'Đợt 1: Tạm ứng',
        percentage: 30,
        amount: 1500000000,
        condition: 'Sau 5 ngày ký hợp đồng',
        dueDate: '20/03/2026',
        status: 'pending',
        specificDocuments: ['Đề nghị tạm ứng', 'Kế hoạch triển khai']
      },
      {
        id: 'INS-004-2',
        name: 'Đợt 2: Thanh lý hợp đồng',
        percentage: 70,
        amount: 3500000000,
        condition: 'Sau khi nghiệm thu và bàn giao',
        dueDate: '30/09/2026',
        status: 'pending',
        specificDocuments: ['Biên bản nghiệm thu', 'Biên bản bàn giao', 'Biên bản quyết toán']
      }
    ],
    masterDocuments: [
      {
        id: 'DOC-004-M1',
        name: 'Hợp đồng lắp đặt số 04/2026',
        type: 'LD-01',
        uploadDate: '10/03/2026',
        uploadBy: 'Phạm Thị D',
        isMaster: true
      },
      {
        id: 'DOC-004-M2',
        name: 'Thiết kế kỹ thuật hệ thống CCTV',
        type: 'LD-11',
        uploadDate: '10/03/2026',
        uploadBy: 'Phạm Thị D',
        isMaster: true
      }
    ],
    totalInvoiced: 0,
    totalPaid: 0,
    remainingAmount: 5500000000,
    createdBy: 'Phạm Thị D',
    createdDate: '10/03/2026',
    updatedBy: 'Phạm Thị D',
    updatedDate: '10/03/2026'
  }
];

// Helper functions
export const getContractById = (contractId: string): Contract | undefined => {
  return CONTRACTS.find(c => c.id === contractId);
};

export const getContractByCode = (code: string): Contract | undefined => {
  return CONTRACTS.find(c => c.code === code);
};

export const getActiveContracts = (): Contract[] => {
  return CONTRACTS.filter(c => c.status === 'active');
};

export const getPendingInstallments = (contractId: string): PaymentInstallment[] => {
  const contract = getContractById(contractId);
  if (!contract) return [];
  return contract.installments.filter(i => i.status === 'pending');
};

export const getContractProgress = (contractId: string): number => {
  const contract = getContractById(contractId);
  if (!contract) return 0;
  return Math.round((contract.totalInvoiced / contract.totalValueAfterTax) * 100);
};
