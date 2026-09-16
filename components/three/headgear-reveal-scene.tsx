"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector2,
} from "three";

import { SHELL } from "@/components/three/headgear-geometry";
import { HeadgearModel } from "@/components/three/headgear-model";
import {
  REVEAL_BLOBS,
  applyReveal,
  createRevealUniform,
} from "@/components/three/reveal-material";

/**
 * Where the head sits inside `hero-portrait.png`, as fractions of the 3:2
 * image box: `x`/`y` locate the middle of the headgear shell, `width` is the
 * shell's width. Calibrated against the actual portrait — if the portrait is
 * replaced, these three numbers are the only thing to re-tune.
 */
export const HEAD_FIT = { x: 0.5, y: 0.36, width: 0.32 } as const;

/** Shell width in inches, including the cage bulge at the sides. */
const MODEL_WIDTH_IN = SHELL.x * 2 + 0.7;

/**
 * Radius of each trail blob as a fraction of the canvas's shorter side. Blobs
 * that overlap add up, so at rest the reveal is about 2.3× this size.
 */
const BLOB_RADIUS = 0.09;

export type RevealMode = "pointer" | "wander" | "static";

export interface HeadgearRevealSceneProps {
  /** Render loop runs only while true — pass false when the hero is off-screen. */
  active: boolean;
  /**
   * `pointer`: the reveal follows the mouse and hides when it leaves.
   * `wander`: the reveal drifts slowly over the face (touch devices).
   * `static`: a fixed reveal over the face (touch + reduced motion).
   */
  mode: RevealMode;
}

export function HeadgearRevealScene({ active, mode }: HeadgearRevealSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 30 }}
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true }}
      // Measure with offsetWidth/offsetHeight, which ignore CSS transforms. The
      // portrait animates in from scale(0.96); a transform-aware measurement
      // taken mid-animation would lock the canvas ~4% small and misalign the
      // headgear with the face for good.
      resize={{ offsetSize: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 8]} intensity={3.2} />
      {/* Neon rim light from behind-left, the signature accent. */}
      <directionalLight position={[-6, 3, -4]} intensity={5} color="#ccff00" />
      <directionalLight position={[3, -4, 4]} intensity={0.5} color="#ff3b3b" />

      {/* Studio reflections for the metal cage, built locally — no CDN fetch. */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, 6]} scale={[10, 2, 1]} />
        <Lightformer
          intensity={1.5}
          position={[6, 0, 2]}
          rotation-y={-Math.PI / 2}
          scale={[6, 6, 1]}
        />
        <Lightformer
          intensity={0.8}
          color="#ccff00"
          position={[-6, 0, -2]}
          rotation-y={Math.PI / 2}
          scale={[10, 1, 1]}
        />
      </Environment>

      <FittedHeadgear mode={mode} />
    </Canvas>
  );
}

function FittedHeadgear({ mode }: { mode: RevealMode }) {
  const { viewport, camera, gl } = useThree();

  // Map the image-box fractions onto world units at the model's depth.
  const view = viewport.getCurrentViewport(camera, [0, 0, 0]);
  const scale = (HEAD_FIT.width * view.width) / MODEL_WIDTH_IN;
  const position: [number, number, number] = [
    (HEAD_FIT.x - 0.5) * view.width,
    (0.5 - HEAD_FIT.y) * view.height,
    0,
  ];

  const reveal = useMemo(() => createRevealUniform(), []);

  const materials = useMemo(
    () => ({
      shell: applyReveal(
        // Lifted off pure black so the shell still reads against the page.
        new MeshStandardMaterial({ color: "#2a2a2f", roughness: 0.45, metalness: 0.15 }),
        reveal,
      ),
      seam: applyReveal(new MeshStandardMaterial({ color: "#3a3a40", roughness: 0.6 }), reveal),
      lining: applyReveal(
        new MeshStandardMaterial({ color: "#a3161c", roughness: 0.95 }),
        reveal,
      ),
      cage: applyReveal(
        new MeshStandardMaterial({
          color: "#1c1c20",
          roughness: 0.35,
          metalness: 0.8,
        }),
        reveal,
      ),
    }),
    [reveal],
  );

  // Always-visible wireframe dome over the crown, hinting at the hidden helmet.
  const ghost = useMemo(
    () => ({
      geometry: new SphereGeometry(1, 36, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      material: new MeshBasicMaterial({
        color: "#fafafa",
        wireframe: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((material) => material.dispose());
      ghost.geometry.dispose();
      ghost.material.dispose();
    };
  }, [materials, ghost]);

  // Per-frame animation state lives in refs: the React Compiler lint rules
  // forbid mutating memoized values from inside useFrame, but refs are meant
  // to be mutated. Trail positions are canvas CSS pixels, y down; blob 0 leads.
  const trailRef = useRef<Vector2[] | null>(null);
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const strength = useRef(0);

  useEffect(() => {
    if (mode !== "pointer") return;

    // Listen on window, not the canvas: the canvas ignores pointer events so
    // the hero headline and buttons layered above it stay clickable.
    function onMove(event: PointerEvent) {
      const rect = gl.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.current = {
        x,
        y,
        inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
      };
    }
    function onLeave() {
      pointer.current.inside = false;
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [gl, mode]);

  useFrame((state, delta) => {
    const { width, height } = state.size;
    const dpr = state.gl.getPixelRatio();
    const faceX = HEAD_FIT.x * width;
    const faceY = (HEAD_FIT.y + 0.04) * height;

    let targetX = faceX;
    let targetY = faceY;
    let targetStrength = 1;

    if (mode === "pointer") {
      targetX = pointer.current.x;
      targetY = pointer.current.y;
      targetStrength = pointer.current.inside ? 1 : 0;
    } else if (mode === "wander") {
      const t = state.clock.elapsedTime;
      targetX = faceX + Math.sin(t * 0.6) * width * 0.07;
      targetY = faceY + Math.sin(t * 0.9) * height * 0.09;
    }

    if (!trailRef.current) {
      trailRef.current = Array.from(
        { length: REVEAL_BLOBS },
        () => new Vector2(targetX, targetY),
      );
    }
    const trail = trailRef.current;

    strength.current = MathUtils.damp(strength.current, targetStrength, 6, delta);

    // The lead blob chases the target; each follower chases the one ahead,
    // slightly slower, so fast movement stretches the reveal into a tail.
    trail[0].x = MathUtils.damp(trail[0].x, targetX, 16, delta);
    trail[0].y = MathUtils.damp(trail[0].y, targetY, 16, delta);
    for (let i = 1; i < REVEAL_BLOBS; i++) {
      const lambda = 14 - i;
      trail[i].x = MathUtils.damp(trail[i].x, trail[i - 1].x, lambda, delta);
      trail[i].y = MathUtils.damp(trail[i].y, trail[i - 1].y, lambda, delta);
    }

    const baseRadius = Math.min(width, height) * BLOB_RADIUS * strength.current;
    reveal.value.forEach((uniform, i) => {
      uniform.set(
        trail[i].x * dpr,
        (height - trail[i].y) * dpr,
        baseRadius * (1 - (i / REVEAL_BLOBS) * 0.7) * dpr,
      );
    });
  });

  return (
    // No rotation: the headgear must stay locked to the photographed face.
    <group position={position} scale={scale}>
      <HeadgearModel materials={materials} />
      <mesh
        geometry={ghost.geometry}
        material={ghost.material}
        scale={[SHELL.x * 1.06, SHELL.y * 1.04, SHELL.z * 1.06]}
      />
    </group>
  );
}
