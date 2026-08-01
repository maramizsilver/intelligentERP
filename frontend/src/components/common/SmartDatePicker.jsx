// ---------------------------------------------------------------------------
// Calendrier intelligent : input date natif (format uniforme garanti) +
// validation métier serveur (dates min/max, passé/futur interdits, etc.)
// Suit visuellement le composant Input existant.
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { colors, borderRadius } from '../../styles/theme';
import documentIntelligenceApi from '../../services/documentIntelligence.api';

export default function SmartDatePicker({
    label, value, onChange,
    autoriserPasse = true, autoriserFutur = true,
    dateMin = null, dateMax = null, required = false
}) {
    const [erreur, setErreur] = useState(null);
    const [verification, setVerification] = useState(false);

    const handleBlur = async () => {
        if (!value) {
            setErreur(required ? 'Ce champ est obligatoire.' : null);
            return;
        }
        setVerification(true);
        try {
            const res = await documentIntelligenceApi.validerDate(value, {
                autoriserPasse, autoriserFutur, dateMin, dateMax
            });
            setErreur(res.data.valide ? null : res.data.message);
        } catch {
            setErreur(null); // service indisponible : on ne bloque pas la saisie
        } finally {
            setVerification(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            {label && (
                <label style={{ fontSize: '13px', fontWeight: 500, color: colors.text }}>
                    {label}{required && <span style={{ color: colors.danger }}> *</span>}
                </label>
            )}
            <input
                type="date"
                value={value || ''}
                min={dateMin || undefined}
                max={dateMax || undefined}
                onChange={(e) => { onChange(e.target.value); setErreur(null); }}
                onBlur={handleBlur}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: borderRadius.md,
                    border: `2px solid ${erreur ? colors.danger : colors.border}`,
                    fontSize: '14px',
                    backgroundColor: colors.white,
                    boxSizing: 'border-box',
                    outline: 'none'
                }}
            />
            {verification && <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>Vérification...</p>}
            {erreur && <p style={{ margin: 0, fontSize: '12px', color: colors.danger }}>{erreur}</p>}
        </div>
    );
}
