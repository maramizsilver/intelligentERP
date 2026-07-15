// backend/middlewares/errorHandler.middleware.js

class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    console.error('❌ Erreur:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        user: req.user?.id
    });

    // Erreur personnalisée
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
            code: err.errorCode
        });
    }

    // Erreur de validation Joi
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation échouée',
            errors: err.details?.map(d => d.message) || [err.message]
        });
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token invalide' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expirée' });
    }

    // Erreur MySQL
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Cette entrée existe déjà' });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: 'Référence invalide' });
    }

    // Erreur par défaut
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
        message: 'Erreur serveur interne',
        ...(isDevelopment && { stack: err.stack, details: err.message })
    });
};

module.exports = { AppError, errorHandler };