import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type RowData } from '@tanstack/react-table'

interface ResourceTableProps<TData extends RowData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  isLoading: boolean
  error?: string
  onRetry?: () => void
  emptyMessage: string
}

export default function ResourceTable<TData extends RowData>({ data, columns, isLoading, error, onRetry, emptyMessage }: ResourceTableProps<TData>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 8 } } })

  if (isLoading) return <div role="status" className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">Cargando…</div>
  if (error) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700"><p>{error}</p>{onRetry && <button onClick={onRetry} className="mt-3 font-semibold underline">Reintentar</button>}</div>
  if (data.length === 0) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">{emptyMessage}</div>

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className="px-5 py-3.5 font-semibold">{header.isPlaceholder ? null : <button type="button" disabled={!header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 disabled:cursor-default">{flexRender(header.column.columnDef.header, header.getContext())}{({ asc: '↑', desc: '↓' } as Record<string, string>)[header.column.getIsSorted() as string] ?? ''}</button>}</th>)}</tr>)}</thead>
      <tbody className="divide-y divide-slate-100">{table.getRowModel().rows.map((row) => <tr key={row.id} className="hover:bg-slate-50/70">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-5 py-4 text-slate-700">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
    </table></div>
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500"><span>Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span><div className="flex gap-2"><button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Anterior</button><button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>
  </div>
}
