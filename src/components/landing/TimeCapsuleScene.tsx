import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Clock3, FileText, Share2 } from "lucide-react";
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
      isDark: root.classList.contains("dark"),
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

function TimeCapsuleMesh({ colors }: { colors: { primary: string; accent: string; muted: string; isDark: boolean } }) {
  const groupRef = useRef<THREE.Group>(null);
  const fileDoodleRef = useRef<THREE.Group>(null);
  const shareDoodleRef = useRef<THREE.Group>(null);
  const clockDoodleRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const doodleLayout = useMemo(() => {
    const compact = viewport.width < 7.6 || viewport.height < 5.2;
    return compact
      ? {
          filePos: [-0.96, 0.58, 0.24] as [number, number, number],
          sharePos: [0.98, -0.18, 0.24] as [number, number, number],
          clockPos: [-0.86, -0.62, 0.2] as [number, number, number],
          scale: 0.74,
        }
      : {
          filePos: [-1.3, 0.72, 0.3] as [number, number, number],
          sharePos: [1.34, -0.3, 0.3] as [number, number, number],
          clockPos: [-1.2, -0.74, 0.22] as [number, number, number],
          scale: 0.9,
        };
  }, [viewport.height, viewport.width]);

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

    if (fileDoodleRef.current) {
      fileDoodleRef.current.rotation.y = -t * 0.35;
      fileDoodleRef.current.position.y = doodleLayout.filePos[1] + Math.sin(t * 1.25) * 0.08;
    }

    if (shareDoodleRef.current) {
      shareDoodleRef.current.rotation.z = Math.sin(t * 0.7) * 0.18;
      shareDoodleRef.current.position.y = doodleLayout.sharePos[1] + Math.sin(t * 1.05 + 1.2) * 0.08;
    }

    if (clockDoodleRef.current) {
      clockDoodleRef.current.rotation.y = t * 0.55;
      clockDoodleRef.current.position.y = doodleLayout.clockPos[1] + Math.sin(t * 1.1 + 2) * 0.06;
    }
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

      {/* Doodle: file card */}
      <group ref={fileDoodleRef} position={doodleLayout.filePos} scale={doodleLayout.scale}>
        <mesh>
          <boxGeometry args={[0.58, 0.76, 0.1]} />
          <meshPhysicalMaterial
            color={colors.accent}
            transmission={0.88}
            thickness={0.3}
            roughness={0.1}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
            emissive={colors.accent}
            emissiveIntensity={colors.isDark ? 0.22 : 0.12}
          />
        </mesh>
        <mesh position={[0.16, 0.26, 0.06]}>
          <boxGeometry args={[0.13, 0.13, 0.03]} />
          <meshStandardMaterial color={colors.primary} metalness={0.35} roughness={0.25} />
        </mesh>
        {[-0.16, 0, 0.16].map((y) => (
          <mesh key={y} position={[0, y, 0.06]}>
            <boxGeometry args={[0.32, 0.03, 0.02]} />
            <meshStandardMaterial color={colors.muted} metalness={0.2} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Doodle: sharing icon */}
      <group ref={shareDoodleRef} position={doodleLayout.sharePos} scale={doodleLayout.scale}>
        {[
          [0, 0.24, 0],
          [-0.34, -0.2, 0],
          [0.34, -0.2, 0],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshPhysicalMaterial
              color={i === 0 ? colors.primary : colors.accent}
              transmission={0.9}
              thickness={0.2}
              roughness={0.08}
              metalness={0.05}
              clearcoat={1}
              emissive={i === 0 ? colors.primary : colors.accent}
              emissiveIntensity={colors.isDark ? 0.3 : 0.14}
            />
          </mesh>
        ))}

        {[[-0.16, 0.02, Math.PI / 6], [0.16, 0.02, -Math.PI / 6]].map(([x, y, zRot], i) => (
          <mesh key={`link-${i}`} position={[x as number, y as number, 0]} rotation={[0, 0, zRot as number]}>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 16]} />
            <meshStandardMaterial color={colors.muted} metalness={0.6} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Doodle: delivery clock */}
      <group ref={clockDoodleRef} position={doodleLayout.clockPos} scale={doodleLayout.scale}>
        <mesh>
          <torusGeometry args={[0.26, 0.05, 16, 64]} />
          <meshPhysicalMaterial
            color={colors.primary}
            transmission={0.86}
            thickness={0.2}
            roughness={0.12}
            metalness={0.15}
            clearcoat={1}
            emissive={colors.primary}
            emissiveIntensity={colors.isDark ? 0.28 : 0.13}
          />
        </mesh>
        <mesh position={[0, 0.09, 0.03]}>
          <boxGeometry args={[0.03, 0.14, 0.03]} />
          <meshStandardMaterial color={colors.accent} metalness={0.55} roughness={0.2} />
        </mesh>
        <mesh position={[0.08, 0, 0.03]} rotation={[0, 0, -0.65]}>
          <boxGeometry args={[0.03, 0.1, 0.03]} />
          <meshStandardMaterial color={colors.accent} metalness={0.55} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function StaticFallback({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
      <div className="pointer-events-none absolute left-4 top-5 sm:left-6 sm:top-6 glass-effect rounded-xl px-3 py-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs text-foreground/80">File</span>
      </div>
      <div className="pointer-events-none absolute right-4 top-16 sm:right-6 sm:top-20 glass-effect rounded-xl px-3 py-2 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-accent" />
        <span className="text-xs text-foreground/80">Share</span>
      </div>
      <div className="pointer-events-none absolute left-8 bottom-12 sm:left-10 sm:bottom-14 glass-effect rounded-xl px-3 py-2 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" />
        <span className="text-xs text-foreground/80">Schedule</span>
      </div>
      <div className={"absolute inset-0 grid place-items-center transition-opacity duration-300 " + (showLabel ? "opacity-100" : "opacity-0")}>
        <div className="glass-effect rounded-3xl px-6 py-4">
          <p className="text-sm text-muted-foreground">Cinematic mode</p>
          <p className="text-lg font-semibold">TimeCapsule</p>
        </div>
      </div>
    </div>
  );
}

export function TimeCapsuleScene() {
  const colors = useThemeHslVars();
  const [canvasReady, setCanvasReady] = useState(false);
  const isDark = colors.isDark;

  return (
    <div className="relative w-full max-w-xl mx-auto h-[320px] sm:h-[360px] md:h-[420px] lg:h-[460px] rounded-[2rem] overflow-hidden border border-border/60 glass-card shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <div className={"absolute inset-0 transition-opacity duration-500 " + (canvasReady ? "opacity-70" : "opacity-100")}>
        <StaticFallback showLabel={!canvasReady} />
      </div>

      {/* Always-visible fallback; Canvas fades in once initialized */}
      <div
        className={
          "absolute inset-0 transition-opacity duration-500 " + (canvasReady ? "opacity-100" : "opacity-0")
        }
      >
        <SceneErrorBoundary fallback={<StaticFallback showLabel={true} />}>
          <Canvas
            camera={{ position: [3.2, 2.4, 3.2], fov: 40 }}
            dpr={1}
            gl={{ alpha: true, antialias: true }}
            onCreated={() => setCanvasReady(true)}
            className="[&>*]:!outline-none"
          >
            <ambientLight intensity={isDark ? 0.85 : 1.05} color={isDark ? colors.accent : colors.muted} />
            <directionalLight position={[4, 6, 4]} intensity={isDark ? 1.28 : 1.05} color={colors.primary} />
            <spotLight
              position={[-6, 8, -2]}
              intensity={isDark ? 1.2 : 0.92}
              angle={0.55}
              penumbra={0.75}
              color={colors.accent}
            />
            <pointLight position={[0, 1.6, 2.4]} intensity={isDark ? 0.7 : 0.5} color={colors.accent} />
            <pointLight position={[0, -1.2, -2.2]} intensity={isDark ? 0.4 : 0.32} color={colors.primary} />

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
