import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiErrorMessage } from '@/shared/api/apiRequest'

export default function LoginPage() {
  const { user, login } = useAuth()
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError('')
      try { await login(value.username, value.password); navigate('/', { replace: true }) }
      catch (submitError) { setError(apiErrorMessage(submitError)) }
    },
  })
  if (user) return <Navigate to="/" replace />
  return <main className="grid flex-1 place-items-center px-5 py-12"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Food Store</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Iniciar sesión</h1><p className="mt-2 text-sm text-slate-500">Ingresá con el usuario de tu cuenta.</p>
    <form className="mt-7 space-y-5" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
      <form.Field name="username" validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Ingresá tu usuario.' }}>{(field) => <div><label htmlFor="login-username" className="mb-1.5 block text-sm font-medium text-slate-700">Usuario</label><input id="login-username" autoComplete="username" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      <form.Field name="password" validators={{ onChange: ({ value }) => value.length >= 8 ? undefined : 'La contraseña debe tener al menos 8 caracteres.' }}>{(field) => <div><label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label><input id="login-password" type="password" autoComplete="current-password" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />{field.state.meta.errors.map((message, index) => <p key={index} className="mt-1 text-xs text-rose-600">{String(message)}</p>)}</div>}</form.Field>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>}</form.Subscribe>
    </form><p className="mt-6 text-center text-sm text-slate-500">¿No tenés cuenta? <Link to="/register" className="font-semibold text-indigo-700 hover:underline">Registrate</Link></p>
  </section></main>
}
