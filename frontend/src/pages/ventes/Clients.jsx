import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export default function Clients() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    nom: '', prenom: '', raison_sociale: '', email: '', telephone: '',
    adresse: '', ville: '', code_postal: '', pays: 'Tunisie',
    matricule_fiscal: '', numero_cin: '', type_client: 'particulier', notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Ventes', 'creation');
  const peutModifier = hasPermission('Ventes', 'modification');
  const peutSupprimer = hasPermission('Ventes', 'suppression');

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await API.get('/clients');
      setClients(res.data.clients || []);
    } catch (err) {
      setError('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (editingId) {
        await API.put(`/clients/${editingId}`, form);
        setSuccess(t('client_modifie'));
      } else {
        await API.post('/clients', form);
        setSuccess(t('client_cree'));
      }
      setIsModalOpen(false);
      setForm({ 
        nom: '', prenom: '', raison_sociale: '', email: '', telephone: '',
        adresse: '', ville: '', code_postal: '', pays: 'Tunisie',
        matricule_fiscal: '', numero_cin: '', type_client: 'particulier', notes: ''
      });
      setEditingId(null);
      loadClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (client) => {
    setForm({
      nom: client.nom || '', prenom: client.prenom || '', raison_sociale: client.raison_sociale || '',
      email: client.email || '', telephone: client.telephone || '', adresse: client.adresse || '',
      ville: client.ville || '', code_postal: client.code_postal || '', pays: client.pays || 'Tunisie',
      matricule_fiscal: client.matricule_fiscal || '', numero_cin: client.numero_cin || '',
      type_client: client.type_client || 'particulier', notes: client.notes || ''
    });
    setEditingId(client.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmation_suppression'))) return;
    try {
      await API.delete(`/clients/${id}`);
      setSuccess(t('client_supprime'));
      loadClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const columns = [
    { key: 'nom', label: t('nom') },
    { key: 'prenom', label: t('prenom') || 'Prénom' },
    { key: 'email', label: t('email') },
    { key: 'telephone', label: t('telephone') },
    { key: 'adresse', label: t('adresse') },
  ];

  const actions = [];
  if (peutModifier) {
    actions.push({ label: t('modifier'), variant: 'primary', onClick: (row) => handleEdit(row) });
  }
  if (peutSupprimer) {
    actions.push({ label: t('supprimer'), variant: 'danger', onClick: (row) => handleDelete(row.id) });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 {t('gestion_clients')}</h1>
          <p style={styles.subtitle}>{t('gerer_clients')}</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            {t('retour')}
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon="+"
              onClick={() => {
                setForm({ 
                  nom: '', prenom: '', raison_sociale: '', email: '', telephone: '',
                  adresse: '', ville: '', code_postal: '', pays: 'Tunisie',
                  matricule_fiscal: '', numero_cin: '', type_client: 'particulier', notes: ''
                });
                setEditingId(null);
                setIsModalOpen(true);
              }}
            >
              {t('nouveau_client')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span>❌</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successContainer}>
          <span>✅</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <Card variant="primary">
        <Table columns={columns} data={clients} loading={loading} actions={actions} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('modifier_client') : t('nouveau_client')}
        size="lg"
        actions={[
          {
            label: editingId ? t('modifier') : t('creer'),
            variant: 'primary',
            onClick: handleSubmit,
            loading: formLoading,
          },
        ]}
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <Input label={t('nom') + ' *'} name="nom" value={form.nom} onChange={handleChange} required disabled={formLoading} />
            <Input label={t('prenom') || 'Prénom'} name="prenom" value={form.prenom} onChange={handleChange} disabled={formLoading} />
            <Input label="Raison sociale" name="raison_sociale" value={form.raison_sociale} onChange={handleChange} disabled={formLoading} />
            <Input label={t('email')} name="email" type="email" value={form.email} onChange={handleChange} disabled={formLoading} />
            <Input label={t('telephone')} name="telephone" value={form.telephone} onChange={handleChange} disabled={formLoading} />
            <Input label={t('adresse')} name="adresse" value={form.adresse} onChange={handleChange} disabled={formLoading} />
            <Input label="Ville" name="ville" value={form.ville} onChange={handleChange} disabled={formLoading} />
            <Input label="Code postal" name="code_postal" value={form.code_postal} onChange={handleChange} disabled={formLoading} />
            <Input label="Pays" name="pays" value={form.pays} onChange={handleChange} disabled={formLoading} />
            <Input label="Matricule fiscal" name="matricule_fiscal" value={form.matricule_fiscal} onChange={handleChange} disabled={formLoading} />
            <Input label="Numéro CIN" name="numero_cin" value={form.numero_cin} onChange={handleChange} disabled={formLoading} />
            <div>
              <label style={styles.label}>Type client</label>
              <select name="type_client" value={form.type_client} onChange={handleChange} style={styles.select} disabled={formLoading}>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
                <option value="association">Association</option>
              </select>
            </div>
          </div>
          <div style={styles.fullWidth}>
            <Input label="Notes" name="notes" value={form.notes} onChange={handleChange} disabled={formLoading} />
          </div>
        </form>
      </Modal>
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
  headerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fullWidth: { marginTop: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#1E293B', marginBottom: '4px' },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
};