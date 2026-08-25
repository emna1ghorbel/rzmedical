// Types miroir des réponses de l'API RZMedical.
//
// Conventions confirmées côté backend :
//  • prix & remise (Produit) arrivent en STRING (Prisma Decimal.toJSON()), ex. "1250.00".
//  • Les dates arrivent en STRING ISO.
//  • Les images sont des chemins racine "/uploads/<fichier>".
//  • remise (Utilisateur), total (Commande) & prixUnitaire (LigneCommande) sont
//    sérialisés en NUMBER par les endpoints boutique (client-auth / orders).

export type TypeUtilisateur = "ADMIN" | "CLIENT";

export type StatutCommande =
  | "EN_ATTENTE"
  | "PAYEE"
  | "EXPEDIEE"
  | "LIVREE"
  | "ANNULEE";

// --- Catalogue ---------------------------------------------------------------

export interface Categorie {
  id: number;
  nom: string;
  visible?: boolean;
  creeLe?: string;
  misAJourLe?: string;
}

// Élément renvoyé par GET /api/categories (avec compteur + sous-catégories légères)
export interface CategorieListItem extends Categorie {
  _count?: { sousCategories: number };
  sousCategories?: { id: number; nom: string }[];
}

export interface SousCategorie {
  id: number;
  nom: string;
  description: string | null;
  image: string | null;
  categorieId: number;
  categorie?: Categorie;
}

// Élément renvoyé par GET /api/subcategories (avec catégorie + compteur produits)
export interface SousCategorieListItem extends SousCategorie {
  categorie: Categorie;
  _count?: { produits: number };
}

export interface Marque {
  id: number;
  nom: string;
  logo: string | null;
  categorieId: number;
  categorie?: Categorie;
}

// Élément renvoyé par GET /api/brands (avec catégorie + compteur produits)
export interface MarqueListItem extends Marque {
  categorie: Categorie;
  _count?: { produits: number };
}

export interface Produit {
  id: number;
  nom: string;
  reference: string;
  description: string | null;
  expirationDate: string | null;
  prix: string; // Decimal en string
  stock: number;
  images: string[];
  video: string | null;
  motsCles: string[];
  ficheTechnique: string | null;
  remise: string; // Decimal en string, pourcentage 0-100
  disponible: boolean;
  sousCategorieId: number;
  marqueId: number;
  sousCategorie: SousCategorie & { categorie: Categorie };
  marque: Marque;
  creeLe: string;
  misAJourLe: string;
}

// --- Contenu du site (annonces + bannières) ---------------------------------

export interface AnnonceSite {
  id: number;
  texte: string;
  actif: boolean;
  ordre: number;
  dureeSecondes: number;
}

export interface BanniereSite {
  id: number;
  image: string;
  titre: string | null;
  description: string | null;
  lien: string | null;
  hauteur: number;
  actif: boolean;
  ordre: number;
  dateDebut: string | null;
  dateFin: string | null;
}

export interface VideoHero {
  id: number;
  videoUrl: string;
  posterUrl: string | null;
  titre: string | null;
  actif: boolean;
  creeLe: string;
}

export interface SiteContentPublic {
  annonces: AnnonceSite[];
  bannieres: BanniereSite[];
  videoHero: VideoHero | null;
}

// --- Utilisateur & commandes (endpoints boutique) ----------------------------

export interface Utilisateur {
  id: number;
  email: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  photo: string | null;
  adresse: string | null;
  dateNaissance: string | null;
  remise: number; // NUMBER, pourcentage 0-100
  matriculeFiscale: string | null;
  activite: string | null;
  typeUtilisateur: TypeUtilisateur;
  creeLe: string;
  dernierLogin: string | null;
}

export interface LigneCommande {
  id: number;
  commandeId: number;
  produitId: number;
  quantite: number;
  prixUnitaire: number; // NUMBER
  produit?: {
    id: number;
    nom: string;
    reference: string;
    images: string[];
  };
}

export interface Commande {
  id: number;
  utilisateurId: number;
  statut: StatutCommande;
  total: number; // NUMBER
  creeLe: string;
  misAJourLe: string;
  lignes: LigneCommande[];
  facture?: {
    id: number;
    numero: string;
    fichierPdf: string | null;
  } | null;
}

export interface AuthResponse {
  token: string;
  user: Utilisateur;
}

// --- Panier (côté client uniquement) ----------------------------------------

export interface CartItem {
  produitId: number;
  reference: string;
  nom: string;
  image: string | null;
  prix: number; // prix catalogue de base (avant toute remise)
  remise: number; // pourcentage de remise produit
  stock: number;
  disponible: boolean;
  quantite: number;
}
