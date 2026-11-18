export const metadata = { title: 'Hors ligne – AÏNA', robots: { index: false } };
export default function HorsLigne() {
  return (
    <main className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="text-3xl font-extrabold text-brique">AÏNA</div>
      <h1 className="mt-6 text-2xl font-extrabold">Vous êtes hors ligne</h1>
      <p className="mt-3 text-lg">Une connexion Internet est nécessaire pour parrainer un enfant. Réessayez dès que le réseau revient.</p>
      <a href="/" className="btn mt-8">Réessayer</a>
    </main>
  );
}
