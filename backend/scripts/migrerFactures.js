// backend/scripts/migrerFactures.js
// Script one-shot pour migrer les bases existantes

const { migrerToutesLesBasesExistantes } = require('../services/database.service');

async function main() {
  console.log('=== MIGRATION DES BASES DE DONNEES EXISTANTES ===');
  console.log('Ajout des tables factures, colonnes devis_id, entreprise_id...');
  
  try {
    await migrerToutesLesBasesExistantes();
    console.log(' Migration terminee avec succes');
  } catch (err) {
    console.error(' Erreur lors de la migration:', err.message);
    process.exit(1);
  }
}

main();