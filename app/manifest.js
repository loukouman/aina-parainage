export default function manifest() {
  return {
    name: 'AÏNA – Parrainage solidaire',
    short_name: 'AÏNA',
    description: 'Parrainez un enfant pour Ma Fête à Karpala.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'fr',
    background_color: '#FFF8EA',
    theme_color: '#17583B',
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
