// backend/scripts/migrate-chatbot-tables.js
//
// Crée la table chatbot_messages (historique du chatbot IA) sur TOUTES les
// bases tenant existantes. Sans script (nouvelles entreprises), la table est
// déjà incluse dans INITIAL_SCHEMA ; pour les entreprises déjà créées avant
// l'ajout du module IA, ce script (ou le premier appel au chatbot, qui la
// crée aussi paresseusement) s'en charge.
//
// Usage :
//   node backend/scripts/migrate-chatbot-tables.js

require('dotenv').config();
const { migrerToutesLesBasesExistantes } = require('../services/database.service');

migrerToutesLesBasesExistantes()
    .then(() => {
        console.log('[Chatbot IA] Migration terminée sur toutes les bases tenant.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('[Chatbot IA] Échec de la migration :', err);
        process.exit(1);
    });
