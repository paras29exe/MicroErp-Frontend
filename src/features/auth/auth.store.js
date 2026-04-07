import { create } from 'zustand'

const initialState = {
  user: null,
  effectivePermissions: [],
  isAuthenticated: false,
  isBootstrapping: true,
}

export const useAuthStore = create((set) => ({
  ...initialState,
  setUser: (user) =>
    set({
      user,
      effectivePermissions: Array.isArray(user?.effectivePermissions) ? user.effectivePermissions : [],
      isAuthenticated: Boolean(user),
    }),
  setEffectivePermissions: (effectivePermissions) =>
    set((state) => {
      const safePermissions = Array.isArray(effectivePermissions) ? effectivePermissions : []
      if (!state.user) {
        return { effectivePermissions: safePermissions }
      }

      return {
        user: { ...state.user, effectivePermissions: safePermissions },
        effectivePermissions: safePermissions,
      }
    }),
  clearSession: () => set({ user: null, effectivePermissions: [], isAuthenticated: false }),
  setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),
}))
