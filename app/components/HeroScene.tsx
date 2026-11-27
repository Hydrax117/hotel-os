'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * HeroScene v2 — Golden Aurora
 *
 * Concept: dozens of sine-wave ribbon meshes sweep across a deep ink void,
 * lit by two slowly-orbiting point lights (amber + emerald). The ribbons
 * undulate like silk in wind. A second layer of sparse glowing spheres
 * (think distant hotel lights) punctuates the depth. The camera drifts
 * forward imperceptibly — you feel like you're floating toward something.
 *
 * Colors: ink (#0c0b09), warm amber (#c9a96e), forest emerald (#244735),
 *         bronze highlights (#dfc9a2).
 */
export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x0c0b09, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c0b09, 0.038);

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      80,
    );
    camera.position.set(0, 0, 14);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0d0a06, 2));

    // Warm amber key — orbits around the ribbons
    const amber = new THREE.PointLight(0xc9a96e, 120, 30);
    amber.position.set(6, 4, 8);
    scene.add(amber);

    // Emerald fill — opposite side
    const emerald = new THREE.PointLight(0x1d5c3a, 80, 28);
    emerald.position.set(-8, -3, 6);
    scene.add(emerald);

    // Deep blue-white backlight
    const back = new THREE.PointLight(0x8aaec8, 40, 25);
    back.position.set(0, 8, -4);
    scene.add(back);

    // ── Ribbon builder ────────────────────────────────────────────────────────
    // Each ribbon is a PlaneGeometry subdivided along X, deformed by sin waves.
    // We store the base Y positions and animate them each frame.
    type Ribbon = {
      mesh: THREE.Mesh;
      posAttr: THREE.BufferAttribute;
      baseY: Float32Array;
      freq: number;    // wave frequency
      amp: number;     // wave amplitude
      speed: number;   // animation speed
      phase: number;   // time phase offset
      xPhase: number;  // phase shift along X
    };

    const ribbons: Ribbon[] = [];
    const SEGS_X = 80;  // horizontal subdivisions
    const SEGS_Y = 1;   // keep ribbon flat on Y axis

    const RIBBON_DEFS = [
      // [width, height, x, y, z,  rotY, rotZ, r, g, b,     metalness, emissive hex, emissiveInt]
      [18, 0.18,  0,  1.2, -2,   0.0,  0.04,  0.80, 0.66, 0.43,  0.9, 0xc9a96e, 0.25],
      [16, 0.12,  0, -0.4, -3,   0.02, -0.03, 0.72, 0.56, 0.32,  0.85,0xad9167, 0.18],
      [20, 0.22,  0,  2.8, -4,  -0.02, 0.06,  0.87, 0.78, 0.60,  0.92,0xdfc9a2, 0.30],
      [14, 0.10,  0, -1.8, -4,   0.03, -0.05, 0.60, 0.46, 0.26,  0.80,0x8b6e47, 0.12],
      [22, 0.26,  0,  4.2, -6,   0.0,   0.03, 0.75, 0.65, 0.40,  0.88,0xc9a96e, 0.22],
      [18, 0.14,  0, -3.0, -5,  -0.01,  0.04, 0.55, 0.42, 0.22,  0.82,0x6b5234, 0.10],
      [15, 0.16,  0,  0.6, -1,   0.01, -0.02, 0.92, 0.82, 0.62,  0.95,0xdfc9a2, 0.35],
      [12, 0.08,  0, -2.4, -2,   0.02,  0.05, 0.50, 0.38, 0.20,  0.78,0x6b5234, 0.08],
      [24, 0.30,  0,  5.5, -8,   0.0,   0.02, 0.70, 0.60, 0.38,  0.90,0xc9a96e, 0.20],
      [10, 0.09,  0,  3.4, -1,  -0.03,  0.03, 0.85, 0.70, 0.45,  0.88,0xad9167, 0.15],
      [20, 0.20,  0, -4.5, -7,   0.01, -0.04, 0.65, 0.52, 0.30,  0.84,0x8b6e47, 0.12],
      [16, 0.13,  0,  1.8, -5,   0.02,  0.06, 0.78, 0.65, 0.42,  0.87,0xc9a96e, 0.18],
      // Thin emerald-tinted accent ribbons
      [14, 0.06,  0,  0.2, -1.5, 0.01,  0.02, 0.22, 0.42, 0.28,  0.92,0x244735, 0.20],
      [18, 0.07,  0, -1.0, -6,  -0.01,  0.03, 0.18, 0.36, 0.24,  0.90,0x1d5c3a, 0.15],
    ] as const;

    const WAVE_PARAMS = [
      // [freq, amp, speed, phase, xPhase]
      [0.8,  0.55, 0.9,  0.0,  0.0 ],
      [1.1,  0.40, 1.2, -0.8,  0.3 ],
      [0.6,  0.70, 0.7,  1.5,  0.5 ],
      [1.3,  0.35, 1.5, -1.2,  0.8 ],
      [0.5,  0.80, 0.6,  2.0,  0.2 ],
      [0.9,  0.45, 1.0,  0.5,  0.6 ],
      [1.5,  0.30, 1.8, -0.3,  0.4 ],
      [0.7,  0.60, 0.8,  1.0,  0.9 ],
      [0.4,  0.90, 0.5,  2.5,  0.1 ],
      [1.2,  0.38, 1.3, -1.8,  0.7 ],
      [0.6,  0.65, 0.7,  0.8,  0.3 ],
      [1.0,  0.42, 1.1,  1.3,  0.5 ],
      [1.4,  0.25, 1.6, -0.5,  0.6 ],
      [0.8,  0.30, 0.9,  1.8,  0.4 ],
    ];

    RIBBON_DEFS.forEach((def, idx) => {
      const [w, h, x, y, z, rotY, rotZ, r, g, b, metal, emissiveHex, emissiveInt] = def;
      const wp = WAVE_PARAMS[idx % WAVE_PARAMS.length];

      const geo = new THREE.PlaneGeometry(w as number, h as number, SEGS_X, SEGS_Y);
      const pos = geo.attributes.position as THREE.BufferAttribute;

      // Store base Y values before deformation
      const baseY = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) baseY[i] = pos.getY(i);

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r as number, g as number, b as number),
        metalness: metal as number,
        roughness: 0.25,
        emissive: new THREE.Color().setHex(emissiveHex as number),
        emissiveIntensity: emissiveInt as number,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x as number, y as number, z as number);
      mesh.rotation.y = rotY as number;
      mesh.rotation.z = rotZ as number;
      scene.add(mesh);

      ribbons.push({
        mesh,
        posAttr: pos,
        baseY,
        freq:   wp[0],
        amp:    wp[1],
        speed:  wp[2],
        phase:  wp[3],
        xPhase: wp[4],
      });
    });

    // ── Glowing spheres (distant hotel/city lights) ───────────────────────────
    const sphereGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const spherePositions = [
      [-5,  2.5, -6], [ 4,  3.5, -8], [-3, -1.5, -5],
      [ 6, -2.0, -9], [-7,  0.5, -7], [ 2,  4.0,-10],
      [-4,  1.0, -4], [ 5,  1.5, -6], [-1, -3.0, -8],
      [ 3, -0.5, -5], [-6, -2.5,-10], [ 1,  2.0, -3],
      [-2,  3.5, -9], [ 7,  0.0, -7], [-5, -1.0, -6],
      [ 0,  5.0,-11], [ 4, -3.0, -4], [-3,  2.0,-12],
    ];
    const sphereMats = [
      new THREE.MeshStandardMaterial({ emissive: 0xc9a96e, emissiveIntensity: 1.8, color: 0x000000 }),
      new THREE.MeshStandardMaterial({ emissive: 0xdfc9a2, emissiveIntensity: 1.5, color: 0x000000 }),
      new THREE.MeshStandardMaterial({ emissive: 0x4a8b68, emissiveIntensity: 1.2, color: 0x000000 }),
    ];

    const sphereMeshes: THREE.Mesh[] = [];
    spherePositions.forEach(([sx, sy, sz], i) => {
      const mat = sphereMats[i % sphereMats.length];
      const m = new THREE.Mesh(sphereGeo, mat);
      m.position.set(sx, sy, sz);
      scene.add(m);
      sphereMeshes.push(m);
    });

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

    // ── Mouse ─────────────────────────────────────────────────────────────────
    let targetMX = 0, targetMY = 0;
    let currentMX = 0, currentMY = 0;
    const onMouse = (e: MouseEvent) => {
      targetMX = (e.clientX / window.innerWidth  - 0.5) * 2;
      targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    // ── Gyro (mobile) ─────────────────────────────────────────────────────────
    const onGyro = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      targetMX = Math.max(-1, Math.min(1, e.gamma / 45));
      targetMY = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 45));
    };
    window.addEventListener('deviceorientation', onGyro, { passive: true });

    // ── Animation ─────────────────────────────────────────────────────────────
    let rafId = 0;
    let t = 0;

    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (!reduced) {
        t += 0.008;

        // Smooth mouse follow
        currentMX = lerp(currentMX, targetMX, 0.04);
        currentMY = lerp(currentMY, targetMY, 0.04);

        // Scene tilt with mouse — gentle
        scene.rotation.y = currentMX * 0.12;
        scene.rotation.x = currentMY * 0.06;

        // Camera slow forward drift
        camera.position.z = 14 - t * 0.015;
        if (camera.position.z < 10) camera.position.z = 14; // reset

        // Amber light orbit
        amber.position.x = Math.cos(t * 0.25) * 9;
        amber.position.y = Math.sin(t * 0.18) * 5 + 3;
        amber.position.z = Math.sin(t * 0.25) * 5 + 8;

        // Emerald light counter-orbit
        emerald.position.x = Math.cos(t * 0.20 + Math.PI) * 10;
        emerald.position.y = Math.sin(t * 0.15 + 1) * 4 - 2;
        emerald.position.z = Math.cos(t * 0.20) * 6 + 5;

        // Animate each ribbon — sine wave deformation along X axis
        ribbons.forEach(({ posAttr, baseY, freq, amp, speed, phase, xPhase }) => {
          const count = posAttr.count;
          for (let i = 0; i < count; i++) {
            const x = posAttr.getX(i);
            const wave = Math.sin(x * freq + t * speed + phase)
                       * Math.cos(x * freq * 0.4 + t * speed * 0.6 + xPhase)
                       * amp;
            posAttr.setY(i, baseY[i] + wave);
          }
          posAttr.needsUpdate = true;
        });

        // Spheres — gentle individual pulse/drift
        sphereMeshes.forEach((m, i) => {
          const flicker = 0.8 + Math.sin(t * 2.5 + i * 1.3) * 0.2;
          (m.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker * (i % 3 === 0 ? 1.8 : i % 3 === 1 ? 1.5 : 1.2);
          m.position.y += Math.sin(t * 0.4 + i * 0.7) * 0.001;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('deviceorientation', onGyro);
      ribbons.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      sphereMeshes.forEach(m => m.geometry.dispose());
      sphereMats.forEach(m => m.dispose());
      sphereGeo.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
