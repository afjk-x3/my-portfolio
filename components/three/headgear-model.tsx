"use client";

import { useEffect, useMemo } from "react";
import type { Material } from "three";

import {
  CHIN,
  SHELL,
  createCageGeometries,
  createCrownGeometry,
  createSeamGeometries,
  createShellGeometry,
  createSideFlapGeometry,
  createThroatFlapGeometry,
} from "@/components/three/headgear-geometry";

export interface HeadgearMaterials {
  shell: Material;
  seam: Material;
  lining: Material;
  cage: Material;
}

const SHELL_SCALE = [SHELL.x, SHELL.y, SHELL.z] as const;

/**
 * The headgear meshes, in inches, centered on the middle of the shell and
 * facing +Z. Materials are supplied by the caller so the same model can be
 * rendered solid, revealed through a mask, or as a wireframe ghost.
 */
export function HeadgearModel({ materials }: { materials: HeadgearMaterials }) {
  const geometry = useMemo(
    () => ({
      crown: createCrownGeometry(),
      shell: createShellGeometry(),
      cage: createCageGeometries(),
      seams: createSeamGeometries(),
      throatFlap: createThroatFlapGeometry(),
      sideFlap: createSideFlapGeometry(),
    }),
    [],
  );

  // Geometries are created imperatively, so free them on unmount.
  useEffect(() => {
    return () => {
      const { cage, seams, ...single } = geometry;
      [...Object.values(single), ...cage.bars, cage.frame, cage.padding, ...seams].forEach((g) =>
        g.dispose(),
      );
    };
  }, [geometry]);

  return (
    <group>
      <mesh geometry={geometry.crown} scale={SHELL_SCALE} material={materials.shell} />
      <mesh geometry={geometry.shell} scale={SHELL_SCALE} material={materials.shell} />

      {geometry.seams.map((seam) => (
        <mesh key={seam.uuid} geometry={seam} material={materials.seam} />
      ))}

      {geometry.cage.bars.map((bar) => (
        <mesh key={bar.uuid} geometry={bar} material={materials.cage} />
      ))}
      <mesh geometry={geometry.cage.frame} material={materials.cage} />
      {/*
       * No inner lining behind the cage on purpose: the canvas is transparent
       * there, so the real face in the portrait shows through the bars.
       */}
      <mesh geometry={geometry.cage.padding} material={materials.lining} />

      <mesh
        geometry={geometry.throatFlap}
        material={materials.shell}
        position={[0, CHIN.y + 0.6, CHIN.z - 1.1]}
        rotation={[-0.12, 0, 0]}
      />
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          geometry={geometry.sideFlap}
          material={materials.shell}
          position={[side * 3.7, CHIN.y + 1.2, CHIN.z - 2.4]}
          rotation={[-0.1, side * 0.9, side * 0.15]}
        />
      ))}
    </group>
  );
}
