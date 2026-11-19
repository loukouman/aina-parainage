import ExcelJS from 'exceljs';
import { db } from '@/lib/supabase';
import { currentAdmin, gateOk } from '@/lib/auth';
import { audit } from '@/lib/security';
import { METHODS, PRICE } from '@/lib/pricing';
export const dynamic = 'force-dynamic';

export async function GET() {
  const me = gateOk() ? await currentAdmin() : null;
  if (!me) return new Response('Not found', { status: 404 });
  const { data } = await db().from('pledges').select('*').eq('status', 'validated').order('paid_at', { ascending: true });
  const rows = data || [];
  const wb = new ExcelJS.Workbook();
  const s1 = wb.addWorksheet('Souscriptions validées');
  s1.columns = [
    ['N° / Réf. Transaction', 34], ['Date & Heure (GMT)', 20], ['Type de Parrain', 16], ['Nom / Raison Sociale', 30], ['Numéro de Téléphone', 18],
    ["Nombre d'Enfants", 14], ['Montant Total Payé (FCFA)', 18], ['Part Restauration (2 500)', 18], ['Part Tee-shirt (1 500)', 18], ['Part Jouet (3 500)', 18], ['Moyen de Paiement', 16], ['Contrôle', 14], ['Contrôle', 14],
  ].map(([header, width], i) => ({ header, width, key: 'c' + i }));
  s1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  s1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17304F' } };
  s1.views = [{ state: 'frozen', ySplit: 1 }];
  const part = (k) => PRICE.parts.find((p) => p.key === k).amount;
  rows.forEach((p, i) => {
    const r = i + 2;
    s1.addRow({
      c0: `${p.ref} / ${p.provider_tx_id || ''}`, c1: new Date(p.paid_at), c2: p.donor_type === 'entreprise' ? 'Entreprise' : 'Particulier',
      c3: p.donor_name, c4: p.phone, c5: p.children,
      c6: { formula: `F${r}*${PRICE.unit}`, result: p.children * PRICE.unit },
      c7: { formula: `F${r}*${part('resto')}`, result: p.children * part('resto') },
      c8: { formula: `F${r}*${part('tshirt')}`, result: p.children * part('tshirt') },
      c9: { formula: `F${r}*${part('jouet')}`, result: p.children * part('jouet') },
      c10: METHODS.find((m) => m.key === p.method)?.label, c11: p.verified ? 'Vérifié' : 'Non vérifié', c11: p.verified ? 'Vérifié' : 'Non vérifié',
    });
  });
  s1.getColumn('c1').numFmt = 'dd/mm/yyyy hh:mm:ss';
  ['c6', 'c7', 'c8', 'c9'].forEach((k) => (s1.getColumn(k).numFmt = '#,##0'));

  const N = rows.reduce((s, p) => s + p.children, 0);
  const s2 = wb.addWorksheet('Récapitulatif budgétaire');
  s2.columns = [{ width: 52 }, { width: 24 }];
  s2.addRow(['Point récapitulatif budgétaire — Ma Fête à Karpala (2ᵉ édition)']).font = { bold: true, size: 14 };
  s2.addRow([]);
  const rng = (c) => `'Souscriptions validées'!${c}2:${c}100000`;
  s2.addRow(['Nombre total cumulé d’enfants parrainés', { formula: `SUM(${rng('F')})`, result: N }]);
  s2.addRow(['Sous-total Restauration (plat chaud + boisson)', { formula: `B3*${part('resto')}`, result: N * part('resto') }]);
  s2.addRow(['Sous-total Tee-shirts', { formula: `B3*${part('tshirt')}`, result: N * part('tshirt') }]);
  s2.addRow(['Sous-total Jouets / Cadeaux', { formula: `B3*${part('jouet')}`, result: N * part('jouet') }]);
  const t = s2.addRow(['TOTAL GÉNÉRAL ENCAISSÉ (FCFA)', { formula: `B3*${PRICE.unit}`, result: N * PRICE.unit }]);
  t.font = { bold: true };
  s2.getColumn(2).numFmt = '#,##0';

  await audit(me, 'export_xlsx', null, { lignes: rows.length });
  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(buf, { headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="parrainages-aina-${stamp}.xlsx"`, 'Cache-Control': 'no-store' } });
}
