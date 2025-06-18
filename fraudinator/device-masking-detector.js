/**
 * @class DeviceDataMaskingDetector
 * @description Dedicated class to detect various forms of device and browser fingerprinting evasion.
 * This class is responsible for detecting device data tampering and masking techniques.
 */
class DeviceDataMaskingDetector {
    constructor() {
        this.score = 0;
        this.indicators = [];
    }

    /**
     * @description Hashes a string using the SHA-256 algorithm.
     * @param {string} str - The string to hash.
     * @returns {Promise<string>} A promise that resolves with the hex-encoded hash.
     */
    async #hash(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * @description Generates a fingerprint based on canvas rendering.
     * @returns {Promise<string>} The canvas fingerprint.
     */
    async #getCanvasFingerprint() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const txt = 'VladTheSpooferWasHere-7a6b4c3d';
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText(txt, 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText(txt, 4, 17);
            const dataUrl = canvas.toDataURL();
            resolve(this.#hash(dataUrl));
        });
    }

    /**
     * @description Gathers WebGL renderer information.
     * @returns {string} The WebGL vendor and renderer string.
     */
    #getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'no-webgl';
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + '~' + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
            return 'no-debug-info';
        } catch (e) {
            return 'webgl-error';
        }
    }

    /**
     * @description Lists available fonts, a common target for masking.
     * @returns {Promise<string[]>} A list of available fonts.
     */
    async #getFonts() {
        if (!document.fonts) return ['no-font-api'];
        await document.fonts.ready;
        const fontSet = new Set();
        for (const font of document.fonts) {
            fontSet.add(font.family);
        }
        return Array.from(fontSet).sort();
    }

    /**
     * @description Checks for audio context fingerprinting inconsistencies.
     * @returns {Promise<object>} Audio fingerprint analysis.
     */
    async #getAudioFingerprint() {
        return new Promise((resolve) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const analyser = audioContext.createAnalyser();
                const gainNode = audioContext.createGain();
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                oscillator.connect(analyser);
                analyser.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.start(0);
                
                setTimeout(() => {
                    const frequencyBinCount = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(frequencyBinCount);
                    analyser.getByteFrequencyData(dataArray);
                    
                    const fingerprint = Array.from(dataArray).slice(0, 30).join(',');
                    oscillator.stop();
                    audioContext.close();
                    
                    resolve({
                        fingerprint,
                        sampleRate: audioContext.sampleRate,
                        maxChannelCount: audioContext.destination.maxChannelCount
                    });
                }, 100);
            } catch (e) {
                resolve({ error: e.message });
            }
        });
    }

    /**
     * @description Checks for timezone manipulation.
     * @returns {object} Timezone analysis results.
     */
    #checkTimezone() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset();
        const offsetHours = -offset / 60;
        
        // Check for common VPN/proxy timezone mismatches
        const suspiciousTimezones = [
            'UTC', 'GMT', 'Europe/London', 'America/New_York', 
            'America/Los_Angeles', 'Asia/Shanghai'
        ];
        
        const isSuspicious = suspiciousTimezones.includes(timezone) && 
                            Math.abs(offsetHours) !== Math.abs(new Date().getTimezoneOffset() / 60);
        
        return {
            timezone,
            offset: offsetHours,
            suspicious: isSuspicious
        };
    }

    /**
     * @description Checks for browser plugin inconsistencies.
     * @returns {object} Plugin analysis results.
     */
    #checkPlugins() {
        const plugins = Array.from(navigator.plugins || []).map(plugin => ({
            name: plugin.name,
            filename: plugin.filename,
            description: plugin.description
        }));
        
        // Check for plugin spoofing patterns
        const hasFlash = plugins.some(p => p.name.toLowerCase().includes('flash'));
        const hasJava = plugins.some(p => p.name.toLowerCase().includes('java'));
        const pluginCount = plugins.length;
        
        const suspicious = pluginCount === 0 || 
                          (hasFlash && new Date().getFullYear() > 2020) || // Flash EOL
                          pluginCount > 50; // Unusual high count
        
        return {
            count: pluginCount,
            hasFlash,
            hasJava,
            suspicious,
            plugins: plugins.slice(0, 5) // First 5 for analysis
        };
    }

    /**
     * @description Checks for media device enumeration masking.
     * @returns {Promise<object>} Media devices analysis.
     */
    async #checkMediaDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return { error: 'MediaDevices API not available' };
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
            
            // Check for suspicious patterns
            const hasLabels = devices.some(d => d.label && d.label.trim().length > 0);
            const allGeneric = devices.every(d => !d.label || d.label.includes('Generic') || d.label.includes('Default'));
            
            return {
                totalDevices: devices.length,
                audioInputs: audioInputs.length,
                videoInputs: videoInputs.length,
                audioOutputs: audioOutputs.length,
                hasLabels,
                allGeneric,
                suspicious: !hasLabels || allGeneric || devices.length === 0
            };
        } catch (e) {
            return { error: e.message };
        }
    }

    /**
     * @description Runs all device masking checks and calculates a score.
     * @returns {Promise<object>} An object containing the final score, indicators, and detection status.
     */
    async runChecks() {
        this.score = 0;
        this.indicators = [];

        // 1. Canvas Fingerprint check
        const canvasFingerprint = await this.#getCanvasFingerprint();
        if (canvasFingerprint.includes('000000') || canvasFingerprint.length < 10) {
            this.score += 20;
            this.indicators.push('Canvas fingerprint appears to be manipulated (contains suspicious pattern)');
        }
        
        // 2. WebGL Info check
        const webglInfo = this.#getWebGLInfo();
        if (webglInfo === 'no-webgl' || webglInfo === 'webgl-error') {
            this.score += 15;
            this.indicators.push('WebGL is unavailable or errored, may indicate masking');
        } else if (webglInfo.toLowerCase().includes('swiftshader') || webglInfo.toLowerCase().includes('llvmpipe')) {
            this.score += 30;
            this.indicators.push(`Software rendering detected in WebGL (${webglInfo}), common in VMs/bots`);
        } else if (webglInfo === 'no-debug-info') {
            this.score += 10;
            this.indicators.push('WebGL debug info is unavailable, could be a privacy tool');
        }
        
        // 3. Audio Fingerprint check
        const audioFingerprint = await this.#getAudioFingerprint();
        if (audioFingerprint.error) {
            this.score += 10;
            this.indicators.push('Audio context unavailable or blocked');
        } else if (audioFingerprint.sampleRate === 44100 && audioFingerprint.maxChannelCount === 2) {
            // Common default values that might indicate spoofing
            this.score += 5;
            this.indicators.push('Audio fingerprint shows default/common values');
        }
        
        // 4. Hardware concurrency check
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
            this.score += 10;
            this.indicators.push('Very low number of CPU cores reported, potentially a VM');
        } else if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 32) {
            this.score += 5;
            this.indicators.push('Unusually high number of CPU cores reported');
        }
        
        // 5. Device Memory check
        if (navigator.deviceMemory && navigator.deviceMemory < 2) {
            this.score += 10;
            this.indicators.push('Low device memory reported, potentially a VM');
        } else if (navigator.deviceMemory && navigator.deviceMemory > 32) {
            this.score += 5;
            this.indicators.push('Unusually high device memory reported');
        }

        // 6. Screen Resolution Inconsistency
        if (Math.abs(screen.width - window.innerWidth) > 200 || Math.abs(screen.height - window.innerHeight) > 200) {
            if (!this.indicators.some(i => i.includes('DevTools'))) {
                this.score += 5;
                this.indicators.push('Significant difference between screen and window resolution');
            }
        }
        
        // 7. Timezone check
        const timezoneCheck = this.#checkTimezone();
        if (timezoneCheck.suspicious) {
            this.score += 15;
            this.indicators.push(`Suspicious timezone configuration: ${timezoneCheck.timezone}`);
        }
        
        // 8. Plugin check
        const pluginCheck = this.#checkPlugins();
        if (pluginCheck.suspicious) {
            this.score += 10;
            this.indicators.push(`Suspicious plugin configuration: ${pluginCheck.count} plugins detected`);
        }
        
        // 9. Media devices check
        const mediaCheck = await this.#checkMediaDevices();
        if (mediaCheck.suspicious && !mediaCheck.error) {
            this.score += 15;
            this.indicators.push('Media devices configuration appears to be masked or limited');
        } else if (mediaCheck.error) {
            this.score += 5;
            this.indicators.push('Media devices enumeration failed or blocked');
        }
        
        // 10. Language and platform consistency
        const languages = navigator.languages || [navigator.language];
        const platform = navigator.platform;
        if (languages.length === 1 && languages[0] === 'en-US' && platform.includes('Win')) {
            this.score += 5;
            this.indicators.push('Generic language/platform combination detected');
        }
        
        return {
            score: this.score,
            indicators: this.indicators,
            isMasked: this.score >= 25,
            details: {
                canvas: canvasFingerprint.substring(0, 16) + '...',
                webgl: webglInfo,
                audio: audioFingerprint.fingerprint ? audioFingerprint.fingerprint.substring(0, 20) + '...' : 'unavailable',
                timezone: timezoneCheck.timezone,
                plugins: pluginCheck.count,
                mediaDevices: mediaCheck.totalDevices || 0
            }
        };
    }
}

// Make the class available globally
window.DeviceDataMaskingDetector = DeviceDataMaskingDetector;