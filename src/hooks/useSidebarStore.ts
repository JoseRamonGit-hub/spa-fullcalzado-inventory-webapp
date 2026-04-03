import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useSidebarStore = create<SidebarState>()(
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
