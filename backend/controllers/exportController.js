exports.exportMesDonnees = (req, res) => {
    const db = req.db;
    
    // Vérifier que db est défini
    if (!db) {
        console.error('[Export] req.db est undefined');
        return res.status(500).json({ 
            message: 'Erreur de connexion à la base de données' 
        });
    }
    
    if (req.user.is_super_admin) {
        return res.status(400).json({ 
            message: "Le SuperAdmin n'a pas de données d'entreprise à exporter" 
        });
    }
    if (req.user.is_external) {
        return res.status(403).json({ 
            message: 'Export réservé aux comptes internes de l\'entreprise' 
        });
    }
    
    const entrepriseId = req.user.entreprise_id;
    if (!entrepriseId) {
        return res.status(400).json({ 
            message: 'Aucune entreprise associée à ce compte' 
        });
    }

    const requetes = {
        clients: ['SELECT * FROM clients', []],
        produits: ['SELECT * FROM produits', []],
        fournisseurs: ['SELECT * FROM fournisseurs', []],
        commandes: [
            `SELECT c.* FROM commandes c 
             JOIN clients cl ON c.client_id = cl.id`,
            []
        ],
        achats: ['SELECT * FROM achats', []],
        devis: ['SELECT * FROM devis', []],
        entrepots: ['SELECT * FROM entrepots', []],
        inventaires: ['SELECT * FROM inventaires', []],
        mouvements_stock: ['SELECT * FROM mouvements_stock', []],
        promotions: ['SELECT * FROM promotions', []],
        documents: ['SELECT * FROM documents', []],
        archives: ['SELECT * FROM archives', []],
        paiements: ['SELECT * FROM paiements', []],
        depenses: ['SELECT * FROM depenses', []],
        recettes: ['SELECT * FROM recettes', []]
    };

    const cles = Object.keys(requetes);
    const resultat = {};
    let restantes = cles.length;
    let erreur = null;

    cles.forEach((cle) => {
        const [sql, params] = requetes[cle];
        db.query(sql, params, (err, rows) => {
            if (err) {
                console.error(`Erreur export ${cle}:`, err);
                erreur = err;
            }
            resultat[cle] = rows || [];
            restantes -= 1;
            
            if (restantes === 0) {
                if (erreur) {
                    console.error('Erreur lors de l\'export:', erreur);
                    return res.status(500).json({ 
                        message: 'Erreur serveur lors de l\'export' 
                    });
                }
                
                resultat._meta = {
                    entreprise_id: entrepriseId,
                    export_date: new Date().toISOString(),
                    version: '1.0'
                };
                
                const nomFichier = `export-donnees-erp-${new Date().toISOString().slice(0, 10)}.json`;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
                res.send(JSON.stringify(resultat, null, 2));
            }
        });
    });
};