import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const ACTIONS = [
  { key: 'consultation', label: 'Voir'} ,
  { key: 'creation', label: 'Créer' },
  { key: 'modification', label: 'Modifier' },
  { key: 'suppression', label: 'Supprimer' },
  { key: 'validation', label: 'Valider' },
  { key: 'export', label: 'Exporter'}
];
  
const MODULE_ICONS = {
  Ventes: '🛒', Achats: '🏭', Stock: '📦', Finance: '💰', Utilisateurs: '🔐'
};

export default function Utilisateurs() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [ongletPrincipal, setOngletPrincipal] = useState('roles'); // 'roles' | 'comptes'

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [nouveauRoleNom, setNouveauRoleNom] = useState('');
  const [afficherFormRole, setAfficherFormRole] = useState(false);

  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [afficherFormUser, setAfficherFormUser] = useState(false);
  const [ongletCreation, setOngletCreation] = useState('interne');
  const [formUser, setFormUser] = useState({ nom: '', prenom: '', email: '', password: '', role_id: '', client_id: '' });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      // silencieux si pas la permission — la page gère déjà l'accès plus bas
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
      flashError(err.response?.data?.message || 'Erreur lors de la mise à jour');
      setPermissions(prev => prev.map(m => m.module_id === moduleRow.module_id ? { ...m, [actionKey]: !nouvelleValeur } : m));
    }
  };

  const creerRole = async (e) => {
    e.preventDefault();
    if (!nouveauRoleNom.trim()) return flashError('Le nom du rôle est requis');
    try {
      await API.post('/roles', { nom: nouveauRoleNom.trim() });
      setNouveauRoleNom('');
      setAfficherFormRole(false);
      flashMessage('Rôle créé. Configurez ses permissions ci-dessous.');
      loadRoles();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  const supprimerRole = async (roleId) => {
    if (!window.confirm("Supprimer ce rôle ? Les comptes qui l'utilisent perdront leurs accès.")) return;
    try {
      await API.delete(`/roles/${roleId}`);
      if (selectedRoleId === roleId) { setSelectedRoleId(null); setPermissions([]); }
      flashMessage('Rôle supprimé');
      loadRoles();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleFormUserChange = (e) => setFormUser({ ...formUser, [e.target.name]: e.target.value });

  const creerUtilisateur = async (e) => {
    e.preventDefault();
    try {
      if (ongletCreation === 'interne') {
        if (!formUser.role_id) return flashError('Veuillez choisir un rôle');
        await API.post('/auth/users', { nom: formUser.nom, prenom: formUser.prenom, email: formUser.email, password: formUser.password, role_id: formUser.role_id });
      } else {
        if (!formUser.client_id) return flashError('Veuillez choisir un client');
        await API.post('/auth/users/externes', { nom: formUser.nom, prenom: formUser.prenom, email: formUser.email, password: formUser.password, client_id: formUser.client_id });
      }
      setFormUser({ nom: '', prenom: '', email: '', password: '', role_id: '', client_id: '' });
      setAfficherFormUser(false);
      flashMessage(' Compte créé avec succès');
      loadUsers();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      flashError(apiErrors ? apiErrors.join(', ') : (err.response?.data?.message || 'Erreur'));
    }
  };

  const changerRoleUtilisateur = async (userId, roleId) => {
    if (!roleId) return;
    try {
      await API.put(`/auth/users/${userId}/role`, { role_id: roleId });
      flashMessage('Rôle mis à jour');
      loadUsers();
    } catch (err) {
      flashError(err.response?.data?.message || 'Erreur');
    }
  };

  if (!peutVoir) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>Vous n'avez pas la permission de consulter cette page.</div>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}> Utilisateurs & rôles</h2>
          <p style={styles.subtitle}>Gérez qui a accès à quoi, module par module.</p>
        </div>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Retour</button>
      </div>

      {message && <div style={styles.successBanner}>{message}</div>}
      {error && <div style={styles.errorBanner}>{error}</div>}

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
          👤 Comptes utilisateurs ({users.length})
        </button>
      </div>

      {ongletPrincipal === 'roles' ? (
        <div style={styles.twoColumns}>
          <div style={styles.card}>
            <div style={styles.cardHeaderRow}>
              <h3 style={styles.cardTitle}>Rôles de l'entreprise</h3>
              {peutCreer && (
                <button style={styles.btnAddSmall} onClick={() => setAfficherFormRole(v => !v)}>
                  {afficherFormRole ? '✕' : '+ Nouveau'}
                </button>
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
                />
                <button style={styles.btnPrimarySmall} type="submit">Créer</button>
              </form>
            )}

            {roles.length === 0 ? (
              <p style={styles.empty}>Aucun rôle personnalisé pour l'instant.</p>
            ) : (
              <ul style={styles.roleList}>
                {roles.map(r => (
                  <li
                    key={r.id}
                    style={{ ...styles.roleItem, ...(selectedRoleId === r.id ? styles.roleItemActive : {}) }}
                    onClick={() => selectionnerRole(r.id)}
                  >
                    <span style={styles.roleItemLabel}>
                      {r.nom}{r.est_admin_entreprise && <span style={styles.crownBadge}>👑 admin</span>}
                    </span>
                    {!r.est_admin_entreprise && peutSupprimer && (
                      <button style={styles.btnDeleteSmall} onClick={(e) => { e.stopPropagation(); supprimerRole(r.id); }}>✕</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              {selectedRoleId ? `Permissions — ${roles.find(r => r.id === selectedRoleId)?.nom || ''}` : 'Permissions par module'}
            </h3>
            {!selectedRoleId ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>👈</span>
                <p style={styles.empty}>Sélectionnez un rôle à gauche pour configurer ses permissions.</p>
              </div>
            ) : permsLoading ? (
              <p style={styles.empty}>Chargement...</p>
            ) : (
              <div style={styles.permGrid}>
                {permissions.map(m => (
                  <div key={m.module_id} style={styles.moduleBlock}>
                    <div style={styles.moduleTitle}>
                      <span>{MODULE_ICONS[m.module_nom] || '📁'}</span> {m.module_nom}
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
                          <span>{a.icon} {a.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardTitle}>Comptes de l'entreprise</h3>
            {peutCreer && (
              <button style={styles.btnAddSmall} onClick={() => setAfficherFormUser(v => !v)}>
                {afficherFormUser ? '✕' : '+ Nouveau compte'}
              </button>
            )}
          </div>

          {afficherFormUser && (
            <div style={styles.userFormBox}>
              <div style={styles.tabs}>
                <button
                  style={{ ...styles.tabBtn, ...(ongletCreation === 'interne' ? styles.tabBtnActive : {}) }}
                  onClick={() => setOngletCreation('interne')}
                >
                  Collaborateur interne
                </button>
                <button
                  style={{ ...styles.tabBtn, ...(ongletCreation === 'externe' ? styles.tabBtnActive : {}) }}
                  onClick={() => setOngletCreation('externe')}
                >
                  Compte externe (client)
                </button>
              </div>

              <form onSubmit={creerUtilisateur} style={styles.userFormGrid}>
                <input style={styles.input} name="nom" placeholder="Nom" value={formUser.nom} onChange={handleFormUserChange} required />
                <input style={styles.input} name="prenom" placeholder="Prénom" value={formUser.prenom} onChange={handleFormUserChange} required />
                <input style={styles.input} name="email" type="email" placeholder="Email" value={formUser.email} onChange={handleFormUserChange} required />
                <input style={styles.input} name="password" type="password" placeholder="Mot de passe" value={formUser.password} onChange={handleFormUserChange} required minLength={8} />

                {ongletCreation === 'interne' ? (
                  <select style={styles.input} name="role_id" value={formUser.role_id} onChange={handleFormUserChange} required>
                    <option value="">-- Choisir un rôle --</option>
                    {roles.filter(r => !r.est_admin_entreprise).map(r => (
                      <option key={r.id} value={r.id}>{r.nom}</option>
                    ))}
                  </select>
                ) : (
                  <select style={styles.input} name="client_id" value={formUser.client_id} onChange={handleFormUserChange} required>
                    <option value="">-- Choisir un client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                )}

                <button style={styles.btnPrimarySmall} type="submit">Créer le compte</button>
              </form>
            </div>
          )}

          {users.length === 0 ? (
            <p style={styles.empty}>Aucun compte pour l'instant.</p>
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
                      <span style={{ ...styles.badge, ...(u.is_external ? styles.badgeExterne : styles.badgeInterne) }}>
                        {u.is_external ? 'Externe' : 'Interne'}
                      </span>
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
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  title: { color: '#0f172a', margin: 0, fontSize: '22px' },
  subtitle: { color: '#64748b', margin: '4px 0 0', fontSize: '13px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  errorBanner: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  successBanner: { backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },

  segmentedControl: { display: 'inline-flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '4px', marginBottom: '20px', gap: '4px' },
  segment: { padding: '8px 16px', border: 'none', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '600' },
  segmentActive: { backgroundColor: 'white', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },

  twoColumns: { display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: '20px', alignItems: 'start' },
  card: { backgroundColor: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  cardTitle: { margin: 0, color: '#0f172a', fontSize: '16px' },

  btnAddSmall: { padding: '6px 12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  inlineForm: { display: 'flex', gap: '8px', marginBottom: '14px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  btnPrimarySmall: { padding: '10px 16px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' },

  roleList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' },
  roleItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '14px', border: '1px solid transparent' },
  roleItemActive: { backgroundColor: '#eff6ff', borderColor: '#0ea5e9' },
  roleItemLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#1e293b' },
  crownBadge: { fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '10px' },
  btnDeleteSmall: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' },

  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyIcon: { fontSize: '28px', display: 'block', marginBottom: '8px' },
  empty: { color: '#94a3b8', fontSize: '14px', margin: 0 },

  permGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  moduleBlock: { border: '1px solid #f1f5f9', borderRadius: '12px', padding: '14px 16px' },
  moduleTitle: { fontWeight: '600', color: '#0f172a', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
  actionsRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  actionPill: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', userSelect: 'none', border: '1px solid transparent' },
  actionPillActive: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  hiddenCheckbox: { display: 'none' },

  tabs: { display: 'flex', gap: '8px', marginBottom: '14px' },
  tabBtn: { flex: 1, padding: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569' },
  tabBtnActive: { backgroundColor: '#0ea5e9', color: 'white', borderColor: '#0ea5e9' },
  userFormBox: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '18px' },
  userFormGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', alignItems: 'end' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0', color: '#334155', fontSize: '13px' },
  td: { padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
  badgeInterne: { backgroundColor: '#e0f2fe', color: '#075985' },
  badgeExterne: { backgroundColor: '#fce7f3', color: '#9d174d' },
  selectInline: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' },
  mutedText: { color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }
};
