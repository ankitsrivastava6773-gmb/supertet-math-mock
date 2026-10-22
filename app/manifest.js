export default function manifest() {
  return {
    name: 'SuperTET Math Mock 2026',
    short_name: 'SuperTET Math',
    description: 'सुपरटीईटी 2026 गणित परीक्षा तैयारी — 338+ सत्यापित प्रश्न, टाइमर और निगेटिव मार्किंग',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0d1a',
    theme_color: '#4f46e5',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
