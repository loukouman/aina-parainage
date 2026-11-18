import crypto from 'crypto';

// Cookie « parrain » : posé quand un parrainage est validé, il permet de voir le compteur public.
export const COOKIE_NAME = 'aina_p';
const key = () => process.env.APP_SECRET || 'dev';
const sign = (exp) => crypto.createHmac('sha256', key()).update('parrain:' + exp).digest('hex').slice(0, 32);

export function makeToken() {
  const exp = String(Date.now() + 365 * 24 * 3600 * 1000);
  return exp + '.' + sign(exp);
}
export function validToken(t) {
  if (!t) return false;
  const [exp, sig] = String(t).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
