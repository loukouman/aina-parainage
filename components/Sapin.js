// Sapin décoratif avec son bonnet de Père Noël (photo détourée) à gauche et à droite.
// swap = version inversée (miroir) pour le côté droit.
export default function Sapin({ className = '', swap = false }) {
  return (
    <img src="/decor/sapin-bonnet.webp" alt="" aria-hidden="true" width="324" height="455" loading="lazy" draggable={false}
      className={`h-auto select-none ${swap ? '-scale-x-100' : ''} ${className}`} />
  );
}
