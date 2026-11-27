'use client';

/**
 * RoomScene3DLazy
 *
 * Lazy-loads the Three.js room viewer so the heavy WebGL bundle is never
 * included in the initial page load. The skeleton matches the canvas dimensions
 * so there is no layout shift when the scene mounts.
 */

import dynamic from 'next/dynamic';
import type { RoomScene3DProps } from './RoomScene3D';

const RoomScene3D = dynamic(() => import('./RoomScene3D'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1a1714',
        borderRadius: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden="true"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(201,169,110,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ animation: 'spin 1.2s linear infinite' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function RoomScene3DLazy(props: RoomScene3DProps) {
  return <RoomScene3D {...props} />;
}
