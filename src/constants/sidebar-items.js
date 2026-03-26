import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  CircleDollarSign,
  Factory,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  UserCog,
  UserRound,
  Users,
  ChartNoAxesCombined,
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard Overview',
        href: '/dashboard/overview',
        permission: 'dashboard:read',
        icon: LayoutDashboard,
        api: {
          module: '/api/dashboard',
          endpoints: ['/overview', '/kpis', '/alerts'],
        },
      },
      {
        title: 'KPI Snapshot',
        href: '/dashboard/kpis',
        permission: 'dashboard:read',
        icon: BarChart3,
        api: {
          module: '/api/dashboard',
          endpoints: ['/kpis'],
        },
      },
      {
        title: 'Operational Alerts',
        href: '/dashboard/alerts',
        permission: 'dashboard:read',
        icon: AlertTriangle,
        api: {
          module: '/api/dashboard',
          endpoints: ['/alerts'],
        },
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Order Flow',
        icon: ChartNoAxesCombined,
        subItems: [
          {
            title: 'Sales Orders',
            href: '/sales/orders',
            permission: 'sales:read',
            icon: ShoppingBag,
            api: {
              module: '/api/sales',
              endpoints: ['/get-sales', '/get-sale/:id'],
            },
          },
          {
            title: 'Record New Sale',
            href: '/sales/new',
            permission: 'sales:create',
            icon: Plus,
            api: {
              module: '/api/sales',
              endpoints: ['/add-sale'],
            },
          },
          {
            title: 'Sales Reports',
            href: '/sales/reports',
            permission: 'sales:read',
            icon: BarChart3,
            api: {
              module: '/api/sales',
              endpoints: ['/get-sales'],
            },
          },
          {
            title: 'Purchase Orders',
            href: '/purchases/orders',
            permission: 'purchase:read',
            icon: ShoppingCart,
            api: {
              module: '/api/purchases',
              endpoints: ['/get-purchases', '/get-purchase/:id'],
            },
          },
          {
            title: 'Record New Purchase',
            href: '/purchases/new',
            permission: 'purchase:create',
            icon: Plus,
            api: {
              module: '/api/purchases',
              endpoints: ['/add-purchase'],
            },
          },
          {
            title: 'Payment Status Updates',
            href: '/purchases/payments',
            permission: 'purchase:update',
            icon: CircleDollarSign,
            api: {
              module: '/api/purchases',
              endpoints: ['/update-payment-status/:id'],
            },
          },
        ],
      },
      {
        title: 'Manufacturing',
        icon: Factory,
        subItems: [
          {
            title: 'Production Register',
            href: '/production/runs',
            permission: 'production:read',
            icon: ClipboardList,
            api: {
              module: '/api/production',
              endpoints: ['/get-productions', '/get-production/:id'],
            },
          },
          {
            title: 'Record Production',
            href: '/production/new',
            permission: 'production:create',
            icon: Plus,
            api: {
              module: '/api/production',
              endpoints: ['/record-production'],
            },
          },
          {
            title: 'BOM Manager',
            href: '/production/bom',
            permission: 'production:read',
            icon: SlidersHorizontal,
            api: {
              module: '/api/production',
              endpoints: ['/upsert-bom', '/get-bom/:productId'],
            },
          },
        ],
      },
      {
        title: 'Inventory',
        icon: Boxes,
        subItems: [
          {
            title: 'Stock Ledger',
            href: '/inventory/stock',
            permission: 'inventory:read',
            icon: Boxes,
            api: {
              module: '/api/inventory',
              endpoints: ['/', '/:productId'],
            },
          },
          {
            title: 'Low Stock',
            href: '/inventory/low-stock',
            permission: 'inventory:read',
            icon: AlertTriangle,
            api: {
              module: '/api/inventory',
              endpoints: ['/low-stock'],
            },
          },
          {
            title: 'Inventory Summary',
            href: '/inventory/summary',
            permission: 'inventory:read',
            icon: BarChart3,
            api: {
              module: '/api/inventory',
              endpoints: ['/summary'],
            },
          },
          {
            title: 'Stock Adjustments',
            href: '/inventory/adjustments',
            permission: 'inventory:update',
            icon: SlidersHorizontal,
            api: {
              module: '/api/inventory',
              endpoints: ['/adjust', '/reorder-level/:productId'],
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Masters & Admin',
    items: [
      {
        title: 'Master Data',
        icon: ChartNoAxesCombined,
        subItems: [
          {
            title: 'Products',
            href: '/master/products',
            permission: 'master:read',
            icon: Package,
            api: {
              module: '/api/products',
              endpoints: [
                '/get-products',
                '/get-product/:id',
                '/add-product',
                '/update-product/:id',
                '/delete-product/:id',
              ],
            },
          },
          {
            title: 'Customers',
            href: '/master/customers',
            permission: 'master:read',
            icon: Users,
            api: {
              module: '/api/customers',
              endpoints: [
                '/get-customers',
                '/get-customer/:id',
                '/add-customer',
                '/update-customer/:id',
                '/delete-customer/:id',
              ],
            },
          },
          {
            title: 'Vendors',
            href: '/master/vendors',
            permission: 'master:read',
            icon: UserRound,
            api: {
              module: '/api/vendors',
              endpoints: [
                '/get-vendors',
                '/get-vendor/:id',
                '/add-vendor',
                '/update-vendor/:id',
                '/delete-vendor/:id',
              ],
            },
          },
        ],
      },
      {
        title: 'User Management',
        href: '/users',
        permission: '*',
        icon: UserCog,
        api: {
          module: '/api/users',
          endpoints: [
            '/me',
            '/update-me',
            '/create-user',
            '/get-users',
            '/get-user/:id',
            '/update-user/:id',
            '/deactivate-user/:id',
            '/delete-user/:id',
          ],
        },
      },
    ],
  },
]

function filterItemByPermission(role, item) {
  if (item.subItems) {
    const filteredSubItems = item.subItems.filter((subItem) =>
      hasPermission(role, subItem.permission),
    )

    if (filteredSubItems.length === 0) {
      return null
    }

    return {
      ...item,
      subItems: filteredSubItems,
    }
  }

  if (!hasPermission(role, item.permission)) {
    return null
  }

  return item
}

export function getSidebarSections(role) {
  return NAV_SECTIONS.map((section) => {
    const items = section.items
      .map((item) => filterItemByPermission(role, item))
      .filter(Boolean)

    return {
      ...section,
      items,
    }
  }).filter((section) => section.items.length > 0)
}
