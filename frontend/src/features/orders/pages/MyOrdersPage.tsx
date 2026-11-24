
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiRequest, apiErrorMessage } from '@/shared/api/apiRequest'
import type { EstadoPedido, Pedido, PedidoPage } from '../types/order'

const pageSize = 10

const money = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  })

const stateLabel: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export default function MyOrdersPage() {
  const [skip, setSkip] = useState(0)
  const [state, setState] = useState<EstadoPedido | ''>('')

  const client = useQueryClient()

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(pageSize),
  })

  if (state) {
    params.set('estado', state)
  }

  const query = useQuery({
    queryKey: ['pedidos', 'mios', skip, state],
    queryFn: () => apiRequest<PedidoPage>(`/pedidos/?${params}`),
  })

  const cancel = useMutation({
    mutationFn: (id: number) =>
      apiRequest<Pedido>(`/pedidos/${id}/cancelar`, {
        method: 'PATCH',
      }),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ['pedidos'],
      })
    },
  })

  const orders = query.data?.items ?? []

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis pedidos</h1>
          <p className="mt-2 text-slate-600">
            Consultá el estado y el detalle de tus compras.
          </p>
        </div>

        <label className="text-sm">
          Filtrar por estado
          <select
            value={state}
            onChange={(event) => {
              setState(event.target.value as EstadoPedido | '')
              setSkip(0)
            }}
            className="ml-2 rounded-lg border bg-white px-3 py-2"
          >
            <option value="">Todos</option>
            {Object.entries(stateLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {query.isPending && (
        <p role="status">Cargando pedidos…</p>
      )}

      {query.isError && (
        <p role="alert" className="text-rose-700">
          {apiErrorMessage(query.error)}
        </p>
      )}

      {cancel.isError && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          No se pudo cancelar el pedido: {apiErrorMessage(cancel.error)}
        </p>
      )}

      {cancel.isSuccess && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          El pedido fue cancelado correctamente y el stock fue restituido.
        </p>
      )}

      {!query.isPending && !query.isError && orders.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center">
          Aún no hay pedidos para este filtro.
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                Pedido #{order.id}
              </h2>

              <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
                {stateLabel[order.estado]}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {new Date(order.created_at).toLocaleString('es-AR')}
              {' · '}
              {order.direccion_entrega}
              {' · '}
              {order.forma_pago}
            </p>

            <ul className="my-3 space-y-1">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3"
                >
                  <span>
                    {item.cantidad} × {item.nombre_producto}
                  </span>
                  <span>{money(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            {order.notas && (
              <p className="mb-3 text-sm text-slate-500">
                Notas: {order.notas}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <strong>Total: {money(order.total)}</strong>

              {order.estado === 'PENDIENTE' && (
                <button
                  type="button"
                  disabled={cancel.isPending}
                  className="text-rose-700 underline disabled:opacity-50"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Cancelar el pedido #${order.id}? Se devolverán las unidades al stock.`,
                      )
                    ) {
                      cancel.mutate(order.id)
                    }
                  }}
                >
                  {cancel.isPending
                    ? 'Cancelando…'
                    : 'Cancelar pedido'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {query.data && (
        <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
          <span>
            {query.data.total
              ? `${skip + 1}–${Math.min(skip + pageSize, query.data.total)} de ${query.data.total} pedidos`
              : '0 pedidos'}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - pageSize))}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={skip + pageSize >= query.data.total}
              onClick={() => setSkip(skip + pageSize)}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
