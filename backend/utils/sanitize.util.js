export const sanitize = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

export const sanitizeObject = (obj) => {
    if (!obj) return obj;
    if (typeof obj === 'string') return sanitize(obj);
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = sanitizeObject(value);
        }
        return result;
    }
    return obj;
};

export const sanitizeEmail = (email) => {
    if (!email) return '';
    return String(email).toLowerCase().trim();
};

export const sanitizeFilename = (filename) => {
    if (!filename) return '';
    return String(filename)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');
};

export const sanitizeId = (id) => {
    const num = parseInt(id);
    return isNaN(num) || num < 0 ? null : num;
};