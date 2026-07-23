const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const authMiddleware = require('./middleware/authMiddleware');
const sessionMiddleware = require('./middleware/sessionMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/superadmin', authMiddleware, require('./routes/superAdminRoutes'));
app.use('/api/entreprises', authMiddleware, require('./routes/entrepriseRoutes'));

const protectedRoutes = [
    { path: '/api/clients', route: './routes/clientRoutes' },
    { path: '/api/fournisseurs', route: './routes/fournisseurRoutes' },
    { path: '/api/produits', route: './routes/produitRoutes' },
    { path: '/api/commandes', route: './routes/commandeRoutes' },
    { path: '/api/roles', route: './routes/roleRoutes' },
    { path: '/api/export', route: './routes/exportRoutes' },
    { path: '/api/devis', route: './routes/devisRoutes' },
    { path: '/api/promotions', route: './routes/promotionRoutes' },
    { path: '/api/achats', route: './routes/achatRoutes' },
    { path: '/api/mouvements-stock', route: './routes/mouvementStockRoutes' },
    { path: '/api/entrepots', route: './routes/entrepotRoutes' },
    { path: '/api/inventaires', route: './routes/inventaireRoutes' },
    { path: '/api/documents', route: './routes/documentRoutes' },
    { path: '/api/archives', route: './routes/archivageRoutes' },
    { path: '/api/finance', route: './routes/financeRoutes' },
    { path: '/api/calculateur', route: './routes/calculateurRoutes' },
    { path: '/api/admin/taux-reference', route: './routes/tauxReferenceAdminRoutes' },
    { path: '/api/audit', route: './routes/auditRoutes' }
];

protectedRoutes.forEach(({ path, route }) => {
    app.use(path, authMiddleware, sessionMiddleware, require(route));
});

app.use('/api/notifications', authMiddleware, sessionMiddleware, require('./routes/notificationRoutes'));

app.use('/api/paiement', require('./routes/paiementRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'Serveur ERP fonctionne !' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur demarre sur le port ${PORT}`);
});