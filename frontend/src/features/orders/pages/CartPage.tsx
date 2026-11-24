import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'

const money = (value: number) => value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const total = items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0)
  return <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10"><h1 className="mb-6 text-3xl font-bold">Tu carrito</h1>
    {items.length === 0 ? <section className="rounded-2xl bg-white p-8 text-center">El carrito está vacío. <Link className="ml-2 text-indigo-700 underline" to="/">Ver menú</Link></section> : <>
      <div className="space-y-3">{items.map((item) => <article key={item.producto_id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4"><div><h2 className="font-semibold">{item.nombre}</h2><p>{money(item.precio_unitario)} c/u · {item.stock} disponibles</p></div><label className="flex items-center gap-2 text-sm">Cantidad<input aria-label={`Cantidad de ${item.nombre}`} className="w-20 rounded border p-2" type="number" min="1" max={item.stock} value={item.cantidad} onChange={(event) => setQuantity(item.producto_id, Number(event.target.value))} /></label><strong>{money(item.precio_unitario * item.cantidad)}</strong><button className="text-rose-700" onClick={() => remove(item.producto_id)}>Quitar</button></article>)}</div>
      <div className="mt-6 flex items-center justify-between text-xl"><strong>Total</strong><strong>{money(total)}</strong></div><Link to="/checkout" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">Continuar al checkout</Link>
    </>}
  </main>
}
