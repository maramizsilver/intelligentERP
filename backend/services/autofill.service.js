// backend/services/autofill.service.js

const ENTITES = {
    client: {
        table: 'clients',
        colonnesRecherche: ['id', 'email', 'telephone', 'matricule_fiscal', 'numero_cin'],
        mappingTags: {
            id: 'client_id',
            nom: 'client_nom',
            prenom: 'client_prenom',
            email: 'client_email',
            telephone: 'client_telephone',
            adresse: 'client_adresse',
            ville: 'client_ville',
            code_postal: 'client_code_postal',
            pays: 'client_pays',
            matricule_fiscal: 'client_matricule_fiscal',
            numero_cin: 'client_cin',
            type_client: 'client_type',
            notes: 'client_notes'
        }
    },
    fournisseur: {
        table: 'fournisseurs',
        colonnesRecherche: ['id', 'email', 'telephone', 'matricule_fiscal'],
        mappingTags: {
            id: 'fournisseur_id',
            nom: 'fournisseur_nom',
            email: 'fournisseur_email',
            telephone: 'fournisseur_telephone',
            adresse: 'fournisseur_adresse',
            ville: 'fournisseur_ville',
            code_postal: 'fournisseur_code_postal',
            pays: 'fournisseur_pays',
            matricule_fiscal: 'fournisseur_matricule_fiscal',
            numero_tva: 'fournisseur_numero_tva',
            notes: 'fournisseur_notes'
        }
    },
    produit: {
        table: 'produits',
        colonnesRecherche: ['id', 'reference', 'code_barre', 'nom'],
        mappingTags: {
            id: 'produit_id',
            nom: 'produit_nom',
            description: 'produit_description',
            reference: 'produit_reference',
            code_barre: 'produit_code_barre',
            prix: 'produit_prix',
            prix_achat: 'produit_prix_achat',
            prix_vente: 'produit_prix_vente',
            prix_unitaire_ht: 'produit_prix_ht',
            tva: 'produit_tva',
            unite: 'produit_unite',
            categorie: 'produit_categorie',
            quantite_stock: 'produit_stock',
            seuil_alerte: 'produit_seuil_alerte'
        }
    },
    entreprise: {
        table: 'entreprises',
        colonnesRecherche: ['id', 'matricule_fiscal', 'email', 'telephone'],
        mappingTags: {
            id: 'entreprise_id',
            nom: 'entreprise_nom',
            raison_sociale: 'entreprise_raison_sociale',
            adresse: 'entreprise_adresse',
            ville: 'entreprise_ville',
            code_postal: 'entreprise_code_postal',
            pays: 'entreprise_pays',
            telephone: 'entreprise_telephone',
            email: 'entreprise_email',
            site_web: 'entreprise_site_web',
            matricule_fiscal: 'entreprise_matricule_fiscal',
            registre_commerce: 'entreprise_registre_commerce',
            capital_social: 'entreprise_capital_social',
            numero_tva: 'entreprise_numero_tva'
        }
    },
    devis: {
        table: 'devis',
        colonnesRecherche: ['id', 'numero_devis', 'reference'],
        mappingTags: {
            id: 'devis_id',
            numero_devis: 'devis_numero',
            reference: 'devis_reference',
            date_devis: 'devis_date',
            date_validite: 'devis_date_validite',
            total_ht: 'devis_total_ht',
            montant_tva: 'devis_montant_tva',
            total_ttc: 'devis_total_ttc',
            remise: 'devis_remise',
            tva: 'devis_tva',
            statut: 'devis_statut',
            notes: 'devis_notes',
            conditions_paiement: 'devis_conditions_paiement'
        }
    },
    commande: {
        table: 'commandes',
        colonnesRecherche: ['id', 'numero_commande', 'reference'],
        mappingTags: {
            id: 'commande_id',
            numero_commande: 'commande_numero',
            reference: 'commande_reference',
            date_commande: 'commande_date',
            total: 'commande_total',
            montant_ht: 'commande_montant_ht',
            montant_tva: 'commande_montant_tva',
            total_ttc: 'commande_total_ttc',
            remise: 'commande_remise',
            statut: 'commande_statut',
            notes: 'commande_notes',
            devis_id: 'devis_id'
        }
    },
    facture: {
        table: 'factures',
        colonnesRecherche: ['id', 'numero_facture'],
        mappingTags: {
            id: 'facture_id',
            numero_facture: 'facture_numero',
            date_facture: 'facture_date',
            total_ht: 'facture_total_ht',
            montant_tva: 'facture_montant_tva',
            total_ttc: 'facture_total_ttc',
            statut: 'facture_statut',
            notes: 'facture_notes',
            devis_id: 'devis_id',
            commande_id: 'commande_id'
        }
    },
    user: {
        table: 'users',
        colonnesRecherche: ['id', 'email', 'matricule'],
        mappingTags: {
            id: 'user_id',
            nom: 'user_nom',
            prenom: 'user_prenom',
            email: 'user_email',
            telephone: 'user_telephone',
            matricule: 'user_matricule',
            fonction: 'user_fonction',
            service: 'user_service'
        }
    }
};

function colonneCorrespondante(cle) {
    if (/^\d+$/.test(cle)) return 'id';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cle)) return 'email';
    if (/^\+?\d[\d\s.-]{6,}$/.test(cle)) return 'telephone';
    if (/^\d{8}$/.test(cle)) return 'numero_cin';
    if (/^\d{7}[A-Z]/.test(cle.toUpperCase())) return 'matricule_fiscal';
    return null;
}

function autoRemplir(db, typeEntite, identifiant) {
    return new Promise((resolve, reject) => {
        const entite = ENTITES[typeEntite];
        if (!entite) return reject(new Error(`Type d'entité inconnu : ${typeEntite}`));
        if (!identifiant) return reject(new Error('Identifiant requis'));

        const colonneDirecte = colonneCorrespondante(String(identifiant));
        let sql, params;

        if (colonneDirecte && entite.colonnesRecherche.includes(colonneDirecte)) {
            sql = `SELECT * FROM ${entite.table} WHERE ${colonneDirecte} = ? LIMIT 1`;
            params = [identifiant];
        } else {
            const colonnes = entite.colonnesRecherche.filter(c => c !== 'id');
            if (colonnes.length === 0) {
                sql = `SELECT * FROM ${entite.table} WHERE id = ? LIMIT 1`;
                params = [identifiant];
            } else {
                sql = `SELECT * FROM ${entite.table} WHERE ${colonnes.map(c => `${c} = ?`).join(' OR ')} LIMIT 1`;
                params = colonnes.map(() => identifiant);
            }
        }

        db.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                return resolve({ trouve: false, donnees: null, tags: {} });
            }
            const donnees = rows[0];
            const tags = {};
            for (const [colonne, tag] of Object.entries(entite.mappingTags)) {
                if (donnees[colonne] !== undefined && donnees[colonne] !== null) {
                    tags[tag] = donnees[colonne];
                }
            }
            resolve({ trouve: true, donnees, tags });
        });
    });
}

function resoudreDocumentComplet(db, typeDocument, id, entrepriseId) {
    return new Promise((resolve, reject) => {
        const requetes = {
            devis: `
                SELECT d.*, 'devis' AS source,
                       c.id AS c_id, c.nom AS c_nom, c.prenom AS c_prenom,
                       c.email AS c_email, c.telephone AS c_telephone,
                       c.adresse AS c_adresse, c.ville AS c_ville,
                       c.matricule_fiscal AS c_matricule_fiscal,
                       c.numero_cin AS c_cin,
                       e.nom AS e_nom, e.adresse AS e_adresse,
                       e.telephone AS e_telephone, e.email AS e_email,
                       e.matricule_fiscal AS e_matricule_fiscal
                FROM devis d
                JOIN clients c ON c.id = d.client_id
                LEFT JOIN entreprises e ON e.id = d.entreprise_id
                WHERE d.id = ? AND d.entreprise_id = ?
            `,
            commande: `
                SELECT co.*, 'commande' AS source,
                       c.id AS c_id, c.nom AS c_nom, c.prenom AS c_prenom,
                       c.email AS c_email, c.telephone AS c_telephone,
                       c.adresse AS c_adresse, c.ville AS c_ville,
                       c.matricule_fiscal AS c_matricule_fiscal,
                       c.numero_cin AS c_cin,
                       dv.id AS dv_id, dv.numero_devis AS dv_numero,
                       dv.date_devis AS dv_date, dv.total_ht AS dv_total_ht,
                       dv.total_ttc AS dv_total_ttc, dv.montant_tva AS dv_montant_tva,
                       dv.remise AS dv_remise, dv.conditions_paiement AS dv_conditions_paiement,
                       e.nom AS e_nom, e.adresse AS e_adresse,
                       e.telephone AS e_telephone, e.email AS e_email,
                       e.matricule_fiscal AS e_matricule_fiscal
                FROM commandes co
                JOIN clients c ON c.id = co.client_id
                LEFT JOIN devis dv ON dv.id = co.devis_id
                LEFT JOIN entreprises e ON e.id = co.entreprise_id
                WHERE co.id = ? AND co.entreprise_id = ?
            `,
            facture: `
                SELECT f.*, 'facture' AS source,
                       c.id AS c_id, c.nom AS c_nom, c.prenom AS c_prenom,
                       c.email AS c_email, c.telephone AS c_telephone,
                       c.adresse AS c_adresse, c.ville AS c_ville,
                       c.matricule_fiscal AS c_matricule_fiscal,
                       c.numero_cin AS c_cin,
                       dv.id AS dv_id, dv.numero_devis AS dv_numero,
                       dv.date_devis AS dv_date, dv.total_ht AS dv_total_ht,
                       dv.total_ttc AS dv_total_ttc,
                       co.id AS co_id, co.numero_commande AS co_numero,
                       co.total AS co_total, co.statut AS co_statut,
                       e.nom AS e_nom, e.adresse AS e_adresse,
                       e.telephone AS e_telephone, e.email AS e_email,
                       e.matricule_fiscal AS e_matricule_fiscal
                FROM factures f
                JOIN clients c ON c.id = f.client_id
                LEFT JOIN devis dv ON dv.id = f.devis_id
                LEFT JOIN commandes co ON co.id = f.commande_id
                LEFT JOIN entreprises e ON e.id = f.entreprise_id
                WHERE f.id = ? AND f.entreprise_id = ?
            `
        };

        const sql = requetes[typeDocument];
        if (!sql) return reject(new Error(`Type de document inconnu : ${typeDocument}`));

        db.query(sql, [id, entrepriseId], (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) return resolve({ trouve: false, tags: {} });

            const r = rows[0];
            
            let tags = {
                client_id: r.c_id,
                client_nom: r.c_nom,
                client_prenom: r.c_prenom,
                client_email: r.c_email,
                client_telephone: r.c_telephone,
                client_adresse: r.c_adresse,
                client_ville: r.c_ville,
                client_matricule_fiscal: r.c_matricule_fiscal,
                client_cin: r.c_cin,
                entreprise_nom: r.e_nom,
                entreprise_adresse: r.e_adresse,
                entreprise_telephone: r.e_telephone,
                entreprise_email: r.e_email,
                entreprise_matricule_fiscal: r.e_matricule_fiscal
            };

            if (typeDocument === 'devis' || r.dv_id) {
                const idDevis = typeDocument === 'devis' ? r.id : r.dv_id;
                tags = {
                    ...tags,
                    devis_id: idDevis,
                    devis_numero: typeDocument === 'devis' ? r.numero_devis : r.dv_numero,
                    devis_date: typeDocument === 'devis' ? r.date_devis : r.dv_date,
                    devis_total_ht: typeDocument === 'devis' ? r.total_ht : r.dv_total_ht,
                    devis_montant_tva: typeDocument === 'devis' ? r.montant_tva : r.dv_montant_tva,
                    devis_total_ttc: typeDocument === 'devis' ? r.total_ttc : r.dv_total_ttc,
                    devis_remise: typeDocument === 'devis' ? r.remise : r.dv_remise,
                    devis_conditions_paiement: typeDocument === 'devis' ? r.conditions_paiement : r.dv_conditions_paiement,
                    devis_statut: typeDocument === 'devis' ? r.statut : null
                };
            }

            if (typeDocument === 'commande' || r.co_id) {
                tags = {
                    ...tags,
                    commande_id: typeDocument === 'commande' ? r.id : r.co_id,
                    commande_numero: typeDocument === 'commande' ? r.numero_commande : r.co_numero,
                    commande_total: typeDocument === 'commande' ? r.total : r.co_total,
                    commande_total_ht: typeDocument === 'commande' ? r.montant_ht : null,
                    commande_total_ttc: typeDocument === 'commande' ? r.total_ttc : null,
                    commande_statut: typeDocument === 'commande' ? r.statut : r.co_statut,
                    commande_date: typeDocument === 'commande' ? r.date_commande : null
                };
            }

            if (typeDocument === 'facture') {
                tags = {
                    ...tags,
                    facture_id: r.id,
                    facture_numero: r.numero_facture,
                    facture_date: r.date_facture,
                    facture_total_ht: r.total_ht,
                    facture_montant_tva: r.montant_tva,
                    facture_total_ttc: r.total_ttc,
                    facture_statut: r.statut,
                    facture_notes: r.notes
                };
            }

            if (tags.devis_id) {
                const sqlProduits = `
                    SELECT dp.*, p.nom as produit_nom, p.reference as produit_reference
                    FROM devis_produits dp
                    JOIN produits p ON dp.produit_id = p.id
                    WHERE dp.devis_id = ?
                `;
                
                db.query(sqlProduits, [tags.devis_id], (err2, rows2) => {
                    if (!err2 && rows2 && rows2.length > 0) {
                        const produitsList = rows2.map(p => 
                            `${p.quantite}x ${p.produit_nom} - ${p.prix_unitaire} TND (${p.total_ligne} TND)`
                        ).join('\n');
                        tags.devis_produits = produitsList;
                        tags.devis_produits_liste = rows2;
                    }
                    resolve({ trouve: true, tags });
                });
            } else {
                resolve({ trouve: true, tags });
            }
        });
    });
}

module.exports = { autoRemplir, ENTITES, resoudreDocumentComplet };