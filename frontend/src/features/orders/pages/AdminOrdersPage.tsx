import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/apiRequest'
import type { EstadoPedido, Pedido, PedidoPage, ResumenPedidos } from '../types/order'

const pageSize = 10
const money = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const stateLabel: Record<EstadoPedido, string> = { PENDIENTE: 'Pendiente', EN_PREPARACION: 'En preparación', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' }

export function AdminSummaryPage() {
  const query = useQuery({ queryKey: ['pedidos', 'resumen'], queryFn: () => apiRequest<ResumenPedidos>('/pedidos/resumen') })
  return <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10"><h1 className="mb-6 text-3xl font-bold">Resumen del negocio</h1>
    {query.isPending ? <p role="status">Cargando resumen…</p> : query.isError ? <p role="alert">{(query.error as Error).message}</p> : <div className="grid gap-4 sm:grid-cols-3">{[['Pendientes', query.data.pendientes], ['En preparación', query.data.en_preparacion], ['Entregados', query.data.entregados], ['Cancelados', query.data.cancelados], ['Pedidos de hoy', query.data.pedidos_hoy], ['Ingresos entregados', money(query.data.ingresos_entregados)]].map(([title, value]) => <article key={String(title)} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{title}</p><strong className="mt-2 block text-2xl">{value}</strong></article>)}</div>}
  </main>
}

export default function AdminOrdersPage() {
  const [skip, setSkip] = useState(0)
  const [state, setState] = useState<EstadoPedido | ''>('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const client = useQueryClient()
  const params = new URLSearchParams({ skip: String(skip), limit: String(pageSize) })
  if (state) params.set('estado', state)
  const query = useQuery({ queryKey: ['pedidos', 'admin', skip, state], queryFn: () => apiRequest<PedidoPage>(`/pedidos/?${params}`) })
  const update = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => apiRequest<Pedido>(`/pedidos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['pedidos'] }),
  })
  const orders = query.data?.items ?? []
  function changeState(order: Pedido, estado: EstadoPedido) {
    const action = estado === 'CANCELADO' ? `¿Cancelar el pedido #${order.id}? Se devolverán las unidades al stock.` : `¿Cambiar el pedido #${order.id} a ${stateLabel[estado].toLowerCase()}?`
    if (window.confirm(action)) update.mutate({ id: order.id, estado })
  }
  return <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Gestión de pedidos</h1><p className="mt-2 text-slate-600">Revisá los pedidos, sus datos y actualizá el estado.</p></div><label className="text-sm">Filtrar por estado<select value={state} onChange={(event) => { setState(event.target.value as EstadoPedido | ''); setSkip(0) }} className="ml-2 rounded-lg border bg-white px-3 py-2"><option value="">Todos</option>{Object.entries(stateLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {query.isPending && <p role="status">Cargando pedidos…</p>}{query.isError && <p role="alert" className="text-rose-700">{(query.error as Error).message}</p>}
    {!query.isPending && !query.isError && orders.length === 0 && <p className="rounded-2xl bg-white p-8 text-center">No hay pedidos para este filtro.</p>}
    <div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold">Pedido #{order.id} · {stateLabel[order.estado]}</h2><p className="mt-1 text-sm text-slate-600">Cliente: {order.usuario_username} · {new Date(order.created_at).toLocaleString('es-AR')}</p><p className="text-sm text-slate-600">{order.direccion_entrega} · {order.forma_pago} · {money(order.total)}</p></div><div className="flex flex-wrap gap-2">
      {order.estado === 'PENDIENTE' && <button disabled={update.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50" onClick={() => changeState(order, 'EN_PREPARACION')}>Preparar</button>}
      {order.estado === 'EN_PREPARACION' && <button disabled={update.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50" onClick={() => changeState(order, 'ENTREGADO')}>Marcar entregado</button>}
      {(order.estado === 'PENDIENTE' || order.estado === 'EN_PREPARACION') && <button disabled={update.isPending} className="rounded-lg border border-rose-200 px-4 py-2 text-rose-700 disabled:opacity-50" onClick={() => changeState(order, 'CANCELADO')}>Cancelar</button>}
      </div></div>
      <button aria-expanded={expanded === order.id} onClick={() => setExpanded((current) => current === order.id ? null : order.id)} className="mt-4 text-sm font-semibold text-indigo-700 underline">{expanded === order.id ? 'Ocultar detalle' : 'Ver detalle del pedido'}</button>
      {expanded === order.id && <div className="mt-3 rounded-xl bg-slate-50 p-4"><ul className="space-y-2">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.cantidad} × {item.nombre_producto} · {money(item.precio_unitario)} c/u</span><span>{money(item.subtotal)}</span></li>)}</ul>{order.notas && <p className="mt-3 text-sm text-slate-600">Notas: {order.notas}</p>}</div>}
    </article>)}</div>
    {query.data && <div className="mt-5 flex items-center justify-between text-sm text-slate-600"><span>{query.data.total ? `${skip + 1}–${Math.min(skip + pageSize, query.data.total)} de ${query.data.total} pedidos` : '0 pedidos'}</span><div className="flex gap-2"><button disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - pageSize))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Anterior</button><button disabled={skip + pageSize >= query.data.total} onClick={() => setSkip(skip + pageSize)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Siguiente</button></div></div>}
  </main>
}
