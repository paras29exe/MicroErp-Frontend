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

function normalizePermissionContext(input) {
  if (typeof input === 'string') {
    return { role: input, effectivePermissions: [] }
  }

  if (!input || typeof input !== 'object') {
    return { role: '', effectivePermissions: [] }
  }

  return {
    role: input.role || '',
    effectivePermissions: Array.isArray(input.effectivePermissions) ? input.effectivePermissions : [],
  }
}

export function hasPermission(roleOrUser, permission) {
  const { role, effectivePermissions } = normalizePermissionContext(roleOrUser)

  if (permission === '*') {
    return role === 'ADMIN' || effectivePermissions.includes('*')
  }

  if (effectivePermissions.length > 0) {
    return effectivePermissions.includes('*') || effectivePermissions.includes(permission)
  }

  const rolePermissions = ROLE_PERMISSIONS[role] || []
  return rolePermissions.includes('*') || rolePermissions.includes(permission)
}
