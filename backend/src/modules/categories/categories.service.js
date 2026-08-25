const prisma = require("../../config/prisma");

// Admin : toutes les catégories
const getAll = async () => {
  return prisma.categorie.findMany({
    include: { _count: { select: { sousCategories: true } } },
    orderBy: { creeLe: "desc" },
  });
};

// Client : uniquement les catégories visibles
const getAllVisible = async () => {
  return prisma.categorie.findMany({
    where: { visible: true },
    include: { _count: { select: { sousCategories: true } } },
    orderBy: { nom: "asc" },
  });
};

const getById = async (id) => {
  return prisma.categorie.findUnique({ where: { id: Number(id) } });
};

const create = async ({ nom }) => {
  return prisma.categorie.create({ data: { nom } });
};

const update = async (id, { nom, visible }) => {
  return prisma.categorie.update({
    where: { id: Number(id) },
    data: {
      nom,
      ...(visible !== undefined && { visible: Boolean(visible) }),
    },
  });
};

const remove = async (id) => {
  return prisma.categorie.delete({ where: { id: Number(id) } });
};

const toggleVisible = async (id) => {
  const cat = await prisma.categorie.findUnique({ where: { id: Number(id) } });
  if (!cat) throw new Error("Catégorie non trouvée");
  return prisma.categorie.update({
    where: { id: Number(id) },
    data: { visible: !cat.visible },
  });
};

module.exports = { getAll, getAllVisible, getById, create, update, remove, toggleVisible };

