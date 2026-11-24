import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/shared/api/apiRequest'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/features/auth'
import type { Producto } from '@/features/products/types/producto'
import type { Pedido, PedidoCreate, FormaPago } from '../types/order'

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const clear = useCartStore((state) => state.clear)
  const navigate = useNavigate()
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const client = useQueryClient()
  const [stockError, setStockError] = useState('')
  const productsQuery = useQuery({
    queryKey: ['checkout-products', items.map((item) => item.producto_id)],
    enabled: items.length > 0,
    queryFn: () => Promise.all(items.map((item) => apiRequest<Producto>(`/productos/${item.producto_id}`))),
  })
  const mutation = useMutation({
    mutationFn: (data: PedidoCreate) => apiRequest<Pedido>('/pedidos/', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: async () => { clear(); await client.invalidateQueries({ queryKey: ['productos'] }); navigate(isAdmin ? '/admin/pedidos' : '/mis-pedidos') },
  })
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: async ({ value }) => {
      setStockError('')
      try {
        const fresh = await productsQuery.refetch()
        if (fresh.isError || !fresh.data) throw new Error('No pudimos validar los productos. Volvé a intentarlo.')
        const byId = new Map(fresh.data.map((product) => [product.id, product]))
        for (const item of items) {
          const product = byId.get(item.producto_id)
          if (!product || !product.activo || !product.disponible) throw new Error(`${item.nombre} ya no está disponible. Quitalo del carrito para continuar.`)
          if (item.cantidad > product.stock) throw new Error(`Quedan ${product.stock} unidades de ${product.nombre}. Ajustá la cantidad en el carrito.`)
        }
        await mutation.mutateAsync({ items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })), ...value, notas: value.notas.trim() || undefined })
      } catch (error) { setStockError(error instanceof Error ? error.message : 'No se pudo realizar el pedido.') }
    },
  })
  if (items.length === 0) return <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10"><h1 className="mb-4 text-3xl font-bold">Confirmar pedido</h1><p>El carrito está vacío. <a className="text-indigo-700 underline" href="/">Volver al menú</a>.</p></main>
  return <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10"><h1 className="mb-6 text-3xl font-bold">Confirmar pedido</h1>
    <section className="mb-5 rounded-2xl bg-white p-5"><h2 className="font-semibold">Tu pedido</h2><ul className="mt-3 space-y-2">{items.map((item) => <li key={item.producto_id} className="flex justify-between text-sm"><span>{item.cantidad} × {item.nombre}</span><span>{(item.cantidad * item.precio_unitario).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span></li>)}</ul></section>
    <form className="space-y-4 rounded-2xl bg-white p-6" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
      <form.Field name="direccion_entrega" validators={{ onChange: ({ value }) => value.trim().length >= 5 ? undefined : 'Ingresá una dirección de al menos 5 caracteres.' }}>{(field) => <div><label htmlFor={field.name} className="block">Dirección de entrega<input id={field.name} required minLength={5} maxLength={200} className="mt-1 w-full rounded-lg border p-3" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      <form.Field name="forma_pago">{(field) => <label className="block">Forma de pago<select className="mt-1 w-full rounded-lg border p-3" value={field.state.value} onChange={(event) => field.handleChange(event.target.value as FormaPago)}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></label>}</form.Field>
      <form.Field name="notas">{(field) => <label className="block">Notas (opcional)<textarea maxLength={1000} className="mt-1 w-full rounded-lg border p-3" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}</form.Field>
      {(stockError || productsQuery.isError) && <p role="alert" className="text-rose-700">{stockError || 'No pudimos consultar el stock actual.'}</p>}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button disabled={!canSubmit || isSubmitting || mutation.isPending || productsQuery.isFetching} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting || mutation.isPending ? 'Enviando…' : 'Realizar pedido'}</button>}</form.Subscribe>
    </form>
  </main>
}
