import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

function normalizeInventoryList(data) {
  const rows = data?.inventory || []
  const meta = data?.meta || {}

  return {
    items: rows,
    meta: {
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
      totalPages: Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20))),
    },
  }
}

function normalizeTransactionList(data) {
  const rows = data?.transactions || []
  const meta = data?.meta || {}

  return {
    items: rows,
    meta: {
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
      totalPages: Math.max(1, Math.ceil((meta.total || 0) / (meta.limit || 20))),
    },
  }
}

export async function getInventoryList(params) {
  const response = await api.get('/inventory', { params })
  const data = getApiData(response)
  return normalizeInventoryList(data)
}

export async function getLowStockProducts() {
  const response = await api.get('/inventory/low-stock')
  const data = getApiData(response)
  return Array.isArray(data) ? data : []
}

export async function getInventorySummary() {
  const response = await api.get('/inventory/summary')
  return getApiData(response)
}

export async function getInventoryTransactions(params) {
  const response = await api.get('/inventory/transactions', { params })
  const data = getApiData(response)
  return normalizeTransactionList(data)
}

export async function getInventoryByProductId(productId) {
  const response = await api.get(`/inventory/${productId}`)
  return getApiData(response)
}

export async function adjustInventoryStock(payload) {
  const response = await api.post('/inventory/adjust', payload)
  return getApiData(response)
}

export async function updateInventoryReorderLevel(productId, reorderLevel) {
  const response = await api.patch(`/inventory/reorder-level/${productId}`, { reorderLevel })
  return getApiData(response)
}

export async function getInventoryProducts(search) {
  const response = await api.get('/products/get-products', {
    params: {
      page: 1,
      pageSize: 100,
      status: 'active',
      ...(search ? { search } : {}),
    },
  })

  const data = getApiData(response)
  if (Array.isArray(data)) return data
  return data?.items || []
}
