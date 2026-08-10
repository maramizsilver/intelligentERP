import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Affichée en haut des pages internes tant que l'entreprise est en plan "essai"
// et n'a pas encore épuisé ses 30 connexions.
export default function EssaiBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user || user.is_super_admin || user.is_external) return null;
  if (user.plan_type !== 'essai') return null;
  if (user.connexions_restantes === null || user.connexions_restantes === undefined) return null;

  const critique = user.connexions_restantes <= 5;

  return (
    <div style={{ ...styles.banner, ...(critique ? styles.bannerCritique : {}) }}>
      {t('periode_essai_gratuite') || 'Période d\'essai gratuite'} — <strong>{user.connexions_restantes}</strong> {t('connexions_restantes') || 'connexion(s) restante(s) avant expiration'}
      {critique && ` ${t('pensez_souscrire') || 'Pensez à souscrire un abonnement pour ne pas perdre l\'accès.'}`}
    </div>
  );
}

const styles = {
  banner: {
    padding: '10px 24px',
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    fontSize: '13px',
    textAlign: 'center',
    borderBottom: '1px solid #c7d2fe'
  },
  bannerCritique: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderBottom: '1px solid #fde68a',
    fontWeight: '600'
  }
};