import axios from 'axios'
import { api } from './api'
import { useAuthStore } from '@/features/auth'
import { useNotificationStore } from '@/store/notificationStore'
let installed = false
export function setupInterceptors() {
  if (installed) return
  installed = true
  api.interceptors.response.use((response) => response, (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const url = error.config?.url ?? ''
      if (error.response?.status === 401 && !url.includes('/auth/token') && !url.includes('/auth/me')) useAuthStore.getState().clearSession()
      if (error.response?.status === 403) useNotificationStore.getState().showNotification('Acceso denegado: no tenés permisos para esta acción.', 'error')
    }
    return Promise.reject(error)
  })
}
