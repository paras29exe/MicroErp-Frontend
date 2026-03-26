import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

function normalizePurchaseList(data) {
  const rows = data?.purchases || []
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

export async function getPurchaseList(params) {
  const response = await api.get('/purchases/get-purchases', { params })
  const data = getApiData(response)
  return normalizePurchaseList(data)
}
