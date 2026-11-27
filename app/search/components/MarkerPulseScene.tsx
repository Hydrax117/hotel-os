'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * MarkerPulseScene — a compact 3D scene showing pulsing hotel marker pins.
 *
 * Rendered as a narrow banner above the results list when a destination search
 * is active. Each pin pulses at an intensity proportional to its index weight
 * (mimicking price/rating variation). Clicking a pin is decorative here — real
 * navigation stays on the list cards below.
 *
 * Colors follow the Lodgen brand palette (forest green + bronze).
 */

const BRAND_GREEN  = 0x244735;
const ACCENT_GOLD  = 0xc9a96e;
const ACCENT_LIGHT = 0xdfc9a2;

type Props = {
  /** Names of the city markers to show (up to 6 used). */
  markerLabels?: string[];
};

export default function MarkerPulseScene({ markerLabels = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      60,
    );
    camera.position.set(0, 0, 9);

    // Soft ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.PointLight(0xdfc9a2, 60, 20);
    key.position.set(5, 6, 8);
    scene.add(key);

    // ── Build markers ──────────────────────────────────────────────────────
    // Distribute markers in a gentle arc
    const count = Math.min(markerLabels.length || 5, 6);
    const spread = count * 1.4;

    type Marker = {
      group: THREE.Group;
      ring: THREE.Mesh;
      dot: THREE.Mesh;
      phase: number;
      speed: number;
      baseY: number;
      intensity: number;
    };

    const markers: Marker[] = [];

    // Ring geometry — a flat torus for the pulse ring
    const ringGeo = new THREE.TorusGeometry(0.28, 0.025, 8, 36);
    const dotGeo  = new THREE.SphereGeometry(0.14, 16, 12);

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1); // 0..1
      const x = (t - 0.5) * spread;
      // Gentle arc — taller at center
      const y = -0.5 * (1 - 4 * Math.pow(t - 0.5, 2)) + 0.3 * Math.random();

      // Alternate colors to add interest
      const isAccent = i % 3 === 0;
      const markerColor = isAccent ? ACCENT_GOLD : BRAND_GREEN;

      const dotMat = new THREE.MeshStandardMaterial({
        color: markerColor,
        emissive: new THREE.Color(markerColor),
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.3,
      });

      const ringMat = new THREE.MeshStandardMaterial({
        color: markerColor,
        emissive: new THREE.Color(markerColor),
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.7,
        metalness: 0.4,
        roughness: 0.5,
      });

      const dot  = new THREE.Mesh(dotGeo, dotMat);
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());

      const group = new THREE.Group();
      group.add(dot);
      group.add(ring);
      group.position.set(x, y, 0);
      scene.add(group);

      markers.push({
        group,
        ring,
        dot,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.5,
        baseY: y,
        intensity: 0.5 + Math.random() * 0.5, // simulate different price/rating weights
      });
    }

    // Connecting line between all markers
    if (count > 1) {
      const linePts = markers.map(m => new THREE.Vector3(m.group.position.x, m.group.position.y, 0));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({
        color: ACCENT_LIGHT,
        transparent: true,
        opacity: 0.18,
      });
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement ?? canvas);

    // ── Animation ──────────────────────────────────────────────────────────
    let rafId = 0;
    let t = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (!reduced) {
        t += 0.016;

        markers.forEach(({ group, ring, dot, phase, speed, baseY, intensity }) => {
          // Gentle bob
          group.position.y = baseY + Math.sin(t * speed + phase) * 0.08;

          // Pulse ring scale — expands and fades
          const pulseCycle = (t * speed * 1.4 + phase) % (Math.PI * 2);
          const pulseProgress = pulseCycle / (Math.PI * 2); // 0..1
          ring.scale.setScalar(1 + pulseProgress * 1.6 * intensity);
          (ring.material as THREE.MeshStandardMaterial).opacity = (1 - pulseProgress) * 0.65 * intensity;

          // Dot emissive breathe
          (dot.material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.4 + Math.sin(t * speed * 1.1 + phase) * 0.3;
        });

        // Slow scene drift
        scene.rotation.y = Math.sin(t * 0.07) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      ringGeo.dispose();
      dotGeo.dispose();
      markers.forEach(({ ring, dot }) => {
        (ring.material as THREE.Material).dispose();
        (dot.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, [markerLabels.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
