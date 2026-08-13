import React, { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';

const STATUTS = [
  { value: 'tous', label: 'Toutes', variant: 'outline' },
  { value: 'en_attente', label: 'En attente', variant: 'warning' },
  { value: 'confirmee', label: 'Confirmées', variant: 'primary' },
  { value: 'livree', label: 'Livrées', variant: 'success' },
];

export default function ClientCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const navigate = useNavigate();

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/client/commandes');
      setCommandes(res.data.commandes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const commandesFiltrees = useMemo(() => {
    return commandes.filter((c) => {
      const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
      const terme = search.trim().toLowerCase();
      const matchSearch =
        !terme ||
        (c.reference || '').toLowerCase().includes(terme) ||
        String(c.id).includes(terme);
      return matchStatut && matchSearch;
    });
  }, [commandes, search, filtreStatut]);

  const statutInfo = (statut) => {
    const map = {
      livree: { label: 'Livrée', variant: 'success', icon: '✅' },
      confirmee: { label: 'Confirmée', variant: 'primary'  },
      en_attente: { label: 'En attente', variant: 'warning' },
      annulee: { label: 'Annulée', variant: 'danger', icon: '✕' },
    };
    return map[statut] || map.en_attente;
  };

  if (loading) return <LoadingSpinner size="lg" text="Chargement de vos commandes..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mes commandes</h1>
          <p style={styles.subtitle}>{commandes.length} commande(s) au total</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/client/produits')}>
          + Nouvelle commande
        </Button>
      </div>

      {/* Filtres statut */}
      <div style={styles.chipsRow}>
        {STATUTS.map((s) => {
          const count = s.value === 'tous' ? commandes.length : commandes.filter((c) => c.statut === s.value).length;
          const active = filtreStatut === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setFiltreStatut(s.value)}
              style={{
                ...styles.chip,
                ...(active ? styles.chipActive : {}),
              }}
            >
              {s.label} <span style={styles.chipCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Recherche */}
      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher par référence ou numéro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        {search && (
          <button style={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {commandesFiltrees.length === 0 ? (
        <EmptyState
          icon="📭"
          title={commandes.length === 0 ? 'Aucune commande pour le moment' : 'Aucun résultat'}
          description={
            commandes.length === 0
              ? 'Passez votre première commande depuis notre catalogue.'
              : 'Essayez un autre terme de recherche ou changez de filtre.'
          }
          action={
            commandes.length === 0 && (
              <Button variant="primary" onClick={() => navigate('/client/produits')}>
                Voir le catalogue
              </Button>
            )
          }
        />
      ) : (
        <div style={styles.list}>
          {commandesFiltrees.map((cmd) => {
            const info = statutInfo(cmd.statut);
            return (
              <div
                key={cmd.id}
                style={styles.cmdCard}
                onClick={() => navigate(`/client/commande/${cmd.id}`)}
              >
                <div style={styles.cmdIcon}>{info.icon}</div>
                <div style={styles.cmdInfo}>
                  <div style={styles.cmdRef}>Commande #{cmd.reference || cmd.id}</div>
                  <div style={styles.cmdDate}>
                    {new Date(cmd.date_commande).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </div>
                </div>
                <div style={styles.cmdRight}>
                  <Badge variant={info.variant}>{info.label}</Badge>
                  <span style={styles.cmdTotal}>{cmd.total_ttc || cmd.total} €</span>
                  <span style={styles.chevron}>›</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
  },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748B', marginTop: '4px' },
  chipsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  chip: {
    padding: '8px 16px', borderRadius: '20px', border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px',
  },
  chipActive: { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' },
  chipCount: { fontSize: '11px', opacity: 0.7 },
  searchWrapper: {
    position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '20px',
    backgroundColor: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '2px 14px',
  },
  searchIcon: { fontSize: '14px', marginRight: '8px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: '14px' },
  clearBtn: { border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  cmdCard: {
    display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px',
    backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8EDF2',
    cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  cmdIcon: { fontSize: '26px', width: '44px', textAlign: 'center' },
  cmdInfo: { flex: 1 },
  cmdRef: { fontWeight: 600, color: '#0F172A', fontSize: '14px' },
  cmdDate: { fontSize: '12px', color: '#94A3B8', marginTop: '2px' },
  cmdRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  cmdTotal: { fontWeight: 700, color: '#0F172A', fontSize: '14px', minWidth: '70px', textAlign: 'right' },
  chevron: { fontSize: '20px', color: '#CBD5E1' },
};