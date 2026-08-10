// backend/services/sequence.service.js

class SequenceService {
    static async genererNumeroBC(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_bc', 'BC', entrepriseId);
    }

    static async genererNumeroDevis(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_devis', 'DEV', entrepriseId);
    }

    static async genererNumeroTransaction(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_transaction', 'TR', entrepriseId);
    }

    static async genererNumeroFacture(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_facture', 'FAC', entrepriseId);
    }

    static async _genererNumero(db, champ, prefix, entrepriseId) {
        try {
            const [rows] = await db.promise().query(
                'SELECT id FROM sequences WHERE entreprise_id = ? LIMIT 1',
                [entrepriseId]
            );
            
            if (rows.length === 0) {
                await db.promise().query(
                    `INSERT INTO sequences 
                     (entreprise_id, dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction, dernier_numero_facture) 
                     VALUES (?, 0, 0, 0, 0)`,
                    [entrepriseId]
                );
            }

            await db.promise().query(
                `UPDATE sequences SET ${champ} = ${champ} + 1 WHERE entreprise_id = ?`,
                [entrepriseId]
            );

            const [result] = await db.promise().query(
                `SELECT ${champ} FROM sequences WHERE entreprise_id = ?`,
                [entrepriseId]
            );
            
            let numero = result[0]?.[champ] || 1;

            let numeroFormate;
            let exists = true;
            let attempts = 0;
            const maxAttempts = 100;

            while (exists && attempts < maxAttempts) {
                const annee = new Date().getFullYear();
                const mois = String(new Date().getMonth() + 1).padStart(2, '0');
                const longueur = prefix === 'TR' ? 5 : 4;
                numeroFormate = String(numero).padStart(longueur, '0');
                const transactionNumber = `${prefix}-${annee}${mois}-${numeroFormate}`;

                const [check] = await db.promise().query(
                    'SELECT id FROM paiements WHERE numero_transaction = ?',
                    [transactionNumber]
                );

                if (check.length === 0) {
                    exists = false;
                } else {
                    numero++;
                    await db.promise().query(
                        `UPDATE sequences SET ${champ} = ${champ} + 1 WHERE entreprise_id = ?`,
                        [entrepriseId]
                    );
                    attempts++;
                }
            }

            const annee = new Date().getFullYear();
            const mois = String(new Date().getMonth() + 1).padStart(2, '0');
            const longueur = prefix === 'TR' ? 5 : 4;
            numeroFormate = String(numero).padStart(longueur, '0');

            return `${prefix}-${annee}${mois}-${numeroFormate}`;
        } catch (err) {
            console.error('Erreur generation sequence:', err);
            throw err;
        }
    }

    /**
     * Génère un numéro générique pour les documents métier
     * @param {Object} db - Connexion base de données
     * @param {number} entrepriseId - ID de l'entreprise
     * @param {string} prefixe - Préfixe du numéro (ex: BL, BP, BR...)
     * @returns {Promise<string>} Numéro formaté
     */
    static async genererNumeroGenerique(db, entrepriseId, prefixe) {
        return this._genererNumeroPrefixeLibre(db, 'dernier_numero_generique', prefixe, entrepriseId);
    }

    /**
     * Méthode générique pour générer des numéros avec préfixe
     * @param {Object} db - Connexion base de données
     * @param {string} champ - Nom du champ dans la table sequences
     * @param {string} prefix - Préfixe du numéro
     * @param {number} entrepriseId - ID de l'entreprise
     * @returns {Promise<string>} Numéro formaté
     */
    static async _genererNumeroPrefixeLibre(db, champ, prefix, entrepriseId) {
        try {
            const [rows] = await db.promise().query(
                'SELECT id FROM sequences WHERE entreprise_id = ? LIMIT 1',
                [entrepriseId]
            );
            
            if (rows.length === 0) {
                await db.promise().query(
                    `INSERT INTO sequences 
                     (entreprise_id, dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction, dernier_numero_facture, dernier_numero_generique) 
                     VALUES (?, 0, 0, 0, 0, 0)`,
                    [entrepriseId]
                );
            }

            await db.promise().query(
                `UPDATE sequences SET ${champ} = ${champ} + 1 WHERE entreprise_id = ?`,
                [entrepriseId]
            );

            const [result] = await db.promise().query(
                `SELECT ${champ} FROM sequences WHERE entreprise_id = ?`,
                [entrepriseId]
            );
            
            const numero = result[0]?.[champ] || 1;
            const annee = new Date().getFullYear();
            const mois = String(new Date().getMonth() + 1).padStart(2, '0');
            
            return `${prefix}-${annee}${mois}-${String(numero).padStart(5, '0')}`;
        } catch (err) {
            console.error('Erreur generation sequence generique:', err);
            throw err;
        }
    }
}

module.exports = SequenceService;