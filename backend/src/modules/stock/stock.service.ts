import { StockMovementType } from '../../../generated/prisma/enums';
import prisma from '../../config/prisma';

type StockTransaction = {
  produit: {
    findUnique(args: { where: { id: number }; select: Record<string, boolean> }): Promise<any>;
    update(args: { where: { id: number }; data: Record<string, unknown> }): Promise<any>;
  };
  stockMovement: {
    findUnique(args: { where: { operationKey: string } }): Promise<any>;
    findMany(args: { where: Record<string, unknown>; orderBy: Record<string, string> }): Promise<any[]>;
    update(args: { where: { id: number }; data: Record<string, unknown> }): Promise<any>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
  purchasePriceHistory?: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
};

export async function recordStockMovement(
  tx: StockTransaction,
  input: {
    productId: number;
    quantity: number;
    type: StockMovementType;
    reference?: string;
    sourceType?: string;
    sourceId?: number;
    userId?: number;
    stockDelta?: number;
    unitPrice?: number;
    depot?: string;
    documentType?: string;
    nature?: string;
    operationKey?: string;
    sourceLineId?: number;
    skipStockUpdate?: boolean;
  },
) {
  const quantity = Math.trunc(Number(input.quantity));
  if (!Number.isFinite(quantity) || quantity <= 0) return;

  const stockDelta = input.stockDelta !== undefined
    ? Math.trunc(Number(input.stockDelta))
    : input.type === StockMovementType.PURCHASE ? quantity : -quantity;
  if (!Number.isFinite(stockDelta)) return;
  const operationKey = input.operationKey
    ?? `${input.sourceType ?? input.type}:${input.sourceId ?? 'manual'}:${input.productId}:${input.sourceLineId ?? 0}`;
  if (await tx.stockMovement.findUnique({ where: { operationKey } })) return;
  const product = await tx.produit.findUnique({
    where: { id: input.productId },
    select: { stock: true, cump: true, prixAchat: true },
  });
  if (!product) throw new Error(`Produit ${input.productId} introuvable`);
  const previousStock = Number(product.stock);
  const unitPrice = input.unitPrice !== undefined
    ? Number(input.unitPrice)
    : Number(product.prixAchat ?? 0);
  const previousCump = Number(product.cump ?? product.prixAchat ?? 0);
  const nextStock = previousStock + stockDelta;
  const nextCump = input.type === StockMovementType.PURCHASE
    ? previousStock <= 0
      ? unitPrice
      : ((previousStock * previousCump) + (quantity * unitPrice)) / (previousStock + quantity)
    : previousCump;
  const valuation = nextStock > 0 ? nextStock * nextCump : null;
  const quantityCosted = input.type === StockMovementType.SALE
    ? Math.min(quantity, Math.max(previousStock, 0))
    : input.type === StockMovementType.PURCHASE ? quantity : 0;
  const quantityPending = input.type === StockMovementType.SALE ? quantity - quantityCosted : 0;
  const movementQuantity = input.type === StockMovementType.ADJUSTMENT || input.type === StockMovementType.INVENTORY
    ? stockDelta
    : quantity;
  const counters = input.type === StockMovementType.PURCHASE
    ? { qteAchat: { increment: quantity } }
    : input.type === StockMovementType.SALE
      ? { qteVente: { increment: quantity } }
      : {};

  await tx.produit.update({
    where: { id: input.productId },
    data: {
      ...(input.skipStockUpdate ? {} : { stock: { increment: stockDelta } }),
      ...(input.type === StockMovementType.PURCHASE ? { cump: nextCump, prixAchat: unitPrice } : {}),
      ...counters,
    },
  });

  await tx.stockMovement.create({
    data: {
      type: input.type,
      quantity: movementQuantity,
      stockDelta,
      quantityCosted,
      quantityPending,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
      unitCost: quantityCosted > 0 ? previousCump : null,
      totalCost: quantityCosted > 0 ? quantityCosted * previousCump : null,
      totalValue: Number.isFinite(unitPrice) ? Math.abs(stockDelta) * unitPrice : null,
      cump: Number.isFinite(nextCump) ? nextCump : null,
      stockAfter: nextStock,
      valuation,
      depot: input.depot ?? 'DEPOT PRINCIPAL',
      documentType: input.documentType ?? input.sourceType,
      nature: input.nature ?? (input.type === StockMovementType.PURCHASE ? 'ENTREE' : input.type === StockMovementType.SALE ? 'SORTIE' : 'AJUSTEMENT'),
      productId: input.productId,
      reference: input.reference,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      userId: input.userId,
      operationKey,
    },
  });

  if (input.type === StockMovementType.PURCHASE && tx.purchasePriceHistory) {
    await tx.purchasePriceHistory.create({
      data: {
        productId: input.productId,
        quantity,
        unitPriceHT: unitPrice,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    });

    let remaining = quantity;
    const pendingSales = await tx.stockMovement.findMany({
      where: { productId: input.productId, type: StockMovementType.SALE, quantityPending: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });
    for (const sale of pendingSales) {
      if (remaining <= 0) break;
      const allocated = Math.min(remaining, sale.quantityPending);
      await tx.stockMovement.update({
        where: { id: sale.id },
        data: {
          quantityCosted: { increment: allocated },
          quantityPending: { decrement: allocated },
          totalCost: { increment: allocated * unitPrice },
        },
      });
      remaining -= allocated;
    }
  }
}

export async function listStockMovements(params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: StockMovementType;
  dateFrom?: string;
  dateTo?: string;
  productId?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 25));
  const where: any = {};
  if (params.type) where.type = params.type;
  if (params.productId) where.productId = params.productId;
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {
      ...(params.dateFrom ? { gte: new Date(`${params.dateFrom}T00:00:00.000Z`) } : {}),
      ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
    };
  }
  if (params.search?.trim()) {
    const search = params.search.trim();
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { documentType: { contains: search, mode: 'insensitive' } },
      { product: { nom: { contains: search, mode: 'insensitive' } } },
      { product: { reference: { contains: search, mode: 'insensitive' } } },
      { product: { sousCategorie: { nom: { contains: search, mode: 'insensitive' } } } },
    ];
  }
  const [total, items] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, nom: true, reference: true } } },
    }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function validateInventory(input: {
  productId: number;
  countedStock: number;
  reference?: string;
  userId?: number;
}) {
  const countedStock = Math.trunc(Number(input.countedStock));
  if (!Number.isFinite(countedStock) || countedStock < 0) {
    throw new Error('Le stock inventorié doit être un entier positif ou nul');
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.produit.findUnique({ where: { id: input.productId }, select: { stock: true } });
    if (!product) throw new Error('Produit introuvable');
    const stockDelta = countedStock - product.stock;
    if (stockDelta !== 0) {
      await recordStockMovement(tx, {
        productId: input.productId,
        quantity: Math.abs(stockDelta),
        stockDelta,
        type: StockMovementType.INVENTORY,
        reference: input.reference,
        sourceType: 'INVENTORY',
        sourceId: input.productId,
        operationKey: `INVENTORY:${input.reference ?? Date.now()}:${input.productId}`,
        userId: input.userId,
      });
    }
    return tx.produit.findUnique({ where: { id: input.productId } });
  });
}
