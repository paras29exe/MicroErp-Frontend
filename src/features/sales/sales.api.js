import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

function normalizeSalesList(data) {
  const rows = data?.sales || []
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

export async function getSalesList(params) {
  const response = await api.get('/sales/get-sales', { params })
  const data = getApiData(response)
  return normalizeSalesList(data)
}

export async function getSaleById(id) {
  const response = await api.get(`/sales/get-sale/${id}`)
  return getApiData(response)
}

export async function createSale(payload) {
  const response = await api.post('/sales/add-sale', payload)
  return getApiData(response)
}

export async function deleteSale(id) {
  const response = await api.delete(`/sales/delete-sale/${id}`)
  return getApiData(response)
}

export async function getSaleCustomers(search) {
  const response = await api.get('/customers/get-customers', {
    params: {
      page: 1,
      pageSize: 50,
      ...(search ? { search } : {}),
    },
  })

  const data = getApiData(response)
  if (Array.isArray(data)) return data
  return data?.items || []
}

export async function getFinishedProductsWithStock(search) {
  const response = await api.get('/products/get-finished-products-stock', {
    params: {
      ...(search ? { search } : {}),
    },
  })

  const data = getApiData(response)
  return data?.items || []
}
