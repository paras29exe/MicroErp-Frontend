import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        pageSize: data.length,
        total: data.length,
        totalPages: 1,
      },
    }
  }

  return {
    items: data?.items || [],
    meta: {
      page: data?.meta?.page || 1,
      pageSize: data?.meta?.pageSize || 20,
      total: data?.meta?.total || 0,
      totalPages: data?.meta?.totalPages || 1,
    },
  }
}

export async function getProductsList(params) {
  const response = await api.get('/products/get-products', { params })
  const data = getApiData(response)
  return normalizeListResponse(data)
}

export async function createProduct(payload) {
  const response = await api.post('/products/add-product', payload)
  return getApiData(response)
}

export async function updateProduct(id, payload) {
  const response = await api.put(`/products/update-product/${id}`, payload)
  return getApiData(response)
}

export async function deleteProduct(id) {
  const response = await api.delete(`/products/delete-product/${id}`)
  return getApiData(response)
}

export async function restoreProduct(id) {
  const response = await api.patch(`/products/restore-product/${id}`)
  return getApiData(response)
}
