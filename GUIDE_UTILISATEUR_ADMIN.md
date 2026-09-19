# 📘 Guide d'Utilisation de l'Administration — RZMedical

Ce guide détaille l'ensemble des fonctionnalités et des flux de travail (workflows) du panneau d'administration de **RZMedical** pour assurer une gestion optimale, fluide et 100 % conforme de votre activité.

---

## 📑 Sommaire
1. [Accès et Connexion Sécurisée](#1-accès-et-connexion-sécurisée)
2. [Étape Prioritaire : Configuration de la Société & Fiscalité](#2-étape-prioritaire--configuration-de-la-société--fiscalité)
3. [Gestion du Catalogue & des Produits](#3-gestion-du-catalogue--des-produits)
4. [Cycle des Ventes : Du Devis à la Facture](#4-cycle-des-ventes--du-devis-à-la-facture)
   - [A. Devis Clients](#a-devis-clients)
   - [B. Commandes](#b-commandes)
   - [C. Bons de Livraison (BL)](#c-bons-de-livraison-bl)
   - [D. Facturation Client & Téléchargement PDF](#d-facturation-client--téléchargement-pdf)
   - [E. Annulation de Facture & Avoirs](#e-annulation-de-facture--avoirs)
5. [Suivi des Impayés & Exercices Fiscaux](#5-suivi-des-impayés--exercices-fiscaux)
6. [Cycle des Achats & Fournisseurs](#6-cycle-des-achats--fournisseurs)
7. [Gestion des Charges & Déclarations](#7-gestion-des-charges--déclarations)
8. [Gestion des Clients & Administrateurs](#8-gestion-des-clients--administrateurs)
9. [Support & Relation Client](#9-support--relation-client)
10. [Règles d'Or & Bonnes Pratiques](#10-règles-dor--bonnes-pratiques)

---

## 1. Accès et Connexion Sécurisée

- **URL d'accès** : `https://admin.rzmedical.tn` (ou `http://localhost:3001` en local).
- **Authentification** : 
  1. Saisissez votre adresse email administrateur et votre mot de passe.
  2. Un code de sécurité OTP temporaire peut être envoyé par email si l'authentification à double facteur est active.
- **Déconnexion** : Accessible depuis le menu du profil en haut à droite.

---

## 2. Étape Prioritaire : Configuration de la Société & Fiscalité

> ⚠️ **ESSENTIEL :** RZMedical est désormais **100 % dynamique**. Toutes les informations saisies dans cette section alimentent **automatiquement** les en-têtes et pieds de page de tous les documents officiels (Factures, Devis, BL, Bons de Commande).

Rendez-vous dans : **Configuration > Société & Fiscalité** (`/configuration`)

### Champs à renseigner :
1. **Logo officiel** :
   - Cliquez sur **"Changer de logo"** pour uploader votre logo (format recommandé : PNG transparent haute résolution).
   - Le logo sera immédiatement utilisé sur les factures et les bons de livraison.
2. **Coordonnées de l'Entreprise** :
   - **Nom de la société** : ex. `RZMedical` ou `R and Z Medical`.
   - **Matricule Fiscale (M.F)** : ex. `1742623LAM000`.
   - **Téléphone** & **Fax**.
   - **Email de contact** : adresse officielle figurant sur vos documents.
   - **Adresse complète** : rue, bâtiment, étage, ville, code postal.
   - **Site Web** : ex. `https://rzmedical.tn`.
3. **Coordonnées Bancaires** :
   - **Nom de la Banque** : ex. `UIB BANK`, `BIAT`, `BNA`...
   - **RIB / N° de Compte** : votre identifiant bancaire à 20 chiffres.
4. **Paramètres Fiscaux & Facturation** :
   - **Taux de TVA autorisés** : liste des pourcentages légaux applicables (ex. `0%`, `7%`, `13%`, `19%`). Vous pouvez ajouter ou supprimer des taux selon l'évolution de la loi de finances.
   - **Valeurs du Timbre Fiscal** : montants légaux en dinars (ex. `1.000 TND`).
   - **Frais de livraison standard** : montant appliqué par défaut aux commandes en ligne.

> 💾 N'oubliez pas de cliquer sur **"Enregistrer la configuration"**. La mise à jour est instantanée dans toute l'application sans redémarrage.

---

## 3. Gestion du Catalogue & des Produits

Accessible depuis le menu **Catalogue** :
- **Catégories** & **Sous-Catégories** : Organisez vos familles de produits (ex. Diagnostic, Matériel médical, Consommables).
- **Marques** : Associez les marques de vos fabricants (Omron, Beurer, etc.).
- **Produits** (`/products`) :
  - **Création / Édition** :
    - Référence unique (ex. `RZM-OMR-M3C`).
    - Désignation claire.
    - Prix d'achat & Prix de vente HT.
    - Taux de TVA applicable (sélection parmi vos taux configurés).
    - Remise éventuelle.
    - Quantité en stock & Seuil d'alerte stock faible.
    - Photos du produit, fiche technique (PDF) et notice.
- **Mouvements de stock** (`/mouvements-stock`) : Historique automatique de chaque entrée (réception fournisseur) et sortie (livraison client).

---

## 4. Cycle des Ventes : Du Devis à la Facture

Le flux standard recommandé suit cette séquence logique :

```
[ Devis Client ] ──> [ Commande ] ──> [ Bon de Livraison (BL) ] ──> [ Facture Finale ]
```

---

### A. Devis Clients (`/devis`)
1. Cliquez sur **"Nouveau Devis"**.
2. Sélectionnez le client (ou créez-en un rapidement).
3. Ajoutez les lignes de produits ou de prestations de services.
4. Les prix HT, la TVA dynamique, les remises et le timbre fiscal sont calculés en direct.
5. Cliquez sur **"Créer le devis"**.
6. **Actions possibles sur un devis** :
   - 📄 **Télécharger PDF** : document imprimable avec logo et coordonnées officielles.
   - 🔄 **Convertir en Commande** ou **Convertir en Facture** en un seul clic une fois le devis accepté par le client.

---

### B. Commandes (`/orders`)
- Regroupe toutes les commandes passées depuis le site e-commerce et celles saisies manuellement.
- **Statuts d'une commande** :
  - `EN_ATTENTE` ➔ Commande reçue, en attente de traitement.
  - `CONFIRMEE` ➔ Stock réservé, commande prête pour expédition.
  - `LIVREE` ➔ Marchandise remise au client.
  - `ANNULEE` ➔ Commande annulée (le stock est automatiquement restitué).
- **Génération directe** : Vous pouvez générer un **Bon de Livraison** ou directement une **Facture** depuis la fiche commande.

---

### C. Bons de Livraison (BL) (`/bons-livraison`)
Le Bon de Livraison atteste de la remise physique de la marchandise.
1. Cliquez sur **"Nouveau BL"** ou générez-le depuis une commande.
2. Indiquez le client, l'adresse de livraison et les articles livrés.
3. Imprimez le PDF officiel qui contient une zone pour le **cachet et la signature du client**.
4. **Groupement Multi-BL** : Vous pouvez livrer plusieurs fois un client (BL 1, BL 2, BL 3) puis générer **une seule facture globale** regroupant tous ces BL !

---

### D. Facturation Client & Téléchargement PDF (`/invoices`)
La facture est le document légal et comptable définitif.

#### Création d'une facture :
- **Depuis un ou plusieurs BL** : Les lignes et quantités livrées sont pré-remplies automatiquement.
- **Depuis une commande** : Conversion automatique.
- **Manuelle** : Bouton **"Créer une facture"** pour saisir librement les articles.

#### Téléchargement & Impression du PDF :
- Cliquez sur l'icône de téléchargement PDF sur la ligne de la facture.
- Le PDF généré contient :
  - Le logo dynamique de votre boutique.
  - Vos mentions légales (Nom, MF, Adresse, Téléphone, Fax, Email).
  - Vos coordonnées bancaires (Banque & RIB) pour le virement client.
  - Le montant en lettres en français (ex. *« Arrêtée la présente facture à la somme de... »*).
  - Le timbre fiscal et le détail par taux de TVA.

#### Gestion du règlement :
- Marquez la facture comme `PAYEE`, `PARTIELLEMENT_PAYEE` ou `NON_PAYEE`.
- Enregistrez les montants perçus pour alimenter le suivi des impayés.

---

### E. Annulation de Facture & Avoirs (`/avoirs`)
> ⚖️ **Règle comptable :** Une facture validée et émise ne doit jamais être supprimée.
- Si une facture doit être corrigée ou annulée :
  1. Cliquez sur **"Annuler la facture"**.
  2. Le système génère automatiquement un **Avoir commercial numéroté** qui vient contrebalancer la facture.
  3. L'avoir est consultable et téléchargeable au format PDF dans **Ventes > Avoirs Clients**.

---

## 5. Suivi des Impayés & Exercices Fiscaux

### Page Impayés (`/impayes`)
- Vue synthétique de tous les clients ayant un solde débiteur.
- Classement par retard de paiement (30 jours, 60 jours, 90 jours+).
- Export CSV pour vos relances téléphoniques ou comptables.

### Exercices Fiscaux (`/exercices`)
- Permet de définir l'année fiscale courante (ex. `2026`).
- Toutes les numérotations de factures, de devis et les statistiques financières se calquent sur l'exercice sélectionné dans la barre supérieure.

---

## 6. Cycle des Achats & Fournisseurs

Accessible depuis le menu **Achats** :
1. **Fournisseurs** (`/fournisseurs`) : Répertoire de vos fabricants et distributeurs (coordonnées, matricule fiscale).
2. **Bons de Commande Fournisseur** (`/bons-commande`) :
   - Émettez vos ordres d'achat avec prix d'achat convenus.
   - Téléchargez le PDF du bon de commande pour l'envoyer par email à votre fournisseur.
3. **Bons de Réception** (`/bons-reception`) :
   - À l'arrivée des colis, validez la réception des quantités réelles.
   - **Impact immédiat** : Le stock des produits reçus est automatiquement augmenté dans l'entrepôt.
4. **Factures Fournisseurs** (`/factures-fournisseurs`) :
   - Enregistrez les factures d'achat pour le calcul de votre marge réelle et de vos obligations fiscales.

---

## 7. Gestion des Charges & Déclarations

Accessible depuis le menu **Charges** :
- **Charges courantes** (`/charges`) : Loyers, électricité, fournitures, frais de transport, etc.
- **CNSS** (`/charges/cnss`) : Enregistrement et suivi des cotisations sociales trimestrielles.
- **Déclarations fiscales / 9ba4a** (`/charges/9ba4a`) : Suivi des déclarations mensuelles d'impôt et de TVA.

---

## 8. Gestion des Clients & Administrateurs

Accessible depuis le menu **Utilisateurs** :
- **Administrateurs** (`/admins`) : Gestion des comptes ayant accès au back-office (création, modification des droits, désactivation).
- **Comptes Clients** (`/customers`) :
  - Fiche détaillée de chaque client.
  - Saisie de la Matricule Fiscale pour les clients professionnels B2B.
  - **Taux de Remise personnalisé** : vous pouvez accorder une remise permanente (ex. 5 % ou 10 %) à un client partenaire ; cette remise s'appliquera automatiquement lors de ses commandes et factures.

---

## 9. Support & Relation Client

Accessible depuis **Support** (`/support`) :
- Liste des tickets ouverts par les clients depuis leur espace boutique.
- Interface de messagerie instantanée pour répondre au client.
- Suivi du statut : `NOUVEAU`, `EN_COURS`, `REPONDU`, `FERME`.

---

## 10. Règles d'Or & Bonnes Pratiques

| Règle | Raison / Bon comportement |
| :--- | :--- |
| **Toujours remplir la page "Société & Fiscalité" dès l'installation** | Garantit que tous vos devis, BL et factures sortent avec votre logo, RIB, MF et adresse exacts. |
| **Ne pas supprimer une facture émise** | Utilisez la fonction d'annulation officielle pour générer un Avoir légal. |
| **Passer par un Bon de Réception pour entrer du stock** | Assure la traçabilité des coûts d'achat et des stocks sans incohérence manuelle. |
| **Vérifier l'Exercice Fiscal actif** | Assurez-vous que l'exercice sélectionné dans l'en-tête correspond à l'année comptable en cours. |
| **Sauvegardes de sécurité régulières** | Effectuez un export régulier de votre base PostgreSQL (`pg_dump`) sur un support externe. |

---

*Guide officiel conçu pour l'administration de RZMedical. Version 2.0 (Dynamique).*
