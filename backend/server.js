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
const rateLimiter = require('./middleware/rateLimit.middleware');

const app = express();

// CORS amélioré pour accepter les requêtes multi-origines
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'https://votre-domaine.com'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Enterprise-Id',
        'Cookie',
        'Accept-Language'
    ],
    exposedHeaders: [
        'Content-Disposition',
        'X-Encrypted',
        'X-Signed',
        'X-Signature'
    ]
}));

app.use(cookieParser());
app.use(securityHeaders);
app.use(xssProtection);
app.use(noCache);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de chiffrement/déchiffrement
app.use(encryptionMiddleware.encryptSensitiveData);
app.use(encryptionMiddleware.decryptSensitiveResponse);

// Routes publiques
app.use('/api/csrf', require('./routes/csrfRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reset', require('./routes/resetRoutes'));

// Routes SuperAdmin (protégées)
app.use('/api/superadmin', authMiddleware, require('./routes/superAdminRoutes'));
app.use('/api/entreprises', authMiddleware, require('./routes/entrepriseRoutes'));

// Routes protégées avec session et audit
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
    { path: '/api/audit', route: './routes/auditRoutes' },
    { path: '/api/documents-intelligents', route: './routes/documentIntelligenceRoutes' },
        { path: '/api/factures', route: './routes/factureRoutes' },
    { path: '/api/chatbot', route: './routes/chatbotRoutes' }

];

protectedRoutes.forEach(({ path, route }) => {
    app.use(path, authMiddleware, sessionMiddleware, auditMiddleware, require(route));
});

// Routes notifications et paiements
app.use('/api/notifications', authMiddleware, sessionMiddleware, require('./routes/notificationRoutes'));
app.use('/api/paiement', require('./routes/paiementRoutes'));

// Route de santé
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Serveur ERP fonctionne !',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            api: '/api/',
            health: '/health'
        }
    });
});

// Middleware d'erreur global
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
    
    // Nettoyage des sessions expirées
    SessionService.cleanupExpiredSessions();
    setInterval(() => {
        SessionService.cleanupExpiredSessions();
    }, 30 * 60 * 1000);
    
    // Démarrage du planificateur de sauvegarde
    if (process.env.NODE_ENV !== 'test') {
        try {
            backupScheduler.startScheduler();
            console.log('Planificateur de sauvegarde démarré');
        } catch (err) {
            console.error('Erreur démarrage scheduler:', err.message);
        }
    }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
    console.error('Erreur non capturée:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse non gérée:', reason);
});

module.exports = app;