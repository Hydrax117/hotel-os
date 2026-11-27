'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';

/**
 * StatCounter3D — hotel count stat with 3D extruded text + bronze particle trail.
 *
 * - Counts up from 0 to `value` using easeOutQuart, when scrolled into view.
 * - The number is rendered as 3D extruded text with a bronze gradient material.
 * - A soft particle trail swirls behind the digits as they count.
 *
 * Falls back to plain DOM text if the font or WebGL is unavailable,
 * or when prefers-reduced-motion is set.
 */

// Self-hosted in /public — no runtime network dependency.
const HELVETIKER_URL = '/fonts/helvetiker_regular.typeface.json';

type Props = {
  value: number;
  suffix?: string;   // e.g. '+'
  prefix?: string;   // e.g. '₦'
  duration?: number; // count-up duration ms
  label?: string;    // caption below the number
  height?: number;   // canvas height px
};

export default function StatCounter3D({
  value,
  suffix = '',
  prefix = '',
  duration = 1800,
  label,
  height = 150,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Determine initial render mode — reduced-motion check runs only on client
  const [fallbackValue, setFallbackValue] = useState<number | null>(null);
  const [domMode, setDomMode] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Defer state updates so they don't cascade inside the effect body
      queueMicrotask(() => {
        setDomMode(true);
        setFallbackValue(value);
      });
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      queueMicrotask(() => {
        setDomMode(true);
        setFallbackValue(value);
      });
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      35,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      50,
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Lighting — front key, warm fill, cool rim
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xf3ece0, 1.6);
    key.position.set(3, 4, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc9a96e, 0.7);
    fill.position.set(-4, -2, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x8aaec8, 0.3);
    rim.position.set(0, 5, -5);
    scene.add(rim);

    // ── Font loading ───────────────────────────────────────────────────────
    let disposed = false;
    const loader = new FontLoader();
    let font: Font | null = null;

    // ── Material (bronze) ───────────────────────────────────────────────────
    const textMat = new THREE.MeshStandardMaterial({
      color: 0xc9a96e,
      metalness: 0.9,
      roughness: 0.25,
      emissive: new THREE.Color(0x6b5234),
      emissiveIntensity: 0.15,
    });

    // ── Particles (bronze trail) ────────────────────────────────────────────
    const P_COUNT = 90;
    const positions = new Float32Array(P_COUNT * 3);
    const colors = new Float32Array(P_COUNT * 3);
    const c = new THREE.Color();
    const palette = [0xc9a96e, 0xdfc9a2, 0xad9167, 0xf3ece0];
    for (let i = 0; i < P_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = -1 - Math.random() * 2;
      c.setHex(palette[Math.floor(Math.random() * palette.length)]);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft dot sprite
    const sc = document.createElement('canvas');
    sc.width = 32; sc.height = 32;
    const sctx = sc.getContext('2d')!;
    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);
    const sprite = new THREE.CanvasTexture(sc);

    const pMat = new THREE.PointsMaterial({
      size: 0.06,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Count-up state ─────────────────────────────────────────────────────
    let started = false;
    let textMesh: THREE.Mesh | null = null;
    let displayValue = 0;

    const buildText = (txt: string) => {
      if (!font) return;
      if (textMesh) {
        scene.remove(textMesh);
        textMesh.geometry.dispose();
        textMesh = null;
      }
      const geo = new TextGeometry(txt, {
        font,
        size: 0.8,
        depth: 0.22,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.015,
        bevelSegments: 3,
      });
      geo.center();
      textMesh = new THREE.Mesh(geo, textMat);
      scene.add(textMesh);
    };

    const easeOutQuart = (p: number) => 1 - Math.pow(1 - p, 4);

    const runCount = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        if (disposed) return;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        displayValue = Math.round(easeOutQuart(progress) * value);
        buildText(`${prefix}${displayValue.toLocaleString()}${suffix}`);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const startWhenVisible = () => {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started) {
            started = true;
            io.disconnect();
            runCount();
          }
        },
        { threshold: 0.3 },
      );
      io.observe(canvas);
      return io;
    };

    const io = startWhenVisible();

    // ── Animation loop ──────────────────────────────────────────────────────
    let rafId = 0;
    let t = 0;
    const animate = () => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      // Text gentle rotation
      if (textMesh) {
        textMesh.rotation.y = Math.sin(t * 0.5) * 0.08;
        textMesh.rotation.x = Math.cos(t * 0.4) * 0.03;
      }

      // Particle swirl — orbits around the text center
      const posAttr = pGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < P_COUNT; i++) {
        const angle = t * 0.6 + i * 0.35;
        const radius = 2.5 + (i % 7) * 0.35;
        posAttr.array[i * 3]     = Math.cos(angle + i * 0.09) * radius * 1.4;
        posAttr.array[i * 3 + 1] = Math.sin(angle * 0.8 + i * 0.11) * radius * 0.35;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    // ── Font load, then start ───────────────────────────────────────────────
    loader.load(
      HELVETIKER_URL,
      (f) => {
        if (disposed) return;
        font = f;
        // Build "0" initially so something shows before the count triggers
        buildText(`${prefix}0${suffix}`);
        animate();
      },
      undefined,
      () => {
        // Font failed — fall back to DOM counter
        queueMicrotask(() => {
          setDomMode(true);
          setFallbackValue(value);
        });
      },
    );

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement ?? canvas);

    // DOM fallback animation (only used when set above)
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      if (textMesh) textMesh.geometry.dispose();
      textMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      sprite.dispose();
      renderer.dispose();
    };
  }, [value, suffix, prefix, duration]);

  // ── DOM fallback renderer ─────────────────────────────────────────────────
  if (domMode) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 400,
          color: 'var(--primitive-bronze-500, #8b6e47)',
          lineHeight: 1,
        }}>
          {prefix}{(fallbackValue ?? 0).toLocaleString()}{suffix}
        </p>
        {label && <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${prefix}${value.toLocaleString()}${suffix}${label ? ` ${label}` : ''}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {label && (
        <p
          className="text-center text-sm"
          style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
