const env = require('./config/env');            // 1er require : charge .env et valide la config
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const authMiddleware = require('./middleware/authMiddleware');
const tenantMiddleware = require('./middleware/tenant.middleware');
const sessionMiddleware = require('./middleware/sessionMiddleware');
const auditMiddleware = require('./middleware/audit.middleware');
const { securityHeaders, xssProtection, noCache } = require('./middleware/security.middleware');
const { bloquerExternes } = require('./middleware/accessGuards.middleware');
const SessionService = require('./services/session.service');
const encryptionMiddleware = require('./middleware/encryption.middleware');
const backupScheduler = require('./scripts/backup-scheduler');
const rateLimiter = require('./middleware/rateLimit.middleware');
const paiementController = require('./controllers/paiementController');

const app = express();
const isProd = env.NODE_ENV === 'production';

app.set('trust proxy', env.TRUST_PROXY);          

// ---------- CORS : origines lues depuis l'environnement ----------
const origines = (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!isProd) origines.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');

app.use(cors({
  origin: (origin, cb) => (!origin || origines.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Enterprise-Id', 'Cookie', 'Accept-Language', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'X-Encrypted', 'X-Signed', 'X-Signature']
}));

// ---------- Webhook Stripe : corps BRUT, avant express.json ----------
app.post('/api/paiement/webhook', express.raw({ type: 'application/json' }), paiementController.webhookStripe);

app.use(cookieParser());
app.use(securityHeaders);
app.use(noCache);
app.use('/api', rateLimiter.globalLimiter);
app.use(express.json({ limit: '1mb' }));               // plus 50 Mo ; les uploads passent par multer
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(xssProtection);

app.use(encryptionMiddleware.encryptSensitiveData);
app.use(encryptionMiddleware.decryptSensitiveResponse);

// ---------- Routes publiques ----------
app.use('/api/csrf', require('./routes/csrfRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reset', require('./routes/resetRoutes'));

// ---------- SuperAdmin ----------
app.use('/api/superadmin', authMiddleware, require('./routes/superAdminRoutes'));
app.use('/api/entreprises', authMiddleware, require('./routes/entrepriseRoutes'));

// ---------- Routes protégées ----------
// Seules ces routes sont accessibles aux comptes externes (portail client)
const OUVERT_AUX_EXTERNES = ['/api/commandes', '/api/promotions'];

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
  { path: '/api/clients-tenant', route: './routes/clientTenantRoutes' },
  { path: '/api/chatbot', route: './routes/chatbotRoutes' },
  { path: '/api/documents-actions', route: './routes/documentActionsRoutes' },
  { path: '/api/documents-metier', route: './routes/documentsMetierRoutes' },
  { path: '/api/analytics', route: './routes/analyticsRoutes' },
  { path: '/api/gemini-chatbot', route: './routes/geminiChatbotRoutes' },
  { path: '/api/users', route: './routes/userRoutes' }
];

protectedRoutes.forEach(({ path, route }) => {
  const gardes = OUVERT_AUX_EXTERNES.includes(path) ? [] : [bloquerExternes];   // défense en profondeur
  app.use(path, authMiddleware, ...gardes, tenantMiddleware, sessionMiddleware, auditMiddleware, require(route));
});

app.use('/api/client', require('./routes/clientPortalRoutes'));
app.use('/api/notifications', authMiddleware, sessionMiddleware, require('./routes/notificationRoutes'));
app.use('/api/paiement', require('./routes/paiementRoutes'));

// ---------- Santé : aucune donnée interne ----------
app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('/', (req, res) => res.json({ message: 'Serveur ERP fonctionne !' }));

app.use(errorHandler);

// ---------- Démarrage ----------
const server = app.listen(env.PORT, () => {
  console.log(`Serveur démarré sur le port ${env.PORT} (${env.NODE_ENV})`);
  SessionService.cleanupExpiredSessions();
  setInterval(() => SessionService.cleanupExpiredSessions(), 30 * 60 * 1000);
  if (env.NODE_ENV !== 'test') {
    try { backupScheduler.startScheduler(); console.log('Planificateur de sauvegarde démarré'); }
    catch (err) { console.error('Erreur démarrage scheduler:', err.message); }
  }
});

// ---------- Arrêt propre (#38) ----------
const arreter = (signal) => {
  console.log(`[${signal}] arrêt en cours…`);
  server.close(async () => {
    try { await db.closeAllPools(); } catch (e) { console.error(e.message); }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 15000).unref();   // sécurité si une requête reste bloquée
};
['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => arreter(s)));

// Un processus dans un état inconnu doit redémarrer, pas continuer (pm2 / Docker le relancent)
process.on('uncaughtException', (err) => { console.error('Erreur non capturée:', err); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error('Promesse non gérée:', reason); process.exit(1); });

module.exports = app;