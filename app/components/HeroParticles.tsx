'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Number of particles — keep low enough to stay well under 1 ms/frame budget
const PARTICLE_COUNT = 280;

// Warm bronze/gold palette matching the site's --primitive-bronze tokens
const COLORS = [
  0xc9a96e, // bronze-300
  0xdfc9a2, // bronze-200
  0xf3ece0, // bronze-100
  0xad9167, // bronze-400
  0xffffff, // white — a few bright highlights
];

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion — mount the canvas but skip animation
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,       // transparent background — hero image shows through
      antialias: false,  // not needed for point sprites
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    // ── Scene / Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 5;

    // ── Particle geometry ────────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);
    const sizes     = new Float32Array(PARTICLE_COUNT);
    const speeds    = new Float32Array(PARTICLE_COUNT); // vertical drift speed
    const phases    = new Float32Array(PARTICLE_COUNT); // horizontal sine phase

    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Scatter across a wide plane in front of the camera
      positions[i * 3]     = (Math.random() - 0.5) * 14; // x  — wide
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y  — full height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;  // z  — shallow depth

      color.setHex(COLORS[Math.floor(Math.random() * COLORS.length)]);
      colors[i * 3]     = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Vary sizes so closer/brighter particles feel larger
      sizes[i]  = Math.random() * 3 + 1;    // 1–4 px
      speeds[i] = Math.random() * 0.004 + 0.001; // slow upward drift
      phases[i] = Math.random() * Math.PI * 2;   // unique horizontal phase
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    // ── Sprite texture — soft radial gradient dot ────────────────────────────
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width  = 32;
    spriteCanvas.height = 32;
    const ctx = spriteCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0,   'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    // ── Material ─────────────────────────────────────────────────────────────
    const material = new THREE.PointsMaterial({
      size: 0.08,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Resize handler ───────────────────────────────────────────────────────
    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement ?? canvas);

    // ── Animation loop ───────────────────────────────────────────────────────
    let rafId = 0;
    let t = 0;

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (reduced) {
        renderer.render(scene, camera);
        return;
      }

      t += 0.016; // ~60 fps time accumulator

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Drift upward
        posAttr.array[i * 3 + 1] += speeds[i];

        // Gentle horizontal sway
        posAttr.array[i * 3] +=
          Math.sin(t * 0.4 + phases[i]) * 0.0008;

        // Wrap: when a particle drifts off the top, respawn at the bottom
        if (posAttr.array[i * 3 + 1] > 5) {
          posAttr.array[i * 3 + 1] = -5;
          posAttr.array[i * 3]     = (Math.random() - 0.5) * 14;
        }
      }

      posAttr.needsUpdate = true;

      // Very slow global rotation for depth
      points.rotation.z = Math.sin(t * 0.03) * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      spriteTexture.dispose();
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
        // Sit above the photo but below the gradient overlay and text
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
