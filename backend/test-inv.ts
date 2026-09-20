import { getInventaireByBonSortie } from './src/modules/stock-commercial/stock-commercial.service';
getInventaireByBonSortie(5).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);
