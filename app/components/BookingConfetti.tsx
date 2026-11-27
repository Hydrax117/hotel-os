'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * BookingConfetti — one-shot gold/bronze particle burst fired on mount.
 *
 * Fires a burst of ~350 brand-colored particles (bronze, gold, cream, emerald)
 * that explode outward from the success icon, arc under gravity, and fade.
 * Self-destructs after ~2.5s by unmounting via internal timer + onDone callback.
 *
 * Respects prefers-reduced-motion (renders nothing).
 */

const PARTICLE_COUNT = 350;

const COLORS = [
  0xc9a96e, // bronze-300
  0xdfc9a2, // bronze-200
  0xf3ece0, // bronze-100
  0xad9167, // bronze-400
  0x8b6e47, // bronze-500
  0x4a6b54, // forest accent
  0xffffff, // bright sparkle
];

type Props = {
  /** Called when the burst has finished — parent can stop rendering this. */
  onDone?: () => void;
};

export default function BookingConfetti({ onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDoneRef.current?.();
      return;
    }

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    // Overhead-ish view so the burst rains down over the card
    camera.position.set(0, 1.2, 8);
    camera.lookAt(0, 1, 0);

    // ── Particles ───────────────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const spins = new Float32Array(PARTICLE_COUNT);   // horizontal wobble freq
    const delays = new Float32Array(PARTICLE_COUNT);  // stagger per particle
    const lifeSpans = new Float32Array(PARTICLE_COUNT);

    const color = new THREE.Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Burst origin — a wide horizontal band above the viewport center,
      // like confetti cannons firing from the sides of the check circle.
      const side = i % 2 === 0 ? -1 : 1;
      positions[i * 3]     = side * 4 + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = 2 + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      // Launch velocity — inward, upward, varied
      const angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.25; // upward cone
      const speed = 0.04 + Math.random() * 0.05;
      velocities[i * 3]     = -side * Math.cos(angle) * speed * (1.6 + Math.random());
      velocities[i * 3 + 1] = Math.sin(angle) * speed * (1.4 + Math.random());
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed * 0.6;

      color.setHex(COLORS[Math.floor(Math.random() * COLORS.length)]);
      colors[i * 3]     = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      spins[i] = Math.random() * Math.PI * 2;
      delays[i] = Math.random() * 18; // frames of stagger
      lifeSpans[i] = 130 + Math.random() * 60; // frames
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft round sprite
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 32; spriteCanvas.height = 32;
    const ctx = spriteCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    // Mixed point sizes for depth — two layers
    const material = new THREE.PointsMaterial({
      size: 0.09,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Animation ─────────────────────────────────────────────────────────────
    let rafId = 0;
    let frame = 0;
    let alive = true;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const GRAVITY = 0.0028;

    const animate = () => {
      if (!alive) return;
      rafId = requestAnimationFrame(animate);
      frame++;

      let anyAlive = false;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const age = frame - delays[i];
        if (age < 0) continue; // not launched yet
        if (age > lifeSpans[i]) continue; // dead

        anyAlive = true;

        // Physics
        velocities[i * 3 + 1] -= GRAVITY; // gravity
        velocities[i * 3] *= 0.992;        // air drag
        posAttr.array[i * 3]     += velocities[i * 3]     + Math.sin(frame * 0.12 + spins[i]) * 0.012;
        posAttr.array[i * 3 + 1] += velocities[i * 3 + 1];
        posAttr.array[i * 3 + 2] += velocities[i * 3 + 2];
      }

      // Fade out over the last quarter of the longest lifespan
      const maxAge = frame - 0;
      material.opacity = Math.max(0, 1 - Math.max(0, (maxAge - 110) / 80));

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);

      if (!anyAlive && frame > 60) {
        alive = false;
        cleanup();
        onDoneRef.current?.();
      }
    };

    animate();

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Hard stop after 4s regardless of visibility state
    const timeout = window.setTimeout(() => {
      if (alive) {
        alive = false;
        cancelAnimationFrame(rafId);
        cleanup();
        onDoneRef.current?.();
      }
    }, 4000);

    function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.clearTimeout(timeout);
      geometry.dispose();
      material.dispose();
      sprite.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }

    return cleanup;
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
