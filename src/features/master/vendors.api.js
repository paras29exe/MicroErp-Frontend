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

export async function getVendorsList(params) {
  const response = await api.get('/vendors/get-vendors', { params })
  const data = getApiData(response)
  return normalizeListResponse(data)
}

export async function createVendor(payload) {
  const response = await api.post('/vendors/add-vendor', payload)
  return getApiData(response)
}

export async function updateVendor(id, payload) {
  const response = await api.put(`/vendors/update-vendor/${id}`, payload)
  return getApiData(response)
}

export async function deleteVendor(id) {
  const response = await api.delete(`/vendors/delete-vendor/${id}`)
  return getApiData(response)
}
