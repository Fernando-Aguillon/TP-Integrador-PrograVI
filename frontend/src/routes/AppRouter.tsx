
import { Navigate, Route, Routes } from 'react-router-dom'

import {
  AdminUsersPage,
  LoginPage,
  RegisterPage
} from '@/features/auth'

import { CategoriesPage } from '@/features/categories'
import { ProductsPage } from '@/features/products'

import Navbar from '@/shared/components/Navbar'
import UnauthorizedPage from '@/shared/components/UnauthorizedPage'
import ProtectedRoute from './ProtectedRoute'

import CartPage from '@/features/orders/pages/CartPage'
import CheckoutPage from '@/features/orders/pages/CheckoutPage'
import MyOrdersPage from '@/features/orders/pages/MyOrdersPage'

import AdminOrdersPage, {
  AdminSummaryPage
} from '@/features/orders/pages/AdminOrdersPage'

export default function AppRouter() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<ProductsPage />} />
        <Route path="/products" element={<ProductsPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/unauthorized"
          element={<UnauthorizedPage />}
        />

        <Route path="/carrito" element={<CartPage />} />

        {/* Rutas para usuarios autenticados */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']} />
          }
        >
          <Route
            path="/checkout"
            element={<CheckoutPage />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={['user']} />
          }
        >
          <Route
            path="/mis-pedidos"
            element={<MyOrdersPage />}
          />
        </Route>

        {/* Rutas exclusivas del administrador */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']} />
          }
        >
          <Route
            path="/categories"
            element={<CategoriesPage />}
          />

          <Route
            path="/admin/categorias"
            element={<CategoriesPage />}
          />

          <Route
            path="/admin/productos"
            element={<ProductsPage />}
          />

          <Route
            path="/admin/usuarios"
            element={<AdminUsersPage />}
          />

          <Route
            path="/admin/resumen"
            element={<AdminSummaryPage />}
          />

          <Route
            path="/admin/pedidos"
            element={<AdminOrdersPage />}
          />
        </Route>

        {/* Ruta no encontrada */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  )
}
