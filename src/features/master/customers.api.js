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

export async function getCustomersList(params) {
  const response = await api.get('/customers/get-customers', { params })
  const data = getApiData(response)
  return normalizeListResponse(data)
}

export async function createCustomer(payload) {
  const response = await api.post('/customers/add-customer', payload)
  return getApiData(response)
}

export async function updateCustomer(id, payload) {
  const response = await api.put(`/customers/update-customer/${id}`, payload)
  return getApiData(response)
}

export async function deleteCustomer(id) {
  const response = await api.delete(`/customers/delete-customer/${id}`)
  return getApiData(response)
}
