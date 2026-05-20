import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '@/services/api'
import { useRole } from '@/context/RoleContext'

/* -----------------------------------------------------------------------
 * ContractsContext — server-backed store for hợp đồng.
 *
 * Calls Laravel /api/contracts (+ /documents) and mirrors the response
 * into local React state so the existing pages don't need to change
 * their access pattern. Mutators are async and return the same shape
 * the demo store did (id for addContract, contract for getContract…).
 * --------------------------------------------------------------------- */

const ContractsContext = createContext(null)

function payloadFromForm(data) {
  return {
    contractNumber: data.contractNumber ?? '',
    customerName: data.customerName ?? '',
    customerTaxCode: data.customerTaxCode ?? '',
    customerAddress: data.customerAddress ?? '',
    customerRepresentative: data.customerRepresentative ?? null,
    customerEmail: data.customerEmail ?? null,
    customerPhone: data.customerPhone ?? null,
    serviceType: data.serviceType ?? '',
    signDate: data.signDate ?? '',
    totalValue: Number(data.totalValue) || 0,
    currency: data.currency ?? 'VND',
    department: data.department ?? '',
    status: data.status ?? 'Đang thực hiện',
    notes: data.notes ?? null,
  }
}

export function ContractsProvider({ children }) {
  const { isAuthenticated } = useRole()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!isAuthenticated) { setContracts([]); return }
    setLoading(true); setError(null)
    try {
      const res = await api.get('/contracts')
      setContracts(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (err) {
      setError(errorMessage(err))
    } finally { setLoading(false) }
  }, [isAuthenticated])

  useEffect(() => { reload() }, [reload])

  const addContract = useCallback(async (data) => {
    const res = await api.post('/contracts', payloadFromForm(data))
    const created = res.data?.data
    if (created) setContracts(prev => [created, ...prev.filter(c => c.id !== created.id)])
    return created?.id
  }, [])

  const updateContract = useCallback(async (id, patch) => {
    const res = await api.put(`/contracts/${id}`, payloadFromForm(patch))
    const updated = res.data?.data
    if (updated) setContracts(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }, [])

  const deleteContract = useCallback(async (id) => {
    await api.delete(`/contracts/${id}`)
    setContracts(prev => prev.filter(c => c.id !== id))
  }, [])

  const addDocument = useCallback(async (contractId, doc) => {
    const form = new FormData()
    form.append('name', doc.name ?? '')
    form.append('group', doc.group ?? '')
    if (doc.fileName) form.append('fileName', doc.fileName)
    if (doc.uploadDate) form.append('uploadDate', doc.uploadDate)
    if (doc.file instanceof File || doc.file instanceof Blob) form.append('file', doc.file)
    const res = await api.post(`/contracts/${contractId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const newDoc = res.data?.data
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId || !newDoc) return c
      const documents = [...(c.documents ?? []), newDoc]
      return { ...c, documents, uploadedCount: documents.length }
    }))
    return newDoc
  }, [])

  // Kept for API compatibility; server has no PATCH doc endpoint, so we
  // emulate locally (used only for legacy demo-time edits).
  const updateDocument = useCallback(async (contractId, docId, patch) => {
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId) return c
      const documents = (c.documents ?? []).map(d => d.id === docId ? { ...d, ...patch } : d)
      return { ...c, documents, uploadedCount: documents.length }
    }))
  }, [])

  const deleteDocument = useCallback(async (contractId, docId) => {
    await api.delete(`/contracts/${contractId}/documents/${docId}`)
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId) return c
      const documents = (c.documents ?? []).filter(d => d.id !== docId)
      return { ...c, documents, uploadedCount: documents.length }
    }))
  }, [])

  const getContract = useCallback(
    (id) => contracts.find(c => c.id === id) ?? null,
    [contracts],
  )

  const resetContracts = useCallback(() => reload(), [reload])

  const value = useMemo(
    () => ({
      contracts, loading, error,
      addContract, updateContract, deleteContract,
      addDocument, updateDocument, deleteDocument,
      getContract, resetContracts, reload,
    }),
    [contracts, loading, error, addContract, updateContract, deleteContract, addDocument, updateDocument, deleteDocument, getContract, resetContracts, reload],
  )

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  )
}

export function useContracts() {
  const ctx = useContext(ContractsContext)
  if (!ctx) throw new Error('useContracts must be used inside <ContractsProvider>')
  return ctx
}
