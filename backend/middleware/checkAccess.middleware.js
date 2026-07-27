module.exports = (tableName, idField = 'id') => {
    return (req, res, next) => {
        if (req.user.is_super_admin) return next();
        
        if (req.user.is_external) {
            const paramId = req.params[idField] || req.body[idField];
            if (paramId && paramId !== req.user.client_id) {
                return res.status(403).json({ 
                    message: 'Acces refuse a cette ressource' 
                });
            }
        }
        
        next();
    };
};