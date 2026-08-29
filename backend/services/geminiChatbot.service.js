// backend/services/geminiChatbot.service.js
const { genAI, GEMINI_MODEL } = require('../config/gemini.config');
const { TOOL_DECLARATIONS, executerOutil } = require('./geminiChatbotTools.service');

const MAX_HISTORIQUE = 20;
const MAX_TOURS_OUTILS = 4;

function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });
}

let tableVerifiee = false;
async function assurerTable(db) {
    if (tableVerifiee) return;
    await query(db, `CREATE TABLE IF NOT EXISTS gemini_chatbot_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role ENUM('user','model') NOT NULL,
        contenu MEDIUMTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_gemini_chatbot_messages_user (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    tableVerifiee = true;
}

// ============================================================
// SYSTEM PROMPT — comportement de l'agent
// ============================================================
function construirePromptSysteme(user) {
    return `Tu es l'agent IA intégré à une plateforme ERP multi-tenant (gestion d'entreprise, utilisée en Tunisie).
Tu réponds à ${user.prenom || "l'utilisateur"} (rôle interne, entreprise #${user.entreprise_id}) sur TROIS sujets uniquement :
1. Le module STOCK (produits, quantités, seuils d'alerte, mouvements de stock).
2. La SÉCURITÉ et les PERMISSIONS (rôles, accès RBAC, MFA, verrouillage de compte).
3. Le FONCTIONNEMENT GÉNÉRAL de la plateforme (modules, multi-tenant, essai gratuit...).

RÈGLES IMPÉRATIVES :
- Réponds toujours en français, de façon concise, professionnelle et directe.
- Pour toute question portant sur des DONNÉES RÉELLES (stock, quantités, mouvements, permissions de l'utilisateur, rôles existants), tu DOIS appeler l'outil correspondant. Ne devine JAMAIS un chiffre, un nom de produit ou une permission — si l'outil ne renvoie rien, dis-le clairement.
- Pour les questions sur le FONCTIONNEMENT GÉNÉRAL (comment marche la plateforme, la sécurité en général, les rôles en général), utilise l'outil expliquer_fonctionnement_plateforme plutôt que d'inventer une explication.
- Si un outil renvoie une erreur de permission ("Accès refusé"), explique poliment à l'utilisateur qu'il n'a pas les droits nécessaires sur ce module et ne cherche jamais à contourner cette limite.
- Si la question sort du cadre Stock / Sécurité / Fonctionnement plateforme (ex: rédiger un contrat, calculer une remise commerciale), réponds brièvement que ce n'est pas ton périmètre et recentre la conversation.
- Reste synthétique : privilégie des listes à puces courtes pour les données chiffrées.
- Ne révèle jamais de détails techniques internes (noms de tables SQL, structure de la base) à l'utilisateur.`;
}

async function chargerHistorique(db, userId) {
    const rows = await query(db,
        `SELECT role, contenu FROM gemini_chatbot_messages
         WHERE user_id = ? ORDER BY id DESC LIMIT ?`, [userId, MAX_HISTORIQUE]);
    return rows.reverse().map(r => ({ role: r.role, parts: [{ text: r.contenu }] }));
}

async function enregistrerMessage(db, userId, role, contenu) {
    await query(db, `INSERT INTO gemini_chatbot_messages (user_id, role, contenu) VALUES (?, ?, ?)`, [userId, role, contenu]);
}

async function envoyerMessage(db, user, messageUtilisateur) {
    if (!process.env.GEMINI_API_KEY) {
        const err = new Error("L'agent IA Gemini n'est pas configuré (clé GEMINI_API_KEY manquante).");
        err.code = 'IA_NON_CONFIGUREE';
        throw err;
    }

    await assurerTable(db);

    const historique = await chargerHistorique(db, user.id);
    await enregistrerMessage(db, user.id, 'user', messageUtilisateur);

    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: construirePromptSysteme(user),
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }]
    });

    const chat = model.startChat({ history: historique });

    let result = await chat.sendMessage(messageUtilisateur);
    let reponseTexte = '';

    for (let tour = 0; tour < MAX_TOURS_OUTILS; tour++) {
        const appelsOutils = result.response.functionCalls();

        if (!appelsOutils || appelsOutils.length === 0) {
            reponseTexte = result.response.text();
            break;
        }

        const reponsesOutils = [];
        for (const appel of appelsOutils) {
            const donnee = await executerOutil(appel.name, appel.args, db, user);
            reponsesOutils.push({
                functionResponse: { name: appel.name, response: donnee }
            });
        }

        result = await chat.sendMessage(reponsesOutils);

        if (tour === MAX_TOURS_OUTILS - 1) {
            reponseTexte = "Je n'ai pas réussi à obtenir toutes les données nécessaires. Peux-tu reformuler ta question ?";
        }
    }

    await enregistrerMessage(db, user.id, 'model', reponseTexte);
    return reponseTexte;
}

async function obtenirHistorique(db, userId) {
    await assurerTable(db);
    return query(db, `SELECT id, role, contenu, created_at FROM gemini_chatbot_messages
                       WHERE user_id = ? ORDER BY id ASC LIMIT 100`, [userId]);
}

async function viderHistorique(db, userId) {
    await assurerTable(db);
    await query(db, `DELETE FROM gemini_chatbot_messages WHERE user_id = ?`, [userId]);
}

module.exports = { envoyerMessage, obtenirHistorique, viderHistorique };