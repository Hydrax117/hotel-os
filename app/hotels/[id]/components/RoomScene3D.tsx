'use client';

/**
 * RoomScene3D
 *
 * A lightweight procedural Three.js viewer that builds a rough 3D floor plan
 * from room metadata (bedType, sizeSqm, amenities). No GLTF files needed —
 * everything is extruded from box primitives.
 *
 * Layout rules
 * ───────────────────────────────────────────────────────────────────────────
 *  - Room shell   : floor + three visible walls (front wall is open so the
 *                   camera can look in)
 *  - Bed          : sized by bedType (single → 1×2, double/queen → 1.6×2,
 *                   king → 2×2.2, twin → two 0.9×2 side-by-side)
 *  - Desk         : always present, right wall
 *  - Wardrobe     : always present, left wall
 *  - TV stand     : shown when amenities include TV / Television
 *  - Bathtub box  : shown when amenities include Bathtub / Bath
 *  - Sofa         : shown when amenities include Sofa / Lounge
 *  - AC unit      : shown when amenities include AC / Air conditioning
 *
 * Interaction
 * ───────────────────────────────────────────────────────────────────────────
 *  - Auto-rotates slowly on Y axis (pauses on pointer down)
 *  - Mouse / touch drag → manual orbit
 *  - Scroll / pinch → zoom
 *  - Respects prefers-reduced-motion (freezes auto-rotate)
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoomScene3DProps = {
  bedType?: string | null;
  sizeSqm?: number | null;
  amenities?: string[];
  name?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function bedDims(bedType: string | null | undefined): { w: number; d: number; twin: boolean } {
  const t = (bedType ?? '').toLowerCase();
  if (t.includes('king'))                      return { w: 2.0,  d: 2.2, twin: false };
  if (t.includes('queen'))                     return { w: 1.8,  d: 2.0, twin: false };
  if (t.includes('double'))                    return { w: 1.6,  d: 2.0, twin: false };
  if (t.includes('twin') || t.includes('two')) return { w: 0.9,  d: 2.0, twin: true  };
  if (t.includes('single'))                    return { w: 1.0,  d: 2.0, twin: false };
  // fallback: treat anything else as double
  return { w: 1.6, d: 2.0, twin: false };
}

function roomSize(sqm: number | null | undefined): { rw: number; rd: number } {
  if (sqm && sqm > 0) {
    // Assume roughly square rooms; clamp to reasonable render range
    const side = Math.sqrt(Math.max(sqm, 10));
    const clamped = Math.min(Math.max(side, 3.5), 7.5);
    return { rw: clamped * 1.1, rd: clamped * 0.9 };
  }
  return { rw: 6.0, rd: 5.0 };
}

function hasAmenity(amenities: string[], keywords: string[]): boolean {
  const joined = amenities.join(' ').toLowerCase();
  return keywords.some(k => joined.includes(k.toLowerCase()));
}

// ── Brand palette ─────────────────────────────────────────────────────────────

const C = {
  floor:     new THREE.Color(0xc4b8a8),  // warm stone
  wall:      new THREE.Color(0xe8e0d4),  // ivory
  wallDark:  new THREE.Color(0xc9bfb0),  // slightly deeper side walls
  bed:       new THREE.Color(0xf0ede6),  // linen white
  bedframe:  new THREE.Color(0x8b6e47),  // walnut brown
  pillow:    new THREE.Color(0xffffff),
  desk:      new THREE.Color(0xa07850),  // oak
  wardrobe:  new THREE.Color(0x7a5c3a),  // dark walnut
  tvstand:   new THREE.Color(0x303030),  // near-black
  tv:        new THREE.Color(0x111111),  // screen
  tub:       new THREE.Color(0xe8e4de),  // ceramic white
  sofa:      new THREE.Color(0x8a7060),  // mocha
  ac:        new THREE.Color(0xd0ccc8),  // light grey
  rug:       new THREE.Color(0xc9a96e),  // brand gold
  skirting:  new THREE.Color(0xb8b0a4),
};

// ── Main component ────────────────────────────────────────────────────────────

export default function RoomScene3D({ bedType, sizeSqm, amenities = [], name }: RoomScene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { rw, rd } = roomSize(sizeSqm);
    const wallH = 2.6;
    const wallT = 0.08;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x1a1714, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1714, 12, 24);

    // ── Camera ────────────────────────────────────────────────────────────────
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);

    // Position camera to look down into the room from front-top
    const camDist = Math.max(rw, rd) * 1.35;
    camera.position.set(0, camDist * 0.7, camDist);
    camera.lookAt(0, wallH * 0.3, 0);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff8f0, 1.4));

    const sun = new THREE.DirectionalLight(0xfff3d6, 2.2);
    sun.position.set(4, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Warm fill from the open front
    const fill = new THREE.PointLight(0xc9a96e, 1.0, 14);
    fill.position.set(0, wallH * 0.7, rd * 0.9);
    scene.add(fill);

    // Ceiling lamp (emissive sphere)
    const lampGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const lampMat = new THREE.MeshStandardMaterial({ emissive: 0xfff8d6, emissiveIntensity: 4, color: 0x000000 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, wallH - 0.1, 0);
    scene.add(lamp);
    const ceilingLight = new THREE.PointLight(0xfff8d6, 1.8, 10);
    ceilingLight.position.copy(lamp.position);
    scene.add(ceilingLight);

    // ── Material factory ──────────────────────────────────────────────────────
    const mat = (color: THREE.Color, roughness = 0.75, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    // ── Collect disposables ───────────────────────────────────────────────────
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
    function box(w: number, h: number, d: number) {
      const g = new THREE.BoxGeometry(w, h, d);
      disposables.push(g);
      return g;
    }

    // ── Pivot for orbit ───────────────────────────────────────────────────────
    const pivot = new THREE.Group();
    scene.add(pivot);
    // All room geometry goes into pivot so we orbit the whole room
    function addToPivot(geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, castShadow = true, receiveShadow = true) {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      pivot.add(mesh);
      disposables.push(geo, m);
      return mesh;
    }

    // ── Floor ─────────────────────────────────────────────────────────────────
    const floorM = mat(C.floor, 0.85);
    addToPivot(box(rw, 0.06, rd), floorM, 0, 0, 0, false, true);

    // Rug in center
    const rugM = mat(C.rug, 0.95);
    addToPivot(box(rw * 0.45, 0.065, rd * 0.45), rugM, 0, 0, 0, false, false);

    // ── Walls ─────────────────────────────────────────────────────────────────
    // Back wall (Z = -rd/2)
    const backWallM = mat(C.wall, 0.90);
    addToPivot(box(rw, wallH, wallT), backWallM, 0, wallH / 2, -rd / 2, false, true);

    // Left wall (X = -rw/2)
    const leftWallM = mat(C.wallDark, 0.88);
    addToPivot(box(wallT, wallH, rd), leftWallM, -rw / 2, wallH / 2, 0, false, true);

    // Right wall (X = +rw/2)
    const rightWallM = mat(C.wallDark, 0.88);
    addToPivot(box(wallT, wallH, rd), rightWallM, rw / 2, wallH / 2, 0, false, true);

    // Skirting boards
    const skirtM = mat(C.skirting, 0.70);
    addToPivot(box(rw, 0.12, 0.05), skirtM, 0, 0.09, -rd / 2 + 0.025, false, false);
    addToPivot(box(0.05, 0.12, rd), skirtM, -rw / 2 + 0.025, 0.09, 0, false, false);
    addToPivot(box(0.05, 0.12, rd), skirtM, rw / 2 - 0.025, 0.09, 0, false, false);

    // ── Bed ───────────────────────────────────────────────────────────────────
    const { w: bw, d: bd, twin } = bedDims(bedType);
    const bedY = 0.03; // sits on floor

    function buildBed(bx: number) {
      // Frame
      const frameM = mat(C.bedframe, 0.65);
      addToPivot(box(bw, 0.22, bd), frameM, bx, bedY + 0.11, -rd / 2 + bd / 2 + 0.5);
      // Mattress
      const mattM = mat(C.bed, 0.90);
      addToPivot(box(bw - 0.04, 0.16, bd - 0.04), mattM, bx, bedY + 0.30, -rd / 2 + bd / 2 + 0.5);
      // Pillows
      const pillowM = mat(C.pillow, 0.95);
      const pCount = twin ? 1 : 2;
      const pSpacing = (bw - 0.15) / (pCount + 1);
      for (let p = 1; p <= pCount; p++) {
        const px = bx - bw / 2 + 0.07 + pSpacing * p;
        addToPivot(box(0.45, 0.10, 0.65), pillowM, px, bedY + 0.44, -rd / 2 + 0.75);
      }
      // Headboard
      const headM = mat(C.bedframe, 0.60);
      addToPivot(box(bw, 0.65, 0.07), headM, bx, bedY + 0.55, -rd / 2 + 0.5);
    }

    if (twin) {
      const gap = 0.5;
      buildBed(-bw / 2 - gap / 2);
      buildBed(+bw / 2 + gap / 2);
    } else {
      buildBed(0);
    }

    // ── Desk (right wall) ─────────────────────────────────────────────────────
    const deskM = mat(C.desk, 0.65);
    // Surface
    addToPivot(box(1.2, 0.05, 0.6), deskM, rw / 2 - 0.35, 0.78, rd / 2 - 0.65);
    // Legs
    for (const [lx, lz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]] as [number, number][]) {
      addToPivot(box(0.05, 0.75, 0.05), mat(C.desk, 0.70), rw / 2 - 0.35 + lx * 0.95, 0.4, rd / 2 - 0.65 + lz * 0.9);
    }

    // ── Wardrobe (left wall) ──────────────────────────────────────────────────
    const wardrobeM = mat(C.wardrobe, 0.65);
    addToPivot(box(1.5, 2.1, 0.55), wardrobeM, -rw / 2 + 0.83, 1.05, rd / 2 - 0.5);
    // Door gap line
    const wardDoorM = mat(new THREE.Color(0x5c4028), 0.50);
    addToPivot(box(0.02, 2.0, 0.56), wardDoorM, -rw / 2 + 0.83, 1.05, rd / 2 - 0.5);
    // Handles
    const handleM = mat(new THREE.Color(0xc9a96e), 0.3, 0.8);
    addToPivot(box(0.04, 0.04, 0.12), handleM, -rw / 2 + 0.60, 1.0, rd / 2 - 0.23);
    addToPivot(box(0.04, 0.04, 0.12), handleM, -rw / 2 + 1.06, 1.0, rd / 2 - 0.23);

    // ── TV & stand (back wall, center) ────────────────────────────────────────
    const showTV = hasAmenity(amenities, ['tv', 'television', 'smart tv', 'flat screen']);
    if (showTV) {
      const tvStandM = mat(C.tvstand, 0.80);
      addToPivot(box(1.1, 0.42, 0.38), tvStandM, 0, 0.21, -rd / 2 + 0.22);
      const tvM = mat(C.tv, 0.20, 0.3);
      addToPivot(box(1.05, 0.58, 0.05), tvM, 0, 0.72, -rd / 2 + 0.07);
      // Screen glow
      const screenM = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, emissive: 0x1a3a5c, emissiveIntensity: 0.4 });
      disposables.push(screenM);
      addToPivot(box(0.95, 0.50, 0.01), screenM, 0, 0.72, -rd / 2 + 0.055);
    }

    // ── Bathtub (right corner back) ───────────────────────────────────────────
    const showTub = hasAmenity(amenities, ['bathtub', 'bath', 'jacuzzi', 'soaking']);
    if (showTub) {
      const tubM = mat(C.tub, 0.30, 0.1);
      addToPivot(box(0.8, 0.45, 1.6), tubM, rw / 2 - 0.5, 0.25, -rd / 2 + 0.9);
      const tubInnerM = mat(new THREE.Color(0xd0e8f0), 0.10, 0.0);
      addToPivot(box(0.68, 0.30, 1.48), tubInnerM, rw / 2 - 0.5, 0.38, -rd / 2 + 0.9);
    }

    // ── Sofa (front area) ────────────────────────────────────────────────────
    const showSofa = hasAmenity(amenities, ['sofa', 'lounge', 'seating area', 'sitting area', 'couch']);
    if (showSofa) {
      const sofaM = mat(C.sofa, 0.85);
      // Seat
      addToPivot(box(1.6, 0.35, 0.65), sofaM, 0, 0.35, rd / 2 - 0.9);
      // Back
      addToPivot(box(1.6, 0.45, 0.14), sofaM, 0, 0.72, rd / 2 - 0.63);
      // Armrests
      addToPivot(box(0.14, 0.45, 0.65), sofaM, -0.73, 0.55, rd / 2 - 0.9);
      addToPivot(box(0.14, 0.45, 0.65), sofaM,  0.73, 0.55, rd / 2 - 0.9);
      // Cushions
      const cushM = mat(new THREE.Color(0x9a8070), 0.90);
      addToPivot(box(0.68, 0.10, 0.52), cushM, -0.4, 0.55, rd / 2 - 0.92);
      addToPivot(box(0.68, 0.10, 0.52), cushM,  0.4, 0.55, rd / 2 - 0.92);
    }

    // ── AC unit (top of back wall) ────────────────────────────────────────────
    const showAC = hasAmenity(amenities, ['ac', 'air conditioning', 'air con', 'climate']);
    if (showAC) {
      const acM = mat(C.ac, 0.60);
      addToPivot(box(1.1, 0.22, 0.14), acM, 0, wallH - 0.35, -rd / 2 + 0.1);
      // Vents
      const ventM = mat(new THREE.Color(0xb0aca8), 0.70);
      for (let v = 0; v < 4; v++) {
        addToPivot(box(0.9, 0.025, 0.1), ventM, 0, wallH - 0.28 - v * 0.04, -rd / 2 + 0.07);
      }
    }

    // ── Nightstand(s) ─────────────────────────────────────────────────────────
    const nsM = mat(C.bedframe, 0.70);
    const nsZ = -rd / 2 + bd + 0.6;

    function buildNightstand(nx: number) {
      addToPivot(box(0.4, 0.5, 0.35), nsM, nx, 0.28, nsZ);
      // Lamp
      const lampBaseM = mat(new THREE.Color(0xc9a96e), 0.5, 0.4);
      addToPivot(box(0.08, 0.30, 0.08), lampBaseM, nx, 0.65, nsZ - 0.08);
      const shadeM = new THREE.MeshStandardMaterial({ color: 0xf5ead0, emissive: 0xf5ead0, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 });
      disposables.push(shadeM);
      const shadeGeo = new THREE.ConeGeometry(0.16, 0.22, 10);
      disposables.push(shadeGeo);
      const shadeMesh = new THREE.Mesh(shadeGeo, shadeM);
      shadeMesh.position.set(nx, 0.95, nsZ - 0.08);
      pivot.add(shadeMesh);
      // Small warm point from lamp shade
      const nsLight = new THREE.PointLight(0xffa050, 0.5, 2.0);
      nsLight.position.set(nx, 0.95, nsZ - 0.08);
      pivot.add(nsLight);
    }

    if (twin) {
      const gap = 0.5;
      buildNightstand(-bw / 2 - gap / 2 - bw / 2 - 0.28);
      buildNightstand(+bw / 2 + gap / 2 + bw / 2 + 0.28);
    } else {
      buildNightstand(-bw / 2 - 0.28);
      buildNightstand(+bw / 2 + 0.28);
    }

    // Also move lamp & ceilingLight into pivot
    lamp.removeFromParent(); pivot.add(lamp);
    ceilingLight.removeFromParent(); pivot.add(ceilingLight);

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement ?? canvas);

    // ── Orbit controls (manual) ───────────────────────────────────────────────
    let isPointerDown = false;
    let lastX = 0;
    let lastY = 0;
    let yaw   = 0;    // horizontal orbit angle
    let pitch = -0.35; // vertical tilt (negative = look down slightly)

    const MIN_PITCH = -1.1;
    const MAX_PITCH =  0.0;
    let zoomDist = camDist;
    const MIN_ZOOM = camDist * 0.5;
    const MAX_ZOOM = camDist * 2.0;
    let autoRotate = true;

    function applyCamera() {
      const x = zoomDist * Math.sin(yaw) * Math.cos(pitch);
      const y = zoomDist * Math.sin(-pitch);
      const z = zoomDist * Math.cos(yaw) * Math.cos(pitch);
      camera.position.set(x, y, z);
      camera.lookAt(0, wallH * 0.3, 0);
    }

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      autoRotate = false;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      yaw   -= dx * 0.01;
      pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch + dy * 0.008));
      applyCamera();
    };
    const onPointerUp = () => { isPointerDown = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDist = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDist + e.deltaY * 0.01));
      applyCamera();
    };

    // Touch pinch zoom
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        zoomDist = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDist - (dist - lastPinchDist) * 0.02));
        lastPinchDist = dist;
        applyCamera();
        e.preventDefault();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup',   onPointerUp);
    canvas.addEventListener('pointerleave',onPointerUp);
    canvas.addEventListener('wheel',       onWheel, { passive: false });
    canvas.addEventListener('touchstart',  onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId = 0;
    let t = 0;

    applyCamera();

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (!reduced && autoRotate) {
        yaw += 0.003;
        applyCamera();
      }

      t += 0.016;
      // Gentle lamp flicker
      ceilingLight.intensity = 1.8 + Math.sin(t * 1.1) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup',   onPointerUp);
      canvas.removeEventListener('pointerleave',onPointerUp);
      canvas.removeEventListener('wheel',       onWheel);
      canvas.removeEventListener('touchstart',  onTouchStart);
      canvas.removeEventListener('touchmove',   onTouchMove);
      disposables.forEach(d => d.dispose());
      lampGeo.dispose();
      lampMat.dispose();
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bedType, sizeSqm, amenities?.join(',')]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        overflow: 'hidden',
        background: '#1a1714',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={name ? `3D floor plan for ${name}` : '3D room preview'}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none', // allow our own touch handling
          cursor: 'grab',
        }}
      />

      {/* Interaction hint */}
      <p
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
        aria-hidden="true"
      >
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}
