module.exports = (req, res, next) => {
    if (!req.user || !req.user.is_super_admin) {
        return res.status(403).json({ message: 'Acces reserve au SuperAdmin plateforme' });
    }

    if (req.path.includes('/api/clients') ||
        req.path.includes('/api/fournisseurs') ||
        req.path.includes('/api/produits') ||
        req.path.includes('/api/commandes') ||
        req.path.includes('/api/devis') ||
        req.path.includes('/api/achats') ||
        req.path.includes('/api/entrepots') ||
        req.path.includes('/api/inventaires') ||
        req.path.includes('/api/mouvements-stock') ||
        req.path.includes('/api/finance') ||
        req.path.includes('/api/documents') ||
        req.path.includes('/api/archives') ||
        req.path.includes('/api/promotions') ||
        req.path.includes('/api/calculateur')) {
        return res.status(403).json({
            message: 'Le SuperAdmin n\'a pas acces aux donnees metier des entreprises'
        });
    }

    next();
};