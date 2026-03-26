import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'
import { AppShell } from '@/app/layouts/app-shell'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute, PermissionRoute } from '@/features/auth/route-guards'
import { useAuthStore } from '@/features/auth/auth.store'
import { bootstrapSession } from '@/features/auth/session'
import { DashboardPage } from '@/pages/DashboardPage'
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProductsPage } from '@/pages/master/ProductsPage'
import { CustomersPage } from '@/pages/master/CustomersPage'
import { VendorsPage } from '@/pages/master/VendorsPage'
import { SalesOrdersPage } from '@/pages/sales/SalesOrdersPage'
import { CreateSalePage } from '@/pages/sales/CreateSalePage'
import { SaleDetailsPage } from '@/pages/sales/SaleDetailsPage'
import { SalesReportsPage } from '@/pages/sales/SalesReportsPage'

function SessionBootstrap() {
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping)

  useEffect(() => {
    setBootstrapping(true)
    bootstrapSession()
  }, [setBootstrapping])

  return <Outlet />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SessionBootstrap />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard/overview"
              element={
                <PermissionRoute permission="dashboard:read">
                  <DashboardPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/dashboard/kpis"
              element={
                <PermissionRoute permission="dashboard:read">
                  <ModulePlaceholderPage title="KPI Snapshot" />
                </PermissionRoute>
              }
            />
            <Route
              path="/dashboard/alerts"
              element={
                <PermissionRoute permission="dashboard:read">
                  <ModulePlaceholderPage title="Operational Alerts" />
                </PermissionRoute>
              }
            />
            <Route
              path="/sales/orders"
              element={
                <PermissionRoute permission="sales:read">
                  <SalesOrdersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/sales/new"
              element={
                <PermissionRoute permission="sales:create">
                  <CreateSalePage />
                </PermissionRoute>
              }
            />
            <Route
              path="/sales/:id"
              element={
                <PermissionRoute permission="sales:read">
                  <SaleDetailsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/sales/reports"
              element={
                <PermissionRoute permission="sales:read">
                  <SalesReportsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/purchases/orders"
              element={
                <PermissionRoute permission="purchase:read">
                  <ModulePlaceholderPage title="Purchase Orders" />
                </PermissionRoute>
              }
            />
            <Route
              path="/purchases/new"
              element={
                <PermissionRoute permission="purchase:create">
                  <ModulePlaceholderPage title="Record New Purchase" />
                </PermissionRoute>
              }
            />
            <Route
              path="/purchases/payments"
              element={
                <PermissionRoute permission="purchase:update">
                  <ModulePlaceholderPage title="Payment Status Updates" />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/stock"
              element={
                <PermissionRoute permission="inventory:read">
                  <ModulePlaceholderPage title="Stock Ledger" />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/low-stock"
              element={
                <PermissionRoute permission="inventory:read">
                  <ModulePlaceholderPage title="Low Stock" />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/summary"
              element={
                <PermissionRoute permission="inventory:read">
                  <ModulePlaceholderPage title="Inventory Summary" />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/adjustments"
              element={
                <PermissionRoute permission="inventory:update">
                  <ModulePlaceholderPage title="Stock Adjustments" />
                </PermissionRoute>
              }
            />
            <Route
              path="/production/runs"
              element={
                <PermissionRoute permission="production:read">
                  <ModulePlaceholderPage title="Production Register" />
                </PermissionRoute>
              }
            />
            <Route
              path="/production/new"
              element={
                <PermissionRoute permission="production:create">
                  <ModulePlaceholderPage title="Record Production" />
                </PermissionRoute>
              }
            />
            <Route
              path="/production/bom"
              element={
                <PermissionRoute permission="production:read">
                  <ModulePlaceholderPage title="BOM Manager" />
                </PermissionRoute>
              }
            />
            <Route
              path="/master/products"
              element={
                <PermissionRoute permission="master:read">
                  <ProductsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/master/customers"
              element={
                <PermissionRoute permission="master:read">
                  <CustomersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/master/vendors"
              element={
                <PermissionRoute permission="master:read">
                  <VendorsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PermissionRoute permission="*">
                  <ModulePlaceholderPage title="User Management" />
                </PermissionRoute>
              }
            />
            <Route
              path="/profile"
              element={<ModulePlaceholderPage title="Profile" />}
            />
            <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="/sales" element={<Navigate to="/sales/orders" replace />} />
            <Route path="/purchases" element={<Navigate to="/purchases/orders" replace />} />
            <Route path="/inventory" element={<Navigate to="/inventory/stock" replace />} />
            <Route path="/production" element={<Navigate to="/production/runs" replace />} />
            <Route path="/master" element={<Navigate to="/master/products" replace />} />
          </Route>

            <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
