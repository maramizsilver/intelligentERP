const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));

            return res.status(400).json({
                message: 'Validation échouée',
                errors
            });
        }

        next();
    };
};

// Schémas de validation pour le calculateur
const calculTauxUniqueSchema = Joi.object({
    montant: Joi.number().positive().required().messages({
        'number.base': 'Le montant doit être un nombre',
        'number.positive': 'Le montant doit être positif',
        'any.required': 'Le montant est requis'
    }),
    date_debut: Joi.date().required().messages({
        'date.base': 'La date de début est invalide',
        'any.required': 'La date de début est requise'
    }),
    date_fin: Joi.date().greater(Joi.ref('date_debut')).required().messages({
        'date.base': 'La date de fin est invalide',
        'date.greater': 'La date de fin doit être après la date de début',
        'any.required': 'La date de fin est requise'
    }),
    taux: Joi.number().min(0).required().messages({
        'number.base': 'Le taux doit être un nombre',
        'number.min': 'Le taux ne peut pas être négatif',
        'any.required': 'Le taux est requis'
    })
});

const calculTauxVariablesSchema = Joi.object({
    montant: Joi.number().positive().required(),
    periodes: Joi.array().items(
        Joi.object({
            date_debut: Joi.date().required(),
            date_fin: Joi.date().greater(Joi.ref('date_debut')).required(),
            taux: Joi.number().min(0).required()
        })
    ).min(1).required()
});

module.exports = {
    validate,
    calculTauxUniqueSchema,
    calculTauxVariablesSchema
};