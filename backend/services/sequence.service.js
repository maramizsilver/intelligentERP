class SequenceService {
    static async genererNumeroBC(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_bc', 'BC');
    }

    static async genererNumeroDevis(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_devis', 'DEV');
    }

    static async genererNumeroTransaction(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_transaction', 'TR');
    }

    static async _genererNumero(db, champ, prefix) {
        try {
            // 1. Vérifier si la table a une ligne
            const [rows] = await db.promise().query('SELECT id FROM sequences LIMIT 1');
            
            if (rows.length === 0) {
                await db.promise().query(
                    'INSERT INTO sequences (dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction) VALUES (0, 0, 0)'
                );
            }

            // 2. Incrémenter le compteur (ATOMIQUE)
            await db.promise().query(`UPDATE sequences SET ${champ} = ${champ} + 1 WHERE id = 1`);

            // 3. Récupérer la nouvelle valeur
            const [result] = await db.promise().query(`SELECT ${champ} FROM sequences WHERE id = 1`);
            const numero = result[0]?.[champ] || 1;

            // 4. Formater le numéro
            const annee = new Date().getFullYear();
            const mois = String(new Date().getMonth() + 1).padStart(2, '0');
            const longueur = prefix === 'TR' ? 5 : 4;
            const numeroFormate = String(numero).padStart(longueur, '0');

            return `${prefix}-${annee}${mois}-${numeroFormate}`;
        } catch (err) {
            console.error('Erreur génération séquence:', err);
            throw err;
        }
    }
}

module.exports = SequenceService;