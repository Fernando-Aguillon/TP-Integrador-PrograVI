
import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import ProductoModal from '../components/ProductoModal'
import ResourceTable from '@/shared/components/ResourceTable'
import { useProducts } from '../hooks/useProducts'
import type { ProductoData } from '../hooks/useProducts'
import type { Producto } from '../types/producto'
import { useAuthStore } from '@/features/auth'
import { useCategories } from '@/features/categories'
import { useCartStore } from '@/store/cartStore'
import { useNotificationStore } from '@/store/notificationStore'

const pageSize = 12

const money = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  })

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Producto | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [skip, setSkip] = useState(0)
  const [addedId, setAddedId] = useState<number | null>(null)

  const navigate = useNavigate()
  const searchValue = useDeferredValue(search)

  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'admin'

  const { query, save, remove, reactivate } = useProducts({
    search: searchValue,
    categoriaId: categoryId ? Number(categoryId) : null,
    skip: isAdmin ? 0 : skip,
    admin: isAdmin,
  })

  const categoriesQuery = useCategories().query
  const categories = categoriesQuery.data ?? []
  const rows = query.data?.items ?? []

  const notify = useNotificationStore((state) => state.showNotification)
  const addToCart = useCartStore((state) => state.add)

  const total = query.data?.total ?? 0

  const columns = useMemo<ColumnDef<Producto, unknown>[]>(() => {
    const definitions: ColumnDef<Producto, unknown>[] = [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ getValue }) => getValue() || '—',
      },
      {
        accessorFn: (row) => row.categoria.nombre,
        id: 'categoria_nombre',
        header: 'Categoría',
      },
      {
        accessorKey: 'precio_base',
        header: 'Precio',
        cell: ({ getValue }) => money(Number(getValue())),
      },
    ]

    if (isAdmin) {
      definitions.push(
        {
          accessorKey: 'stock',
          header: 'Stock',
        },
        {
          accessorKey: 'disponible',
          header: 'Disponibilidad',
          cell: ({ getValue }) =>
            getValue() ? 'Disponible' : 'No disponible',
        },
      )

      definitions.push({
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ getValue }) => getValue() ? 'Activo' : 'Desactivado',
      })

      definitions.push({
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => row.original.activo ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelected(row.original)
                setModalOpen(true)
              }}
              className="font-semibold text-indigo-700"
            >
              Editar
            </button>

            <button
              onClick={() => {
                if (window.confirm(`¿Desactivar ${row.original.nombre}?`)) {
                  remove.mutate(row.original.id)
                }
              }}
              className="font-semibold text-rose-600"
            >
              Desactivar
            </button>
          </div>
        ) : (
          <button
            onClick={() => reactivate.mutate(row.original.id)}
            disabled={reactivate.isPending}
            className="font-semibold text-emerald-700 disabled:opacity-50"
          >
            Reactivar
          </button>
        ),
      })

      definitions.push({
        id: 'pedido',
        header: 'Pedido',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            disabled={!row.original.activo || !row.original.disponible || row.original.stock < 1}
            onClick={() => {
              const product = row.original

              const added = addToCart({
                producto_id: product.id,
                nombre: product.nombre,
                precio_unitario: product.precio_base,
                stock: product.stock,
              })

              if (!added) {
                notify('Ya agregaste todo el stock disponible.', 'error')
                return
              }

              navigate('/checkout')
            }}
            className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white disabled:opacity-40"
          >
            Pedir
          </button>
        ),
      })
    } else {
      definitions.push({
        id: 'carrito',
        header: 'Comprar',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            disabled={!row.original.disponible || row.original.stock < 1}
            onClick={() => {
              const product = row.original

              const added = addToCart({
                producto_id: product.id,
                nombre: product.nombre,
                precio_unitario: product.precio_base,
                stock: product.stock,
              })

              if (!added) {
                notify('Ya agregaste todo el stock disponible.', 'error')
                return
              }

              setAddedId(product.id)

              window.setTimeout(
                () =>
                  setAddedId((current) =>
                    current === product.id ? null : current,
                  ),
                900,
              )

              notify(`${product.nombre} agregado al carrito.`, 'success')
            }}
            className={`rounded-lg px-3 py-2 text-white transition duration-200 disabled:opacity-40 ${
              addedId === row.original.id
                ? 'scale-110 bg-emerald-600 animate-bounce'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {addedId === row.original.id ? 'Agregado ✓' : 'Agregar'}
          </button>
        ),
      })
    }

    return definitions
  }, [isAdmin, remove, reactivate, addToCart, notify, addedId, navigate])

  async function submit(data: ProductoData) {
    await save.mutateAsync({
      id: selected?.id,
      data,
    })

    setModalOpen(false)
    setSelected(null)
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <section className="mb-8 flex flex-col justify-between gap-5 rounded-3xl bg-slate-900 px-6 py-9 text-white sm:flex-row sm:items-end sm:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
            Menú
          </p>

          <h1 className="mt-3 text-3xl font-bold">Productos</h1>

          <p className="mt-2 text-slate-300">
            {isAdmin
              ? 'Administrá productos, precios y disponibilidad.'
              : 'Elegí tus favoritos y agregalos al carrito.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setSelected(null)
              setModalOpen(true)
            }}
            className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
          >
            + Nuevo producto
          </button>
        )}
      </section>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          aria-label="Buscar productos"
          placeholder="Buscar productos…"
          className="min-w-60 rounded-xl border bg-white px-4 py-3"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setSkip(0)
          }}
        />

        <select
          aria-label="Filtrar por categoría"
          className="rounded-xl border bg-white px-4 py-3"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value)
            setSkip(0)
          }}
        >
          <option value="">Todas las categorías</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
      </div>

      <ResourceTable
        data={rows}
        columns={columns}
        isLoading={query.isPending}
        error={
          query.isError
            ? (query.error as Error).message
            : categoriesQuery.isError
              ? (categoriesQuery.error as Error).message
              : undefined
        }
        onRetry={() => {
          void query.refetch()
          void categoriesQuery.refetch()
        }}
        emptyMessage="No hay productos para estos filtros."
        manualPagination={!isAdmin}
        getRowClassName={(product) =>
          isAdmin && !product.activo ? 'bg-slate-100 opacity-50' : ''
        }
      />

      {!isAdmin && (
        <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
          <span>
            {total
              ? `${skip + 1}–${Math.min(skip + pageSize, total)} de ${total} productos`
              : '0 productos'}
          </span>

          <div className="flex gap-2">
            <button
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - pageSize))}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              disabled={skip + pageSize >= total}
              onClick={() => setSkip(skip + pageSize)}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {modalOpen && isAdmin && (
        <ProductoModal
          key={selected?.id ?? 'new'}
          producto={selected}
          onClose={() => setModalOpen(false)}
          onSubmit={submit}
        />
      )}
    </main>
  )
}
