import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CONTRACTS as SEED_CONTRACTS, totalDocsForServiceType } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * ContractsContext — mutable client-side store for hợp đồng.
 *
 * Why: masterData.CONTRACTS is a static seed array. To support CRUD per
 * Prompt 14 without a backend, we mirror it into React state and persist
 * to localStorage. All pages (list, detail, form, DeNghiForm dropdown)
 * read from this single source so changes propagate.
 *
 * Schema additions over the seed model (all optional, used by Prompt 14):
 *   customerRepresentative, customerEmail, customerPhone,
 *   currency ('VND' | 'USD'), notes
 * --------------------------------------------------------------------- */

const STORAGE_KEY = 'vtk:contracts:v1'

const ContractsContext = createContext(null)

/** Load from localStorage; fall back to seed data on first run / parse error. */
function loadInitial() {
  if (typeof window === 'undefined') return SEED_CONTRACTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_CONTRACTS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return SEED_CONTRACTS
    return parsed
  } catch {
    return SEED_CONTRACTS
  }
}

/** Generate next contract id of shape HD-YYYY-NNN, unique within `list`. */
function nextContractId(list) {
  const year = new Date().getFullYear()
  const prefix = `HD-${year}-`
  let max = 0
  for (const c of list) {
    if (typeof c.id === 'string' && c.id.startsWith(prefix)) {
      const n = parseInt(c.id.slice(prefix.length), 10)
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function ContractsProvider({ children }) {
  const [contracts, setContracts] = useState(loadInitial)

  // Persist on every change.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts))
    } catch {
      /* quota / privacy mode — silently ignore for demo */
    }
  }, [contracts])

  /** Add a new contract. Caller passes partial data; we fill defaults. */
  const addContract = useCallback((data) => {
    let createdId
    setContracts(prev => {
      const id = nextContractId(prev)
      createdId = id
      const totalDocs = totalDocsForServiceType(data.serviceType) || 0
      const next = {
        id,
        contractNumber: data.contractNumber ?? '',
        customerName: data.customerName ?? '',
        customerTaxCode: data.customerTaxCode ?? '',
        customerAddress: data.customerAddress ?? '',
        customerRepresentative: data.customerRepresentative ?? '',
        customerEmail: data.customerEmail ?? '',
        customerPhone: data.customerPhone ?? '',
        serviceType: data.serviceType ?? '',
        signDate: data.signDate ?? '',
        totalValue: Number(data.totalValue) || 0,
        currency: data.currency ?? 'VND',
        department: data.department ?? '',
        status: data.status ?? 'Đang thực hiện',
        notes: data.notes ?? '',
        documents: [],
        totalDocs,
        uploadedCount: 0,
      }
      return [next, ...prev]
    })
    return createdId
  }, [])

  /** Update an existing contract by id. Partial patch; recomputes totalDocs if serviceType changes. */
  const updateContract = useCallback((id, patch) => {
    setContracts(prev => prev.map(c => {
      if (c.id !== id) return c
      const merged = { ...c, ...patch }
      if (patch.serviceType && patch.serviceType !== c.serviceType) {
        merged.totalDocs = totalDocsForServiceType(patch.serviceType) || 0
      }
      if (patch.totalValue !== undefined) {
        merged.totalValue = Number(patch.totalValue) || 0
      }
      return merged
    }))
  }, [])

  /** Delete a contract by id. */
  const deleteContract = useCallback((id) => {
    setContracts(prev => prev.filter(c => c.id !== id))
  }, [])

  /** Add an uploaded document to a contract. doc = {name, group, fileName, uploadDate} */
  const addDocument = useCallback((contractId, doc) => {
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId) return c
      const docId = `doc-${contractId}-${Date.now()}-${Math.floor(Math.random()*1000)}`
      const newDoc = { id: docId, ...doc }
      const documents = [...c.documents, newDoc]
      return { ...c, documents, uploadedCount: documents.length }
    }))
  }, [])

  /** Update an uploaded document's metadata (e.g. replace file). */
  const updateDocument = useCallback((contractId, docId, patch) => {
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId) return c
      const documents = c.documents.map(d => d.id === docId ? { ...d, ...patch } : d)
      return { ...c, documents, uploadedCount: documents.length }
    }))
  }, [])

  /** Remove an uploaded document from a contract. */
  const deleteDocument = useCallback((contractId, docId) => {
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId) return c
      const documents = c.documents.filter(d => d.id !== docId)
      return { ...c, documents, uploadedCount: documents.length }
    }))
  }, [])

  /** Look up by id (memo-friendly helper). */
  const getContract = useCallback(
    (id) => contracts.find(c => c.id === id) ?? null,
    [contracts],
  )

  /** Reset to seed data (useful for demos / dev). */
  const resetContracts = useCallback(() => {
    setContracts(SEED_CONTRACTS)
  }, [])

  const value = useMemo(
    () => ({ contracts, addContract, updateContract, deleteContract, addDocument, updateDocument, deleteDocument, getContract, resetContracts }),
    [contracts, addContract, updateContract, deleteContract, addDocument, updateDocument, deleteDocument, getContract, resetContracts],
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
