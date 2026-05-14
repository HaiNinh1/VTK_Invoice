import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { INVOICE_REQUESTS as SEED_REQUESTS } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * RequestsContext — shared mutable store for đề nghị xuất HĐ.
 *
 * Replaces the previous pattern where each page (DeNghi, DeNghiForm,
 * SInvoice, PheDuyet) kept its own local override map. With this store
 * recall / export / approve / reject / return persist across pages and
 * survive reload via localStorage.
 *
 * Mutation API:
 *   addRequest(data)            → string id (DN-YYYY-NNNNN)
 *   updateRequest(id, patch)
 *   recallRequest(id)           → status → 'Nháp'
 *   submitRequest(id)           → status → 'Chờ duyệt'
 *   approveRequest(id, meta)    → status → 'Đã duyệt' + approvedBy/Date
 *   rejectRequest(id, reason)   → status → 'Từ chối' + rejectReason
 *   returnRequest(id, reason)   → status → 'Trả lại bổ sung'
 *   exportRequest(id)           → status → 'Đã xuất HĐ' + sInvoiceNumber
 *
 * Notification hooks: callers may pass a `pushNotification` from
 * NotificationsContext for cross-cutting events, but this store stays
 * notification-agnostic to avoid circular providers.
 * --------------------------------------------------------------------- */

const STORAGE_KEY = 'vtk:requests:v1'

const RequestsContext = createContext(null)

function loadInitial() {
  if (typeof window === 'undefined') return SEED_REQUESTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_REQUESTS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return SEED_REQUESTS
    return parsed
  } catch {
    return SEED_REQUESTS
  }
}

function nextRequestId(list) {
  const year = new Date().getFullYear()
  const prefix = `DN-${year}-`
  let max = 0
  for (const r of list) {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10)
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  // continue seed numbering from 101 baseline
  return `${prefix}${String(Math.max(max + 1, 200)).padStart(5, '0')}`
}

function nextSInvoiceNumber(list) {
  // Mimic Viettel S-Invoice serial: K26TYY + 7 digits, monotonically increasing.
  let max = 0
  for (const r of list) {
    if (typeof r.sInvoiceNumber === 'string' && r.sInvoiceNumber.startsWith('K26TYY')) {
      const n = parseInt(r.sInvoiceNumber.slice(6), 10)
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  if (max === 0) max = 140
  return `K26TYY${String(max + 1).padStart(7, '0')}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState(loadInitial)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
    } catch {
      /* ignore */
    }
  }, [requests])

  const addRequest = useCallback((data) => {
    let createdId
    setRequests(prev => {
      const id = nextRequestId(prev)
      createdId = id
      const valueBeforeVAT = Number(data.valueBeforeVAT) || 0
      const vatRate = Number(data.vatRate ?? 10)
      const vatAmount = Math.round(valueBeforeVAT * vatRate / 100)
      const next = {
        id,
        contractId: data.contractId ?? '',
        contractNumber: data.contractNumber ?? '',
        customerName: data.customerName ?? '',
        customerTaxCode: data.customerTaxCode ?? '',
        customerAddress: data.customerAddress ?? '',
        serviceType: data.serviceType ?? '',
        valueBeforeVAT,
        vatRate,
        vatAmount,
        valueAfterVAT: valueBeforeVAT + vatAmount,
        invoiceType: data.invoiceType ?? 'Tạo mới',
        originalInvoiceNumber: data.originalInvoiceNumber ?? null,
        adjustmentReason: data.adjustmentReason ?? null,
        paymentTerm: data.paymentTerm ?? '',
        paymentMethod: data.paymentMethod ?? '',
        department: data.department ?? '',
        createdBy: data.createdBy ?? '',
        createdById: data.createdById ?? '',
        createdDate: todayIso(),
        status: data.status ?? 'Nháp',
        legalChecklist: data.legalChecklist ?? { total: 0, checked: 0 },
        hasCommitment: Boolean(data.hasCommitment),
        commitmentDeadline: data.commitmentDeadline ?? null,
        commitmentText: data.commitmentText ?? null,
        approvedBy: null,
        approvedDate: null,
        rejectReason: null,
        sInvoiceNumber: null,
        sInvoiceTaxCode: null,
        buyerEmail: data.buyerEmail ?? '',
        notes: data.notes ?? '',
      }
      return [next, ...prev]
    })
    return createdId
  }, [])

  const updateRequest = useCallback((id, patch) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      const merged = { ...r, ...patch }
      if (patch.valueBeforeVAT !== undefined || patch.vatRate !== undefined) {
        const vbv = Number(merged.valueBeforeVAT) || 0
        const vr = Number(merged.vatRate) || 0
        merged.vatAmount = Math.round(vbv * vr / 100)
        merged.valueAfterVAT = vbv + merged.vatAmount
      }
      return merged
    }))
  }, [])

  /**
   * Recall guard: chỉ cho phép khi status === 'Chờ duyệt' và (nếu có userId) phải là người tạo.
   * Return: { ok: boolean, reason?: string }
   */
  const recallRequest = useCallback((id, userId) => {
    let result = { ok: false, reason: 'Không tìm thấy đề nghị' }
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      if (r.status !== 'Chờ duyệt') {
        result = { ok: false, reason: 'Chỉ được thu hồi khi đang Chờ duyệt' }
        return r
      }
      if (userId && r.createdById && r.createdById !== userId) {
        result = { ok: false, reason: 'Chỉ người tạo mới được thu hồi' }
        return r
      }
      result = { ok: true }
      return { ...r, status: 'Nháp', recalledAt: todayIso() }
    }))
    return result
  }, [])

  const submitRequest = useCallback((id) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Chờ duyệt', submittedAt: todayIso() } : r,
    ))
  }, [])

  /**
   * Approve guard: chỉ cho phép khi:
   *   - status === 'Chờ duyệt'
   *   - legalChecklist.checked === total, HOẮC hồ sơ thiếu nhưng có hasCommitment + commitmentDeadline >= today
   * meta: { approvedBy, approvedById, accountingRefNo, accountRevenue, accountTax, accountReceivable, approvalNote }
   */
  const approveRequest = useCallback((id, meta = {}) => {
    let result = { ok: false, reason: 'Không tìm thấy đề nghị' }
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      if (r.status !== 'Chờ duyệt') {
        result = { ok: false, reason: 'Chỉ duyệt được khi đang Chờ duyệt' }
        return r
      }
      const lc = r.legalChecklist ?? { total: 0, checked: 0 }
      const legalComplete = lc.total === 0 || lc.checked >= lc.total
      const commitmentValid = r.hasCommitment && r.commitmentDeadline && r.commitmentDeadline >= todayIso()
      if (!legalComplete && !commitmentValid) {
        result = { ok: false, reason: 'Hồ sơ pháp lý thiếu và không có cam kết bổ sung hợp lệ' }
        return r
      }
      result = { ok: true }
      return {
        ...r,
        status: 'Đã duyệt',
        approvedBy: meta.approvedBy ?? 'Hệ thống',
        approvedById: meta.approvedById ?? null,
        approvedDate: todayIso(),
        accountingRefNo: meta.accountingRefNo ?? null,
        accountRevenue: meta.accountRevenue ?? null,
        accountTax: meta.accountTax ?? null,
        accountReceivable: meta.accountReceivable ?? null,
        approvalNote: meta.approvalNote ?? null,
      }
    }))
    return result
  }, [])

  const rejectRequest = useCallback((id, reason) => {
    let result = { ok: false, reason: 'Không tìm thấy đề nghị' }
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      if (r.status !== 'Chờ duyệt') {
        result = { ok: false, reason: 'Chỉ từ chối được khi đang Chờ duyệt' }
        return r
      }
      result = { ok: true }
      return { ...r, status: 'Từ chối', rejectReason: reason ?? '' }
    }))
    return result
  }, [])

  const returnRequest = useCallback((id, reason) => {
    let result = { ok: false, reason: 'Không tìm thấy đề nghị' }
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      if (r.status !== 'Chờ duyệt') {
        result = { ok: false, reason: 'Chỉ trả lại được khi đang Chờ duyệt' }
        return r
      }
      result = { ok: true }
      return { ...r, status: 'Trả lại bổ sung', returnReason: reason ?? '' }
    }))
    return result
  }, [])

  /**
   * exportRequest: spec yc đã duyệt → gửi S-Invoice (Đang xử lý) → Thành công/Lỗi.
   * Default vào trạng thái 'Thành công' với sInvoiceNumber. Có option simulateError.
   */
  const exportRequest = useCallback((id, opts = {}) => {
    let issued = null
    let result = { ok: false, reason: 'Không tìm thấy đề nghị' }
    setRequests(prev => {
      const target = prev.find(r => r.id === id)
      if (!target) return prev
      if (target.status !== 'Đã duyệt' && target.status !== 'Trả lại bổ sung') {
        // allow re-export only from approved
        if (target.status !== 'Đã duyệt') {
          result = { ok: false, reason: 'Chỉ xuất được khi đã duyệt' }
          return prev
        }
      }
      const sInvoiceNumber = nextSInvoiceNumber(prev)
      issued = sInvoiceNumber
      const taxCode = `4A2B${String(1000 + (parseInt(sInvoiceNumber.slice(6), 10) % 9000)).padStart(4, '0')}`
      result = { ok: true }
      return prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'Đã xuất HĐ',
              sInvoiceNumber,
              sInvoiceTaxCode: taxCode,
              sInvoiceStatus: opts.simulateError ? 'Lỗi' : 'Thành công',
              sInvoiceError: opts.simulateError ? (opts.errorMessage ?? 'Lỗi kết nối S-Invoice') : null,
              exportedAt: todayIso(),
            }
          : r,
      )
    })
    return { ...result, sInvoiceNumber: issued }
  }, [])

  /** Retry export khi Lỗi: reset status về Đã duyệt để xuất lại, hoặc trigger reissue */
  const retryExport = useCallback((id) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      if (r.sInvoiceStatus !== 'Lỗi') return r
      const sInvoiceNumber = nextSInvoiceNumber(prev)
      return {
        ...r,
        sInvoiceNumber,
        sInvoiceStatus: 'Thành công',
        sInvoiceError: null,
        exportedAt: todayIso(),
      }
    }))
  }, [])

  const deleteRequest = useCallback((id) => {
    setRequests(prev => prev.filter(r => r.id !== id))
  }, [])

  const getRequest = useCallback(
    (id) => requests.find(r => r.id === id) ?? null,
    [requests],
  )

  const resetRequests = useCallback(() => {
    setRequests(SEED_REQUESTS)
  }, [])

  const value = useMemo(() => ({
    requests, addRequest, updateRequest, recallRequest, submitRequest,
    approveRequest,
    rejectRequest,
    returnRequest,
    exportRequest,
    retryExport,
    deleteRequest,
    getRequest, resetRequests,
  }), [
    requests, addRequest, updateRequest, recallRequest, submitRequest,
    approveRequest, rejectRequest, returnRequest, exportRequest, retryExport, deleteRequest,
    getRequest, resetRequests,
  ])

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  )
}

export function useRequests() {
  const ctx = useContext(RequestsContext)
  if (!ctx) throw new Error('useRequests must be used inside <RequestsProvider>')
  return ctx
}
