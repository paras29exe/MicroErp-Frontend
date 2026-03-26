export const ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  SALES_MANAGER: [
    'master:read',
    'sales:create',
    'sales:read',
    'sales:update',
    'sales:delete',
    'inventory:read',
    'dashboard:read',
  ],
  PURCHASE_MANAGER: [
    'master:read',
    'purchase:create',
    'purchase:read',
    'purchase:update',
    'purchase:delete',
    'inventory:read',
    'dashboard:read',
  ],
  INVENTORY_MANAGER: [
    'master:read',
    'inventory:read',
    'inventory:update',
    'purchase:read',
    'sales:read',
    'production:read',
    'dashboard:read',
  ],
  PRODUCTION_MANAGER: [
    'master:read',
    'production:create',
    'production:read',
    'production:update',
    'production:delete',
    'inventory:read',
    'inventory:update',
    'purchase:read',
    'dashboard:read',
  ],
  ACCOUNTANT: [
    'master:read',
    'purchase:read',
    'sales:read',
    'inventory:read',
    'production:read',
    'expense:read',
    'expense:create',
    'dashboard:read',
  ],
}

export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes('*') || permissions.includes(permission)
}
