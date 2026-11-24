import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return <main className="grid flex-1 place-items-center px-5 py-16"><section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-9 text-center"><p className="text-sm font-bold uppercase tracking-widest text-rose-600">403 · Acceso denegado</p><h1 className="mt-3 text-3xl font-bold text-slate-900">No tenés permisos para esta página</h1><p className="mt-3 text-slate-500">Tu cuenta puede consultar el catálogo, pero esta sección es exclusiva para administración.</p><Link to="/categories" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Volver al catálogo</Link></section></main>
}
