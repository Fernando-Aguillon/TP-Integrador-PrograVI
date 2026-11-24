import type { ColumnDef } from '@tanstack/react-table'
import type { Categoria } from '../types/categoria'
import ResourceTable from '@/shared/components/ResourceTable'

interface CategoriaListProps {
  categorias: Categoria[]
  columns: ColumnDef<Categoria, unknown>[]
  isLoading: boolean
  error?: string
  onRetry: () => void
}

export default function CategoriaList({ categorias, columns, isLoading, error, onRetry }: CategoriaListProps) {
  return <ResourceTable data={categorias} columns={columns} isLoading={isLoading} error={error} onRetry={onRetry} emptyMessage="Todavía no hay categorías." />
}
