import { ImageResponse } from 'next/og';
export const runtime = 'edge';

// Icône provisoire (lettre A). Remplacez-la par le vrai logo quand il existera.
export async function GET(_req, { params }) {
  const s = Number(params.size);
  if (![192, 512].includes(s)) return new Response('Not found', { status: 404 });
  return new ImageResponse(
    (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#17583B', color: '#F4C257', fontSize: s * 0.5, fontWeight: 800 }}>A</div>),
    { width: s, height: s }
  );
}
