import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import CategoriaModal from '../components/CategoriaModal'
import CategoriaList from '../components/CategoriaList'
import { useCategories } from '../hooks/useCategories'
import { useAuthStore } from '@/features/auth'
import type { Categoria, CategoriaFormData } from '../types/categoria'
export default function CategoriesPage() {
  const { query, save, remove } = useCategories()
  const [modalOpen, setModalOpen] = useState(false); const [selected, setSelected] = useState<Categoria | null>(null)
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const rows = query.data ?? []
  const columns = useMemo<ColumnDef<Categoria, unknown>[]>(() => {
    const definitions: ColumnDef<Categoria, unknown>[] = [
      { accessorKey: 'nombre', header: 'Nombre' },
      { accessorKey: 'descripcion', header: 'Descripción', cell: ({ getValue }) => getValue() || <span className="text-slate-400">Sin descripción</span> },
    ]
    if (isAdmin) definitions.push({ id: 'acciones', header: 'Acciones', enableSorting: false, cell: ({ row }) => <div className="flex gap-2"><button onClick={() => { setSelected(row.original); setModalOpen(true) }} className="font-semibold text-indigo-700">Editar</button><button onClick={() => { if (window.confirm(`¿Eliminar la categoría «${row.original.nombre}»?`)) remove.mutate(row.original.id) }} className="font-semibold text-rose-600">Eliminar</button></div> })
    return definitions
  }, [isAdmin, remove])
  async function submit(data: CategoriaFormData) { await save.mutateAsync({ id: selected?.id, data }); setModalOpen(false); setSelected(null) }
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14"><section className="mb-8 flex flex-col justify-between gap-5 rounded-3xl bg-slate-900 px-6 py-9 text-white sm:flex-row sm:items-end sm:px-10"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Catálogo</p><h1 className="mt-3 text-3xl font-bold">Categorías</h1><p className="mt-2 text-slate-300">Organizá los productos de la tienda.</p></div>{isAdmin && <button onClick={() => { setSelected(null); setModalOpen(true) }} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">+ Nueva categoría</button>}</section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Administración</p><h2 className="mt-1 text-2xl font-bold">Todas las categorías</h2></div><span className="text-sm text-slate-500">{rows.length} en total</span></div><CategoriaList categorias={rows} columns={columns} isLoading={query.isPending} error={query.isError ? (query.error as Error).message : undefined} onRetry={() => void query.refetch()}/>{modalOpen && isAdmin && <CategoriaModal key={selected?.id ?? 'new'} categoria={selected} onClose={() => setModalOpen(false)} onSubmit={submit}/>}</main>
}
