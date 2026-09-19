import { Router } from 'express';
import * as ctrl from './stock-commercial.controller';

const router = Router();

// Stock en temps réel
router.get('/', ctrl.getStockCommercial);
router.get('/stock-dynamique/:commercialId', ctrl.getStockDynamiqueCommercial);

// Bons de sortie
router.post('/bons-sortie', ctrl.createBonSortie);
router.get('/bons-sortie', ctrl.listBonsSortie);
router.get('/bons-sortie/:id', ctrl.getBonSortie);
router.patch('/bons-sortie/:id', ctrl.updateBonSortie);
router.get('/bons-sortie/:id/pdf', ctrl.downloadBonSortiePdf);
router.post('/bons-sortie/:id/envoyer-email', ctrl.sendBonSortieEmail);
router.patch('/bons-sortie/:id/valider', ctrl.validerBonSortie);

// Inventaires
router.get('/inventaires', ctrl.listInventaires);
router.get('/bons-sortie/:id/inventaire', ctrl.getInventaire);
router.post('/bons-sortie/:id/inventaire', ctrl.createInventaire);
router.patch('/inventaires/lignes/:ligneId', ctrl.updateLigneInventaire);
router.post('/inventaires/:id/valider', ctrl.validerInventaire);

export default router;
