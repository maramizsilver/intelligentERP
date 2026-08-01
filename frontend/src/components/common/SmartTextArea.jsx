// frontend/src/components/common/SmartTextArea.jsx
// ---------------------------------------------------------------------------
// Dictionnaire intelligent : correction orthographique, suggestions et
// bouton "Corriger tout", utilisable dans tous les formulaires (notes de
// commande, descriptions produit, clauses de contrat...).
// ---------------------------------------------------------------------------
import React, { useState, useRef } from 'react';
import { colors, borderRadius } from '../../styles/theme';
import documentIntelligenceApi from '../../services/documentIntelligence.api';

export default function SmartTextArea({ label, value, onChange, langue = 'fr', rows = 4 }) {
    const [fautes, setFautes] = useState([]);
    const [verification, setVerification] = useState(false);
    const timerRef = useRef(null);

    const verifier = (texte) => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            if (!texte || texte.trim().length < 3) { setFautes([]); return; }
            setVerification(true);
            try {
                const res = await documentIntelligenceApi.verifierOrthographe(texte, langue);
                setFautes(res.data.fautes || []);
            } catch {
                setFautes([]);
            } finally {
                setVerification(false);
            }
        }, 800);
    };

    const handleChange = (e) => {
        onChange(e.target.value);
        verifier(e.target.value);
    };

    const corrigerTout = async () => {
        try {
            const res = await documentIntelligenceApi.verifierOrthographe(value, langue, true);
            if (res.data.texteCorrige) {
                onChange(res.data.texteCorrige);
                setFautes([]);
            }
        } catch { /* service indisponible : le texte reste inchangé */ }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            {label && <label style={{ fontSize: '13px', fontWeight: 500, color: colors.text }}>{label}</label>}
            <textarea
                value={value || ''}
                onChange={handleChange}
                rows={rows}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: borderRadius.md,
                    border: `2px solid ${fautes.length > 0 ? colors.warning : colors.border}`,
                    fontSize: '14px',
                    backgroundColor: colors.white,
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: colors.textMuted }}>
                    {verification ? 'Vérification orthographique...' :
                        fautes.length > 0 ? `${fautes.length} suggestion(s)` : ''}
                </span>
                {fautes.length > 0 && (
                    <button type="button" onClick={corrigerTout}
                        style={{ fontSize: '12px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Corriger tout
                    </button>
                )}
            </div>
            {fautes.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: '12px', color: colors.warningDark }}>
                    {fautes.slice(0, 5).map((f, i) => (
                        <li key={i}>
                            « {f.extraitFautif} » — {f.message}
                            {f.suggestions.length > 0 && <> (suggestion : {f.suggestions[0]})</>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
