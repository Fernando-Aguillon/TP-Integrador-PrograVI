import { create } from 'zustand'
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checking: true,
  login: async (username, password) => {
    const form = new URLSearchParams({ username, password })
    await api.post('/auth/token', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    set({ user: await apiRequest<UsuarioAuth>('/auth/me'), checking: false })
  },
  logout: async () => {
    try { await api.post('/auth/logout') } catch { /* Si la cookie venció, limpiamos la sesión local. */ }
    finally { set({ user: null, checking: false }) }
  },
  checkAuth: async () => {
    set({ checking: true })
    try { set({ user: await apiRequest<UsuarioAuth>('/auth/me') }) }
    catch { set({ user: null }) }
    finally { set({ checking: false }) }
  },
  clearSession: () => set({ user: null, checking: false }),
}))
