import { notFound } from 'next/navigation';
import Receipt from '@/components/Receipt';
export const metadata = { title: 'Reçu de parrainage – AÏNA', robots: { index: false } };
export default function Page({ params }) {
  if (!/^AINA-[A-Z2-9]{10}$/.test(params.ref)) notFound();
  return <Receipt reference={params.ref} />;
}
