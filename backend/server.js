const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const db = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const authMiddleware = require('./middleware/authMiddleware');
const sessionMiddleware = require('./middleware/sessionMiddleware');
const auditMiddleware = require('./middleware/audit.middleware');
const { securityHeaders, xssProtection, noCache } = require('./middleware/security.middleware');
const SessionService = require('./services/session.service');
const encryptionMiddleware = require('./middleware/encryption.middleware');
const backupScheduler = require('./scripts/backup-scheduler');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Enterprise-Id', 'Cookie']
}));

app.use(cookieParser());
app.use(securityHeaders);
app.use(xssProtection);
app.use(noCache);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(encryptionMiddleware.encryptSensitiveData);
app.use(encryptionMiddleware.decryptSensitiveResponse);

app.use('/api/csrf', require('./routes/csrfRoutes'));

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
    app.use(path, authMiddleware, sessionMiddleware, auditMiddleware, require(route));
});

app.use('/api/notifications', authMiddleware, sessionMiddleware, require('./routes/notificationRoutes'));

app.use('/api/paiement', require('./routes/paiementRoutes'));

app.use('/api/reset', require('./routes/resetRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'Serveur ERP fonctionne !' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Serveur demarre sur le port ' + PORT);
    SessionService.cleanupExpiredSessions();
    setInterval(() => {
        SessionService.cleanupExpiredSessions();
    }, 30 * 60 * 1000);
    
    if (process.env.NODE_ENV !== 'test') {
        try {
            backupScheduler.startScheduler();
            console.log('[SERVER] Planificateur de sauvegarde demarre');
        } catch (err) {
            console.error('[SERVER] Erreur demarrage scheduler:', err.message);
        }
    }
});