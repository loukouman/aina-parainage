// Configuration serveur uniquement.
export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  open: Date.parse(process.env.OPEN_AT || '2026-11-20T00:00:00Z'),
  close: Date.parse(process.env.CLOSE_AT || '2026-12-21T00:00:00Z'),
};
export const phaseAt = (t) => (t < SITE.open ? 'waiting' : t >= SITE.close ? 'closed' : 'open');
