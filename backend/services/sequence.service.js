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

    static async _genererNumero(db, champ, prefix, entrepriseId) {
        try {
            // Initialiser la séquence si elle n'existe pas
            const [rows] = await db.promise().query(
                'SELECT id FROM sequences WHERE entreprise_id = ? LIMIT 1',
                [entrepriseId]
            );
            
            if (rows.length === 0) {
                await db.promise().query(
                    `INSERT INTO sequences 
                     (entreprise_id, dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction) 
                     VALUES (?, 0, 0, 0)`,
                    [entrepriseId]
                );
            }

            // Incrémenter le compteur
            await db.promise().query(
                `UPDATE sequences SET ${champ} = ${champ} + 1 WHERE entreprise_id = ?`,
                [entrepriseId]
            );

            // Récupérer la nouvelle valeur
            const [result] = await db.promise().query(
                `SELECT ${champ} FROM sequences WHERE entreprise_id = ?`,
                [entrepriseId]
            );
            
            let numero = result[0]?.[champ] || 1;

            // Vérifier les doublons et sauter si nécessaire
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

                // Vérifier si ce numéro existe déjà
                const [check] = await db.promise().query(
                    'SELECT id FROM paiements WHERE numero_transaction = ?',
                    [transactionNumber]
                );

                if (check.length === 0) {
                    exists = false;
                } else {
                    // Incrémenter et réessayer
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
}

module.exports = SequenceService;