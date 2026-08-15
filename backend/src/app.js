const express = require("express");
const cors = require("cors");
const categoriesRoutes = require("./modules/categories/categories.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/categories", categoriesRoutes);

// Route de test
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API MediSupply" });
});

module.exports = app;
