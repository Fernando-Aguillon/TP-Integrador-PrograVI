import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/apiRequest'
import { useNotificationStore } from '@/store/notificationStore'
import type { Producto, ProductoInput, ProductoPage } from '../types/producto'
export type ProductoData = ProductoInput
export interface ProductFilters { search: string; categoriaId: number | null; skip: number; admin: boolean }
export function useProducts(filters: ProductFilters) {
  const client = useQueryClient(); const notify = useNotificationStore((state) => state.showNotification)
  const queryKey = ['productos', filters]
  const params = new URLSearchParams({ skip: String(filters.skip), limit: '12' })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.categoriaId) params.set('categoria_id', String(filters.categoriaId))
  const query = useQuery({ queryKey, queryFn: () => apiRequest<ProductoPage>(`/productos/?${params.toString()}`) })
  useEffect(() => { if (query.isError) notify(query.error instanceof Error ? query.error.message : 'No se pudieron cargar los datos.', 'error') }, [query.isError, query.error, notify])
  const save = useMutation({ mutationFn: ({ id, data }: { id?: number; data: ProductoData }) => apiRequest<Producto>(id ? `/productos/${id}` : '/productos/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }), onSuccess: async (_, vars) => { await client.invalidateQueries({ queryKey: ['productos'] }); notify(vars.id ? 'Producto actualizado.' : 'Producto creado.', 'success') }, onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo guardar el producto.', 'error') })
  const remove = useMutation({ mutationFn: (id: number) => apiRequest<void>(`/productos/${id}`, { method: 'DELETE' }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['productos'] }); notify('Producto desactivado.', 'success') }, onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo desactivar el producto.', 'error') })
  return { query, save, remove }
}
