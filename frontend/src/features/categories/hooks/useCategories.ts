import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/apiRequest'
import { useNotificationStore } from '@/store/notificationStore'
import type { Categoria, CategoriaFormData } from '../types/categoria'
const queryKey = ['categorias']
export function useCategories() {
  const client = useQueryClient(); const notify = useNotificationStore((state) => state.showNotification)
  const query = useQuery({ queryKey, queryFn: () => apiRequest<Categoria[]>('/categorias/') })
  useEffect(() => { if (query.isError) notify(query.error instanceof Error ? query.error.message : 'No se pudieron cargar los datos.', 'error') }, [query.isError, query.error, notify])
  const save = useMutation({ mutationFn: ({ id, data }: { id?: number; data: CategoriaFormData }) => apiRequest<Categoria>(id ? `/categorias/${id}` : '/categorias/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }), onSuccess: async (_, vars) => { await client.invalidateQueries({ queryKey }); notify(vars.id ? 'Categoría actualizada.' : 'Categoría creada.', 'success') }, onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo guardar la categoría.', 'error') })
  const remove = useMutation({ mutationFn: (id: number) => apiRequest<void>(`/categorias/${id}`, { method: 'DELETE' }), onSuccess: async () => { await client.invalidateQueries({ queryKey }); notify('Categoría eliminada.', 'success') }, onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo eliminar la categoría.', 'error') })
  return { query, save, remove }
}
