export const collectDeviceInfo = () => {
    let clientId = localStorage.getItem('device_client_id');
    if (!clientId) {
        clientId = generateUUID();
        localStorage.setItem('device_client_id', clientId);
    }

    const info = {
        client_id: clientId,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        color_depth: window.screen.colorDepth,
        language: navigator.language || navigator.userLanguage || 'fr-FR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        hardware_concurrency: navigator.hardwareConcurrency || 0,
        device_memory: navigator.deviceMemory || 0,
        touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        cookie_enabled: navigator.cookieEnabled,
        do_not_track: navigator.doNotTrack || 'unspecified'
    };

    info.os = detectOS(navigator.userAgent);
    info.os_version = detectOSVersion(navigator.userAgent);
    info.browser = detectBrowser(navigator.userAgent);
    info.browser_version = detectBrowserVersion(navigator.userAgent);
    info.device_type = detectDeviceType(navigator.userAgent);

    return info;
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function detectOS(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('chrome os')) return 'Chrome OS';
    return 'Unknown';
}

function detectOSVersion(userAgent) {
    const ua = userAgent;
    const matches = ua.match(/Windows NT (\d+\.\d+)/);
    if (matches) return matches[1];
    
    const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
    if (macMatch) return macMatch[1].replace(/_/g, '.');
    
    const androidMatch = ua.match(/Android (\d+\.\d+)/);
    if (androidMatch) return androidMatch[1];
    
    const iosMatch = ua.match(/OS (\d+[._]\d+[._]\d+)/);
    if (iosMatch) return iosMatch[1].replace(/_/g, '.');
    
    return null;
}

function detectBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    if (ua.includes('brave')) return 'Brave';
    return 'Unknown';
}

function detectBrowserVersion(userAgent) {
    const ua = userAgent;
    const patterns = [
        /Chrome\/(\d+\.\d+\.\d+\.\d+)/,
        /Firefox\/(\d+\.\d+)/,
        /Safari\/(\d+\.\d+)/,
        /Edge\/(\d+\.\d+\.\d+\.\d+)/,
        /OPR\/(\d+\.\d+\.\d+\.\d+)/
    ];
    
    for (const pattern of patterns) {
        const match = ua.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function detectDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    return 'desktop';
}

export const calculateSimpleFingerprint = () => {
    const info = collectDeviceInfo();
    const data = [
        info.client_id,
        info.screen_resolution,
        info.language,
        info.timezone,
        info.os,
        info.browser,
        info.hardware_concurrency
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};