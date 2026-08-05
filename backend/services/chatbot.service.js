// backend/services/chatbot.service.js
// ---------------------------------------------------------------------------
// Assistant client intelligent (chatbot conversationnel) — cœur du Module
// d'Intelligence Artificielle. Gère l'historique de conversation (par
// utilisateur, dans la base tenant courante) et l'échange avec l'API OpenAI,
// y compris la boucle de "function calling" vers les données de l'ERP.
// ---------------------------------------------------------------------------
const { openai, CHATBOT_MODEL } = require('../config/openai.config');
const { TOOL_DEFINITIONS, executerOutil } = require('./chatbotTools.service');

const MAX_HISTORIQUE = 20;   
const MAX_TOURS_OUTILS = 4;      

function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

let tableVerifiee = false;
/** Crée la table d'historique si elle n'existe pas encore (idempotent). */
async function assurerTable(db) {
    if (tableVerifiee) return;
    await query(
        db,
        `CREATE TABLE IF NOT EXISTS chatbot_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            role ENUM('user','assistant') NOT NULL,
            contenu MEDIUMTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_chatbot_messages_user (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    tableVerifiee = true;
}

function construirePromptSysteme(user) {
    return `Tu es l'assistant IA intégré à un logiciel ERP (gestion d'entreprise) utilisé en Tunisie.
Tu aides ${user.prenom || "l'utilisateur"} (${user.email || 'utilisateur'}) à trouver rapidement des informations
sur les produits, le stock, les clients, les commandes et les factures de son entreprise.

Règles impératives :
- Réponds toujours en français, de façon concise et professionnelle.
- Pour toute question portant sur des données réelles (stock, prix, client, commande, facture, chiffre d'affaires...),
  utilise SYSTÉMATIQUEMENT les outils fournis plutôt que de deviner ou d'inventer une réponse.
- Si un outil ne renvoie aucun résultat, dis-le clairement, ne fabrique jamais de données.
- Si un outil renvoie une erreur de permission ("Accès refusé"), explique poliment à l'utilisateur qu'il n'a pas
  les droits nécessaires sur ce module et n'essaie pas de contourner cette limite par un autre moyen.
- Si la question sort du cadre de l'ERP (gestion, ventes, achats, stock, finance), réponds brièvement
  puis recentre poliment la conversation sur ce que tu peux faire.
- Reste synthétique : privilégie des réponses courtes, avec des listes à puces si plusieurs éléments.`;
}

async function chargerHistorique(db, userId) {
    const rows = await query(
        db,
        `SELECT role, contenu FROM chatbot_messages
         WHERE user_id = ? ORDER BY id DESC LIMIT ?`,
        [userId, MAX_HISTORIQUE]
    );
    return rows.reverse().map((r) => ({ role: r.role, content: r.contenu }));
}

async function enregistrerMessage(db, userId, role, contenu) {
    await query(
        db,
        `INSERT INTO chatbot_messages (user_id, role, contenu) VALUES (?, ?, ?)`,
        [userId, role, contenu]
    );
}

/**
 * Envoie un message utilisateur au chatbot et renvoie la réponse texte de l'IA,
 * après avoir laissé le modèle appeler les outils ERP nécessaires.
 */
async function envoyerMessage(db, user, messageUtilisateur) {
    if (!process.env.OPENAI_API_KEY) {
        const err = new Error("Le chatbot IA n'est pas configuré (clé OPENAI_API_KEY manquante).");
        err.code = 'IA_NON_CONFIGUREE';
        throw err;
    }

    await assurerTable(db);

    const historique = await chargerHistorique(db, user.id);
    await enregistrerMessage(db, user.id, 'user', messageUtilisateur);

    const messages = [
        { role: 'system', content: construirePromptSysteme(user) },
        ...historique,
        { role: 'user', content: messageUtilisateur }
    ];

    let reponseTexte = '';

    for (let tour = 0; tour < MAX_TOURS_OUTILS; tour++) {
        const completion = await openai.chat.completions.create({
            model: CHATBOT_MODEL,
            messages,
            tools: TOOL_DEFINITIONS,
            tool_choice: 'auto',
            temperature: 0.3
        });

        const choix = completion.choices[0];
        const messageAssistant = choix.message;
        messages.push(messageAssistant);

        const appelsOutils = messageAssistant.tool_calls;
        if (!appelsOutils || appelsOutils.length === 0) {
            reponseTexte = messageAssistant.content || '';
            break;
        }

        // Le modèle veut interroger l'ERP : on exécute chaque outil demandé,
        // puis on renvoie les résultats pour qu'il formule sa réponse finale.
        for (const appel of appelsOutils) {
            const resultat = await executerOutil(appel.function.name, appel.function.arguments, db, user);
            messages.push({
                role: 'tool',
                tool_call_id: appel.id,
                content: JSON.stringify(resultat)
            });
        }

        if (tour === MAX_TOURS_OUTILS - 1) {
            reponseTexte = "Je n'ai pas réussi à obtenir toutes les données nécessaires pour répondre précisément. Peux-tu reformuler ta question ?";
        }
    }

    await enregistrerMessage(db, user.id, 'assistant', reponseTexte);
    return reponseTexte;
}

async function obtenirHistorique(db, userId) {
    await assurerTable(db);
    return query(
        db,
        `SELECT id, role, contenu, created_at FROM chatbot_messages
         WHERE user_id = ? ORDER BY id ASC LIMIT 100`,
        [userId]
    );
}

async function viderHistorique(db, userId) {
    await assurerTable(db);
    await query(db, `DELETE FROM chatbot_messages WHERE user_id = ?`, [userId]);
}

module.exports = { envoyerMessage, obtenirHistorique, viderHistorique };
