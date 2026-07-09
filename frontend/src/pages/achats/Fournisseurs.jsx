
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export default function Fournisseurs() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '' });
  const [formLoading, setFormLoading] = useState(false);

  const peutCreer = hasPermission('Achats', 'creation');
  const peutModifier = hasPermission('Achats', 'modification');
  const peutSupprimer = hasPermission('Achats', 'suppression');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/fournisseurs');
      setFournisseurs(res.data.fournisseurs || []);
    } catch (err) {
      setError('Impossible de charger les fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (editingId) {
        await API.put(`/fournisseurs/${editingId}`, form);
        setSuccess(' Fournisseur mis à jour avec succès');
      } else {
        await API.post('/fournisseurs', form);
        setSuccess(' Fournisseur créé avec succès');
      }
      setIsModalOpen(false);
      setForm({ nom: '', email: '', telephone: '', adresse: '' });
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (fournisseur) => {
    setForm({
      nom: fournisseur.nom,
      email: fournisseur.email || '',
      telephone: fournisseur.telephone || '',
      adresse: fournisseur.adresse || '',
    });
    setEditingId(fournisseur.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      await API.delete(`/fournisseurs/${id}`);
      setSuccess(' Fournisseur supprimé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'adresse', label: 'Adresse' },
  ];

  const actions = [];
  if (peutModifier) {
    actions.push({ label: 'modif', variant: 'primary', onClick: (row) => handleEdit(row) });
  }
  if (peutSupprimer) {
    actions.push({ label: 'suppr', variant: 'danger', onClick: (row) => handleDelete(row.id) });
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}> Gestion des Fournisseurs</h1>
          <p style={styles.subtitle}>Gérez tous vos fournisseurs</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} icon="←">
            Retour
          </Button>
          {peutCreer && (
            <Button
              variant="primary"
              icon="+"
              onClick={() => {
                setForm({ nom: '', email: '', telephone: '', adresse: '' });
                setEditingId(null);
                setIsModalOpen(true);
              }}
            >
              Nouveau fournisseur
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
          <span>done</span>
          <span style={styles.successText}>{success}</span>
        </div>
      )}

      <Card title=" Liste des fournisseurs" variant="primary">
        <Table columns={columns} data={fournisseurs} loading={loading} actions={actions} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? ' Modifier le fournisseur' : ' Nouveau fournisseur'}
        size="md"
        actions={[
          {
            label: editingId ? 'Mettre à jour' : 'Créer',
            variant: 'primary',
            onClick: handleSubmit,
            loading: formLoading,
          },
        ]}
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <Input label="Nom *" name="nom" value={form.nom} onChange={handleChange} required disabled={formLoading} />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} disabled={formLoading} />
            <Input label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} disabled={formLoading} />
            <Input label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} disabled={formLoading} />
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
};