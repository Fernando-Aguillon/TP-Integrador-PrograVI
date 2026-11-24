export interface Producto {
  id: number
  categoria_id: number
  categoria: { id: number; nombre: string; descripcion: string; activo: boolean }
  nombre: string
  descripcion: string
  precio_base: number
  imagen_url: string
  stock: number
  disponible: boolean
  activo: boolean
}

export interface ProductoPage {
  total: number
  items: Producto[]
}

export type ProductoInput = Omit<Producto, 'id' | 'categoria'>
