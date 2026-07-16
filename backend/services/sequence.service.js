
/**
 * Service centralisé pour la gestion des séquences (numéros incrémentaux)
 * Utilise la table sequences dans la base tenant
 */
class SequenceService {
    /**
     * Génère le prochain numéro de bon de commande
     * @param {object} db - Pool MySQL tenant (req.db)
     * @param {number} entrepriseId - ID de l'entreprise (pour le cache)
     * @returns {Promise<string>} - Numéro formaté: BC-YYYYMM-XXXX
     */
    static async genererNumeroBC(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_bc', 'BC');
    }

    /**
     * Génère le prochain numéro de devis
     * @param {object} db - Pool MySQL tenant (req.db)
     * @param {number} entrepriseId - ID de l'entreprise (pour le cache)
     * @returns {Promise<string>} - Numéro formaté: DEV-YYYYMM-XXXX
     */
    static async genererNumeroDevis(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_devis', 'DEV');
    }

    /**
     * Génère le prochain numéro de transaction
     * @param {object} db - Pool MySQL tenant (req.db)
     * @param {number} entrepriseId - ID de l'entreprise (pour le cache)
     * @returns {Promise<string>} - Numéro formaté: TR-YYYYMM-XXXXX
     */
    static async genererNumeroTransaction(db, entrepriseId) {
        return this._genererNumero(db, 'dernier_numero_transaction', 'TR');
    }

    /**
     * Méthode interne pour générer un numéro incrémental
     * @param {object} db - Pool MySQL tenant
     * @param {string} champ - Nom du champ dans la table sequences
     * @param {string} prefix - Préfixe du numéro (BC, DEV, TR)
     * @returns {Promise<string>}
     */
    static async _genererNumero(db, champ, prefix) {
        return new Promise((resolve, reject) => {
            db.getConnection((errConn, connection) => {
                if (errConn) return reject(errConn);

                connection.beginTransaction((errTx) => {
                    if (errTx) {
                        connection.release();
                        return reject(errTx);
                    }

                    // Vérifier si la table sequences a une ligne
                    connection.query(
                        'SELECT id FROM sequences LIMIT 1',
                        (errCheck, rows) => {
                            if (errCheck) {
                                return connection.rollback(() => {
                                    connection.release();
                                    reject(errCheck);
                                });
                            }

                            // Si pas de ligne, en créer une
                            if (rows.length === 0) {
                                connection.query(
                                    'INSERT INTO sequences (dernier_numero_bc, dernier_numero_devis, dernier_numero_transaction) VALUES (0, 0, 0)',
                                    (errInsert) => {
                                        if (errInsert) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                reject(errInsert);
                                            });
                                        }
                                        this._incrementAndFormat(connection, champ, prefix, resolve, reject);
                                    }
                                );
                            } else {
                                this._incrementAndFormat(connection, champ, prefix, resolve, reject);
                            }
                        }
                    );
                });
            });
        });
    }

    /**
     * Incrémente le compteur et formate le numéro
     */
    static _incrementAndFormat(connection, champ, prefix, resolve, reject) {
        // Verrouiller la ligne et incrémenter
        const sql = `
            UPDATE sequences 
            SET ${champ} = ${champ} + 1 
            WHERE id = 1
        `;

        connection.query(sql, (errUpd) => {
            if (errUpd) {
                return connection.rollback(() => {
                    connection.release();
                    reject(errUpd);
                });
            }

            // Récupérer la nouvelle valeur
            connection.query(
                `SELECT ${champ} FROM sequences WHERE id = 1`,
                (errSel, rows) => {
                    if (errSel) {
                        return connection.rollback(() => {
                            connection.release();
                            reject(errSel);
                        });
                    }

                    const numero = rows[0]?.[champ] || 1;

                    connection.commit((errCommit) => {
                        connection.release();
                        if (errCommit) return reject(errCommit);

                        // Formater le numéro
                        const annee = new Date().getFullYear();
                        const mois = String(new Date().getMonth() + 1).padStart(2, '0');

                        let longueur = 4;
                        if (prefix === 'TR') longueur = 5;

                        const numeroFormate = String(numero).padStart(longueur, '0');
                        resolve(`${prefix}-${annee}${mois}-${numeroFormate}`);
                    });
                }
            );
        });
    }
}

module.exports = SequenceService;