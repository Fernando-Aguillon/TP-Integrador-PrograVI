import type { ReactNode } from 'react'
interface AuthPanelProps { eyebrow: string; title: string; children: ReactNode }
export default function AuthPanel({eyebrow,title,children}:AuthPanelProps){return <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>{children}</section>}
