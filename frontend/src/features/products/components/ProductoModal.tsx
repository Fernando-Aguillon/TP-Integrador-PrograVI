import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useCategories } from '@/features/categories'
import type { Producto, ProductoInput } from '../types/producto'

interface Props { producto: Producto | null; onClose: () => void; onSubmit: (data: ProductoInput) => Promise<void> }
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'

export default function ProductoModal({ producto, onClose, onSubmit }: Props) {
  const [submitError, setSubmitError] = useState('')
  const categories = useCategories().query.data ?? []
  const form = useForm({
    defaultValues: {
      categoria_id: producto?.categoria_id ?? categories[0]?.id ?? 0,
      nombre: producto?.nombre ?? '', descripcion: producto?.descripcion ?? '',
      precio_base: producto?.precio_base ?? 0, imagen_url: producto?.imagen_url ?? '',
      stock: producto?.stock ?? 0, disponible: producto?.disponible ?? true, activo: producto?.activo ?? true,
    },
    onSubmit: async ({ value }) => { setSubmitError(''); try { await onSubmit(value) } catch (error) { setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar el producto.') } },
  })
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="producto-modal-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <h2 id="producto-modal-title" className="text-2xl font-bold text-slate-900">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
      {categories.length === 0 ? <p role="alert" className="mt-5 text-sm text-rose-700">Creá una categoría activa antes de agregar productos.</p> : <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
        <form.Field name="categoria_id" validators={{ onChange: ({ value }) => value > 0 ? undefined : 'Elegí una categoría.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Categoría</label><select id={field.name} value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={inputClass}>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></div>}</form.Field>
        <form.Field name="nombre" validators={{ onChange: ({ value }) => value.trim() ? undefined : 'El nombre es obligatorio.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Nombre</label><input id={field.name} maxLength={150} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors.map((error, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(error)}</p>)}</div>}</form.Field>
        <form.Field name="descripcion">{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Descripción</label><textarea id={field.name} rows={3} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} /></div>}</form.Field>
        <div className="grid gap-4 sm:grid-cols-2"><form.Field name="precio_base" validators={{ onChange: ({ value }) => Number.isFinite(value) && value >= 0 ? undefined : 'El precio debe ser mayor o igual a cero.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Precio</label><input id={field.name} type="number" min="0" step="0.01" value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={inputClass} />{field.state.meta.errors.map((error, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(error)}</p>)}</div>}</form.Field>
          <form.Field name="stock" validators={{ onChange: ({ value }) => Number.isInteger(value) && value >= 0 ? undefined : 'El stock debe ser un entero no negativo.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Stock</label><input id={field.name} type="number" min="0" step="1" value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={inputClass} /></div>}</form.Field></div>
        <form.Field name="imagen_url">{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">URL de imagen (opcional)</label><input id={field.name} type="url" maxLength={500} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} /></div>}</form.Field>
        <form.Field name="disponible">{(field) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.state.value} onChange={(event) => field.handleChange(event.target.checked)} />Disponible para pedidos</label>}</form.Field>
        {submitError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p>}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={!canSubmit || isSubmitting} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Guardando…' : 'Guardar producto'}</button></div>}</form.Subscribe>
      </form>}
    </section>
  </div>
}
