import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

export async function login(payload) {
  const response = await api.post('/auth/login', payload)
  return getApiData(response)
}

export async function refreshSession() {
  return api.post('/auth/refresh')
}

export async function logout() {
  return api.post('/auth/logout')
}

export async function getMe() {
  const response = await api.get('/users/me')
  return getApiData(response)
}

export async function getMyEffectivePermissions() {
  const response = await api.get('/users/me/effective-permissions')
  return getApiData(response)
}
