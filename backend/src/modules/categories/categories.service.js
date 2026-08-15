const prisma = require("../../config/prisma");

const getAll = async () => {
  return prisma.categorie.findMany({
    include: { _count: { select: { sousCategories: true } } },
    orderBy: { creeLe: "desc" },
  });
};

const getById = async (id) => {
  return prisma.categorie.findUnique({ where: { id: Number(id) } });
};

const create = async ({ nom }) => {
  return prisma.categorie.create({ data: { nom } });
};

const update = async (id, { nom }) => {
  return prisma.categorie.update({ where: { id: Number(id) }, data: { nom } });
};

const remove = async (id) => {
  return prisma.categorie.delete({ where: { id: Number(id) } });
};

module.exports = { getAll, getById, create, update, remove };
