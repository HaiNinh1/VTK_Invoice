import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { api, errorMessage } from '@/services/api'
import { useRole } from '@/context/RoleContext'

/* -----------------------------------------------------------------------
 * InvoiceTypesContext — server-backed store for "Loại HĐ".
 *
 * Wraps /api/invoice-types + /groups + /document-templates endpoints.
 * Mutators are async; the consuming UI (CaiDat InvoiceTypesEditor)
 * already triggers them via user actions so awaiting them is fine.
 *
 * Local cache is refetched after every mutation by mapping the server
 * response back into the cached list. The shape preserved:
 *   { id, name, serviceType, active, documentGroups: [
 *       { id, groupName, documents: [{ id, name, required }] }
 *   ]}
 * --------------------------------------------------------------------- */

const InvoiceTypesContext = createContext(null)

function replaceItem(list, item) {
  if (!item) return list
  const i = list.findIndex(t => t.id === item.id)
  if (i === -1) return [...list, item]
  const next = list.slice(); next[i] = item; return next
}

export function InvoiceTypesProvider({ children }) {
  const { isAuthenticated } = useRole()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!isAuthenticated) { setTypes([]); return }
    setLoading(true); setError(null)
    try {
      const res = await api.get('/invoice-types')
      setTypes(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (err) { setError(errorMessage(err)) }
    finally { setLoading(false) }
  }, [isAuthenticated])

  useEffect(() => { reload() }, [reload])

  const addType = useCallback(async (data) => {
    const res = await api.post('/invoice-types', {
      name: data.name,
      serviceType: data.serviceType ?? data.name,
      active: data.active ?? true,
    })
    const created = res.data?.data
    if (created) setTypes(prev => [...prev, created])
    return created?.id
  }, [])

  const updateType = useCallback(async (id, patch) => {
    const res = await api.patch(`/invoice-types/${id}`, {
      name: patch.name,
      serviceType: patch.serviceType,
      active: patch.active,
    })
    const updated = res.data?.data
    if (updated) setTypes(prev => replaceItem(prev, updated))
    return updated
  }, [])

  const deleteType = useCallback(async (id) => {
    await api.delete(`/invoice-types/${id}`)
    setTypes(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleActive = useCallback(async (id) => {
    const res = await api.post(`/invoice-types/${id}/toggle-active`)
    const active = res.data?.active
    setTypes(prev => prev.map(t => t.id === id ? { ...t, active: Boolean(active) } : t))
  }, [])

  // ---- Groups ----------------------------------------------------------
  const addGroup = useCallback(async (typeId, groupName) => {
    const res = await api.post(`/invoice-types/${typeId}/groups`, { groupName: groupName || 'Nhóm mới' })
    const group = res.data?.data
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: [...(t.documentGroups ?? []), group],
    })))
  }, [])

  /**
   * renameGroup(typeId, idx, newName) — the editor passes an array index;
   * we look up the group's server id from current state and call PATCH.
   */
  const renameGroup = useCallback(async (typeId, idx, newName) => {
    let group
    setTypes(prev => prev.map(t => {
      if (t.id !== typeId) return t
      const g = t.documentGroups?.[idx]
      if (!g) return t
      group = g
      return {
        ...t,
        documentGroups: t.documentGroups.map((x, i) => i === idx ? { ...x, groupName: newName } : x),
      }
    }))
    if (!group) return
    try {
      await api.patch(`/invoice-types/${typeId}/groups/${group.id}`, { groupName: newName })
    } catch (err) {
      await reload()
      throw err
    }
  }, [reload])

  const deleteGroup = useCallback(async (typeId, idx) => {
    let groupId
    setTypes(prev => prev.map(t => {
      if (t.id !== typeId) return t
      const g = t.documentGroups?.[idx]; if (!g) return t
      groupId = g.id
      return { ...t, documentGroups: t.documentGroups.filter((_, i) => i !== idx) }
    }))
    if (!groupId) return
    try { await api.delete(`/invoice-types/${typeId}/groups/${groupId}`) }
    catch (err) { await reload(); throw err }
  }, [reload])

  // ---- Templates -------------------------------------------------------
  const addDocument = useCallback(async (typeId, groupIdx, doc) => {
    const current = types.find(t => t.id === typeId)
    const group = current?.documentGroups?.[groupIdx]
    if (!group) return
    const res = await api.post(`/invoice-types/${typeId}/groups/${group.id}/templates`, {
      name: doc?.name ?? 'Tài liệu mới',
      required: doc?.required ?? true,
    })
    const template = res.data?.data
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i !== groupIdx ? g : ({
        ...g,
        documents: [...(g.documents ?? []), template],
      })),
    })))
  }, [types])

  const updateDocument = useCallback(async (typeId, groupIdx, docId, patch) => {
    // Numeric _id is the DB primary key (when available); fall back to id.
    const current = types.find(t => t.id === typeId)
    const group = current?.documentGroups?.[groupIdx]
    const doc = group?.documents?.find(d => d.id === docId)
    const dbId = doc?._id ?? docId
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i !== groupIdx ? g : ({
        ...g,
        documents: g.documents.map(d => d.id === docId ? { ...d, ...patch } : d),
      })),
    })))
    try { await api.patch(`/document-templates/${dbId}`, patch) }
    catch (err) { await reload(); throw err }
  }, [types, reload])

  const deleteDocument = useCallback(async (typeId, groupIdx, docId) => {
    const current = types.find(t => t.id === typeId)
    const group = current?.documentGroups?.[groupIdx]
    const doc = group?.documents?.find(d => d.id === docId)
    const dbId = doc?._id ?? docId
    setTypes(prev => prev.map(t => t.id !== typeId ? t : ({
      ...t,
      documentGroups: t.documentGroups.map((g, i) => i !== groupIdx ? g : ({
        ...g,
        documents: g.documents.filter(d => d.id !== docId),
      })),
    })))
    try { await api.delete(`/document-templates/${dbId}`) }
    catch (err) { await reload(); throw err }
  }, [types, reload])

  const value = useMemo(() => ({
    types, loading, error, reload,
    addType, updateType, deleteType, toggleActive,
    addGroup, renameGroup, deleteGroup,
    addDocument, updateDocument, deleteDocument,
  }), [types, loading, error, reload, addType, updateType, deleteType, toggleActive, addGroup, renameGroup, deleteGroup, addDocument, updateDocument, deleteDocument])

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
