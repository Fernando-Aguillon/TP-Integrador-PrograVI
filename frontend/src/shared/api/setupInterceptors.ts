
import axios from 'axios'

import { api } from './api'
import { useAuthStore } from '@/features/auth'
import { useNotificationStore } from '@/store/notificationStore'

let installed = false

export function setupInterceptors() {
  if (installed) return

  installed = true

  api.interceptors.response.use(
    (response) => response,

    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const url = error.config?.url ?? ''
        const status = error.response?.status

        const responseData = error.response?.data as
          | { detail?: unknown }
          | undefined

        const detail = responseData?.detail

        // Sesión vencida o inválida.
        if (
          status === 401 &&
          !url.includes('/auth/token') &&
          !url.includes('/auth/me')
        ) {
          useAuthStore.getState().clearSession()
        }

        // Cuenta desactivada por un administrador.
        if (
          status === 400 &&
          typeof detail === 'string' &&
          detail.toLowerCase().includes('cuenta de usuario desactivada')
        ) {
          useAuthStore.getState().clearSession()

          useNotificationStore.getState().showNotification(
            'Tu cuenta fue desactivada. Contactá con un administrador.',
            'error'
          )
        }

        // Usuario autenticado sin permisos suficientes.
        if (status === 403) {
          useNotificationStore.getState().showNotification(
            'Acceso denegado: no tenés permisos para esta acción.',
            'error'
          )
        }
      }

      return Promise.reject(error)
    }
  )
}
