export function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character]));
}

export function safeInteger(value, fallback = 0, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

export function safeIdentifier(value, maximumLength = 120) {
    return String(value || '')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, Math.max(1, maximumLength));
}

export function safeDisplayName(value, fallback = 'JOGADOR', maximumLength = 40) {
    const normalized = String(value || '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximumLength);
    return normalized || fallback;
}

export function createSecureId(prefix = 'id') {
    const safePrefix = safeIdentifier(prefix, 32) || 'id';
    if(globalThis.crypto?.randomUUID) return `${safePrefix}_${globalThis.crypto.randomUUID()}`;
    const fallback = `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    return `${safePrefix}_${fallback}`;
}
