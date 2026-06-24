import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppSidebarState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useSidebarStore = create<AppSidebarState>()(
  persist(
    (set) => ({
      open: true,
      setOpen: (open) => set({ open }),
    }),
    {
      name: "sidebar-storage",
    },
  ),
);
