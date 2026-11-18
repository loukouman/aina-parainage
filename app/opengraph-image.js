import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AÏNA – Parrainage solidaire';
export default function Image() {
  return new ImageResponse(
    (<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: '#17583B', color: '#fff' }}>
      <div style={{ fontSize: 64, color: '#F4C257', fontWeight: 800 }}>AÏNA</div>
      <div style={{ fontSize: 76, fontWeight: 800, marginTop: 20, lineHeight: 1.1 }}>Parrainez un enfant pour Ma Fête à Karpala</div>
      <div style={{ fontSize: 36, marginTop: 28, color: '#FBEFD5' }}>Un jouet · un repas chaud · un tee-shirt — 7 500 FCFA</div>
    </div>), size);
}
