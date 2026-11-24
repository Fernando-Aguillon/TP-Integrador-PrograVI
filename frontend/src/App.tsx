import { useEffect } from 'react'
import AppRouter from '@/routes/AppRouter'
import Toast from '@/shared/components/Toast'
import { useAuth } from '@/features/auth'
export default function App() {
  const { checkAuth } = useAuth()
  useEffect(() => { void checkAuth() }, [checkAuth])
  return <><AppRouter /><Toast /></>
}
