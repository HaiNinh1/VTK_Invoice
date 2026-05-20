import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '@/services/api'
import { useRole } from '@/context/RoleContext'

/* -----------------------------------------------------------------------
 * RequestsContext — server-backed store for đề nghị xuất HĐ.
 *
 * Wraps /api/requests + lifecycle actions (submit/recall/approve/reject/
 * return/export/retry-export). Public method signatures match the prior
 * demo store so consumers (DeNghi, DeNghiForm, PheDuyet, SInvoice) don't
 * need API changes — they just become async-aware where they read return
 * values.
 *
 * Action helpers return { ok: boolean, reason?: string, ... } so the
 * existing call sites that branch on `res.ok` keep working.
 * --------------------------------------------------------------------- */

const RequestsContext = createContext(null)

function buildPayload(data) {
  const payload = {
    contractId: data.contractId,
    valueBeforeVAT: data.valueBeforeVAT !== undefined ? Number(data.valueBeforeVAT) : undefined,
    vatRate: data.vatRate !== undefined ? Number(data.vatRate) : undefined,
    paymentTerm: data.paymentTerm,
    paymentMethod: data.paymentMethod ?? undefined,
    invoiceType: data.invoiceType ?? undefined,
    originalInvoiceNumber: data.originalInvoiceNumber ?? null,
    adjustmentReason: data.adjustmentReason ?? null,
    buyerEmail: data.buyerEmail ?? null,
    notes: data.notes ?? null,
    status: data.status,
    hasCommitment: data.hasCommitment !== undefined ? Boolean(data.hasCommitment) : undefined,
    commitmentText: data.commitmentText ?? null,
    commitmentDeadline: data.commitmentDeadline ?? null,
    legalChecklist: data.legalChecklist,
  }
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  return payload
}

async function actionCall(url) {
  try {
    const res = await api.post(url)
    return { ok: true, data: res.data?.data ?? null, raw: res.data }
  } catch (err) {
    return { ok: false, reason: errorMessage(err), data: null }
  }
}
async function actionCallWithBody(url, body) {
  try {
    const res = await api.post(url, body)
    return { ok: true, data: res.data?.data ?? null, raw: res.data }
  } catch (err) {
    return { ok: false, reason: errorMessage(err), data: null }
  }
}

export function RequestsProvider({ children }) {
  const { isAuthenticated } = useRole()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!isAuthenticated) { setRequests([]); return }
    setLoading(true); setError(null)
    try {
      const res = await api.get('/requests')
      setRequests(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (err) { setError(errorMessage(err)) }
    finally { setLoading(false) }
  }, [isAuthenticated])

  useEffect(() => { reload() }, [reload])

  const upsert = useCallback((req) => {
    if (!req) return
    setRequests(prev => {
      const i = prev.findIndex(r => r.id === req.id)
      if (i === -1) return [req, ...prev]
      const next = prev.slice(); next[i] = req; return next
    })
  }, [])

  const addRequest = useCallback(async (data) => {
    const res = await api.post('/requests', buildPayload(data))
    const created = res.data?.data ?? res.data
    upsert(created)
    return created?.id
  }, [upsert])

  const updateRequest = useCallback(async (id, patch) => {
    const res = await api.put(`/requests/${id}`, buildPayload(patch))
    const updated = res.data?.data ?? res.data
    upsert(updated)
    return updated
  }, [upsert])

  const submitRequest = useCallback(async (id) => {
    const r = await actionCall(`/requests/${id}/submit`)
    if (r.ok) upsert(r.data)
    return r
  }, [upsert])

  const recallRequest = useCallback(async (id /* , userId */) => {
    const r = await actionCall(`/requests/${id}/recall`)
    if (r.ok) upsert(r.data)
    return r
  }, [upsert])

  const approveRequest = useCallback(async (id, meta = {}) => {
    const r = await actionCallWithBody(`/requests/${id}/approve`, {
      accountingRefNo: meta.accountingRefNo,
      accountRevenue: meta.accountRevenue,
      accountTax: meta.accountTax,
      accountReceivable: meta.accountReceivable,
      approvalNote: meta.approvalNote,
    })
    if (r.ok) upsert(r.data)
    return r
  }, [upsert])

  const rejectRequest = useCallback(async (id, reason) => {
    const r = await actionCallWithBody(`/requests/${id}/reject`, { reason })
    if (r.ok) upsert(r.data)
    return r
  }, [upsert])

  const returnRequest = useCallback(async (id, reason) => {
    const r = await actionCallWithBody(`/requests/${id}/return`, { reason })
    if (r.ok) upsert(r.data)
    return r
  }, [upsert])

  const exportRequest = useCallback(async (id /* , opts */) => {
    try {
      const res = await api.post(`/requests/${id}/export`)
      const data = res.data?.data ?? null
      upsert(data)
      return { ok: true, sInvoiceNumber: res.data?.sInvoiceNumber ?? data?.sInvoiceNumber ?? null, data }
    } catch (err) {
      return { ok: false, reason: errorMessage(err), sInvoiceNumber: null, data: null }
    }
  }, [upsert])

  const retryExport = useCallback(async (id) => {
    try {
      const res = await api.post(`/requests/${id}/retry-export`)
      const data = res.data?.data ?? null
      upsert(data)
      return { ok: true, sInvoiceNumber: res.data?.sInvoiceNumber ?? data?.sInvoiceNumber ?? null, data }
    } catch (err) {
      return { ok: false, reason: errorMessage(err), sInvoiceNumber: null, data: null }
    }
  }, [upsert])

  const deleteRequest = useCallback(async (id) => {
    await api.delete(`/requests/${id}`)
    setRequests(prev => prev.filter(r => r.id !== id))
  }, [])

  const getRequest = useCallback(
    (id) => requests.find(r => r.id === id) ?? null,
    [requests],
  )

  const resetRequests = useCallback(() => reload(), [reload])

  const value = useMemo(() => ({
    requests, loading, error, reload,
    addRequest, updateRequest,
    submitRequest, recallRequest,
    approveRequest, rejectRequest, returnRequest,
    exportRequest, retryExport,
    deleteRequest, getRequest, resetRequests,
  }), [requests, loading, error, reload, addRequest, updateRequest, submitRequest, recallRequest, approveRequest, rejectRequest, returnRequest, exportRequest, retryExport, deleteRequest, getRequest, resetRequests])

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
