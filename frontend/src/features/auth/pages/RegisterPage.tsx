import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'
import { apiErrorMessage, apiRequest } from '@/shared/api/apiRequest'
import { useNotificationStore } from '@/store/notificationStore'
import type { UserRegisterData } from '../types/auth.types'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const notify = useNotificationStore((state) => state.showNotification)
  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError('')
      try {
        await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(value satisfies UserRegisterData) })
        notify('Cuenta creada. Ya podés iniciar sesión.', 'success')
        navigate('/login', { replace: true, state: { registered: true } })
      } catch (submitError) { setError(apiErrorMessage(submitError)) }
    },
  })
  return <main className="grid flex-1 place-items-center px-5 py-10"><section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Food Store</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Crear una cuenta</h1>
    <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
      <form.Field name="username" validators={{ onChange: ({ value }) => /^[A-Za-z0-9_.-]{3,50}$/.test(value) ? undefined : 'Usá entre 3 y 50 letras, números, puntos, guiones o guiones bajos.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Usuario</label><input id={field.name} autoComplete="username" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      <form.Field name="full_name" validators={{ onChange: ({ value }) => value.trim().length >= 2 ? undefined : 'Ingresá tu nombre completo.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Nombre completo</label><input id={field.name} autoComplete="name" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      <form.Field name="email" validators={{ onChange: ({ value }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Ingresá un email válido.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Email</label><input id={field.name} type="email" autoComplete="email" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      <form.Field name="password" validators={{ onChange: ({ value }) => value.length >= 8 ? undefined : 'Usá al menos 8 caracteres.' }}>{(field) => <div><label htmlFor={field.name} className="mb-1 block text-sm font-medium">Contraseña</label><input id={field.name} type="password" autoComplete="new-password" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isSubmitting ? 'Creando cuenta…' : 'Registrarme'}</button>}</form.Subscribe>
    </form><p className="mt-5 text-center text-sm text-slate-500">¿Ya tenés cuenta? <Link to="/login" className="font-semibold text-indigo-700 hover:underline">Iniciá sesión</Link></p>
  </section></main>
}
