import { api } from '@/lib/api-client'
import { getApiData } from '@/lib/api-response'

function normalizeUsersListResponse(data) {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        pageSize: data.length || 20,
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

export async function getUsersList(params) {
  const response = await api.get('/users/get-users', { params })
  const data = getApiData(response)
  return normalizeUsersListResponse(data)
}

export async function getUserById(id) {
  const response = await api.get(`/users/get-user/${id}`)
  return getApiData(response)
}

export async function getUserAuditLogs(id, params) {
  const response = await api.get(`/users/get-user-audit/${id}`, { params })
  const data = getApiData(response)

  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        page: 1,
        pageSize: data.length || 20,
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

export async function createUser(payload) {
  const response = await api.post('/users/create-user', payload)
  return getApiData(response)
}

export async function updateUser(id, payload) {
  const response = await api.put(`/users/update-user/${id}`, payload)
  return getApiData(response)
}

export async function deactivateUser(id) {
  const response = await api.patch(`/users/deactivate-user/${id}`)
  return getApiData(response)
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/delete-user/${id}`)
  return getApiData(response)
}

export async function getMyProfile() {
  const response = await api.get('/users/me')
  return getApiData(response)
}

export async function updateMyProfile(payload) {
  const response = await api.patch('/users/update-me', payload)
  return getApiData(response)
}

export async function getUserOverrides(id, params) {
  const response = await api.get(`/users/get-user-overrides/${id}`, { params })
  return getApiData(response) || []
}

export async function createUserOverride(id, payload) {
  const response = await api.post(`/users/add-user-override/${id}`, payload)
  return getApiData(response)
}

export async function revokeUserOverride(id, overrideId) {
  const response = await api.patch(`/users/revoke-user-override/${id}/${overrideId}`)
  return getApiData(response)
}

export async function getUserEffectivePermissions(id) {
  const response = await api.get(`/users/get-user-permissions/${id}`)
  return getApiData(response)
}
