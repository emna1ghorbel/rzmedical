import { serializeOrder } from './src/modules/orders/orders.controller';
// wait, serializeOrder is not exported. Let me just copy it here.
const serializeOrder = (order: any) => ({
  ...order,
  total: Number(order.total),
  lignes: Array.isArray(order.lignes)
    ? order.lignes.map((l: any) => ({ ...l, prixUnitaire: Number(l.prixUnitaire) }))
    : order.lignes,
});
import { getAllOrders } from './src/modules/orders/orders.service';
getAllOrders()
  .then(orders => {
     const serialized = orders.map(serializeOrder);
     console.log('OK', serialized.length);
  })
  .catch(console.error)
  .finally(() => process.exit(0));
