import axios from 'axios'
import { api } from './api'
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await api.request<T>({ url: path, method: init?.method ?? 'GET', data: init?.body, headers: init?.body ? { 'Content-Type': 'application/json' } : undefined })
    return response.data
  } catch (error) {
    if (axios.isAxiosError<{ detail?: string | { msg: string }[] }>(error)) {
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') throw new Error(detail)
      if (Array.isArray(detail)) throw new Error(detail.map((item) => item.msg).join(', '))
    }
    throw error
  }
}
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string | { msg: string }[] }>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
    return error.message
  }
  return error instanceof Error ? error.message : 'Ocurri? un error inesperado.'
}
