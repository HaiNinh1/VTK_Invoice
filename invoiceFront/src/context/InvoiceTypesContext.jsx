import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { INVOICE_TYPE_CONFIGS as SEED } from '@/data/masterData'

/* -----------------------------------------------------------------------
 * InvoiceTypesContext — mutable client-side store for "Loại HĐ" (Prompt 12).
 *
 * Mirrors the static seed INVOICE_TYPE_CONFIGS into React state and persists
 * to localStorage. Supports full CRUD over invoice types and their document
 * checklists. Other pages that need the legacy export keep working — they
 * import the seed; the live data flows through this context.
 *
 * Schema (per type):
 *   { id, name, serviceType, active, documentGroups: [
 *       { groupName, documents: [ { id, name, required } ] }
 *   ]}
 * --------------------------------------------------------------------- */

const STORAGE_KEY = 'vtk:invoice-types:v1'

const InvoiceTypesContext = createContext(null)

function loadInitial() {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : SEED
  } catch { return SEED }
}

function uniqueDocId(prefix = 'doc') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function nextTypeId(list, hint = 'loai-hd') {
  const base = hint.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loai-hd'
  if (!list.some(t => t.id === base)) return base
  let n = 2
  while (list.some(t => t.id === `${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export function InvoiceTypesProvider({ children }) {
  const [types, setTypes] = useState(loadInitial)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(types)) } catch { /* ignore */ }
  }, [types])

  /** Add new invoice type. Returns the generated id. */
  const addType = useCallback((data) => {
    let createdId
    setTypes(prev => {
      const id = nextTypeId(prev, data.name)
      createdId = id
      return [
        ...prev,
        {
          id,
          name: data.name ?? 'Loại HĐ mới',
          serviceType: data.serviceType ?? data.name ?? 'Khác',
          active: data.active ?? true,
          documentGroups: data.documentGroups ?? [
            { groupName: 'Hồ sơ Hợp đồng', documents: [] },
          ],
        },
      ]
    })
    return createdId
  }, [])

  const updateType = useCallback((id, patch) => {
    setTypes(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const deleteType = useCallback((id) => {
    setTypes(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleActive = useCallback((id) => {
    setTypes(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }, [])

  // -- Group + document mutations -----------------------------------------
  const addGroup = useCallback((typeId, groupName) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: [
        ...t.documentGroups,
        { groupName: groupName || 'Nhóm mới', documents: [] },
      ],
    })))
  }, [])

  const renameGroup = useCallback((typeId, idx, newName) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i === idx ? { ...g, groupName: newName } : g),
    })))
  }, [])

  const deleteGroup = useCallback((typeId, idx) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.filter((_, i) => i !== idx),
    })))
  }, [])

  const addDocument = useCallback((typeId, groupIdx, doc) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i !== groupIdx ? g : ({
        ...g,
        documents: [
          ...g.documents,
          { id: uniqueDocId(), name: doc?.name ?? 'Tài liệu mới', required: doc?.required ?? true },
        ],
      })),
    })))
  }, [])

  const updateDocument = useCallback((typeId, groupIdx, docId, patch) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i !== groupIdx ? g : ({
        ...g,
        documents: g.documents.map(d => d.id === docId ? { ...d, ...patch } : d),
      })),
    })))
  }, [])

  const deleteDocument = useCallback((typeId, groupIdx, docId) => {
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i !== groupIdx ? g : ({
        ...g,
        documents: g.documents.filter(d => d.id !== docId),
      })),
    })))
  }, [])

  const value = useMemo(() => ({
    types,
    addType, updateType, deleteType, toggleActive,
    addGroup, renameGroup, deleteGroup,
    addDocument, updateDocument, deleteDocument,
  }), [types, addType, updateType, deleteType, toggleActive, addGroup, renameGroup, deleteGroup, addDocument, updateDocument, deleteDocument])

  return (
    <InvoiceTypesContext.Provider value={value}>
      {children}
    </InvoiceTypesContext.Provider>
  )
}

export function useInvoiceTypes() {
  const ctx = useContext(InvoiceTypesContext)
  if (!ctx) throw new Error('useInvoiceTypes must be used inside <InvoiceTypesProvider>')
  return ctx
}
