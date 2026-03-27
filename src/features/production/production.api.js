import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

function normalizeProductionList(data) {
  const rows = data?.productions || []
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

export async function getProductionList(params) {
  const response = await api.get('/production/get-productions', { params })
  const data = getApiData(response)
  return normalizeProductionList(data)
}

export async function getProductionById(id) {
  const response = await api.get(`/production/get-production/${id}`)
  return getApiData(response)
}

export async function recordProduction(payload) {
  const response = await api.post('/production/record-production', payload)
  return getApiData(response)
}

export async function upsertBom(payload) {
  const response = await api.post('/production/upsert-bom', payload)
  return getApiData(response)
}

export async function getBomByProductId(productId) {
  const response = await api.get(`/production/get-bom/${productId}`)
  return getApiData(response)
}

export async function getFinishedProducts(search) {
  const response = await api.get('/products/get-products', {
    params: {
      page: 1,
      pageSize: 100,
      status: 'active',
      category: 'finished',
      ...(search ? { search } : {}),
    },
  })

  const data = getApiData(response)
  if (Array.isArray(data)) return data
  return data?.items || []
}

export async function getRawMaterialProducts(search) {
  const response = await api.get('/products/get-products', {
    params: {
      page: 1,
      pageSize: 100,
      status: 'active',
      category: 'raw',
      ...(search ? { search } : {}),
    },
  })

  const data = getApiData(response)
  if (Array.isArray(data)) return data
  return data?.items || []
}
