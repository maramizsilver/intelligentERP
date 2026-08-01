
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
            notes: 'commande_notes'
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

module.exports = { autoRemplir, ENTITES };