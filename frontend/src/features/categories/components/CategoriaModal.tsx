import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Categoria, CategoriaFormData } from '../types/categoria'

interface Props { categoria: Categoria | null; onClose: () => void; onSubmit: (data: CategoriaFormData) => Promise<void> }
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'

export default function CategoriaModal({ categoria, onClose, onSubmit }: Props) {
  const [submitError, setSubmitError] = useState('')
  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    onSubmit: async ({ value }) => { setSubmitError(''); try { await onSubmit(value) } catch (error) { setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar la categoría.') } },
  })

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="categoria-modal-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <h2 id="categoria-modal-title" className="text-2xl font-bold text-slate-900">{categoria ? 'Editar categoría' : 'Nueva categoría'}</h2>
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
        <form.Field name="nombre" validators={{ onChange: ({ value }) => value.trim() ? undefined : 'El nombre es obligatorio.' }}>
          {(field) => <div><label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label><input id={field.name} autoFocus maxLength={100} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors.map((error, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(error)}</p>)}</div>}
        </form.Field>
        <form.Field name="descripcion">
          {(field) => <div><label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-slate-700">Descripción (opcional)</label><textarea id={field.name} rows={4} maxLength={2000} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} /></div>}
        </form.Field>
        {submitError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p>}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={!canSubmit || isSubmitting} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Guardando…' : 'Guardar'}</button></div>}</form.Subscribe>
      </form>
    </section>
  </div>
}
