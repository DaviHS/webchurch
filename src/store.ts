import { create } from "zustand";

type State = {
  isSidebarOpen: boolean;
};

type Actions = {
  setIsSidebarOpen: (isOpen: boolean) => void;
};

export const useStore = create<State & Actions>((set) => ({
  isSidebarOpen: false,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
