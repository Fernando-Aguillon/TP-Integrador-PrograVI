import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useAuthStore } from '@/features/auth'
import { useCartStore } from '@/store/cartStore'

export default function Navbar() {
  const { user, checking, logout } = useAuth()
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.cantidad, 0))
  const setCartOwner = useCartStore((state) => state.setOwner)
  useEffect(() => { if (user) setCartOwner(user.id) }, [user, setCartOwner])
  const navigate = useNavigate()
  const linkClass = ({ isActive }: { isActive: boolean }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
  async function signOut() { await logout(); navigate('/login', { replace: true }) }
  return <nav className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
    <NavLink to="/" className="flex items-center gap-3" aria-label="Food Store, inicio"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-black text-white">F</span><span className="text-lg font-bold tracking-tight text-slate-900">food<span className="text-indigo-600">store</span></span></NavLink>
    <div className="flex flex-wrap items-center gap-1">{!isAdmin && <><NavLink to="/products" className={linkClass}>Menú</NavLink><NavLink to="/carrito" className={({ isActive }) => `${linkClass({ isActive })} ${cartCount ? 'animate-pulse' : ''}`}>Carrito{cartCount > 0 && <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{cartCount}</span>}</NavLink></>}
      {user && !isAdmin && <NavLink to="/mis-pedidos" className={linkClass}>Mis pedidos</NavLink>}
      {user && isAdmin && <><NavLink to="/admin/productos" className={linkClass}>Productos</NavLink><NavLink to="/admin/categorias" className={linkClass}>Categorías</NavLink><NavLink to="/admin/resumen" className={linkClass}>Resumen</NavLink><NavLink to="/admin/pedidos" className={linkClass}>Pedidos</NavLink><NavLink to="/admin/users" className={linkClass}>Usuarios</NavLink></>}
      {!user && (checking ? <span role="status" className="px-3 text-sm text-slate-500">Comprobando sesión…</span> : <><NavLink to="/login" className={linkClass}>Ingresar</NavLink><NavLink to="/register" className={linkClass}>Registrarme</NavLink></>)}
    </div>
    {user && <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{user.full_name}</p><p className="text-xs text-slate-500">{user.role === 'admin' ? 'Administrador' : `@${user.username}`}</p></div><button type="button" onClick={() => void signOut()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cerrar sesión</button></div>}
  </div></nav>
}
