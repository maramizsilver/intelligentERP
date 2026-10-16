require('dotenv').config();
const Joi = require('joi');

const isProd = process.env.NODE_ENV === 'production';
const prodRequis = (s) => (isProd ? s.required() : s.optional());

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(5000),
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  BACKUP_ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
  EXPORT_SECRET_KEY: prodRequis(Joi.string().min(32)),
  DB_HOST: Joi.string().default('localhost'),
  DB_USER: isProd ? Joi.string().invalid('root').required() : Joi.string().optional(),
  DB_PASSWORD:  prodRequis(Joi.string().allow('')),
  DB_MASTER_NAME: Joi.string().default('erp_db'),
  FRONTEND_URL: prodRequis(Joi.string().uri()),
  CORS_ORIGINS: prodRequis(Joi.string()),            // ex: https://app.mondomaine.tn
  STRIPE_SECRET_KEY: prodRequis(Joi.string()),
  STRIPE_WEBHOOK_SECRET: prodRequis(Joi.string()),
  ABONNEMENT_PRIX: Joi.number().default(100),
  TRUST_PROXY: Joi.number().default(0)               // 1 derrière nginx/load balancer
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });
if (error) {
  console.error(' Configuration invalide :\n - ' + error.details.map((d) => d.message).join('\n - '));
  process.exit(1);
}
module.exports = value;