const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));

            return res.status(400).json({
                message: 'Validation echouee',
                errors
            });
        }

        req.body = value;
        next();
    };
};

const passwordStrengthSchema = Joi.object({
    password: Joi.string()
        .min(8)
        .regex(/[A-Z]/, 'doit contenir une majuscule')
        .regex(/[a-z]/, 'doit contenir une minuscule')
        .regex(/[0-9]/, 'doit contenir un chiffre')
        .regex(/[!@#$%^&*]/, 'doit contenir un caractere special')
        .required()
        .messages({
            'string.min': 'Le mot de passe doit contenir au moins 8 caracteres',
            'string.pattern.name': 'Le mot de passe {#name}',
            'any.required': 'Le mot de passe est requis'
        })
});

const validatePasswordStrength = validate(passwordStrengthSchema);

const calculTauxUniqueSchema = Joi.object({
    montant: Joi.number().positive().required().messages({
        'number.base': 'Le montant doit etre un nombre',
        'number.positive': 'Le montant doit etre positif',
        'any.required': 'Le montant est requis'
    }),
    date_debut: Joi.date().required().messages({
        'date.base': 'La date de debut est invalide',
        'any.required': 'La date de debut est requise'
    }),
    date_fin: Joi.date().greater(Joi.ref('date_debut')).required().messages({
        'date.base': 'La date de fin est invalide',
        'date.greater': 'La date de fin doit etre apres la date de debut',
        'any.required': 'La date de fin est requise'
    }),
    taux: Joi.number().min(0).required().messages({
        'number.base': 'Le taux doit etre un nombre',
        'number.min': 'Le taux ne peut pas etre negatif',
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

const registerSchema = Joi.object({
    entreprise_nom: Joi.string().min(2).max(150).required().messages({
        'string.min': 'Le nom de l entreprise doit faire au moins 2 caracteres',
        'any.required': 'Le nom de l entreprise est requis'
    }),
    nom: Joi.string().min(2).max(100).required(),
    prenom: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required().messages({
        'string.email': 'Email invalide'
    }),
    password: Joi.string()
        .min(8)
        .regex(/[A-Z]/, 'doit contenir une majuscule')
        .regex(/[a-z]/, 'doit contenir une minuscule')
        .regex(/[0-9]/, 'doit contenir un chiffre')
        .regex(/[!@#$%^&*]/, 'doit contenir un caractere special')
        .required()
        .messages({
            'string.min': 'Le mot de passe doit contenir au moins 8 caracteres',
            'string.pattern.name': 'Le mot de passe {#name}',
            'any.required': 'Le mot de passe est requis'
        }),
    plan_type: Joi.string().valid('essai', 'payant').default('essai'),
    id_fiscal: Joi.string().allow('', null).max(50)
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const clientSchema = Joi.object({
    nom: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().allow('', null),
    telephone: Joi.string().allow('', null).max(50),
    adresse: Joi.string().allow('', null).max(255)
});

const commandeSchema = Joi.object({
    client_id: Joi.number().integer().positive().required(),
    lignes: Joi.array().items(
        Joi.object({
            produit_id: Joi.number().integer().positive().required(),
            quantite: Joi.number().integer().min(1).required()
        })
    ).min(1).required()
});

const devisSchema = Joi.object({
    client_id: Joi.number().integer().positive().required(),
    date_validite: Joi.date().required(),
    remise: Joi.number().min(0).max(100).default(0),
    notes: Joi.string().allow('', null),
    lignes: Joi.array().items(
        Joi.object({
            produit_id: Joi.number().integer().positive().required(),
            quantite: Joi.number().integer().min(1).required(),
            remise_ligne: Joi.number().min(0).max(100).default(0)
        })
    ).min(1).required()
});

const promotionSchema = Joi.object({
    code: Joi.string().min(2).max(50).required(),
    nom: Joi.string().min(2).max(255).required(),
    description: Joi.string().allow('', null),
    type: Joi.string().valid('pourcentage', 'fixe', 'livraison_offerte').required(),
    valeur: Joi.number().positive().required(),
    date_debut: Joi.date().required(),
    date_fin: Joi.date().greater(Joi.ref('date_debut')).required(),
    utilisation_max: Joi.number().integer().positive().allow('', null),
    produits_concernes: Joi.string().allow('', null),
    clients_concernes: Joi.string().allow('', null),
    actif: Joi.boolean().default(true)
});

const fournisseurSchema = Joi.object({
    nom: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().allow('', null),
    telephone: Joi.string().allow('', null).max(50),
    adresse: Joi.string().allow('', null).max(255)
});

const achatSchema = Joi.object({
    fournisseur_id: Joi.number().integer().positive().required(),
    date_livraison_prevue: Joi.date().allow('', null),
    notes: Joi.string().allow('', null),
    lignes: Joi.array().items(
        Joi.object({
            produit_id: Joi.number().integer().positive().required(),
            quantite: Joi.number().integer().min(1).required(),
            prix_unitaire: Joi.number().min(0).allow('', null)
        })
    ).min(1).required()
});

const produitSchema = Joi.object({
    nom: Joi.string().min(2).max(255).required(),
    description: Joi.string().allow('', null),
    prix: Joi.number().min(0).required(),
    quantite_stock: Joi.number().min(0).default(0)
});

const entrepotSchema = Joi.object({
    nom: Joi.string().min(2).max(255).required(),
    adresse: Joi.string().allow('', null),
    responsable: Joi.string().allow('', null),
    actif: Joi.boolean().default(true)
});

const depenseSchema = Joi.object({
    categorie: Joi.string().valid(
        'fournisseur', 'salaire', 'loyer', 'electricite',
        'transport', 'marketing', 'impot', 'autre'
    ).required(),
    montant: Joi.number().positive().required(),
    description: Joi.string().allow('', null),
    date_depense: Joi.date().required(),
    fournisseur_id: Joi.number().integer().positive().allow('', null),
    mode_paiement: Joi.string().valid(
        'especes', 'cheque', 'virement', 'carte',
        'stripe', 'paypal', 'flouci', 'konnect'
    ).allow('', null),
    justificatif_document_id: Joi.number().integer().positive().allow('', null)
});

const recetteSchema = Joi.object({
    source: Joi.string().min(2).max(255).required(),
    montant: Joi.number().positive().required(),
    description: Joi.string().allow('', null),
    date_recette: Joi.date().required(),
    client_id: Joi.number().integer().positive().allow('', null),
    mode_paiement: Joi.string().valid(
        'especes', 'cheque', 'virement', 'carte',
        'stripe', 'paypal', 'flouci', 'konnect'
    ).allow('', null)
});

const paiementSchema = Joi.object({
    reference_type: Joi.string().valid('commande', 'achat').required(),
    reference_id: Joi.number().integer().positive().required(),
    montant: Joi.number().positive().required(),
    mode_paiement: Joi.string().valid(
        'especes', 'cheque', 'virement', 'carte',
        'stripe', 'paypal', 'flouci', 'konnect'
    ).required(),
    provider_ref: Joi.string().allow('', null)
});

const userSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    prenom: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role_id: Joi.number().integer().positive().required()
});

const externalUserSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    prenom: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    client_id: Joi.number().integer().positive().required()
});

const documentSchema = Joi.object({
    nom: Joi.string().allow('', null),
    type_document: Joi.string().valid(
        'facture', 'contrat', 'bon_commande', 'devis', 'identite', 'autre'
    ).default('autre'),
    reference_type: Joi.string().allow('', null),
    reference_id: Joi.string().allow('', null)
});

const archiveSchema = Joi.object({
    type_entite: Joi.string().valid('commande', 'devis', 'achat', 'client').required(),
    entite_id: Joi.number().integer().positive().required(),
    motif: Joi.string().allow('', null),
    supprimer_original: Joi.boolean().default(false)
});

const roleSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('', null)
});

const permissionSchema = Joi.object({
    module_id: Joi.number().integer().positive().required(),
    consultation: Joi.boolean().default(false),
    creation: Joi.boolean().default(false),
    modification: Joi.boolean().default(false),
    suppression: Joi.boolean().default(false),
    validation: Joi.boolean().default(false),
    export: Joi.boolean().default(false)
});

module.exports = {
    validate,
    validatePasswordStrength,
    passwordStrengthSchema,
    calculTauxUniqueSchema,
    calculTauxVariablesSchema,
    registerSchema,
    loginSchema,
    clientSchema,
    commandeSchema,
    devisSchema,
    promotionSchema,
    fournisseurSchema,
    achatSchema,
    produitSchema,
    entrepotSchema,
    depenseSchema,
    recetteSchema,
    paiementSchema,
    userSchema,
    externalUserSchema,
    documentSchema,
    archiveSchema,
    roleSchema,
    permissionSchema
};