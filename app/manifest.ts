import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Axiom-0 Sovereign Mobile & AI Kernel Studio',
    short_name: 'Axiom-0',
    description:
      'First-principles self-modifying AI workbench, custom binary compiler & VM, Git-DAG context engine, compoundable live telemetry matrix, and Android app studio.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#090D16',
    theme_color: '#090D16',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
