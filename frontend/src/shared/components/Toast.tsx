import { useEffect } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
export default function Toast() {
  const message = useNotificationStore((state) => state.message)
  const kind = useNotificationStore((state) => state.kind)
  const hide = useNotificationStore((state) => state.hideNotification)
  useEffect(() => { if (!message) return; const timer = window.setTimeout(hide, 3000); return () => window.clearTimeout(timer) }, [message, hide])
  if (!message) return null
  const style = kind === 'error' ? 'bg-rose-700' : kind === 'success' ? 'bg-emerald-700' : 'bg-slate-900'
  return <div role="status" aria-live="polite" className={`fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl ${style} px-5 py-4 text-sm font-medium text-white shadow-xl`}>{message}<button onClick={hide} aria-label="Cerrar notificación" className="ml-4 font-bold">?</button></div>
}
