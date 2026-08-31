import { create } from "zustand";
import type { Stage } from "@/shared/types";
import type { DeviceTier } from "../lib/device";

interface JourneyState {
  stage: Stage;
  progress: number;
  soundOn: boolean;
  device: DeviceTier;
  sceneEnabled: boolean;
  discharges: Partial<Record<Stage, boolean>>;
  setStage: (stage: Stage) => void;
  setProgress: (progress: number) => void;
  setSoundOn: (soundOn: boolean) => void;
  setDevice: (device: DeviceTier) => void;
  setSceneEnabled: (enabled: boolean) => void;
  markDischarge: (stage: Stage) => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  stage: "surface",
  progress: 0,
  soundOn: false,
  device: "mid",
  sceneEnabled: false,
  discharges: {},
  setStage: (stage) => set({ stage }),
  setProgress: (progress) => set({ progress }),
  setSoundOn: (soundOn) => set({ soundOn }),
  setDevice: (device) => set({ device }),
  setSceneEnabled: (sceneEnabled) => set({ sceneEnabled }),
  markDischarge: (stage) =>
    set((state) => ({ discharges: { ...state.discharges, [stage]: true } })),
}));
