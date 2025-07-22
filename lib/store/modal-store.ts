import { create } from "zustand";

interface ModalState {
  dailyMissionOpen: boolean;
  setDailyMissionOpen: (open: boolean) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  dailyMissionOpen: false,
  setDailyMissionOpen: (open) => set({ dailyMissionOpen: open }),
}));