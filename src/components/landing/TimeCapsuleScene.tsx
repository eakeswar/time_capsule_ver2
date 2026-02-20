import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";

function toThreeSafeHsl(value: string) {
  // input from CSS vars: "208 83% 46%" -> output: "hsl(208, 83%, 46%)"
  const parts = value
    .trim()
    .split(/\s+/)
    .map((p) => p.replace("%", ""));

  if (parts.length < 3) return null;
  const [h, s, l] = parts;
  if (!h || !s || !l) return null;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function useThemeHslVars() {
  const read = () => {
    const root = document.documentElement;
    const s = getComputedStyle(root);

    const primaryRaw = s.getPropertyValue("--primary");
    const accentRaw = s.getPropertyValue("--accent");
    const mutedRaw = s.getPropertyValue("--muted");

    return {
      primary: toThreeSafeHsl(primaryRaw) ?? "#3b82f6",
      accent: toThreeSafeHsl(accentRaw) ?? "#38bdf8",
      muted: toThreeSafeHsl(mutedRaw) ?? "#94a3b8",
    };
  };

  const [vars, setVars] = useState(read);

  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setVars(read()));
    obs.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return vars;
}

class SceneErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error("TimeCapsuleScene crashed, falling back.", err);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
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
    groupRef.current.rotation.y = t * 0.25;
    groupRef.current.rotation.x = Math.sin(t * 0.45) * 0.07;
    groupRef.current.position.y = Math.sin(t * 0.9) * 0.07;
  });

  return (
    <group ref={groupRef}>
      {/* Pedestal */}
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[1.25, 1.05, 0.28, 64]} />
        <meshStandardMaterial color={colors.muted} metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Glass capsule body */}
      <mesh>
        <cylinderGeometry args={[0.62, 0.62, 1.6, 64]} />
        <meshPhysicalMaterial
          color={colors.primary}
          metalness={0.05}
          roughness={0.08}
          transmission={0.92}
          thickness={0.85}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.08}
          attenuationColor={colors.accent}
          attenuationDistance={1.2}
        />
      </mesh>

      {/* Glass domes */}
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.62, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={colors.accent}
          metalness={0.02}
          roughness={0.08}
          transmission={0.95}
          thickness={0.9}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.1}
          attenuationColor={colors.accent}
          attenuationDistance={1.0}
        />
      </mesh>

      <mesh position={[0, -0.8, 0]}>
        <sphereGeometry args={[0.62, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={colors.accent}
          metalness={0.02}
          roughness={0.08}
          transmission={0.95}
          thickness={0.9}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.1}
          attenuationColor={colors.accent}
          attenuationDistance={1.0}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial emissive={colors.accent} emissiveIntensity={2.1} color={colors.accent} />
      </mesh>

      {/* Modern orbit rings */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}>
          <torusGeometry args={[1.03, 0.03, 16, 140]} />
          <meshStandardMaterial color={colors.muted} metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function StaticFallback() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="glass-effect rounded-3xl px-6 py-4">
          <p className="text-sm text-muted-foreground">Cinematic mode (fallback)</p>
          <p className="text-lg font-semibold">TimeCapsule</p>
        </div>
      </div>
    </div>
  );
}

export function TimeCapsuleScene() {
  const colors = useThemeHslVars();
  const [canvasReady, setCanvasReady] = useState(false);

  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-[2rem] overflow-hidden border border-border/60 glass-card shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      {/* Always-visible fallback; Canvas fades in once initialized */}
      <div
        className={
          "absolute inset-0 transition-opacity duration-500 " + (canvasReady ? "opacity-0" : "opacity-100")
        }
      >
        <StaticFallback />
      </div>

      <div
        className={
          "absolute inset-0 transition-opacity duration-500 " + (canvasReady ? "opacity-100" : "opacity-0")
        }
      >
        <SceneErrorBoundary fallback={<StaticFallback />}>
          <Canvas
            camera={{ position: [3.2, 2.4, 3.2], fov: 40 }}
            dpr={1}
            gl={{ alpha: true, antialias: true }}
            onCreated={() => setCanvasReady(true)}
            className="[&>*]:!outline-none"
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 6, 4]} intensity={1.15} />
            <spotLight position={[-6, 8, -2]} intensity={1.05} angle={0.55} penumbra={0.75} />

            <Suspense fallback={null}>
              <group position={[0, -0.2, 0]}>
                <TimeCapsuleMesh colors={colors} />
              </group>
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
    </div>
  );
}
