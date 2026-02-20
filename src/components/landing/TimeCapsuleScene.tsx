import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";

function useThemeHslVars() {
  const read = () => {
    const root = document.documentElement;
    const s = getComputedStyle(root);
    const primary = s.getPropertyValue("--primary").trim();
    const accent = s.getPropertyValue("--accent").trim();
    const muted = s.getPropertyValue("--muted").trim();
    const background = s.getPropertyValue("--background").trim();
    return {
      primary: primary ? `hsl(${primary})` : "#3b82f6",
      accent: accent ? `hsl(${accent})` : "#38bdf8",
      muted: muted ? `hsl(${muted})` : "#94a3b8",
      background: background ? `hsl(${background})` : "#0b1220",
    };
  };

  const [vars, setVars] = useState(read);

  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setVars(read()));
    obs.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", () => setVars(read()));
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", () => setVars(read()));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return vars;
}

function TimeCapsuleMesh({ colors }: { colors: { primary: string; accent: string; muted: string } }) {
  const groupRef = useRef<THREE.Group>(null);
  const prefersReduced = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current || prefersReduced) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.35;
    groupRef.current.rotation.x = Math.sin(t * 0.45) * 0.08;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {/* Capsule body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.6, 64]} />
        <meshStandardMaterial color={colors.primary} metalness={0.75} roughness={0.22} />
      </mesh>

      {/* Domes */}
      <mesh castShadow position={[0, 0.8, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.6, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={colors.accent} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, -0.8, 0]}>
        <sphereGeometry args={[0.6, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={colors.accent} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.23, 32, 32]} />
        <meshStandardMaterial emissive={colors.accent} emissiveIntensity={1.6} color={colors.accent} />
      </mesh>

      {/* Rings */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}>
          <torusGeometry args={[1.02, 0.02, 16, 120]} />
          <meshStandardMaterial color={colors.muted} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function TimeCapsuleScene() {
  const colors = useThemeHslVars();

  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-[2rem] overflow-hidden border border-border/60 glass-card shadow-xl">
      {/* Cinematic overlays using theme tokens only */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <Canvas
        camera={{ position: [3.2, 2.4, 3.2], fov: 40 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        className="[&>*]:!outline-none"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
        <spotLight position={[-6, 8, -2]} intensity={1.25} angle={0.55} penumbra={0.75} />

        <Suspense fallback={null}>
          <group position={[0, -0.2, 0]}>
            <TimeCapsuleMesh colors={colors} />
          </group>
          <Sparkles count={90} speed={0.3} size={2} scale={[8, 5, 8]} color={colors.accent} opacity={0.55} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.55}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
    </div>
  );
}
