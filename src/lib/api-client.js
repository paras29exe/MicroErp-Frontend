import axios from 'axios'
import { useAuthStore } from '@/features/auth/auth.store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let refreshInProgress = false
let queuedRequests = []

function resolveQueue(error) {
  queuedRequests.forEach((handler) => {
    if (error) {
      handler.reject(error)
      return
    }

    handler.resolve()
  })

  queuedRequests = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config
    const status = error?.response?.status
    const requestUrl = originalRequest?.url || ''

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
      useAuthStore.getState().clearSession()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (refreshInProgress) {
      return new Promise((resolve, reject) => {
        queuedRequests.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        })
      })
    }

    refreshInProgress = true

    try {
      await api.post('/auth/refresh')
      resolveQueue()
      return api(originalRequest)
    } catch (refreshError) {
      resolveQueue(refreshError)
      useAuthStore.getState().clearSession()
      return Promise.reject(refreshError)
    } finally {
      refreshInProgress = false
    }
  },
)
