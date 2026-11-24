
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { apiRequest } from '@/shared/api/apiRequest'
import { api } from '@/shared/api/api'
import type { UsuarioAuth } from '../types/auth.types'

interface AuthState {
  user: UsuarioAuth | null
  checking: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      checking: true,

      login: async (username, password) => {
        const form = new URLSearchParams({
          username,
          password
        })

        await api.post('/auth/token', form, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        const user = await apiRequest<UsuarioAuth>('/auth/me')

        set({
          user,
          checking: false
        })
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // Si la cookie venció, limpiamos igualmente la sesión local.
        } finally {
          set({
            user: null,
            checking: false
          })
        }
      },

      checkAuth: async () => {
        set({ checking: true })

        try {
          const user = await apiRequest<UsuarioAuth>('/auth/me')
          set({ user })
        } catch {
          set({ user: null })
        } finally {
          set({ checking: false })
        }
      },

      clearSession: () => {
        set({
          user: null,
          checking: false
        })
      }
    }),
    {
      name: 'food-store-auth',

      // Nunca persistir el token ni las acciones.
      // La autenticación real sigue dependiendo de la cookie HttpOnly.
      partialize: (state) => ({
        user: state.user
      })
    }
  )
)
