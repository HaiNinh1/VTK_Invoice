// Canonical query-key factory.
//
// All `queryKey` arrays MUST come from here so invalidation is bulletproof and
// refactors don't silently break cache wiring. Keys are hierarchical so
// `qk.invoiceRequests.all` invalidates every variant.
//
// Convention: each feature has
//   .all   -> string[]                    (broadest scope; use for invalidate)
//   .list(params?)                        (specific paginated list)
//   .detail(id)                           (single resource)
//   .sub(id, 'child')                     (nested resource)

import type { ListInvoiceRequestsParams } from './endpoints/invoiceRequests';

const root = {
  dashboard: ['dashboard'] as const,
  notifications: ['notifications'] as const,
  invoiceRequests: ['invoice-requests'] as const,
  invoiceRequest: ['invoice-request'] as const,
  approvals: ['approvals'] as const,
  customers: ['customers'] as const,
  invoiceTypes: ['invoice-types'] as const,
  serviceTypes: ['service-types'] as const,
  legalDocsCatalog: ['legal-documents-catalog'] as const,
  contracts: ['contracts'] as const,
  contract: ['contract'] as const,
  commitments: ['commitments'] as const,
  commitment: ['commitment'] as const,
  reports: ['reports'] as const,
  signature: ['signature'] as const,
  health: ['health'] as const,
};

export const queryKeys = {
  dashboard: { all: root.dashboard, root: () => root.dashboard },

  notifications: {
    all: root.notifications,
    list: (params?: Record<string, unknown>) => [...root.notifications, params] as const,
    unread: () => [...root.notifications, { unread: true }] as const,
  },

  invoiceRequests: {
    all: root.invoiceRequests,
    list: (params?: ListInvoiceRequestsParams) => [...root.invoiceRequests, params] as const,
  },
  invoiceRequest: {
    all: root.invoiceRequest,
    detail: (id: number | string) => [...root.invoiceRequest, String(id)] as const,
    timeline: (id: number | string) =>
      [...root.invoiceRequest, String(id), 'timeline'] as const,
    legalDocs: (id: number | string) =>
      [...root.invoiceRequest, String(id), 'legal-documents'] as const,
    commitments: (id: number | string) =>
      [...root.invoiceRequest, String(id), 'commitments'] as const,
  },

  approvals: {
    all: root.approvals,
    pending: () => [...root.approvals, 'pending'] as const,
  },

  customers: {
    all: root.customers,
    list: (params?: Record<string, unknown>) => [...root.customers, params] as const,
  },
  invoiceTypes: {
    all: root.invoiceTypes,
    list: (params?: Record<string, unknown>) => [...root.invoiceTypes, params] as const,
  },
  serviceTypes: {
    all: root.serviceTypes,
    list: (params?: Record<string, unknown>) => [...root.serviceTypes, params] as const,
  },
  legalDocsCatalog: {
    all: root.legalDocsCatalog,
    list: (params?: Record<string, unknown>) => [...root.legalDocsCatalog, params] as const,
  },

  contracts: {
    all: root.contracts,
    list: (params?: Record<string, unknown>) => [...root.contracts, params] as const,
  },
  contract: {
    all: root.contract,
    detail: (id: number) => [...root.contract, id] as const,
    installments: (id: number) => [...root.contract, id, 'installments'] as const,
    documents: (id: number) => [...root.contract, id, 'documents'] as const,
  },

  commitments: { all: root.commitments },
  commitment: {
    all: root.commitment,
    detail: (id: number | string) => [...root.commitment, String(id)] as const,
  },

  reports: {
    all: root.reports,
    legalCompliance: (params?: Record<string, unknown>) =>
      [...root.reports, 'legal-compliance', params] as const,
  },

  signature: { all: root.signature, me: () => root.signature },
  health: { all: root.health, root: () => root.health },
};

// Compatibility alias — legacy callers import `qk`. New code should import `queryKeys`.
export const qk = queryKeys;
