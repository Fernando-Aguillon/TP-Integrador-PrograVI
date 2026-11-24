import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ResourceTable from '@/shared/components/ResourceTable'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { AdminUsuario } from '../types/auth.types'

export default function AdminUsersPage() {
  const { query, changeState } = useAdminUsers()
  const columns = useMemo<ColumnDef<AdminUsuario, unknown>[]>(() => [
    { accessorKey: 'full_name', header: 'Nombre completo' },
    { accessorKey: 'username', header: 'Usuario' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Rol' },
    { accessorKey: 'disabled', header: 'Estado', cell: ({ getValue }) => getValue() ? 'Desactivado' : 'Activo' },
    { id: 'acciones', header: 'Acciones', enableSorting: false, cell: ({ row }) => <button onClick={() => changeState.mutate({ id: row.original.id, active: row.original.disabled })} disabled={changeState.isPending} className="font-semibold text-indigo-700 disabled:opacity-50">{row.original.disabled ? 'Activar' : 'Desactivar'}</button> },
  ], [changeState])
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
    <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-9 text-white sm:px-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Administración</p><h1 className="mt-3 text-3xl font-bold">Usuarios</h1><p className="mt-2 text-slate-300">Activá o desactivá el acceso de las cuentas registradas.</p></section>
    <ResourceTable data={query.data ?? []} columns={columns} isLoading={query.isPending} error={query.isError ? (query.error as Error).message : undefined} onRetry={() => void query.refetch()} emptyMessage="No hay usuarios registrados." />
  </main>
}
