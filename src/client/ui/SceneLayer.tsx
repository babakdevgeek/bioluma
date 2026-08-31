import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { useJourneyStore } from "../stores/journey";

function Creature() {
  const mesh = useRef<THREE.Mesh>(null);
  const stage = useJourneyStore((s) => s.stage);
  const soundOn = useJourneyStore((s) => s.soundOn);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uCharge: { value: 0 },
          uColorA: { value: new THREE.Color("#c9f24e") },
          uColorB: { value: new THREE.Color("#e879f9") },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uCharge;
          varying vec3 vNormal;
          varying float vWave;

          float snoise(vec3 p) {
            return sin(p.x * 2.2 + uTime * 0.7) * 0.35 +
                   sin(p.y * 3.4 - uTime * 0.9) * 0.2 +
                   sin(p.z * 4.8 + uTime * 1.2) * 0.1;
          }

          void main() {
            vNormal = normal;
            float wave = snoise(position + normal * 0.8);
            vWave = wave;
            vec3 displaced = position + normal * (0.16 * wave + uCharge * 0.18);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform float uCharge;
          varying vec3 vNormal;
          varying float vWave;
          void main() {
            float fres = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.6);
            vec3 color = mix(uColorA, uColorB, 0.35 + uCharge * 0.8 + vWave * 0.6);
            float alpha = 0.38 + fres * 0.44 + uCharge * 0.2;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [],
  );

  useEffect(() => {
    const charge = material.uniforms.uCharge;
    charge.value = stage === "relay" ? 0.55 : stage === "drift" ? 0.26 : stage === "archive" ? 0.12 : 0.05;
  }, [material, stage, soundOn]);

  useFrame((state) => {
    if (!mesh.current) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.1;
    mesh.current.rotation.y += 0.0025;
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.16;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.8}>
      <mesh ref={mesh} material={material} position={[0, 0.7, -0.5]}>
        <icosahedronGeometry args={[1.25, 18]} />
      </mesh>
    </Float>
  );
}

function Dust() {
  const points = useMemo(() => {
    const count = 2200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = (Math.random() - 0.2) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return arr;
  }, []);

  return (
    <Points positions={points} stride={3} frustumCulled>
      <PointMaterial transparent size={0.03} sizeAttenuation color="#dafcb0" depthWrite={false} opacity={0.7} />
    </Points>
  );
}

function Scene() {
  const device = useJourneyStore((s) => s.device);
  return (
    <Canvas
      dpr={device === "high" ? [1, 1.8] : [1, 1.3]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      gl={{ antialias: device !== "low", alpha: true }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#090e16", 8, 18]} />
      <ambientLight intensity={0.35} color="#a8b8ff" />
      <pointLight intensity={10} color="#c9f24e" position={[0, 1, 3]} distance={12} decay={1.8} />
      <pointLight intensity={5} color="#e879f9" position={[3, -2, 2]} distance={10} decay={2} />
      <Suspense fallback={null}>
        <Creature />
        <Dust />
      </Suspense>
      {device !== "low" && (
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} intensity={0.55} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  );
}

export function SceneLayer() {
  return <Scene />;
}
