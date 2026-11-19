// Constantes sans secret : utilisables côté navigateur ET serveur.
export const PRICE = {
  unit: 7500,
  parts: [
    { key: 'jouet', label: 'Jouet / Cadeau', amount: 3500 },
    { key: 'resto', label: 'Restauration (plat chaud + boisson)', amount: 2500 },
    { key: 'tshirt', label: 'Tee-shirt', amount: 1500 },
  ],
};

// Moyens de paiement par code USSD (paiement marchand). Le montant est ajouté automatiquement au code.
// Pour changer un numéro marchand ou un code, modifiez uniquement la ligne de l'opérateur concerné.
// color : couleur du bouton · text : couleur du texte sur cette couleur (lisibilité).
export const METHODS = [
  { key: 'orange', label: 'Orange Money', color: '#FF7900', text: '#111111', ussd: (amount) => `*144*2*1*76671494*${amount}#` },
  { key: 'moov', label: 'Moov Money', color: '#0B5FA5', text: '#FFFFFF', ussd: (amount) => `*555*2*1*70585635*${amount}#` },
];
export const MAX_CHILDREN = 1000;
export const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
export const total = (n) => n * PRICE.unit;
