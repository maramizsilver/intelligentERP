// frontend/src/pages/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHero from '../../components/common/PageHero';
import { colors, spacing, borderRadius, glassmorphism } from '../../styles/theme';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    fournisseurs: 0,
    produits: 0,
    commandes: 0,
    commandesEnAttente: 0,
    devis: 0,
    devisEnAttente: 0,
    promotionsActives: 0,
    alertesStock: 0,
    achatsEnCours: 0
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [
        clientsRes, fournisseursRes, produitsRes, commandesRes,
        devisRes, promotionsRes, alertesRes, achatsRes
      ] = await Promise.all([
        API.get('/clients').catch(() => ({ data: { clients: [] } })),
        API.get('/fournisseurs').catch(() => ({ data: { fournisseurs: [] } })),
        API.get('/produits').catch(() => ({ data: { produits: [] } })),
        API.get('/commandes').catch(() => ({ data: { commandes: [] } })),
        API.get('/devis').catch(() => ({ data: { devis: [] } })),
        API.get('/promotions').catch(() => ({ data: { promotions: [] } })),
        API.get('/mouvements-stock/alertes/rupture').catch(() => ({ data: { alertes: [] } })),
        API.get('/achats').catch(() => ({ data: { achats: [] } }))
      ]);

      const commandes = commandesRes.data.commandes || [];
      const devisList = devisRes.data.devis || [];
      const promotions = promotionsRes.data.promotions || [];
      const achats = achatsRes.data.achats || [];

      setStats({
        clients: clientsRes.data.clients?.length || 0,
        fournisseurs: fournisseursRes.data.fournisseurs?.length || 0,
        produits: produitsRes.data.produits?.length || 0,
        commandes: commandes.length,
        commandesEnAttente: commandes.filter(c => c.statut === 'en_attente').length,
        devis: devisList.length,
        devisEnAttente: devisList.filter(d => d.statut === 'envoye' || d.statut === 'brouillon').length,
        promotionsActives: promotions.filter(p => p.actif && new Date(p.date_fin) > new Date()).length,
        alertesStock: alertesRes.data.alertes?.length || 0,
        achatsEnCours: achats.filter(a => a.statut === 'brouillon' || a.statut === 'envoye' || a.statut === 'recu_partiel').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exporterDonnees = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.get('/export/mes-donnees', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-donnees-erp-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(t('export_succes') || 'Données exportées avec succès');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(t('erreur_export') || "Erreur lors de l'export");
      setTimeout(() => setError(''), 5000);
    } finally {
      setExporting(false);
    }
  };

  if (user?.is_external) { navigate('/client/dashboard'); return null; }
  if (user?.is_super_admin) { navigate('/superadmin/dashboard'); return null; }
  if (loading) return <LoadingSpinner size="lg" text={t('chargement')} />;

  // Icônes + dégradés associés à chaque module pour un rendu cohérent
  const MODULES = {
    clients:    { icon: '👥', gradient: colors.gradientPrimary },
    devis:      { icon: '📄', gradient: colors.gradientSecondary },
    commandes:  { icon: '🛒', gradient: colors.gradientSuccess },
    promotions: { icon: '🏷️', gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
    fournisseurs: { icon: '🏭', gradient: colors.gradientWarning },
    achats:     { icon: '📦', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    produits:   { icon: '📦', gradient: colors.gradientPrimary },
    mouvements: { icon: '🔄', gradient: colors.gradientSecondary },
    alertes:    { icon: '⚠️', gradient: colors.gradientDanger },
    entrepots:  { icon: '🏚️', gradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)' },
    calculateur:{ icon: '🧮', gradient: colors.gradientSuccess },
    inventaire: { icon: '📋', gradient: colors.gradientWarning },
    utilisateurs:{ icon: '👤', gradient: colors.gradientPrimary },
    documents:  { icon: '📁', gradient: colors.gradientSecondary },
    archives:   { icon: '🗄️', gradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)' },
  };

  const menuItems = [];
  if (hasPermission('Ventes', 'consultation')) {
    menuItems.push(
      { key: 'clients', path: '/clients', label: t('clients'), desc: `${stats.clients} ${t('enregistres') || 'enregistrés'}` },
      { key: 'devis', path: '/devis', label: t('devis'), desc: `${stats.devis} ${t('total')} · ${stats.devisEnAttente} ${t('en_attente')}` },
      { key: 'commandes', path: '/commandes', label: t('commandes'), desc: `${stats.commandes} ${t('total')} · ${stats.commandesEnAttente} ${t('en_attente')}` },
      { key: 'promotions', path: '/promotions', label: t('promotions') || 'Promotions', desc: `${stats.promotionsActives} ${t('actives') || 'actives'}` }
    );
  }
  if (hasPermission('Achats', 'consultation')) {
    menuItems.push(
      { key: 'fournisseurs', path: '/fournisseurs', label: t('fournisseurs'), desc: `${stats.fournisseurs} ${t('enregistres') || 'enregistrés'}` },
      { key: 'achats', path: '/achats', label: t('achats'), desc: `${stats.achatsEnCours} ${t('en_cours') || 'en cours'}` }
    );
  }
  if (hasPermission('Stock', 'consultation')) {
    menuItems.push(
      { key: 'produits', path: '/produits', label: t('produits'), desc: `${stats.produits} ${t('references') || 'références'}` },
      { key: 'mouvements', path: '/mouvements-stock', label: t('mouvements_stock'), desc: t('historique_stock') || 'Historique des stocks' },
      { key: 'alertes', path: '/alertes-stock', label: t('alertes') || 'Alertes',
        desc: stats.alertesStock > 0 ? `${stats.alertesStock} ${t('produits_critiques') || 'produit(s) critique(s)'}` : t('aucune_alerte') || 'Aucune alerte',
        danger: stats.alertesStock > 0 },
      { key: 'entrepots', path: '/entrepots', label: t('entrepots') || 'Entrepôts', desc: t('gestion_entrepots') || 'Gestion des entrepôts' },
      { key: 'calculateur', path: '/calculateur', label: t('calculateur') || 'Calculateur', desc: t('moteur_calcul') || 'Moteur de calcul' },
      { key: 'inventaire', path: '/inventaires', label: t('inventaire'), desc: t('gestion_inventaires') || 'Gestion des inventaires' }
    );
  }
  if (hasPermission('Utilisateurs', 'consultation')) {
    menuItems.push({ key: 'utilisateurs', path: '/utilisateurs', label: t('utilisateurs'), desc: t('gestion_acces') || 'Gestion des accès' });
  }
  if (hasPermission('Documents', 'consultation')) {
    menuItems.push(
      { key: 'documents', path: '/documents', label: t('documents'), desc: t('gestion_documentaire') || 'Gestion documentaire' },
      { key: 'archives', path: '/archives', label: t('archives'), desc: t('archivage_numerique') || 'Archivage numérique' }
    );
  }

  const heroStats = [
    { label: t('clients'), value: stats.clients, accent: '#38BDF8' },
    { label: t('commandes'), value: stats.commandes, accent: '#4ADE80' },
    { label: t('devis'), value: stats.devis, accent: '#A78BFA' },
    { label: t('produits'), value: stats.produits, accent: '#FBBF24' },
    { label: t('alertes_stock') || 'Alertes', value: stats.alertesStock, accent: stats.alertesStock > 0 ? '#F87171' : '#94A3B8' },
  ];

  return (
    <div>
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>✕</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span style={styles.successIcon}>✓</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <PageHero
        icon="🏢"
        title={`${t('bonjour') || 'Bonjour'} ${user?.prenom} ${user?.nom}`}
        subtitle={`${user?.role || 'Utilisateur'}${user?.entreprise ? ` · ${user.entreprise}` : ''}`}
        stats={heroStats}
        actions={
          <>
            <Button variant="outline" onClick={exporterDonnees} loading={exporting} size="sm">
              {t('exporter_donnees') || 'Exporter mes données'}
            </Button>
            <Button variant="primary" onClick={loadStats} size="sm">
              {t('actualiser') || 'Actualiser'}
            </Button>
          </>
        }
      />

      <Card
        title={t('acces_rapide') || 'Accès rapide'}
        subtitle={t('gerer_acces_module') || 'Naviguez directement vers un module'}
      >
        <div style={styles.menuGrid}>
          {menuItems.map((item) => {
            const mod = MODULES[item.key] || { icon: '📌', gradient: colors.gradientPrimary };
            return (
              <div
                key={item.key}
                style={{
                  ...styles.menuCard,
                  ...(item.danger ? styles.menuCardDanger : {}),
                }}
                onClick={() => navigate(item.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)';
                }}
              >
                <div style={{ ...styles.menuIconBadge, background: mod.gradient }}>
                  {mod.icon}
                </div>
                <div style={styles.menuContent}>
                  <div style={styles.menuTitle}>
                    {item.label}
                    {item.danger && <Badge variant="danger" style={{ marginLeft: '8px' }}>!</Badge>}
                  </div>
                  <div style={styles.menuDesc}>{item.desc}</div>
                </div>
                <span style={styles.menuChevron}>›</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

const styles = {
  errorContainer: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
    padding: '12px 16px', marginBottom: '16px',
  },
  errorIcon: { color: '#991B1B', fontSize: '16px', fontWeight: 'bold' },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px',
    padding: '12px 16px', marginBottom: '16px',
  },
  successIcon: { color: '#065F46', fontSize: '16px', fontWeight: 'bold' },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },

  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: spacing.md,
  },
  menuCard: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: '16px 18px',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    border: '1px solid #EEF2F6',
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
  },
  menuCardDanger: {
    borderColor: '#FECACA',
    background: 'linear-gradient(180deg, #FFF 0%, #FEF2F2 100%)',
  },
  menuIconBadge: {
    width: '42px',
    height: '42px',
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '19px',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
  },
  menuContent: { flex: 1, minWidth: 0 },
  menuTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
  },
  menuDesc: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  menuChevron: {
    fontSize: '20px',
    color: '#CBD5E1',
    flexShrink: 0,
  },
};