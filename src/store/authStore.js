import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "../lib/zustandStorage";

export const useAuthStore = create(
  persist(
    (set) => ({
      userId: null,
      accessToken: null,
      refreshToken: null,

      setAuth: ({ userId, accessToken, refreshToken }) =>
        set({ userId, accessToken, refreshToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () =>
        set({ userId: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth-store",
      storage: zustandStorage,
      partialize: (state) => ({
        userId: state.userId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export const usePhoneNumberStore = create((set) => ({
  phoneNumber: "",
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  reset: () => set({ phoneNumber: "" }),
}));