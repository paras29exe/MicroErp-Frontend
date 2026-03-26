import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

export async function getDashboardOverview(params) {
  const response = await api.get('/dashboard/overview', { params })
  return getApiData(response)
}

export async function getDashboardKpis(params) {
  const response = await api.get('/dashboard/kpis', { params })
  return getApiData(response)
}

export async function getDashboardAlerts(params) {
  const response = await api.get('/dashboard/alerts', { params })
  return getApiData(response)
}
