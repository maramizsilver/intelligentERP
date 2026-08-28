// frontend/src/pages/auth/Register.jsx
// ---------------------------------------------------------------------------
// Refonte de la page d'inscription : mise en page "split-screen" (panneau de
// marque à gauche, formulaire à droite), validation en temps réel champ par
// champ, indicateur de robustesse du mot de passe, et retour visuel clair
// sur l'état du bouton d'envoi (idle / chargement / succès / erreur).
//
// Le comportement métier (appel API, redirection, gestion du paiement pour
// le plan payant) est identique à l'ancienne version : seule la présentation
// et l'expérience de saisie ont été retravaillées.
// ---------------------------------------------------------------------------
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import '../../styles/brand-tokens.css';
import './Register.css';

// ============================================================
// Règles de validation (alignées avec le schéma Joi du backend :
// backend/middleware/validate.middleware.js -> registerSchema)
// ============================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name, value, form) {
  switch (name) {
    case 'entreprise_nom':
      if (!value.trim()) return "Le nom de l'entreprise est requis";
      if (value.trim().length < 2) return 'Au moins 2 caractères';
      return '';
    case 'nom':
      if (!value.trim()) return 'Le nom est requis';
      if (value.trim().length < 2) return 'Au moins 2 caractères';
      return '';
    case 'prenom':
      if (!value.trim()) return 'Le prénom est requis';
      if (value.trim().length < 2) return 'Au moins 2 caractères';
      return '';
    case 'email':
      if (!value.trim()) return "L'email est requis";
      if (!EMAIL_REGEX.test(value.trim())) return 'Format d\'email invalide';
      return '';
    case 'password': {
      if (!value) return 'Le mot de passe est requis';
      if (value.length < 8) return '8 caractères minimum';
      if (!/[A-Z]/.test(value)) return 'Ajoutez une majuscule';
      if (!/[a-z]/.test(value)) return 'Ajoutez une minuscule';
      if (!/[0-9]/.test(value)) return 'Ajoutez un chiffre';
      if (!/[!@#$%^&*]/.test(value)) return 'Ajoutez un caractère spécial (!@#$%^&*)';
      return '';
    }
    case 'confirmPassword':
      if (!value) return 'Confirmez le mot de passe';
      if (value !== form.password) return 'Les mots de passe ne correspondent pas';
      return '';
    default:
      return '';
  }
}

/** Calcule un score de robustesse de 0 (très faible) à 4 (excellent). */
function computePasswordScore(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ['Très faible', 'Faible', 'Correct', 'Bon', 'Excellent'];
const STRENGTH_COLORS = ['#F43F5E', '#F97316', '#F59E0B', '#22C55E', '#10B981'];

// Champs requis pour activer le bouton d'envoi
const REQUIRED_FIELDS = ['entreprise_nom', 'nom', 'prenom', 'email', 'password', 'confirmPassword'];

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    entreprise_nom: '',
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan_type: 'essai',
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | error

  const passwordScore = useMemo(() => computePasswordScore(form.password), [form.password]);

  // Formulaire valide si chaque champ requis est rempli et sans erreur connue
  const isFormValid = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => {
      const value = form[field];
      const error = validateField(field, value, form);
      return value && !error;
    });
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    // Validation en direct uniquement sur les champs déjà "touchés"
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, nextForm) }));
    }
    // Si on change le mot de passe, on revalide aussi la confirmation
    if (name === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', nextForm.confirmPassword, nextForm),
      }));
    }
    if (submitState === 'error') setSubmitState('idle');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, form) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Valide tout le formulaire d'un coup (au cas où l'utilisateur n'a
    // jamais quitté un champ avant de soumettre)
    const allTouched = {};
    const allErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      allTouched[field] = true;
      allErrors[field] = validateField(field, form[field], form);
    });
    setTouched(allTouched);
    setErrors(allErrors);

    const hasErrors = Object.values(allErrors).some(Boolean);
    if (hasErrors) {
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    try {
      const payload = {
        entreprise_nom: form.entreprise_nom,
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        password: form.password,
        plan_type: form.plan_type,
      };
      const response = await API.post('/auth/register-entreprise', payload);

      if (form.plan_type === 'payant') {
        const paiementResponse = await API.post('/paiement/create-abonnement', {
          email: form.email,
          entreprise_nom: form.entreprise_nom,
          montant: 100,
        });

        if (paiementResponse.data.success) {
          window.location.href = paiementResponse.data.paymentUrl;
          return;
        }
        setServerError(paiementResponse.data.message || 'Erreur lors de la création du paiement');
        setSubmitState('error');
        return;
      }

      setSubmitState('success');
      setTimeout(() => navigate('/'), 2600);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setServerError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || "Erreur lors de l'inscription"));
      setSubmitState('error');
    }
  };

  const fieldStatus = (name) => {
    if (!touched[name]) return 'idle';
    return errors[name] ? 'invalid' : 'valid';
  };

  return (
    <div className="rg-page">
      <div className="rg-shell">
        {/* ---------------------------------------------------------
            PANNEAU DE MARQUE — pose le ton "logiciel de gestion sérieux"
            et rappelle en un coup d'œil ce que le futur client obtient.
           --------------------------------------------------------- */}
        <aside className="rg-brand" aria-hidden="false">
          <div className="rg-brand-top">
            <div className="rg-logo">
              <span className="rg-logo-mark">◆</span>
              <span className="rg-logo-text">ERP</span>
            </div>
            <LanguageSwitcher variant="dark" />
          </div>

          <div className="rg-brand-body">
            <p className="rg-eyebrow">Plateforme de gestion d'entreprise</p>
            <h1 className="rg-headline">
              Pilotez votre activité<br />depuis un seul endroit.
            </h1>
            <p className="rg-subline">
              Ventes, achats, stock, finance et documents : votre ERP tunisien,
              pensé pour les équipes qui veulent avancer vite.
            </p>

            <ul className="rg-feature-list">
              <li>
                <span className="rg-feature-icon" style={{ background: '#10B981' }}>✓</span>
                30 connexions d'essai gratuites, sans carte bancaire
              </li>
              <li>
                <span className="rg-feature-icon" style={{ background: '#0EA5E9' }}>✓</span>
                Vos données restent chiffrées et vous appartiennent
              </li>
              <li>
                <span className="rg-feature-icon" style={{ background: '#6366F1' }}>✓</span>
                Assistant IA intégré pour vos équipes commerciales
              </li>
            </ul>
          </div>

          <p className="rg-brand-footer">© 2026 ERP — Tous droits réservés</p>
        </aside>

        {/* ---------------------------------------------------------
            FORMULAIRE
           --------------------------------------------------------- */}
        <main className="rg-form-panel">
          <div className="rg-form-card">
            <div className="rg-form-header">
              <h2 className="rg-form-title">Créer votre compte</h2>
              <p className="rg-form-subtitle">
                Déjà inscrit ?{' '}
                <button type="button" className="rg-link" onClick={() => navigate('/')}>
                  Se connecter
                </button>
              </p>
            </div>

            {serverError && (
              <div className="rg-alert rg-alert-error" role="alert">
                <span className="rg-alert-icon">!</span>
                <span>{serverError}</span>
              </div>
            )}

            {submitState === 'success' ? (
              <div className="rg-success" role="status">
                <div className="rg-success-badge">✓</div>
                <h3>Inscription réussie</h3>
                <p>
                  Vérifiez votre email pour activer votre compte. Redirection vers
                  la page de connexion...
                </p>
              </div>
            ) : (
              <form className="rg-form" onSubmit={handleSubmit} noValidate>
                {/* --- Entreprise --- */}
                <FormField
                  label="Nom de l'entreprise"
                  name="entreprise_nom"
                  placeholder="Ex : Société ABC"
                  value={form.entreprise_nom}
                  status={fieldStatus('entreprise_nom')}
                  error={errors.entreprise_nom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="organization"
                />

                <div className="rg-row">
                  <FormField
                    label="Nom"
                    name="nom"
                    placeholder="Ben Salah"
                    value={form.nom}
                    status={fieldStatus('nom')}
                    error={errors.nom}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="family-name"
                  />
                  <FormField
                    label="Prénom"
                    name="prenom"
                    placeholder="Amine"
                    value={form.prenom}
                    status={fieldStatus('prenom')}
                    error={errors.prenom}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="given-name"
                  />
                </div>

                <FormField
                  label="Email professionnel"
                  name="email"
                  type="email"
                  placeholder="amine@entreprise.com"
                  value={form.email}
                  status={fieldStatus('email')}
                  error={errors.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                />

                <FormField
                  label="Mot de passe"
                  name="password"
                  type="password"
                  placeholder="8 caractères minimum"
                  value={form.password}
                  status={fieldStatus('password')}
                  error={errors.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                />

                {form.password && (
                  <div className="rg-strength" aria-live="polite">
                    <div className="rg-strength-track">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="rg-strength-seg"
                          style={{
                            backgroundColor: i < passwordScore ? STRENGTH_COLORS[passwordScore] : 'var(--border-subtle)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="rg-strength-label" style={{ color: STRENGTH_COLORS[passwordScore] }}>
                      {STRENGTH_LABELS[passwordScore]}
                    </span>
                  </div>
                )}

                <FormField
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ressaisissez le mot de passe"
                  value={form.confirmPassword}
                  status={fieldStatus('confirmPassword')}
                  error={errors.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                />

                {/* --- Formule --- */}
                <fieldset className="rg-plan-fieldset">
                  <legend className="rg-field-label">Formule</legend>
                  <div className="rg-plan-grid">
                    <PlanCard
                      id="plan-essai"
                      title="Essai gratuit"
                      desc="30 connexions offertes"
                      badge="Sans engagement"
                      active={form.plan_type === 'essai'}
                      onSelect={() => setForm((f) => ({ ...f, plan_type: 'essai' }))}
                    />
                    <PlanCard
                      id="plan-payant"
                      title="Abonnement Pro"
                      desc="Accès illimité"
                      badge="100 DT / mois"
                      badgeAccent
                      active={form.plan_type === 'payant'}
                      onSelect={() => setForm((f) => ({ ...f, plan_type: 'payant' }))}
                    />
                  </div>
                </fieldset>

                <SubmitButton state={submitState} disabled={!isFormValid} />
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Sous-composants réutilisables
// ============================================================

/** Champ de formulaire avec validation en temps réel et icône d'état. */
function FormField({ label, name, type = 'text', placeholder, value, status, error, onChange, onBlur, autoComplete }) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="rg-field">
      <label className="rg-field-label" htmlFor={inputId}>{label}</label>
      <div className={`rg-input-wrap rg-input-wrap--${status}`}>
        <input
          id={inputId}
          name={name}
          type={type}
          className="rg-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={status === 'invalid'}
          aria-describedby={status === 'invalid' ? errorId : undefined}
        />
        {status === 'valid' && <span className="rg-status-icon rg-status-icon--valid" aria-hidden="true">✓</span>}
        {status === 'invalid' && <span className="rg-status-icon rg-status-icon--invalid" aria-hidden="true">!</span>}
      </div>
      {status === 'invalid' && (
        <p className="rg-field-error" id={errorId}>{error}</p>
      )}
    </div>
  );
}

/** Carte de sélection de formule (radio stylisé). */
function PlanCard({ id, title, desc, badge, badgeAccent, active, onSelect }) {
  return (
    <label htmlFor={id} className={`rg-plan-card ${active ? 'rg-plan-card--active' : ''}`}>
      <input
        type="radio"
        id={id}
        name="plan_type"
        checked={active}
        onChange={onSelect}
        className="rg-plan-radio"
      />
      <span className="rg-plan-title">{title}</span>
      <span className="rg-plan-desc">{desc}</span>
      <span className={`rg-plan-badge ${badgeAccent ? 'rg-plan-badge--accent' : ''}`}>{badge}</span>
    </label>
  );
}

/** Bouton d'envoi avec retour visuel explicite selon l'état de soumission. */
function SubmitButton({ state, disabled }) {
  const isLoading = state === 'loading';
  const isError = state === 'error';

  return (
    <button
      type="submit"
      className={`rg-submit ${isError ? 'rg-submit--shake' : ''}`}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="rg-submit-content">
          <span className="rg-spinner" aria-hidden="true" />
          Création du compte...
        </span>
      ) : (
        <span className="rg-submit-content">
          S'inscrire
          <span className="rg-submit-arrow" aria-hidden="true">→</span>
        </span>
      )}
    </button>
  );
}