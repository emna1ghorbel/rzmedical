/** Data belongs to the browser mock only; it is never sent to production. */
export const productFixture = {
  id: 101,
  nom: 'Produit E2E stérile',
  reference: 'E2E-PROD-101',
  prix: 12.5,
  prixAchat: 8,
  tva: 19,
  remise: 0,
  stock: 100,
  disponible: true,
  disponibleALaVente: true,
  sousCategorieId: 11,
  marqueId: 21,
  sousCategorie: { id: 11, nom: 'Consommables', categorie: { id: 1, nom: 'Médical' } },
  marque: { id: 21, nom: 'RZ Test' },
};

export const productReferenceData = {
  products: [productFixture],
  subcategories: [productFixture.sousCategorie],
  brands: [productFixture.marque],
};
