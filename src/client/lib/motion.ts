import { useEffect, useState } from "react";
import { webglAvailable } from "./device";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function useCanRenderScene() {
  const reduced = useReducedMotion();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setOk(!reduced && webglAvailable());
  }, [reduced]);

  return ok;
}
