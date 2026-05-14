/**
 * masterData.js — Single source of truth for demo data.
 * Per Prompt 2 + Prompt 12. All components import from here.
 * Replace with real API calls when backend is ready.
 */

// -------------------------------- USERS ------------------------------------
export const USERS = [
  { id: 'u1', name: 'Nguyễn Văn An',   email: 'an.nv@viettel.vn',   role: 'employee',  department: 'KV3', hasSignature: true  },
  { id: 'u2', name: 'Trần Thị Bình',   email: 'binh.tt@viettel.vn', role: 'accountant', department: 'TC',  hasSignature: true  },
  { id: 'u3', name: 'Lê Quang Cường',  email: 'cuong.lq@viettel.vn', role: 'manager',   department: 'KV3', hasSignature: false },
  { id: 'u4', name: 'Phạm Mỹ Dung',    email: 'dung.pm@viettel.vn', role: 'admin',     department: 'IT',  hasSignature: true  },
  { id: 'u5', name: 'Hoàng Minh Đức',  email: 'duc.hm@viettel.vn',  role: 'employee',  department: 'KV1', hasSignature: true  },
]

export const CURRENT_USER_BY_ROLE = {
  employee:   USERS[0],
  manager:    USERS[2],
  accountant: USERS[1],
  admin:      USERS[3],
}

export const ROLE_LABELS = {
  employee:   'Nhân viên',
  manager:    'Quản lý',
  accountant: 'Kế toán',
  admin:      'Quản trị viên',
}

// ------------------------ INVOICE TYPE CONFIGS -----------------------------
// Prompt 12: defines what documents are required per invoice type.
// Used by Contract page + Invoice form Tab 2 to render dynamic checklist.
export const INVOICE_TYPE_CONFIGS = [
  {
    id: 'lap-dat',
    name: 'Lắp đặt công trình',
    serviceType: 'Lắp đặt',
    active: true,
    documentGroups: [
      { groupName: 'Hồ sơ Hợp đồng', documents: [
        { id: 'hd1', name: 'Hợp đồng đã ký',         required: true  },
        { id: 'hd2', name: 'Phụ lục hợp đồng',       required: false },
        { id: 'hd3', name: 'Biên bản đàm phán giá',  required: true  },
      ]},
      { groupName: 'Hồ sơ Nghiệm thu', documents: [
        { id: 'nt1', name: 'BB nghiệm thu khối lượng',     required: true },
        { id: 'nt2', name: 'BB nghiệm thu hoàn thành',     required: true },
        { id: 'nt3', name: 'Bảng tổng hợp KL nghiệm thu', required: true },
      ]},
      { groupName: 'Hồ sơ Quyết toán', documents: [
        { id: 'qt1', name: 'Biên bản quyết toán',         required: true },
        { id: 'qt2', name: 'Bảng tính giá trị quyết toán', required: true },
        { id: 'qt3', name: 'Xác nhận công nợ',            required: true },
      ]},
      { groupName: 'Thanh toán & Bảo lãnh', documents: [
        { id: 'tt1', name: 'Đề nghị thanh toán',          required: true },
        { id: 'tt2', name: 'BL thực hiện HĐ / Bảo hành',  required: true },
      ]},
    ],
  },
  {
    id: 'tu-van',
    name: 'Tư vấn thiết kế',
    serviceType: 'Tư vấn',
    active: true,
    documentGroups: [
      { groupName: 'Hồ sơ Hợp đồng', documents: [
        { id: 'tv-hd1', name: 'Hợp đồng đã ký',   required: true },
        { id: 'tv-hd2', name: 'Phụ lục hợp đồng', required: false },
      ]},
      { groupName: 'Hồ sơ Nghiệm thu', documents: [
        { id: 'tv-nt1', name: 'BB nghiệm thu sản phẩm tư vấn', required: true },
        { id: 'tv-nt2', name: 'Báo cáo tư vấn cuối kỳ',       required: true },
      ]},
      { groupName: 'Thanh toán', documents: [
        { id: 'tv-tt1', name: 'Đề nghị thanh toán', required: true },
        { id: 'tv-tt2', name: 'Xác nhận công nợ',   required: true },
      ]},
    ],
  },
  {
    id: 'do-luong',
    name: 'Đo lường',
    serviceType: 'Đo lường',
    active: true,
    documentGroups: [
      { groupName: 'Hồ sơ Hợp đồng', documents: [
        { id: 'dl-hd1', name: 'Hợp đồng đã ký', required: true },
      ]},
      { groupName: 'Nghiệm thu', documents: [
        { id: 'dl-nt1', name: 'BB đo lường hiện trường', required: true },
        { id: 'dl-nt2', name: 'Báo cáo kết quả đo',      required: true },
        { id: 'dl-nt3', name: 'BB nghiệm thu kết quả',   required: true },
      ]},
      { groupName: 'Thanh toán', documents: [
        { id: 'dl-tt1', name: 'Đề nghị thanh toán', required: true },
        { id: 'dl-tt2', name: 'Xác nhận công nợ',   required: true },
      ]},
    ],
  },
  {
    id: 'bao-tri',
    name: 'Bảo trì bảo dưỡng',
    serviceType: 'Bảo trì',
    active: true,
    documentGroups: [
      { groupName: 'Hồ sơ Hợp đồng', documents: [
        { id: 'bt-hd1', name: 'Hợp đồng bảo trì', required: true },
      ]},
      { groupName: 'Nghiệm thu', documents: [
        { id: 'bt-nt1', name: 'BB bảo trì định kỳ',     required: true },
        { id: 'bt-nt2', name: 'Báo cáo bảo trì tháng',  required: true },
      ]},
      { groupName: 'Thanh toán', documents: [
        { id: 'bt-tt1', name: 'Đề nghị thanh toán', required: true },
      ]},
    ],
  },
]

/** Look up the full checklist for a given serviceType. */
export function getChecklistForServiceType(serviceType) {
  const cfg = INVOICE_TYPE_CONFIGS.find(c => c.serviceType === serviceType)
  return cfg?.documentGroups ?? []
}

/** Count total docs across all groups for a config. */
export function totalDocsForServiceType(serviceType) {
  return getChecklistForServiceType(serviceType).reduce(
    (sum, g) => sum + g.documents.length, 0,
  )
}

// -------------------------------- CONTRACTS --------------------------------
const CUSTOMERS = [
  { name: 'VNPT Hà Nội',            tax: '0100684378', addr: '57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội' },
  { name: 'Mobifone',               tax: '0100686209', addr: 'MM18 Trung Hòa, Cầu Giấy, Hà Nội' },
  { name: 'FPT Telecom',            tax: '0101778163', addr: '17 Duy Tân, Cầu Giấy, Hà Nội' },
  { name: 'LG Display Hải Phòng',   tax: '0201585834', addr: 'KCN Tràng Duệ, An Dương, Hải Phòng' },
  { name: 'Samsung Electronics HCMC', tax: '0314617985', addr: 'Khu CNC, Quận 9, TP Hồ Chí Minh' },
  { name: 'Viettel Construction',   tax: '0102232556', addr: 'Số 1 Trần Hữu Dực, Nam Từ Liêm, Hà Nội' },
  { name: 'BQLDA TP Hà Nội',        tax: '0107654321', addr: '79 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội' },
  { name: 'Tổng Cty Điện lực miền Bắc', tax: '0100100417', addr: '20 Trần Nguyên Hãn, Hoàn Kiếm, Hà Nội' },
  { name: 'EVN HANOI',              tax: '0100101114', addr: '69 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội' },
  { name: 'CMC Telecom',            tax: '0103510543', addr: 'Toà nhà CMC, Duy Tân, Cầu Giấy, Hà Nội' },
]
const SERVICE_TYPES = ['Tư vấn', 'Đo lường', 'Lắp đặt', 'Bảo trì']
const DEPARTMENTS = ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'DL', 'DDL']
const CONTRACT_STATUSES = ['Đang thực hiện', 'Đã quyết toán', 'Đã thanh lý']

// Deterministic seeded random for stable demo data
function seeded(i, salt = 1) {
  const x = Math.sin(i * 9301 + salt * 49297) * 233280
  return x - Math.floor(x)
}

function makeContract(i) {
  const cust = CUSTOMERS[i % CUSTOMERS.length]
  const serviceType = SERVICE_TYPES[Math.floor(seeded(i, 2) * 4)]
  const totalDocs = totalDocsForServiceType(serviceType) || 8
  const uploadedCount = Math.max(0, Math.floor(seeded(i, 3) * (totalDocs + 1)))
  const groups = getChecklistForServiceType(serviceType)
  const flatDocs = groups.flatMap(g => g.documents.map(d => ({ ...d, group: g.groupName })))
  const documents = flatDocs.slice(0, uploadedCount).map((d, idx) => ({
    id: `doc-${i}-${idx}`,
    name: d.name,
    group: d.group,
    fileName: `${d.name.toLowerCase().replace(/\s+/g, '_')}_${i}.pdf`,
    uploadDate: `2025-${String(((i + idx) % 11) + 1).padStart(2, '0')}-15`,
  }))
  const month = String(((i % 12) + 1)).padStart(2, '0')
  return {
    id: `HD-2025-${String(i + 1).padStart(3, '0')}`,
    contractNumber: `${i + 1}/2025/HĐKT-VTK`,
    customerName: cust.name,
    customerTaxCode: cust.tax,
    customerAddress: cust.addr,
    serviceType,
    signDate: `2025-${month}-${String(((i * 3) % 27) + 1).padStart(2, '0')}`,
    totalValue: Math.round((500 + seeded(i, 5) * 4500)) * 1_000_000,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    status: CONTRACT_STATUSES[Math.floor(seeded(i, 6) * 3)],
    documents,
    totalDocs,
    uploadedCount: documents.length,
  }
}

export const CONTRACTS = Array.from({ length: 10 }, (_, i) => makeContract(i))

// --------------------------- INVOICE REQUESTS ------------------------------
const REQUEST_STATUSES = [
  'Nháp', 'Chờ duyệt', 'Đã duyệt', 'Đã xuất HĐ', 'Từ chối', 'Trả lại bổ sung',
]
const PAYMENT_TERMS = ['Đợt 1', 'Đợt 2', 'Thanh toán cuối']
const INVOICE_KINDS = ['Tạo mới', 'Điều chỉnh', 'Thay thế']

function makeRequest(i) {
  const contract = CONTRACTS[i % CONTRACTS.length]
  const valueBeforeVAT = Math.round(contract.totalValue * (0.2 + seeded(i, 7) * 0.6))
  const vatRate = 10
  const vatAmount = Math.round(valueBeforeVAT * vatRate / 100)
  const status = REQUEST_STATUSES[Math.floor(seeded(i, 8) * REQUEST_STATUSES.length)]
  const checklistTotal = contract.totalDocs
  const checklistChecked = Math.min(checklistTotal, contract.uploadedCount + Math.floor(seeded(i, 9) * 3))
  const hasCommitment = checklistChecked < checklistTotal && (status === 'Chờ duyệt' || status === 'Nháp')
  const creatorIdx = i % USERS.length
  const monthIdx = (i % 3) + 1
  return {
    id: `DN-2026-${String(101 + i).padStart(5, '0')}`,
    contractId: contract.id,
    contractNumber: contract.contractNumber,
    customerName: contract.customerName,
    customerTaxCode: contract.customerTaxCode,
    customerAddress: contract.customerAddress,
    serviceType: contract.serviceType,
    valueBeforeVAT,
    vatRate,
    vatAmount,
    valueAfterVAT: valueBeforeVAT + vatAmount,
    invoiceType: INVOICE_KINDS[i % 3],
    paymentTerm: PAYMENT_TERMS[i % 3],
    department: contract.department,
    createdBy: USERS[creatorIdx].name,
    createdById: USERS[creatorIdx].id,
    createdDate: `2026-0${monthIdx}-${String(((i * 5) % 27) + 1).padStart(2, '0')}`,
    status,
    legalChecklist: {
      total: checklistTotal,
      checked: checklistChecked,
    },
    hasCommitment,
    commitmentDeadline: hasCommitment ? `2026-04-${String(((i * 2) % 27) + 1).padStart(2, '0')}` : null,
    approvedBy: ['Đã duyệt', 'Đã xuất HĐ'].includes(status) ? USERS[1].name : null,
    approvedDate: ['Đã duyệt', 'Đã xuất HĐ'].includes(status) ? `2026-03-${String(((i * 4) % 27) + 1).padStart(2, '0')}` : null,
    sInvoiceNumber: status === 'Đã xuất HĐ' ? `K26TYY${String(140 + i).padStart(7, '0')}` : null,
    sInvoiceTaxCode: status === 'Đã xuất HĐ' ? `4A2B${String(1000 + i).padStart(4, '0')}` : null,
    buyerEmail: `ketoan@${contract.customerName.toLowerCase().split(' ')[0]}.vn`,
  }
}

export const INVOICE_REQUESTS = Array.from({ length: 15 }, (_, i) => makeRequest(i))

// ----------------------- SIDEBAR NAV CONFIG --------------------------------
// Driven by spec: 7 items (after Prompt 16). Each item declares which roles see it.
// Component renders Lucide icon by name to keep this file framework-free.
export const NAV_ITEMS = [
  { to: '/',          label: 'Việc cần làm',   icon: 'ClipboardList', roles: ['employee', 'manager', 'accountant', 'admin'] },
  { to: '/hop-dong',  label: 'Hợp đồng',       icon: 'FileText',      roles: ['employee', 'manager', 'accountant', 'admin'] },
  { to: '/de-nghi',   label: 'Đề nghị xuất HĐ', icon: 'FilePlus',     roles: ['employee', 'manager', 'accountant', 'admin'] },
  { to: '/phap-ly',   label: 'Pháp lý',        icon: 'ShieldCheck',   roles: ['manager', 'accountant', 'admin'] },
  { to: '/phe-duyet', label: 'Phê duyệt',      icon: 'CheckSquare',   roles: ['employee', 'manager', 'accountant', 'admin'] },
  { to: '/s-invoice', label: 'S-Invoice',      icon: 'Monitor',       roles: ['accountant', 'admin'] },
  { to: '/cai-dat',   label: 'Cài đặt',        icon: 'Settings',      roles: ['accountant', 'admin'] },
]
