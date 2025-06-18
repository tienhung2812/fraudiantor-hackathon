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
            canvas.width = 250;
            canvas.height = 200;
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

        // Check for common VPN/proxy timezone mismatches (simplified check)
        // This is a basic heuristic; a more advanced solution might compare with IP geolocation timezone.
        // For example, if browser reports UTC+0 but IP is known to be GMT+8.
        const suspiciousTimezones = [
            'UTC', 'GMT', 'Etc/UTC', 'Etc/GMT'
        ];

        // A more nuanced check: if the reported timezone does not match the expected timezone
        // based on the system's current offset and known common timezones.
        // For a hackathon, let's keep it simpler. If the timezone is one of these generic ones, it's a weak signal.
        const isGenericTimezone = suspiciousTimezones.includes(timezone);

        return {
            timezone,
            offset: offsetHours,
            isGeneric: isGenericTimezone
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

        // Revise plugin suspicion:
        // - Plugin count of 0 is unusual but common in modern browsers (less and less rely on plugins).
        // - Flash/Java detection after EOL is a strong signal.
        // - Very high count could be indicative of manipulation.
        let suspicious = false;
        if (hasFlash && new Date().getFullYear() > 2020) { // Flash EOL
            suspicious = true;
        }
        // Very high plugin count might indicate injection/spoofing, but browser defaults vary.
        // Let's set a higher threshold or make it a weaker signal.
        if (pluginCount > 20) { // Modern browsers typically have fewer built-in plugins exposed.
            suspicious = true;
        }

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
                return { error: 'MediaDevices API not available', suspicious: true };
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

            // --- REVISED LOGIC FOR MOBILE DEVICES ---
            // On many browsers, especially mobile, device labels are empty until user grants camera/mic permission
            // This is a privacy feature, not necessarily masking.
            const hasLabels = devices.some(d => d.label && d.label.trim().length > 0);
            const allGenericOrEmptyLabels = devices.every(d => !d.label || d.label.includes('Generic') || d.label.includes('Default') || d.label.trim().length === 0);

            // A device is suspicious if:
            // 1. enumerateDevices fails entirely.
            // 2. No devices are reported at all (highly unusual).
            // 3. All reported devices have generic or empty labels *and* there's a reasonable expectation of labels (e.g., if there are multiple devices reported but all are generic).
            let suspicious = false;
            if (devices.length === 0) {
                suspicious = true; // No devices at all
            } else if (allGenericOrEmptyLabels && devices.length > 0) {
                // If there are devices but all have generic/empty labels, it's still a signal, but weaker.
                // It's more suspicious if combined with other masking indicators.
                suspicious = true;
            }

            return {
                totalDevices: devices.length,
                audioInputs: audioInputs.length,
                videoInputs: videoInputs.length,
                audioOutputs: audioOutputs.length,
                hasLabels,
                allGenericOrEmptyLabels,
                suspicious: suspicious
            };
        } catch (e) {
            // Error could indicate API blocking or unusual environment
            return { error: e.message, suspicious: true };
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
        const canvasFingerprintHash = await this.#getCanvasFingerprint();
        // A truly generic or blocked canvas often results in a very short or repeating hash for simple content.
        if (canvasFingerprintHash.includes('000000') || canvasFingerprintHash.length < 50) { // Adjusted length threshold
            this.score += 20;
            this.indicators.push('Canvas fingerprint appears to be manipulated (contains suspicious pattern or is too short)');
        }

        // 2. WebGL Info check
        const webglInfo = this.#getWebGLInfo();
        if (webglInfo === 'no-webgl' || webglInfo === 'webgl-error') {
            this.score += 15;
            this.indicators.push('WebGL is unavailable or errored, may indicate masking');
        } else if (webglInfo.toLowerCase().includes('swiftshader') || webglInfo.toLowerCase().includes('llvmpipe') || webglInfo.toLowerCase().includes('virtual')) {
            this.score += 30;
            this.indicators.push(`Software rendering or virtualization detected in WebGL (${webglInfo}), common in VMs/bots`);
        } else if (webglInfo === 'no-debug-info') {
            this.score += 10;
            this.indicators.push('WebGL debug info is unavailable, could be a privacy tool');
        }

        // 3. Audio Fingerprint check
        const audioFingerprint = await this.#getAudioFingerprint();
        if (audioFingerprint.error) {
            this.score += 10;
            this.indicators.push('Audio context unavailable or blocked');
        } else if (audioFingerprint.fingerprint === '0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0') {
            this.score += 15;
            this.indicators.push('Audio fingerprint is entirely zero, indicating potential blocking/spoofing');
        } else if (audioFingerprint.sampleRate === 44100 && audioFingerprint.maxChannelCount === 2) {
            // Common default values that might indicate spoofing, but can also be normal. Weak signal.
            // Only add if there are other suspicious audio properties, or if combined with other strong signals.
            // For now, let's remove this as a direct indicator to reduce false positives.
        }

        // 4. Hardware concurrency check
        // Adjusted range for more realistic assessment, especially for mobile devices.
        // Modern phones can have 8+ cores. Very low (1) or extremely high (uncommon) are still suspicious.
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) { // Changed from <2 to <1 (meaning only 1 core)
            this.score += 10;
            this.indicators.push('Very low number of CPU cores reported, potentially a VM/emulation');
        } else if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 64) { // Very high, might be server-side or extreme hardware.
            this.score += 5;
            this.indicators.push('Unusually high number of CPU cores reported');
        }

        // 5. Device Memory check
        // Adjusted for mobile context. Many phones have 2-8GB.
        if (navigator.deviceMemory && navigator.deviceMemory < 1) { // 0.5 GB or less is very low
            this.score += 10;
            this.indicators.push('Extremely low device memory reported, potentially a VM/emulation');
        } else if (navigator.deviceMemory && navigator.deviceMemory > 128) { // Unrealistically high for common devices
            this.score += 5;
            this.indicators.push('Unusually high device memory reported');
        }

        // 6. Screen Resolution Inconsistency - REVISED FOR MOBILE
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        const screenAspectRatio = screenWidth / screenHeight;

        // Broaden "very low resolution" to exclude common mobile resolutions
        // Common mobile resolutions (viewport pixels): 360x640, 375x667, 414x896, 1080x1920 (device pixels)
        // We're checking screen.width, which can be device pixels or CSS pixels depending on device/browser.
        // Assuming this mostly reflects device pixels for broad range.
        if (screenWidth < 320 || screenHeight < 480) { // Very small, almost certainly an emulation or very old device
            this.score += 15;
            this.indicators.push(`Extremely low screen resolution detected: ${screenWidth}x${screenHeight}`);
        }

        // Updated common aspect ratios to include mobile typical ones (tall/narrow)
        const commonAspectRatios = [
            16 / 9, 16 / 10, 4 / 3, 5 / 4, 21 / 9, // Desktop/Widescreen
            9 / 16, 10 / 16, 9 / 18, 9.5 / 19, 9 / 20, // Mobile (portrait)
            18 / 9, 19 / 9.5, 20 / 9 // Mobile (landscape)
        ];
        const tolerance = 0.05; // Increased tolerance for aspect ratio checks

        const hasCommonAspectRatio = commonAspectRatios.some(ratio =>
            Math.abs(screenAspectRatio - ratio) < tolerance
        );

        if (!hasCommonAspectRatio && screenWidth > 0 && screenHeight > 0) {
            this.score += 5;
            this.indicators.push(`Unusual screen aspect ratio: ${screenAspectRatio.toFixed(2)}`);
        }

        // VM-typical resolution with low color depth remains
        const commonVMResolutions = [
            '1024x768', '800x600', '1280x720', '1366x768' // These are common for VMs/RDP
        ];
        const currentResolution = `${screenWidth}x${screenHeight}`;
        if (commonVMResolutions.includes(currentResolution) && screen.colorDepth <= 16) {
            this.score += 8;
            this.indicators.push(`VM-typical resolution with low color depth: ${currentResolution}`);
        }

        // 7. Timezone check
        const timezoneCheck = this.#checkTimezone();
        if (timezoneCheck.isGeneric) { // Use 'isGeneric' flag now
            this.score += 15;
            this.indicators.push(`Generic/unspecific timezone detected: ${timezoneCheck.timezone}`);
        }

        // 8. Plugin check
        const pluginCheck = this.#checkPlugins();
        if (pluginCheck.suspicious) {
            let pluginSignal = 'Suspicious plugin configuration';
            if (pluginCheck.hasFlash && new Date().getFullYear() > 2020) {
                pluginSignal += ' (Flash detected after EOL)';
                this.score += 20; // Stronger signal for EOL plugin
            } else if (pluginCheck.count > 20) {
                pluginSignal += ` (Unusually high plugin count: ${pluginCheck.count})`;
                this.score += 10;
            } else if (pluginCheck.count === 0 && (navigator.plugins || []).length === 0) {
                // If navigator.plugins itself is empty, it's normal for modern browsers.
                // If it's not empty but `plugins` array is empty, it's suspicious.
                // Let's only flag if `navigator.plugins` object is present but reports 0 plugins.
                if (navigator.plugins && navigator.plugins.length === 0) {
                     pluginSignal += ` (No plugins reported despite navigator.plugins being available)`;
                     this.score += 5; // Weaker signal, as many modern sites don't use plugins.
                }
            }
            if (pluginSignal !== 'Suspicious plugin configuration') { // Only add if a specific suspicion was found
                this.indicators.push(pluginSignal);
            }
        }


        // 9. Media devices check - REVISED FOR MOBILE
        const mediaCheck = await this.#checkMediaDevices();
        if (mediaCheck.error) {
            this.score += 10;
            this.indicators.push(`Media devices API error or blocked: ${mediaCheck.error}`);
        } else if (mediaCheck.suspicious) {
            // Adjust score based on the specific type of "suspicious"
            if (mediaCheck.totalDevices === 0) {
                this.score += 20;
                this.indicators.push('No media input/output devices detected at all (highly unusual)');
            } else if (mediaCheck.allGenericOrEmptyLabels) {
                // This is common for privacy on mobile without permission. Only flag if it's explicitly masked/manipulated.
                // Let's make this a weaker signal on its own, and rely on other signals to amplify.
                this.score += 5; // Reduced score
                this.indicators.push('Media device labels are generic or empty (common privacy feature or masking)');
            }
        }

        // 10. Language and platform consistency (refined)
        const languages = navigator.languages || [navigator.language];
        const platform = navigator.platform;
        const userAgent = navigator.userAgent;

        // Check for common inconsistencies (e.g., Windows platform with Linux User Agent)
        let platformMismatch = false;
        if (platform.includes('Win') && !userAgent.includes('Windows') && !userAgent.includes('WOW64') && !userAgent.includes('Win64')) {
            platformMismatch = true;
        } else if (platform.includes('Mac') && !userAgent.includes('Macintosh') && !userAgent.includes('Mac OS X')) {
            platformMismatch = true;
        } else if (platform.includes('Linux') && !userAgent.includes('Linux') && !userAgent.includes('X11')) {
            platformMismatch = true;
        }

        if (platformMismatch) {
            this.score += 15;
            this.indicators.push('Platform/User-Agent string mismatch');
        }

        // Check for single, generic language (e.g., only 'en-US' when other indicators suggest a non-US origin)
        // This is a weak signal on its own, but combined can be useful.
        if (languages.length === 1 && languages[0].toLowerCase() === 'en-us') {
            // Consider this only if other stronger masking signals are present.
            // For now, let's keep it as a very weak signal to avoid over-flagging.
            // this.score += 2;
            // this.indicators.push('Single, generic "en-US" language setting');
        }


        return {
            score: this.score,
            indicators: this.indicators,
            isMasked: this.score >= 25, // Threshold might need adjustment after testing
            details: {
                canvas: canvasFingerprintHash.substring(0, 16) + '...',
                webgl: webglInfo,
                audio: audioFingerprint.fingerprint ? audioFingerprint.fingerprint.substring(0, 20) + '...' : 'unavailable',
                timezone: timezoneCheck.timezone,
                plugins: pluginCheck.count,
                mediaDevices: mediaCheck.totalDevices || 0,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                screenResolution: `${screenWidth}x${screenHeight}`
            }
        };
    }
}

// Make the class available globally
window.DeviceDataMaskingDetector = DeviceDataMaskingDetector;