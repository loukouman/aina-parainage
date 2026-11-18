// Constantes sans secret : utilisables côté navigateur ET serveur.
export const PRICE = {
  unit: 7500,
  parts: [
    { key: 'jouet', label: 'Jouet / Cadeau', amount: 3500 },
    { key: 'resto', label: 'Restauration (plat chaud + boisson)', amount: 2500 },
    { key: 'tshirt', label: 'Tee-shirt', amount: 1500 },
  ],
};
export const METHODS = [
  { key: 'orange', label: 'Orange Money' },
  { key: 'moov', label: 'Moov Money' },
  { key: 'wave', label: 'Wave' },
];
export const MAX_CHILDREN = 1000;
export const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
export const total = (n) => n * PRICE.unit;
