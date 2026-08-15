const service = require("./categories.service");

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Catégorie non trouvée" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: "Le champ 'nom' est requis" });
    const data = await service.create({ nom });
    res.status(201).json(data);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Ce nom de catégorie existe déjà" });
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: "Le champ 'nom' est requis" });
    const data = await service.update(req.params.id, { nom });
    res.json(data);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Catégorie non trouvée" });
    if (err.code === "P2002") return res.status(409).json({ error: "Ce nom de catégorie existe déjà" });
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Catégorie non trouvée" });
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
