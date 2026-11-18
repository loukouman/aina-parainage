import './globals.css';
import '@fontsource-variable/nunito';
import { SITE } from '@/lib/config';
import PwaRegister from '@/components/PwaRegister';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: 'AÏNA – Parrainage solidaire · Ma Fête à Karpala',
  description: 'Parrainez un enfant pour la 2ᵉ édition de Ma Fête à Karpala : jouet, repas chaud et tee-shirt pour 7 500 FCFA.',
  openGraph: { title: 'AÏNA – Parrainez un enfant', description: 'Ma Fête à Karpala, 22–27 décembre 2026. Un enfant parrainé = un jouet, un repas, un tee-shirt.', locale: 'fr_BF', type: 'website' },
  icons: { icon: '/pwa-icon/192', apple: '/pwa-icon/192' },
  appleWebApp: { capable: true, title: 'AÏNA', statusBarStyle: 'default' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#17583B' };
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-creme font-sans text-nuit antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
