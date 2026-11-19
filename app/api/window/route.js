import { NextResponse } from 'next/server';
import { getWindow } from '@/lib/config';
export const dynamic = 'force-dynamic';

// Dates d'ouverture et de fermeture actuelles : la page de parrainage les compare à celles qu'elle affiche
// et se rafraîchit toute seule dès qu'elles changent (par exemple après un réglage dans « Calendrier »).
export async function GET() {
  const w = await getWindow();
  return NextResponse.json({ open: w.open, close: w.close }, { headers: { 'Cache-Control': 'private, no-store' } });
}
