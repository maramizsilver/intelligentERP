const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', require('./routes/authRoutes'));
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
app.use('/api/entrepots', require('./routes/entrepotRoutes'));
app.use('/api/inventaires', require('./routes/inventaireRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/archives', require('./routes/archivageRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));

app.use('/api/calculateur', require('./routes/calculateurRoutes'));
app.use('/api/admin/taux-reference', require('./routes/tauxReferenceAdminRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.get('/', (req, res) => {
    res.json({ message: 'Serveur ERP fonctionne !' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});