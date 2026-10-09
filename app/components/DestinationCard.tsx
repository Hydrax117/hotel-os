import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type DestinationCardProps = {
  city: string;
  hotelCount: number;
  imageUrl?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DestinationCard({
  city,
  hotelCount,
  imageUrl,
  gradientFrom = '#d4a574',
  gradientTo = '#8b5e3c',
}: DestinationCardProps) {
  const backgroundStyle = imageUrl
    ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` };

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer"
      style={backgroundStyle}
    >
      {/* Dark overlay gradient on bottom half */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Hotel count badge — top right */}
      <div
        className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      >
        {hotelCount} hotels
      </div>

      {/* City name — bottom left */}
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="text-lg font-bold text-white drop-shadow-sm">{city}</h3>
      </div>
    </div>
  );
}
