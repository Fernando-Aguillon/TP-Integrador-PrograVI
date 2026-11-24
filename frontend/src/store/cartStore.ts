import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem { producto_id: number; nombre: string; precio_unitario: number; cantidad: number; stock: number }
interface CartState {
  items: CartItem[]
  ownerId: number | null
  setOwner: (userId: number | null) => void
  add: (item: Omit<CartItem, 'cantidad'>) => boolean
  setQuantity: (id: number, cantidad: number) => void
  remove: (id: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(persist((set) => ({
  items: [],
  ownerId: null,
  setOwner: (userId) => set((state) => {
    if (userId === null) return state
    if (state.ownerId !== null && state.ownerId !== userId) return { items: [], ownerId: userId }
    return { ownerId: userId }
  }),
  add: (item) => {
    let added = false
    set((state) => {
      const existing = state.items.find((row) => row.producto_id === item.producto_id)
      const max = Math.max(0, item.stock)
      if ((existing?.cantidad ?? 0) >= max) return state
      added = true
      return { items: existing
        ? state.items.map((row) => row.producto_id === item.producto_id ? { ...row, precio_unitario: item.precio_unitario, stock: max, cantidad: row.cantidad + 1 } : row)
        : [...state.items, { ...item, cantidad: 1 }] }
    })
    return added
  },
  setQuantity: (id, cantidad) => set((state) => ({ items: cantidad < 1
    ? state.items.filter((item) => item.producto_id !== id)
    : state.items.map((item) => item.producto_id === id ? { ...item, cantidad: Math.min(cantidad, item.stock || cantidad) } : item) })),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.producto_id !== id) })),
  clear: () => set({ items: [] }),
}), { name: 'food-store-cart-v2' }))
