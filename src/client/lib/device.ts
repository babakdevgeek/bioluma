export type DeviceTier = "low" | "mid" | "high";

/**
 * A rough heuristic, not a benchmark. Good enough to decide whether bloom and
 * 30k particles are rude.
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "mid";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const width = window.innerWidth;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let score = 0;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;

  if (width >= 1200) score += 1;
  if (!coarse) score += 1;

  if (score >= 5) return "high";
  if (score >= 3) return "mid";
  return "low";
}

export function webglAvailable(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
}
