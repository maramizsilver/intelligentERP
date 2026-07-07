const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/fournisseurs', require('./routes/fournisseurRoutes'));
app.use('/api/produits', require('./routes/produitRoutes'));
app.use('/api/commandes', require('./routes/commandeRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/entreprises', require('./routes/entrepriseRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/devis', require('./routes/devisRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/achats', require('./routes/achatRoutes'));
app.use('/api/mouvements-stock', require('./routes/mouvementStockRoutes'));

// ============================================================
// NOUVEAUX MODULES
// ============================================================
app.use('/api/entrepots', require('./routes/entrepotRoutes'));       // Module Stock - Gestion des entrepôts
app.use('/api/inventaires', require('./routes/inventaireRoutes'));   // Module Stock - Gestion des inventaires
app.use('/api/documents', require('./routes/documentRoutes'));       // Module Administratif - Gestion documentaire
app.use('/api/archives', require('./routes/archivageRoutes'));       // Module Administratif - Archivage numérique

app.get('/', (req, res) => {
  res.json({ message: 'Serveur ERP fonctionne !' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
