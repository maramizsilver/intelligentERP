// src/pages/admin/Utilisateurs.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';  
const ACTIONS = [
  { key: 'consultation', label: ' Voir' },
  { key: 'creation', label: ' Créer' },
  { key: 'modification', label: ' Modifier' },
  { key: 'suppression', label: ' Supprimer' },
  { key: 'validation', label: ' Valider' },
  { key: 'export', label: ' Exporter' }
];

const MODULE_ICONS = {
  Ventes: 'Ventes',
  Achats: 'Ahcats',
  Stock: 'Stock',
  Finance: 'Finance',
  Utilisateurs: 'user',
  Documents: 'Doc'
};

export default function Utilisateurs() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [ongletPrincipal, setOngletPrincipal] = useState('roles');
  const [loading, setLoading] = useState(false);

  // Rôles
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [nouveauRoleNom, setNouveauRoleNom] = useState('');
  const [afficherFormRole, setAfficherFormRole] = useState(false);

  // Utilisateurs
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [afficherFormUser, setAfficherFormUser] = useState(false);
  const [ongletCreation, setOngletCreation] = useState('interne');
  const [formUser, setFormUser] = useState({ nom: '', prenom: '', email: '', password: '', role_id: '', client_id: '' });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const peutVoir = hasPermission('Utilisateurs', 'consultation');
  const peutCreer = hasPermission('Utilisateurs', 'creation');
  const peutModifier = hasPermission('Utilisateurs', 'modification');
  const peutSupprimer = hasPermission('Utilisateurs', 'suppression');

  useEffect(() => {
    loadRoles();
    loadUsers();
    API.get('/clients').then(res => setClients(res.data.clients || [])).catch(() => {});
  }, []);

  const flashMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3500); };
  const flashError = (msg) => { setError(msg); setTimeout(() => setError(''), 4500); };

  const loadRoles = async () => {
    try {
      const res = await API.get('/roles');
      setRoles(res.data.roles || []);
    } catch (err) {
      flashError('Impossible de charger les rôles');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data.users || []);
    } catch (err) {
      // silencieux
    }
  };

  const selectionnerRole = async (roleId) => {
    setSelectedRoleId(roleId);
    setPermsLoading(true);
    try {
      const res = await API.get(`/roles/${roleId}/permissions`);
      setPermissions(res.data.permissions || []);
    } catch (err) {
      flashError('Impossible de charger les permissions de ce rôle');
    } finally {
      setPermsLoading(false);
    }
  };

  const toggleCase = async (moduleRow, actionKey) => {
    const nouvelleValeur = !moduleRow[actionKey];
    setPermissions(prev => prev.map(m => m.module_id === moduleRow.module_id ? { ...m, [actionKey]: nouvelleValeur } : m));
    try {
      await API.put(`/roles/${selectedRoleId}/permissions`, { module_id: moduleRow.module_id, ...moduleRow, [actionKey]: nouvelleValeur });
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
      setPermissions(prev => prev.map(m => m.module_id === moduleRow.module_id ? { ...m, [actionKey]: !nouvelleValeur } : m));
    }
  };

  const creerRole = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    if (!nouveauRoleNom.trim()) {
      flashError('Le nom du rôle est requis');
      setFormLoading(false);
      return;
    }
    try {
      await API.post('/roles', { nom: nouveauRoleNom.trim() });
      setNouveauRoleNom('');
      setAfficherFormRole(false);
      flashMessage(' Rôle créé');
      loadRoles();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const supprimerRole = async (roleId) => {
    if (!window.confirm("Supprimer ce rôle ? Les comptes qui l'utilisent perdront leurs accès.")) return;
    try {
      await API.delete(`/roles/${roleId}`);
      if (selectedRoleId === roleId) { setSelectedRoleId(null); setPermissions([]); }
      flashMessage(' Rôle supprimé');
      loadRoles();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleFormUserChange = (e) => setFormUser({ ...formUser, [e.target.name]: e.target.value });

  const creerUtilisateur = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (ongletCreation === 'interne') {
        if (!formUser.role_id) {
          flashError('Veuillez choisir un rôle');
          setFormLoading(false);
          return;
        }
        await API.post('/auth/users', { nom: formUser.nom, prenom: formUser.prenom, email: formUser.email, password: formUser.password, role_id: formUser.role_id });
      } else {
        if (!formUser.client_id) {
          flashError('Veuillez choisir un client');
          setFormLoading(false);
          return;
        }
        await API.post('/auth/users/externes', { nom: formUser.nom, prenom: formUser.prenom, email: formUser.email, password: formUser.password, client_id: formUser.client_id });
      }
      setFormUser({ nom: '', prenom: '', email: '', password: '', role_id: '', client_id: '' });
      setAfficherFormUser(false);
      flashMessage(' Compte créé avec succès');
      loadUsers();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      flashError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || 'Erreur'));
    } finally {
      setFormLoading(false);
    }
  };

  const changerRoleUtilisateur = async (userId, roleId) => {
    if (!roleId) return;
    try {
      await API.put(`/auth/users/${userId}/role`, { role_id: roleId });
      flashMessage(' Rôle mis à jour');
      loadUsers();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  if (!peutVoir) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}> Accès refusé</h1>
          <p style={styles.subtitle}>Vous n'avez pas la permission de consulter cette page.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Utilisateurs & Rôles</h1>
          <p style={styles.subtitle}>Gérez qui a accès à quoi, module par module</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
          Retour
        </Button>
      </div>

      {message && (
        <div style={styles.successContainer}>
          <span>Done</span>
          <span style={styles.successText}>{message}</span>
        </div>
      )}
      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.segmentedControl}>
        <button
          style={{ ...styles.segment, ...(ongletPrincipal === 'roles' ? styles.segmentActive : {}) }}
          onClick={() => setOngletPrincipal('roles')}
        >
          Rôles & permissions
        </button>
        <button
          style={{ ...styles.segment, ...(ongletPrincipal === 'comptes' ? styles.segmentActive : {}) }}
          onClick={() => setOngletPrincipal('comptes')}
        >
           Comptes utilisateurs ({users.length})
        </button>
      </div>

      {ongletPrincipal === 'roles' ? (
        <div style={styles.twoColumns}>
          <Card title=" Rôles de l'entreprise" variant="primary">
            <div style={styles.cardHeaderRow}>
              <span style={styles.cardSubtitle}>Gérez les rôles personnalisés</span>
              {peutCreer && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setAfficherFormRole(v => !v)}
                  icon={afficherFormRole ? '✕' : '+'}
                >
                  {afficherFormRole ? 'Fermer' : 'Nouveau rôle'}
                </Button>
              )}
            </div>

            {afficherFormRole && (
              <form onSubmit={creerRole} style={styles.inlineForm}>
                <input
                  style={styles.input}
                  placeholder="Ex: Responsable Achats"
                  value={nouveauRoleNom}
                  onChange={(e) => setNouveauRoleNom(e.target.value)}
                  autoFocus
                  disabled={formLoading}
                />
                <Button type="submit" size="sm" loading={formLoading}>
                  Créer
                </Button>
              </form>
            )}

            {roles.length === 0 ? (
              <EmptyState  title="Aucun rôle" description="Créez votre premier rôle personnalisé." />
            ) : (
              <ul style={styles.roleList}>
                {roles.map(r => (
                  <li
                    key={r.id}
                    style={{ ...styles.roleItem, ...(selectedRoleId === r.id ? styles.roleItemActive : {}) }}
                    onClick={() => selectionnerRole(r.id)}
                  >
                    <span style={styles.roleItemLabel}>
                      {r.nom}
                      {r.est_admin_entreprise && <Badge variant="warning" style={{ marginLeft: '8px' }}> Admin</Badge>}
                    </span>
                    {!r.est_admin_entreprise && peutSupprimer && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); supprimerRole(r.id); }}
                      >
                        ✕
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={selectedRoleId ? `Permissions — ${roles.find(r => r.id === selectedRoleId)?.nom || ''}` : 'Permissions par module'}
            variant="secondary"
          >
            {!selectedRoleId ? (
              <EmptyState
                
                title="Sélectionnez un rôle"
                description="Cliquez sur un rôle à gauche pour configurer ses permissions."
              />
            ) : permsLoading ? (
              <LoadingSpinner size="md" text="Chargement des permissions..." />
            ) : (
              <div style={styles.permGrid}>
                {permissions.map(m => (
                  <div key={m.module_id} style={styles.moduleBlock}>
                    <div style={styles.moduleTitle}>
                      <span>{MODULE_ICONS[m.module_nom] }</span> {m.module_nom}
                    </div>
                    <div style={styles.actionsRow}>
                      {ACTIONS.map(a => (
                        <label
                          key={a.key}
                          style={{ ...styles.actionPill, ...(m[a.key] ? styles.actionPillActive : {}) }}
                        >
                          <input
                            type="checkbox"
                            checked={!!m[a.key]}
                            onChange={() => peutModifier && toggleCase(m, a.key)}
                            disabled={!peutModifier}
                            style={styles.hiddenCheckbox}
                          />
                          <span>{a.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card title="👤 Comptes de l'entreprise" variant="primary">
          <div style={styles.cardHeaderRow}>
            <span style={styles.cardSubtitle}>Gérez les comptes utilisateurs</span>
            {peutCreer && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setAfficherFormUser(v => !v)}
                icon={afficherFormUser ? '✕' : '+'}
              >
                {afficherFormUser ? 'Fermer' : 'Nouveau compte'}
              </Button>
            )}
          </div>

          {afficherFormUser && (
            <div style={styles.userFormBox}>
              <div style={styles.tabs}>
                <button
                  style={{ ...styles.tabBtn, ...(ongletCreation === 'interne' ? styles.tabBtnActive : {}) }}
                  onClick={() => setOngletCreation('interne')}
                >
                  👤 Collaborateur interne
                </button>
                <button
                  style={{ ...styles.tabBtn, ...(ongletCreation === 'externe' ? styles.tabBtnActive : {}) }}
                  onClick={() => setOngletCreation('externe')}
                >
                   Compte externe (client)
                </button>
              </div>

              <form onSubmit={creerUtilisateur} style={styles.userFormGrid}>
                <Input
                  name="nom"
                  placeholder="Nom"
                  value={formUser.nom}
                  onChange={handleFormUserChange}
                  required
                  disabled={formLoading}
                />
                <Input
                  name="prenom"
                  placeholder="Prénom"
                  value={formUser.prenom}
                  onChange={handleFormUserChange}
                  required
                  disabled={formLoading}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formUser.email}
                  onChange={handleFormUserChange}
                  required
                  disabled={formLoading}
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Mot de passe"
                  value={formUser.password}
                  onChange={handleFormUserChange}
                  required
                  minLength={8}
                  disabled={formLoading}
                />

                {ongletCreation === 'interne' ? (
                  <select style={styles.select} name="role_id" value={formUser.role_id} onChange={handleFormUserChange} required disabled={formLoading}>
                    <option value="">-- Choisir un rôle --</option>
                    {roles.filter(r => !r.est_admin_entreprise).map(r => (
                      <option key={r.id} value={r.id}>{r.nom}</option>
                    ))}
                  </select>
                ) : (
                  <select style={styles.select} name="client_id" value={formUser.client_id} onChange={handleFormUserChange} required disabled={formLoading}>
                    <option value="">-- Choisir un client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                )}

                <Button type="submit" variant="primary" loading={formLoading}>
                  Créer le compte
                </Button>
              </form>
            </div>
          )}

          {users.length === 0 ? (
            <EmptyState icon="📭" title="Aucun compte" description="Créez votre premier compte utilisateur." />
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Rôle</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={styles.td}>{u.prenom} {u.nom}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <Badge variant={u.is_external ? 'secondary' : 'primary'}>
                        {u.is_external ? 'Externe' : 'Interne'}
                      </Badge>
                    </td>
                    <td style={styles.td}>
                      {u.is_external ? (
                        <span style={styles.mutedText}>Portail client</span>
                      ) : peutModifier ? (
                        <select
                          style={styles.selectInline}
                          value={u.role_id || ''}
                          onChange={(e) => changerRoleUtilisateur(u.id, e.target.value)}
                        >
                          {roles.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                        </select>
                      ) : (
                        u.role_nom || '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: { color: '#991B1B', fontSize: '13px', fontWeight: 500 },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  successText: { color: '#065F46', fontSize: '13px', fontWeight: 500 },
  segmentedControl: {
    display: 'inline-flex',
    backgroundColor: '#E2E8F0',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '20px',
    gap: '4px',
  },
  segment: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#475569',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 340px) 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardSubtitle: { fontSize: '13px', color: '#64748B' },
  inlineForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#F8FAFC',
    ':focus': {
      borderColor: '#0EA5E9',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
    },
  },
  selectInline: {
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '13px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
  },
  roleList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  roleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    cursor: 'pointer',
    fontSize: '14px',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#F1F5F9',
    },
  },
  roleItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0EA5E9',
  },
  roleItemLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 500,
    color: '#1E293B',
  },
  mutedText: { color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' },
  permGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  moduleBlock: {
    border: '1px solid #F1F5F9',
    borderRadius: '10px',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#F8FAFC',
    },
  },
  moduleTitle: {
    fontWeight: 600,
    color: '#0F172A',
    fontSize: '14px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  actionPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
    fontSize: '12px',
    cursor: 'pointer',
    userSelect: 'none',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#E2E8F0',
    },
  },
  actionPillActive: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    border: '1px solid #86EFAC',
  },
  hiddenCheckbox: { display: 'none' },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px',
  },
  tabBtn: {
    flex: 1,
    padding: '8px',
    border: '2px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#475569',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#F1F5F9',
    },
  },
  tabBtnActive: {
    backgroundColor: '#0EA5E9',
    color: '#FFFFFF',
    borderColor: '#0EA5E9',
  },
  userFormBox: {
    backgroundColor: '#F8FAFC',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '18px',
  },
  userFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    alignItems: 'end',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    borderBottom: '2px solid #E2E8F0',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 600,
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #F1F5F9',
    fontSize: '14px',
  },
};