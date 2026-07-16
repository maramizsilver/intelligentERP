
/**
 * Nettoie une chaîne de caractères (XSS prevention)
 */
function sanitizeString(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Nettoie un objet récursivement
 */
function sanitizeObject(obj) {
    if (!obj) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = sanitizeObject(value);
        }
        return result;
    }
    return obj;
}

/**
 * Nettoie un email
 */
function sanitizeEmail(email) {
    if (!email) return '';
    return String(email).toLowerCase().trim();
}

/**
 * Nettoie un nom de fichier
 */
function sanitizeFilename(filename) {
    if (!filename) return '';
    return String(filename)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');
}

/**
 * Valide et nettoie un ID
 */
function sanitizeId(id) {
    const num = parseInt(id);
    return isNaN(num) || num < 0 ? null : num;
}

module.exports = {
    sanitizeString,
    sanitizeObject,
    sanitizeEmail,
    sanitizeFilename,
    sanitizeId
};