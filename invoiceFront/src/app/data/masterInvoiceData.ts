// MASTER INVOICE REQUEST DATASET
// Single source of truth for ALL pages in the VTK Invoice System
// Every page must reference this dataset to ensure data consistency

export interface InvoiceRequest {
  id: number;
  requestCode: string;
  invoiceNo: string;
  customer: string;
  taxCode: string;
  serviceType: string;
  beforeVAT: number;
  taxRate: string;
  afterVAT: number;
  revenueCenter: string;
  creator: string;
  department: string;
  createdDate: string;
  status: 'draft' | 'pending' | 'pending-vpgd' | 'approved' | 'issued' | 'rejected' | 'accounted';
  legalStatus: {
    completed: number;
    total: number;
    status: 'complete' | 'insufficient' | 'overdue' | 'supplementing';
  };
  commitment: {
    code: string;
    status: 'active' | 'overdue' | 'near-due';
    deadline: string;
    daysRemaining: number;
    content: string;
    createdBy: string;
    createdDate: string;
  } | null;
  sInvoiceStatus: 'completed' | 'sent-to-cqt' | 'error' | 'pending' | 'none';
  sInvoiceCode?: string;
  sInvoiceError?: string;
  vfsStatus: 'completed' | 'processing' | 'pending' | 'none';
}

export const MASTER_INVOICE_DATA: InvoiceRequest[] = [
  // Record 1
  {
    id: 1,
    requestCode: 'DN-2026-00145',
    invoiceNo: 'VTK-089',
    customer: 'VNPT Hà Nội',
    taxCode: '0100686209',
    serviceType: 'Lắp đặt',
    beforeVAT: 2450000000,
    taxRate: '10%',
    afterVAT: 2695000000,
    revenueCenter: 'KV3',
    creator: 'Nguyễn Văn A',
    department: 'P.KTCN',
    createdDate: '10/03/2026',
    status: 'approved',
    legalStatus: {
      completed: 8,
      total: 11,
      status: 'supplementing'
    },
    commitment: {
      code: 'CK-089',
      status: 'active',
      deadline: '30/04/2026',
      daysRemaining: 48,
      content: 'Hoàn thành công việc lắp đặt',
      createdBy: 'Nguyễn Văn A',
      createdDate: '10/03/2026'
    },
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000145',
    vfsStatus: 'completed'
  },
  // Record 2
  {
    id: 2,
    requestCode: 'DN-2026-00146',
    invoiceNo: 'VTK-090',
    customer: 'EVN Miền Bắc',
    taxCode: '0100100079',
    serviceType: 'Đo lường',
    beforeVAT: 850000000,
    taxRate: '10%',
    afterVAT: 935000000,
    revenueCenter: 'KV1',
    creator: 'Trần Thị B',
    department: 'P.TC',
    createdDate: '10/03/2026',
    status: 'issued',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000146',
    vfsStatus: 'completed'
  },
  // Record 3
  {
    id: 3,
    requestCode: 'DN-2026-00147',
    invoiceNo: 'VTK-091',
    customer: 'FPT Telecom',
    taxCode: '0101778163',
    serviceType: 'Tư vấn',
    beforeVAT: 1250000000,
    taxRate: '10%',
    afterVAT: 1375000000,
    revenueCenter: 'KV2',
    creator: 'Phạm Văn C',
    department: 'P.KTCN',
    createdDate: '11/03/2026',
    status: 'pending',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'pending',
    vfsStatus: 'pending'
  },
  // Record 4
  {
    id: 4,
    requestCode: 'DN-2026-00148',
    invoiceNo: 'VTK-092',
    customer: 'MobiFone Đà Nẵng',
    taxCode: '0401274480',
    serviceType: 'Lắp đặt',
    beforeVAT: 3200000000,
    taxRate: '10%',
    afterVAT: 3520000000,
    revenueCenter: 'KV5',
    creator: 'Lê Thị D',
    department: 'P.KTCN',
    createdDate: '11/03/2026',
    status: 'pending',
    legalStatus: {
      completed: 7,
      total: 11,
      status: 'insufficient'
    },
    commitment: null,
    sInvoiceStatus: 'pending',
    vfsStatus: 'pending'
  },
  // Record 5
  {
    id: 5,
    requestCode: 'DN-2026-00149',
    invoiceNo: 'VTK-093',
    customer: 'Samsung Bắc Ninh',
    taxCode: '0200772079',
    serviceType: 'Bảo trì',
    beforeVAT: 450000000,
    taxRate: '10%',
    afterVAT: 495000000,
    revenueCenter: 'KV1',
    creator: 'Nguyễn Văn A',
    department: 'P.KTCN',
    createdDate: '11/03/2026',
    status: 'draft',
    legalStatus: {
      completed: 3,
      total: 11,
      status: 'insufficient'
    },
    commitment: null,
    sInvoiceStatus: 'none',
    vfsStatus: 'none'
  },
  // Record 6
  {
    id: 6,
    requestCode: 'DN-2026-00150',
    invoiceNo: 'VTK-094',
    customer: 'LG Display Hải Phòng',
    taxCode: '0200658014',
    serviceType: 'Lắp đặt',
    beforeVAT: 5800000000,
    taxRate: '10%',
    afterVAT: 6380000000,
    revenueCenter: 'KV2',
    creator: 'Hoàng Văn E',
    department: 'P.KTCN',
    createdDate: '08/03/2026',
    status: 'approved',
    legalStatus: {
      completed: 9,
      total: 11,
      status: 'overdue'
    },
    commitment: {
      code: 'CK-094',
      status: 'overdue',
      deadline: '08/03/2026',
      daysRemaining: -5,
      content: 'Hoàn thành công việc lắp đặt',
      createdBy: 'Hoàng Văn E',
      createdDate: '08/03/2026'
    },
    sInvoiceStatus: 'error',
    sInvoiceError: 'MST không hợp lệ',
    vfsStatus: 'pending'
  },
  // Record 7
  {
    id: 7,
    requestCode: 'DN-2026-00151',
    invoiceNo: 'VTK-095',
    customer: 'Huawei Việt Nam',
    taxCode: '0101511501',
    serviceType: 'Tư vấn',
    beforeVAT: 780000000,
    taxRate: '8%',
    afterVAT: 842400000,
    revenueCenter: 'KV3',
    creator: 'Trần Văn F',
    department: 'P.KTCN',
    createdDate: '09/03/2026',
    status: 'accounted',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000151',
    vfsStatus: 'completed'
  },
  // Record 8
  {
    id: 8,
    requestCode: 'DN-2026-00152',
    invoiceNo: 'VTK-096',
    customer: 'VNPT TP.HCM',
    taxCode: '0301490025',
    serviceType: 'Đo lường',
    beforeVAT: 1650000000,
    taxRate: '10%',
    afterVAT: 1815000000,
    revenueCenter: 'KV7',
    creator: 'Nguyễn Thị G',
    department: 'P.KTCN',
    createdDate: '12/03/2026',
    status: 'pending',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'pending',
    vfsStatus: 'pending'
  },
  // Record 9
  {
    id: 9,
    requestCode: 'DN-2026-00153',
    invoiceNo: 'VTK-097',
    customer: 'CMC Telecom',
    taxCode: '0100886695',
    serviceType: 'Lắp đặt',
    beforeVAT: 920000000,
    taxRate: '10%',
    afterVAT: 1012000000,
    revenueCenter: 'KV2',
    creator: 'Phạm Văn C',
    department: 'P.KTCN',
    createdDate: '12/03/2026',
    status: 'draft',
    legalStatus: {
      completed: 5,
      total: 11,
      status: 'insufficient'
    },
    commitment: null,
    sInvoiceStatus: 'none',
    vfsStatus: 'none'
  },
  // Record 10
  {
    id: 10,
    requestCode: 'DN-2026-00154',
    invoiceNo: 'VTK-098',
    customer: 'Ericsson Việt Nam',
    taxCode: '0105018706',
    serviceType: 'Bảo trì',
    beforeVAT: 680000000,
    taxRate: '10%',
    afterVAT: 748000000,
    revenueCenter: 'KV3',
    creator: 'Phạm Văn C',
    department: 'P.KTCN',
    createdDate: '07/03/2026',
    status: 'rejected',
    legalStatus: {
      completed: 6,
      total: 11,
      status: 'insufficient'
    },
    commitment: null,
    sInvoiceStatus: 'none',
    vfsStatus: 'none'
  },
  // Record 11
  {
    id: 11,
    requestCode: 'DN-2026-00155',
    invoiceNo: 'VTK-099',
    customer: 'Nokia Networks',
    taxCode: '0106053719',
    serviceType: 'Tư vấn',
    beforeVAT: 1100000000,
    taxRate: '10%',
    afterVAT: 1210000000,
    revenueCenter: 'KV3',
    creator: 'Phạm Văn C',
    department: 'P.KTCN',
    createdDate: '06/03/2026',
    status: 'approved',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'sent-to-cqt',
    sInvoiceCode: 'K26TYY0000155',
    vfsStatus: 'processing'
  },
  // Record 12
  {
    id: 12,
    requestCode: 'DN-2026-00156',
    invoiceNo: 'VTK-100',
    customer: 'SCTV',
    taxCode: '0301416697',
    serviceType: 'Đo lường',
    beforeVAT: 520000000,
    taxRate: '8%',
    afterVAT: 561600000,
    revenueCenter: 'KV7',
    creator: 'Trần Văn F',
    department: 'P.KTCN',
    createdDate: '13/03/2026',
    status: 'draft',
    legalStatus: {
      completed: 2,
      total: 11,
      status: 'insufficient'
    },
    commitment: null,
    sInvoiceStatus: 'none',
    vfsStatus: 'none'
  },
  // Record 13
  {
    id: 13,
    requestCode: 'DN-2026-00157',
    invoiceNo: 'VTK-101',
    customer: 'VTC Intecom',
    taxCode: '0100110020',
    serviceType: 'Lắp đặt',
    beforeVAT: 4100000000,
    taxRate: '10%',
    afterVAT: 4510000000,
    revenueCenter: 'KV2',
    creator: 'Nguyễn Văn A',
    department: 'P.KTCN',
    createdDate: '05/03/2026',
    status: 'accounted',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000157',
    vfsStatus: 'completed'
  },
  // Record 14
  {
    id: 14,
    requestCode: 'DN-2026-00158',
    invoiceNo: 'VTK-102',
    customer: 'Viettel Construction',
    taxCode: '0100109106-003',
    serviceType: 'Lắp đặt',
    beforeVAT: 8500000000,
    taxRate: '10%',
    afterVAT: 9350000000,
    revenueCenter: 'KV6',
    creator: 'Nguyễn Thị G',
    department: 'P.KTCN',
    createdDate: '04/03/2026',
    status: 'issued',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000158',
    vfsStatus: 'processing'
  },
  // Record 15
  {
    id: 15,
    requestCode: 'DN-2026-00159',
    invoiceNo: 'VTK-103',
    customer: 'NetNam',
    taxCode: '0101010236',
    serviceType: 'Tư vấn',
    beforeVAT: 350000000,
    taxRate: '10%',
    afterVAT: 385000000,
    revenueCenter: 'KV3',
    creator: 'Nguyễn Văn A',
    department: 'P.KTCN',
    createdDate: '13/03/2026',
    status: 'pending',
    legalStatus: {
      completed: 10,
      total: 11,
      status: 'insufficient'
    },
    commitment: {
      code: 'CK-103',
      status: 'near-due',
      deadline: '15/04/2026',
      daysRemaining: 2,
      content: 'Cam kết bổ sung hồ sơ pháp lý thiếu',
      createdBy: 'Nguyễn Văn A',
      createdDate: '13/03/2026'
    },
    sInvoiceStatus: 'pending',
    vfsStatus: 'none'
  },
  // Record 16
  {
    id: 16,
    requestCode: 'DN-2026-00160',
    invoiceNo: 'VTK-104',
    customer: 'Viettel Telecom',
    taxCode: '0100109106-002',
    serviceType: 'Bảo trì',
    beforeVAT: 2100000000,
    taxRate: '10%',
    afterVAT: 2310000000,
    revenueCenter: 'KV1',
    creator: 'Hoàng Văn E',
    department: 'P.KTCN',
    createdDate: '03/03/2026',
    status: 'issued',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000160',
    vfsStatus: 'completed'
  },
  // Record 17
  {
    id: 17,
    requestCode: 'DN-2026-00161',
    invoiceNo: 'VTK-105',
    customer: 'Vinaphone',
    taxCode: '0100686209-005',
    serviceType: 'Tư vấn',
    beforeVAT: 1580000000,
    taxRate: '10%',
    afterVAT: 1738000000,
    revenueCenter: 'KV5',
    creator: 'Trần Thị B',
    department: 'P.TC',
    createdDate: '02/03/2026',
    status: 'accounted',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000161',
    vfsStatus: 'completed'
  },
  // Record 18
  {
    id: 18,
    requestCode: 'DN-2026-00162',
    invoiceNo: 'VTK-106',
    customer: 'VNPT Net',
    taxCode: '0100686209-006',
    serviceType: 'Lắp đặt',
    beforeVAT: 3750000000,
    taxRate: '10%',
    afterVAT: 4125000000,
    revenueCenter: 'KV1',
    creator: 'Lê Thị D',
    department: 'P.KTCN',
    createdDate: '01/03/2026',
    status: 'approved',
    legalStatus: {
      completed: 9,
      total: 11,
      status: 'supplementing'
    },
    commitment: {
      code: 'CK-106',
      status: 'near-due',
      deadline: '18/03/2026',
      daysRemaining: 5,
      content: 'Hoàn thành công việc lắp đặt',
      createdBy: 'Lê Thị D',
      createdDate: '01/03/2026'
    },
    sInvoiceStatus: 'pending',
    vfsStatus: 'pending'
  },
  // Record 19
  {
    id: 19,
    requestCode: 'DN-2026-00163',
    invoiceNo: 'VTK-107',
    customer: 'FPT Software',
    taxCode: '0101778163-001',
    serviceType: 'Đo lường',
    beforeVAT: 890000000,
    taxRate: '10%',
    afterVAT: 979000000,
    revenueCenter: 'KV2',
    creator: 'Nguyễn Văn A',
    department: 'P.KTCN',
    createdDate: '28/02/2026',
    status: 'issued',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000163',
    vfsStatus: 'completed'
  },
  // Record 20
  {
    id: 20,
    requestCode: 'DN-2026-00164',
    invoiceNo: 'VTK-108',
    customer: 'Viettel Mobile',
    taxCode: '0100109106-004',
    serviceType: 'Bảo trì',
    beforeVAT: 1420000000,
    taxRate: '10%',
    afterVAT: 1562000000,
    revenueCenter: 'KV6',
    creator: 'Phạm Văn C',
    department: 'P.KTCN',
    createdDate: '27/02/2026',
    status: 'issued',
    legalStatus: {
      completed: 11,
      total: 11,
      status: 'complete'
    },
    commitment: null,
    sInvoiceStatus: 'completed',
    sInvoiceCode: 'K26TYY0000164',
    vfsStatus: 'completed'
  }
];

// DERIVED STATS - All pages should calculate from MASTER_INVOICE_DATA

export const getMonthlyStats = () => {
  const marchRecords = MASTER_INVOICE_DATA.filter(r => r.createdDate.includes('/03/2026'));
  const pending = MASTER_INVOICE_DATA.filter(r => r.status === 'pending');
  const insufficient = MASTER_INVOICE_DATA.filter(r => r.legalStatus.status === 'insufficient' || r.legalStatus.status === 'overdue');
  const issued = MASTER_INVOICE_DATA.filter(r => r.status === 'issued');
  
  return {
    totalThisMonth: marchRecords.length,
    pendingApproval: pending.length,
    insufficientDocs: insufficient.length,
    issued: issued.length
  };
};

export const getRecentRequests = (limit: number = 5) => {
  return [...MASTER_INVOICE_DATA]
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.createdDate.split('/').reverse().join('-'));
      const dateB = new Date(b.createdDate.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);
};

export const getPendingApprovals = () => {
  return MASTER_INVOICE_DATA.filter(r => r.status === 'pending');
};

export const getCommitmentRecords = () => {
  return MASTER_INVOICE_DATA.filter(r => r.commitment !== null);
};

export const getSInvoiceByStatus = (status: 'completed' | 'sent-to-cqt' | 'error' | 'pending') => {
  return MASTER_INVOICE_DATA.filter(r => r.sInvoiceStatus === status);
};

export const getVFSByStatus = (status: 'completed' | 'processing' | 'pending') => {
  return MASTER_INVOICE_DATA.filter(r => r.vfsStatus === status);
};

export const getLegalStats = () => {
  const complete = MASTER_INVOICE_DATA.filter(r => r.legalStatus.status === 'complete');
  const supplementing = MASTER_INVOICE_DATA.filter(r => r.legalStatus.status === 'supplementing');
  const insufficient = MASTER_INVOICE_DATA.filter(r => r.legalStatus.status === 'insufficient');
  const overdue = MASTER_INVOICE_DATA.filter(r => r.legalStatus.status === 'overdue');
  
  return {
    total: MASTER_INVOICE_DATA.length,
    complete: complete.length,
    supplementing: supplementing.length,
    insufficient: insufficient.length,
    overdue: overdue.length,
    completePercentage: Math.round((complete.length / MASTER_INVOICE_DATA.length) * 100)
  };
};

// Helper to get single record by request code
export const getRecordByCode = (requestCode: string) => {
  return MASTER_INVOICE_DATA.find(r => r.requestCode === requestCode);
};