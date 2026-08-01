// frontend/src/pages/documents/GenerationDocuments.jsx
// ---------------------------------------------------------------------------
// Page transversale de génération de documents Word à partir de modèles.
// Utilisable depuis n'importe quel module (bouton "Générer le devis en Word"
// dans Devis.jsx peut simplement naviguer ici avec les bons paramètres, ou
// appeler directement documentIntelligenceApi.genererDocument()).
// ---------------------------------------------------------------------------
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import documentIntelligenceApi from '../../services/documentIntelligence.api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SmartDatePicker from '../../components/common/SmartDatePicker';
import SmartTextArea from '../../components/common/SmartTextArea';
import { colors } from '../../styles/theme';

const TYPES_DOCUMENT = [
    { value: 'devis', label: 'Devis' },
    { value: 'facture', label: 'Facture' },
    { value: 'bon_commande', label: 'Bon de commande' },
    { value: 'contrat', label: 'Contrat' },
    { value: 'autre', label: 'Autre' }
];

const TYPES_ENTITE_AUTOFILL = [
    { value: 'client', label: 'Client' },
    { value: 'fournisseur', label: 'Fournisseur' },
    { value: 'produit', label: 'Produit' },
    { value: 'entreprise', label: 'Mon entreprise' }
];

export default function GenerationDocuments() {
    const navigate = useNavigate();

    const [typeDocument, setTypeDocument] = useState('devis');
    const [modeles, setModeles] = useState([]);
    const [nomModele, setNomModele] = useState('');
    const [tags, setTags] = useState([]);
    const [donnees, setDonnees] = useState({});

    const [typeEntiteAutofill, setTypeEntiteAutofill] = useState('client');
    const [identifiantAutofill, setIdentifiantAutofill] = useState('');

    const [estDocumentFinancier, setEstDocumentFinancier] = useState(false);
    const [langueMontants, setLangueMontants] = useState('fr');
    const [deviseMontants, setDeviseMontants] = useState('TND');

    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState('');
    const [succes, setSucces] = useState('');
    const [documentGenereId, setDocumentGenereId] = useState(null);

    // Charge les modèles disponibles à chaque changement de type de document
    useEffect(() => {
        setNomModele('');
        setTags([]);
        documentIntelligenceApi.listerModeles(typeDocument)
            .then(res => setModeles(res.data.modeles || []))
            .catch(() => setModeles([]));
    }, [typeDocument]);

    // Charge les balises {tag} du modèle sélectionné pour construire le formulaire
    useEffect(() => {
        if (!nomModele) { setTags([]); return; }
        documentIntelligenceApi.tagsDuModele(typeDocument, nomModele)
            .then(res => setTags(res.data.tags || []))
            .catch(() => setTags([]));
    }, [typeDocument, nomModele]);

    const handleChampChange = (tag, valeur) => {
        setDonnees(prev => ({ ...prev, [tag]: valeur }));
    };

    // Saisie intelligente : récupère les données déjà connues d'un client,
    // fournisseur, produit ou de l'entreprise, et préremplit les champs
    // correspondants du formulaire (évite la double saisie).
    const lancerAutoRemplissage = useCallback(async () => {
        if (!identifiantAutofill.trim()) return;
        setErreur('');
        try {
            const res = await documentIntelligenceApi.autoRemplir(typeEntiteAutofill, identifiantAutofill.trim());
            if (!res.data.trouve) {
                setErreur("Aucun enregistrement trouvé pour cet identifiant.");
                return;
            }
            setDonnees(prev => ({ ...prev, ...res.data.tags }));
            setSucces('Champs préremplis automatiquement depuis la base.');
            setTimeout(() => setSucces(''), 3000);
        } catch (err) {
            setErreur(err.response?.data?.message || "Erreur lors de l'auto-remplissage");
        }
    }, [typeEntiteAutofill, identifiantAutofill]);

    const handleGenerer = async (e) => {
        e.preventDefault();
        setErreur('');
        setSucces('');
        setDocumentGenereId(null);

        if (!nomModele) { setErreur('Veuillez sélectionner un modèle.'); return; }

        setChargement(true);
        try {
            const payload = {
                typeDocument,
                nomModele,
                donnees: {
                    ...donnees,
                    ...(estDocumentFinancier ? {
                        montantHT: Number(donnees.montantHT || 0),
                        montantTVA: Number(donnees.montantTVA || 0),
                        montantTTC: Number(donnees.montantTTC || 0)
                    } : {})
                },
                estDocumentFinancier,
                langueMontants,
                deviseMontants
            };
            const res = await documentIntelligenceApi.genererDocument(payload);
            setSucces('Document généré avec succès.');
            setDocumentGenereId(res.data.documentId);
            if (res.data.tagsManquants?.length > 0) {
                setErreur(`Attention, champs non renseignés dans le document : ${res.data.tagsManquants.join(', ')}`);
            }
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la génération du document');
        } finally {
            setChargement(false);
        }
    };

    const telechargerDocumentGenere = async () => {
        try {
            const res = await API.get(`/documents/${documentGenereId}/telecharger`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${typeDocument}_${documentGenereId}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setErreur('Erreur lors du téléchargement');
        }
    };

    // Champs qui ne sont pas des montants (ceux-ci ont leurs propres inputs dédiés
    // avec calcul automatique du "en toutes lettres")
    const tagsChampsMontant = ['montantHT', 'montantTVA', 'montantTTC'];
    const tagsAffiches = tags.filter(t => !tagsChampsMontant.includes(t) && !t.endsWith('_lettres'));

    return (
        <div>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Génération de documents Word</h1>
                    <p style={styles.subtitle}>Devis, factures, bons de commande et contrats, remplis automatiquement</p>
                </div>
                <Button variant="secondary" icon="←" onClick={() => navigate('/documents')}>Retour</Button>
            </div>

            {erreur && <div style={styles.alertError}>{erreur}</div>}
            {succes && <div style={styles.alertSuccess}>{succes}</div>}

            <Card title="1. Choix du modèle" variant="primary" style={{ marginBottom: 20 }}>
                <div style={styles.grid2}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Type de document</label>
                        <select style={styles.select} value={typeDocument} onChange={(e) => setTypeDocument(e.target.value)}>
                            {TYPES_DOCUMENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Modèle</label>
                        <select style={styles.select} value={nomModele} onChange={(e) => setNomModele(e.target.value)}>
                            <option value="">— Sélectionner un modèle —</option>
                            {modeles.map(m => (
                                <option key={m.nom} value={m.nom}>{m.nom} {m.portee === 'commun' ? '(commun)' : '(entreprise)'}</option>
                            ))}
                        </select>
                        {modeles.length === 0 && nomModele === '' && (
                            <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                                Aucun modèle pour ce type. Déposez un fichier .docx dans backend/templates/documents/.
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {nomModele && (
                <>
                    <Card title="2. Saisie intelligente (anti double-saisie)" variant="success" style={{ marginBottom: 20 }}>
                        <div style={styles.grid3}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Type d'enregistrement</label>
                                <select style={styles.select} value={typeEntiteAutofill} onChange={(e) => setTypeEntiteAutofill(e.target.value)}>
                                    {TYPES_ENTITE_AUTOFILL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <Input
                                label="Identifiant (ID, matricule, CIN, e-mail...)"
                                value={identifiantAutofill}
                                onChange={(e) => setIdentifiantAutofill(e.target.value)}
                                placeholder="ex: 12345678 ou client@exemple.com"
                            />
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Button variant="success" onClick={lancerAutoRemplissage} fullWidth>
                                    ⚡ Auto-remplir
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card title="3. Informations du document" variant="primary" style={{ marginBottom: 20 }}>
                        <div style={styles.grid2}>
                            {tagsAffiches.map(tag => (
                                tag.toLowerCase().includes('date') ? (
                                    <SmartDatePicker
                                        key={tag}
                                        label={tag.replace(/_/g, ' ')}
                                        value={donnees[tag] || ''}
                                        onChange={(v) => handleChampChange(tag, v)}
                                    />
                                ) : tag.toLowerCase().includes('note') || tag.toLowerCase().includes('description') || tag.toLowerCase().includes('clause') ? (
                                    <div key={tag} style={{ gridColumn: '1 / -1' }}>
                                        <SmartTextArea
                                            label={tag.replace(/_/g, ' ')}
                                            value={donnees[tag] || ''}
                                            onChange={(v) => handleChampChange(tag, v)}
                                        />
                                    </div>
                                ) : (
                                    <Input
                                        key={tag}
                                        label={tag.replace(/_/g, ' ')}
                                        value={donnees[tag] || ''}
                                        onChange={(e) => handleChampChange(tag, e.target.value)}
                                    />
                                )
                            ))}
                        </div>
                    </Card>

                    <Card title="4. Montants (calcul automatique en toutes lettres)" variant="warning" style={{ marginBottom: 20 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                            <input type="checkbox" checked={estDocumentFinancier}
                                onChange={(e) => setEstDocumentFinancier(e.target.checked)} />
                            Ce document comporte des montants HT / TVA / TTC
                        </label>

                        {estDocumentFinancier && (
                            <div style={styles.grid3}>
                                <Input label="Montant HT" type="number" step="0.001"
                                    value={donnees.montantHT || ''} onChange={(e) => handleChampChange('montantHT', e.target.value)} />
                                <Input label="Montant TVA" type="number" step="0.001"
                                    value={donnees.montantTVA || ''} onChange={(e) => handleChampChange('montantTVA', e.target.value)} />
                                <Input label="Montant TTC" type="number" step="0.001"
                                    value={donnees.montantTTC || ''} onChange={(e) => handleChampChange('montantTTC', e.target.value)} />
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Langue des montants en lettres</label>
                                    <select style={styles.select} value={langueMontants} onChange={(e) => setLangueMontants(e.target.value)}>
                                        <option value="fr">Français</option>
                                        <option value="en">Anglais</option>
                                        <option value="ar">Arabe</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Devise</label>
                                    <select style={styles.select} value={deviseMontants} onChange={(e) => setDeviseMontants(e.target.value)}>
                                        <option value="TND">Dinar tunisien (TND)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                        <option value="USD">Dollar (USD)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Button variant="primary" size="lg" loading={chargement} onClick={handleGenerer}>
                            📄 Générer le document Word
                        </Button>
                        {documentGenereId && (
                            <Button variant="success" size="lg" onClick={telechargerDocumentGenere}>
                                ⬇️ Télécharger
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 },
    subtitle: { fontSize: 14, color: '#64748B', margin: '4px 0 0' },
    alertError: { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991B1B', fontSize: 13, fontWeight: 500 },
    alertSuccess: { backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#065F46', fontSize: 13, fontWeight: 500 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 13, fontWeight: 500, color: '#0F172A' },
    select: { padding: '10px 14px', borderRadius: 8, border: '2px solid #E2E8F0', fontSize: 14, backgroundColor: '#FFFFFF', outline: 'none', width: '100%', boxSizing: 'border-box' }
};
