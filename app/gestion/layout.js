import { notFound } from 'next/navigation';
import { gateOk } from '@/lib/auth';
export const metadata = { title: 'Administration', robots: { index: false, follow: false } };
export default function Layout({ children }) {
  if (!gateOk()) notFound();
  return children;
}
