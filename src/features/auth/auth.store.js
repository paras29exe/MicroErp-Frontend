import { create } from 'zustand'

const initialState = {
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
}

export const useAuthStore = create((set) => ({
  ...initialState,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
  setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),
}))
