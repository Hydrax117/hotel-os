'use client';

import dynamic from 'next/dynamic';

const StatCounter3D = dynamic(() => import('./StatCounter3D'), {
  ssr: false,
  loading: () => null,
});

export default function StatCounter3DLazy(props: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label?: string;
  height?: number;
}) {
  return <StatCounter3D {...props} />;
}
