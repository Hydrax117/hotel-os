'use client';

import dynamic from 'next/dynamic';

const MarkerPulseScene = dynamic(() => import('./MarkerPulseScene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Lazy wrapper — mounts the 3D marker pulse banner only on the client
 * after the results have loaded, with a min-height so layout doesn't jump.
 */
export default function MarkerPulseLazy({
  markerLabels,
}: {
  markerLabels?: string[];
}) {
  return (
    <div
      className="mb-4 overflow-hidden rounded-2xl"
      style={{
        height: 110,
        background:
          'linear-gradient(135deg, rgba(36,71,53,0.06) 0%, rgba(201,169,110,0.05) 100%)',
        border: '1px solid var(--color-border)',
      }}
      aria-hidden="true"
    >
      <MarkerPulseScene markerLabels={markerLabels} />
    </div>
  );
}
