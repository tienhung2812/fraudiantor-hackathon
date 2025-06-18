class FraudDetector {
    constructor() {
        this.locationData = null;
        this.environmentData = {};
        this.suspicionScore = 0;
        this.detectionDetails = [];
        this.devToolsDetected = false;
        this.extensionDetected = false;
        this.consoleOverridden = false;
        this.deviceMaskingDetected = false;
        this.vpnDetected = false;

        // Behavioral analysis properties
        this.behavioralIndicators = [];
        this.behavioralScore = 0;
        this.locationSpoofedByBehavior = false;

        // Instantiate detector modules
        this.extensionDetector = new ExtensionDetector();
        this.deviceMaskingDetector = new DeviceDataMaskingDetector();
        this.vpnDetector = new VPNDetector();
        this.initializeDetection();
    }

    /**
     * @description Initializes all detection mechanisms when the class is instantiated.
     */
    initializeDetection() {
        this.detectDevToolsInitial();
        this.detectConsoleOverrides();
        this.detectExtensionArtifacts();
        this.detectVPN();
        this.setupAntiEvasion();
    }

    /**
     * @description Sets up advanced anti-evasion techniques to make detection more robust.
     */
    setupAntiEvasion() {
        // Anti-evasion technique 1: Multiple detection attempts with random delays
        setInterval(() => {
            this.detectDevToolsRuntime();
        }, Math.random() * 5000 + 2000);

        // Anti-evasion technique 2: Function integrity checks
        this.originalFunctions = {
            getCurrentPosition: navigator.geolocation.getCurrentPosition,
            toString: Function.prototype.toString,
            apply: Function.prototype.apply,
            call: Function.prototype.call
        };

        // Anti-evasion technique 3: DOM mutation observer for extension detection
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1 && node.hasAttribute) {
                                this.checkForExtensionArtifacts(node);
                            }
                        });
                    }
                });
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-vytal', 'data-surfshark', 'data-location-guard']
            });
        }
    }

    /**
     * @description Performs runtime checks for DevTools being opened.
     */
    detectDevToolsRuntime() {
        // Runtime DevTools detection that bypasses common evasion attempts
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;

        if ((widthThreshold || heightThreshold) && !this.devToolsDetected) {
            this.devToolsDetected = true;

            if (!this.environmentData.devToolsScore) this.environmentData.devToolsScore = 0;
            if (!this.environmentData.devToolsIndicators) this.environmentData.devToolsIndicators = [];

            this.environmentData.devToolsScore += 25;
            this.environmentData.devToolsIndicators.push('DevTools opened during session');
        }
    }

    /**
     * @description Checks for DOM elements injected by common location spoofing extensions.
     * @param {Node} node - The DOM node to inspect.
     */
    checkForExtensionArtifacts(node) {
        const extensionAttributes = [
            'data-vytal', 'data-surfshark', 'data-location-guard',
            'data-change-location', 'data-extension', 'data-vpn'
        ];

        extensionAttributes.forEach(attr => {
            if (node.hasAttribute && node.hasAttribute(attr)) {
                this.extensionDetected = true;

                if (!this.environmentData.extensionScore) this.environmentData.extensionScore = 0;
                if (!this.environmentData.extensionIndicators) this.environmentData.extensionIndicators = [];

                this.environmentData.extensionScore += 20;
                this.environmentData.extensionIndicators.push(`Extension artifact detected: ${attr}`);
            }
        });
    }

    /**
     * @description Performs initial checks for DevTools presence upon page load.
     */
    detectDevToolsInitial() {
        const devToolsIndicators = [];
        let devToolsScore = 0;

        // Method 1: Timing-based detection
        const startTime = performance.now();
        // debugger; // This line can be used for timing checks but is commented out
        const endTime = performance.now();
        const timeDiff = endTime - startTime;

        if (timeDiff > 100) {
            devToolsScore += 30;
            devToolsIndicators.push('DevTools detected via debugger timing');
            this.devToolsDetected = true;
        }

        // Method 2: Window size detection
        const windowHeight = window.outerHeight - window.innerHeight;
        const windowWidth = window.outerWidth - window.innerWidth;

        if (windowHeight > 200 || windowWidth > 200) {
            devToolsScore += 20;
            devToolsIndicators.push('DevTools panel detected via window dimensions');
            this.devToolsDetected = true;
        }

        // Method 3: Function override detection
        const originalToString = Function.prototype.toString;
        const overrideTest = () => {};

        if (overrideTest.toString() !== originalToString.call(overrideTest)) {
            devToolsScore += 25;
            devToolsIndicators.push('Function toString override detected');
        }

        // Method 4: Console detection
        let consoleDetected = false;
        const originalConsole = console.log;
        console.log = function(...args) {
            consoleDetected = true;
            return originalConsole.apply(console, args);
        };
        console.log('');
        console.log = originalConsole;

        if (consoleDetected) {
            devToolsScore += 15;
            devToolsIndicators.push('Console usage detected');
        }

        // Method 5: DevTools-specific globals detection
        if (window.devtools || window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
            devToolsScore += 20;
            devToolsIndicators.push('DevTools global objects detected');
            this.devToolsDetected = true;
        }

        this.environmentData.devToolsScore = devToolsScore;
        this.environmentData.devToolsIndicators = devToolsIndicators;
        this.environmentData.devToolsDetected = this.devToolsDetected;
    }

    /**
     * @description Detects if native console methods have been overridden.
     */
    detectConsoleOverrides() {
        const consoleOverrides = [];
        let overrideScore = 0;

        const nativeToString = Function.prototype.toString;
        const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace'];

        consoleMethods.forEach(method => {
            const consoleMethod = console[method];
            if (typeof consoleMethod !== 'function') return;
            const methodString = nativeToString.call(consoleMethod);

            if (!methodString.includes('[native code]')) {
                overrideScore += 10;
                consoleOverrides.push(`Console.${method} has been overridden`);
                this.consoleOverridden = true;
            }
        });

        const testFunction = function() {};
        const originalString = testFunction.toString();
        testFunction.toString = () => 'modified';

        if (testFunction.toString() !== originalString) {
            overrideScore += 15;
            consoleOverrides.push('Function toString modification detected');
        }

        this.environmentData.consoleOverrideScore = overrideScore;
        this.environmentData.consoleOverrides = consoleOverrides;
    }

    /**
     * @description Uses the ExtensionDetector class to find spoofing-related extensions.
     */
    detectExtensionArtifacts() {
        const detectionResult = this.extensionDetector.performFullExtensionDetection();

        this.environmentData.extensionScore = detectionResult.score;
        this.environmentData.extensionIndicators = detectionResult.indicators;
        this.extensionDetected = detectionResult.detected;
    }

    detectVPN() {
        // Use the dedicated VPNDetector class
        const detectionResult = this.vpnDetector.performFullVPNDetection();
        
        this.environmentData.vpnScore = detectionResult.score;
        this.environmentData.vpnIndicators = detectionResult.indicators;
        this.environmentData.vpnDetected = detectionResult.detected;
        this.environmentData.detectedVpnProvider = detectionResult.provider;
        this.vpnDetected = detectionResult.detected;
    }

    /**
     * @description Analyzes the user's geolocation for known spoofing signatures.
     * @returns {object} An object containing the signature score and indicators.
     */
    detectLocationSignatures() {
        if (!this.locationData) return { signatureScore: 0, signatureIndicators: [] };

        const signatureIndicators = [];
        let signatureScore = 0;

        // DevTools signature: accuracy exactly 150
        if (this.locationData.accuracy === 150) {
            signatureScore += 50;
            signatureIndicators.push('DevTools signature: accuracy exactly 150m detected');
        }

        // DevTools default coordinates detection
        const devToolsDefaults = [
            { lat: 37.4224764, lng: -122.0842499, name: 'Google HQ (DevTools default)' },
            { lat: 37.386052, lng: -122.083851, name: 'Mountain View (DevTools default)' },
            { lat: 37.7749, lng: -122.4194, name: 'San Francisco (DevTools default)' },
            { lat: 40.7128, lng: -74.0060, name: 'New York (DevTools default)' },
            { lat: 51.5074, lng: -0.1278, name: 'London (DevTools default)' }
        ];

        const currentLat = this.locationData.latitude;
        const currentLng = this.locationData.longitude;

        devToolsDefaults.forEach(coord => {
            if (Math.abs(currentLat - coord.lat) < 0.0001 &&
                Math.abs(currentLng - coord.lng) < 0.0001) {
                signatureScore += 60;
                signatureIndicators.push(`DevTools default location detected: ${coord.name}`);
            }
        });

        const latStr = currentLat.toString();
        const lngStr = currentLng.toString();

        if (latStr.includes('.000000') || lngStr.includes('.000000')) {
            signatureScore += 30;
            signatureIndicators.push('Unrealistic coordinate precision detected');
        }

        const emulatorCoords = [
            { lat: 0, lng: 0, name: 'Null Island (0,0)' },
            { lat: 37.421998333333335, lng: -122.08400000000002, name: 'Android Emulator Default' }
        ];

        emulatorCoords.forEach(coord => {
            if (Math.abs(currentLat - coord.lat) < 0.001 &&
                Math.abs(currentLng - coord.lng) < 0.001) {
                signatureScore += 40;
                signatureIndicators.push(`Emulator coordinates detected: ${coord.name}`);
            }
        });

        return { signatureScore, signatureIndicators };
    }

    /**
     * @description Fetches the user's geolocation data.
     * @returns {Promise<object>} A promise that resolves with the location data.
     */
    async analyzeLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const startTime = Date.now();

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const responseTime = Date.now() - startTime;
                    this.locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        responseTime: responseTime
                    };
                    resolve(this.locationData);
                },
                (error) => {
                    reject(error);
                }, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * @description Analyzes environment signals to detect remote desktop environments.
     * @returns {object} An object containing environment data and RDP score.
     */
    detectRemoteDesktop() {
        const checks = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            languages: navigator.languages,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight
            }
        };

        let rdpScore = 0;
        const rdpIndicators = [];

        const commonRdpResolutions = [
            [1024, 768], [1280, 1024], [1440, 900], [1920, 1080]
        ];
        const currentRes = [checks.screen.width, checks.screen.height];
        if (commonRdpResolutions.some(res => res[0] === currentRes[0] && res[1] === currentRes[1])) {
            rdpScore += 10;
            rdpIndicators.push('Common RDP resolution detected');
        }

        if (checks.screen.colorDepth < 24) {
            rdpScore += 15;
            rdpIndicators.push('Low color depth (typical of RDP)');
        }

        if (checks.userAgent.includes('RDP') || checks.userAgent.includes('Remote')) {
            rdpScore += 20;
            rdpIndicators.push('RDP indicator in user agent');
        }

        if (checks.userAgent.includes('VirtualBox') ||
            checks.userAgent.includes('VMware') ||
            checks.userAgent.includes('QEMU')) {
            rdpScore += 25;
            rdpIndicators.push('Virtualization detected');
        }

        this.environmentData = {
            ...checks,
            rdpScore,
            rdpIndicators,
            isRemoteDesktop: rdpScore >= 20
        };

        return this.environmentData;
    }
    
    /**
     * @description Runs the device data masking detector.
     * @returns {object} An object containing the masking score and indicators.
     */
    async detectDeviceDataMasking() {
        const maskingResult = await this.deviceMaskingDetector.runChecks();
        this.deviceMaskingDetected = maskingResult.isMasked;
        
        this.environmentData.maskingScore = maskingResult.score;
        this.environmentData.maskingIndicators = maskingResult.indicators;
        
        return {
            score: maskingResult.score,
            indicators: maskingResult.indicators,
            detected: maskingResult.isMasked
        };
    }

    /**
     * @description Analyzes multiple signals to determine if the location is being spoofed.
     * @returns {Promise<object>} A promise that resolves with the spoofing analysis.
     */
    async detectLocationSpoofing() {
        if (!this.locationData) {
            throw new Error('Location data not available');
        }

        const spoofingIndicators = [];
        let spoofingScore = 0;

        if (this.locationData.responseTime < 100) {
            spoofingScore += 15;
            spoofingIndicators.push('Suspiciously fast geolocation response');
        }

        if (this.locationData.accuracy < 5) {
            spoofingScore += 10;
            spoofingIndicators.push('Unrealistically high accuracy');
        } else if (this.locationData.accuracy > 10000) {
            spoofingScore += 5;
            spoofingIndicators.push('Very low accuracy');
        }

        const lat = this.locationData.latitude;
        const lng = this.locationData.longitude;

        if (Math.abs(lat % 1) < 0.001 || Math.abs(lng % 1) < 0.001) {
            spoofingScore += 20;
            spoofingIndicators.push('Coordinates appear rounded/artificial');
        }

        try {
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const browserOffset = this.getTimezoneOffsetFromName(browserTimezone);
            const locationOffset = await this.getTimezoneFromCoords(lat, lng);

            // Compare UTC offsets instead of timezone names
            if (Math.abs(browserOffset - locationOffset) > 1) { // Allow 1 hour difference for DST
                spoofingScore += 25;
                spoofingIndicators.push(`Timezone mismatch: Browser(${browserTimezone}/${browserOffset >= 0 ? '+' : ''}${browserOffset}) vs Location(UTC${locationOffset >= 0 ? '+' : ''}${locationOffset})`);
            }
        } catch (e) {
            // Timezone API might fail
        }

        if (this.isSuspiciousLocation(lat, lng)) {
            spoofingScore += 30;
            spoofingIndicators.push('Location appears to be in suspicious area');
        }

        const signatureDetection = this.detectLocationSignatures();
        spoofingScore += signatureDetection.signatureScore;
        spoofingIndicators.push(...signatureDetection.signatureIndicators);

        if (this.locationSpoofedByDevTools) {
            spoofingScore += this.locationSpoofingScore || 100;
            if (this.locationSpoofingIndicators) {
                spoofingIndicators.push(...this.locationSpoofingIndicators);
            }
        }

        if (this.behavioralScore > 0) {
            spoofingScore += this.behavioralScore;
            spoofingIndicators.push(...this.behavioralIndicators);
        }

        const criticalIndicators = this.checkCriticalSpoofingIndicators(spoofingIndicators);
        const hasTimezoneIssue = spoofingIndicators.some(indicator => indicator.includes('Timezone mismatch'));
        const hasDevToolsSignature = spoofingIndicators.some(indicator =>
            indicator.includes('DevTools signature') ||
            indicator.includes('DevTools default location') ||
            indicator.includes('accuracy exactly 150')
        );

        return {
            spoofingScore,
            spoofingIndicators,
            isLocationSpoofed: spoofingScore >= 20 ||
                this.locationSpoofedByDevTools ||
                this.locationSpoofedByBehavior ||
                criticalIndicators ||
                hasTimezoneIssue ||
                hasDevToolsSignature
        };
    }

    /**
     * @description Checks for critical indicators that automatically mark a location as spoofed.
     * @param {string[]} indicators - An array of detected indicators.
     * @returns {boolean} True if a critical indicator is found.
     */
    checkCriticalSpoofingIndicators(indicators) {
        const criticalPatterns = [
            'DevTools signature', 'DevTools default location', 'Timezone mismatch',
            'accuracy exactly 150', 'Google HQ (DevTools default)',
            'Mountain View (DevTools default)', 'San Francisco (DevTools default)',
            'New York (DevTools default)', 'London (DevTools default)',
            'Android Emulator Default', 'Null Island (0,0)', 'Emulator coordinates detected'
        ];
        return indicators.some(indicator =>
            criticalPatterns.some(pattern => indicator.includes(pattern))
        );
    }

    getTimezoneOffsetFromName(timezoneName) {
        // Get the current UTC offset for a timezone name (e.g., "Asia/Saigon" -> 7)
        try {
            // Use a specific date to check timezone offset
            const testDate = new Date('2024-01-15T12:00:00Z'); // Use a winter date to avoid DST issues
            
            // Get the time in the target timezone
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezoneName,
                timeZoneName: 'longOffset'
            });
            
            const parts = formatter.formatToParts(testDate);
            const offsetPart = parts.find(part => part.type === 'timeZoneName');
            
            if (offsetPart && offsetPart.value) {
                // Parse formats like "GMT+7", "GMT-5", etc.
                const match = offsetPart.value.match(/GMT([+-])(\d+)(:(\d+))?/);
                if (match) {
                    const sign = match[1] === '+' ? 1 : -1;
                    const hours = parseInt(match[2], 10);
                    const minutes = match[4] ? parseInt(match[4], 10) : 0;
                    return sign * (hours + minutes / 60);
                }
            }
            
            // Fallback: calculate manually
            if (timezoneName.toLowerCase() === 'utc') {
                return 0;
            }
            
            const utcDate = new Date(testDate.toISOString());
            const localDate = new Date(testDate.toLocaleString('en-CA', { timeZone: timezoneName }));
            const diffMs = localDate.getTime() - utcDate.getTime();
            return diffMs / (1000 * 60 * 60);
        } catch (e) {
            // Final fallback: use browser's current offset
            return -new Date().getTimezoneOffset() / 60;
        }
    }
    
    /**
     * @description Approximates timezone from coordinates. A real implementation should use a dedicated API.
     * @param {number} lat - Latitude.
     * @param {number} lng - Longitude.
     * @returns {Promise<string>} The estimated timezone (e.g., 'UTC+7').
     */
    async getTimezoneFromCoords(lat, lng) {
        // NOTE: This is a very rough approximation. For a real product, use a reverse geocoding API.
        const timezoneOffset = Math.round(lng / 15);
        const utcOffset = timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;
        return `UTC${utcOffset}`;
    }

    /**
     * @description Checks if a location is in a commonly known suspicious or spoofed area.
     * @param {number} lat - Latitude.
     * @param {number} lng - Longitude.
     * @returns {boolean} True if the location is suspicious.
     */
    isSuspiciousLocation(lat, lng) {
        if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return true; // Null Island

        const suspiciousCoords = [
            [37.7749, -122.4194], // San Francisco (commonly spoofed)
            [40.7128, -74.0060],  // New York (commonly spoofed)
            [51.5074, -0.1278],   // London (commonly spoofed)
        ];
        return suspiciousCoords.some(coords =>
            Math.abs(lat - coords[0]) < 0.01 && Math.abs(lng - coords[1]) < 0.01
        );
    }

    /**
     * @description Executes the full suite of fraud detection analyses.
     * @returns {Promise<object>} A promise that resolves with a comprehensive analysis report.
     */
    async performFullAnalysis() {
        try {
            // Analyze environment first
            const envData = this.detectRemoteDesktop();

            // Analyze device masking
            const maskingAnalysis = await this.detectDeviceDataMasking();
            
            // Get location data
            await this.analyzeLocation();
            
            // Analyze location spoofing
            const locationAnalysis = await this.detectLocationSpoofing();

            // Calculate overall scores including all detection methods with safe defaults
            const totalSuspicion = (envData.rdpScore || 0) +
                                   (locationAnalysis.spoofingScore || 0) +
                                   (this.environmentData.devToolsScore || 0) +
                                   (this.environmentData.consoleOverrideScore || 0) +
                                   (this.environmentData.extensionScore || 0) +
                                   (this.environmentData.maskingScore || 0) +
                                   (this.environmentData.vpnScore || 0);
            // Combine all indicators with safe defaults
            const allIndicators = [
                ...(locationAnalysis.spoofingIndicators || []),
                ...(envData.rdpIndicators || []),
                ...(this.environmentData.devToolsIndicators || []),
                ...(this.environmentData.consoleOverrides || []),
                ...(this.environmentData.extensionIndicators || []),
                ...(this.environmentData.maskingIndicators || []),
                ...(this.environmentData.vpnIndicators || [])
            ];
            
            return {
                location: {
                    coordinates: `${this.locationData.latitude.toFixed(4)}, ${this.locationData.longitude.toFixed(4)}`,
                    latitude: this.locationData.latitude,
                    longitude: this.locationData.longitude,
                    accuracy: `${this.locationData.accuracy.toFixed(0)}m`,
                    responseTime: `${this.locationData.responseTime}ms`,
                    isSpoofed: locationAnalysis.isLocationSpoofed,
                    spoofingScore: locationAnalysis.spoofingScore,
                    indicators: locationAnalysis.spoofingIndicators
                },
                environment: {
                    isRemoteDesktop: envData.isRemoteDesktop,
                    rdpScore: envData.rdpScore,
                    indicators: envData.rdpIndicators,
                    platform: envData.platform,
                    resolution: `${envData.screen.width}x${envData.screen.height}`,
                    timezone: envData.timezone
                },
                devTools: {
                    detected: this.environmentData.devToolsDetected || false,
                    score: this.environmentData.devToolsScore || 0,
                    indicators: this.environmentData.devToolsIndicators || []
                },
                console: {
                    overridden: this.consoleOverridden || false,
                    score: this.environmentData.consoleOverrideScore || 0,
                    indicators: this.environmentData.consoleOverrides || []
                },
                extensions: {
                    detected: this.extensionDetected || false,
                    score: this.environmentData.extensionScore || 0,
                    indicators: this.environmentData.extensionIndicators || []
                },
                deviceMasking: {
                    detected: this.deviceMaskingDetected || false,
                    score: this.environmentData.maskingScore || 0,
                    indicators: this.environmentData.maskingIndicators || []
                },
                vpn: {
                    detected: this.vpnDetected || false,
                    score: this.environmentData.vpnScore || 0,
                    indicators: this.environmentData.vpnIndicators || [],
                    provider: this.environmentData.detectedVpnProvider || null
                },
                overall: {
                    suspicionScore: totalSuspicion,
                    riskLevel: this.getRiskLevel(totalSuspicion),
                    allIndicators: allIndicators
                }
            };
        } catch (error) {
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    /**
     * @description Converts a numerical score into a categorical risk level.
     * @param {number} score - The total suspicion score.
     * @returns {string} The risk level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').
     */
    getRiskLevel(score) {
        if (score < 20) return 'LOW';
        if (score < 40) return 'MEDIUM';
        if (score < 60) return 'HIGH';
        return 'CRITICAL';
    }

    // RDP/VM Detection Methods
    checkScreenProperties() {
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const colorDepth = window.screen.colorDepth;
        const devicePixelRatio = window.devicePixelRatio;

        let suspicion = 'Normal';
        const factors = [];

        if (colorDepth < 24) {
            suspicion = 'Suspicious';
            factors.push(`Low Color Depth (${colorDepth} bits)`);
        }

        if (devicePixelRatio < 1 && devicePixelRatio <= 0.75) {
            suspicion = 'Suspicious';
            factors.push(`Unusual Device Pixel Ratio (${devicePixelRatio})`);
        }

        if ((screenWidth < 1024 || screenHeight < 768) && (screenWidth > 0 && screenHeight > 0)) {
            suspicion = 'Suspicious';
            factors.push(`Very Small Resolution (${screenWidth}x${screenHeight})`);
        }

        const aspectRatio = screenWidth / screenHeight;
        const commonAspectRatios = [16 / 9, 16 / 10, 4 / 3, 5 / 4];
        let isCommonAspectRatio = false;
        for (const commonRatio of commonAspectRatios) {
            if (Math.abs(aspectRatio - commonRatio) < 0.01) {
                isCommonAspectRatio = true;
                break;
            }
        }
        if (!isCommonAspectRatio) {
            suspicion = 'Suspicious';
            factors.push(`Uncommon Aspect Ratio (${aspectRatio.toFixed(2)})`);
        }

        return {
            data: { width: screenWidth, height: screenHeight, colorDepth: colorDepth, devicePixelRatio: devicePixelRatio },
            suspicion: suspicion,
            factors: factors
        };
    }

    checkWebGLRenderer() {
        let rendererString = 'Not available';
        let suspicion = 'Normal';
        const factors = [];

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    rendererString = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                    const suspiciousKeywords = [
                        'vmware', 'virtualbox', 'mesa offscreen', 'microsoft basic render driver',
                        'rdp display miniport', 'qemu', 'llvmpipe', 'software renderer',
                        'parsec', 'anydesk', 'teamviewer', 'chrome remote desktop', 'google gfx',
                        'virtual', 'remotefx'
                    ];

                    for (const keyword of suspiciousKeywords) {
                        if (rendererString.includes(keyword)) {
                            suspicion = 'Suspicious';
                            factors.push(`WebGL contains '${keyword}'`);
                        }
                    }
                } else {
                    rendererString = 'WEBGL_debug_renderer_info not available';
                }
            } else {
                rendererString = 'WebGL not supported';
            }
        } catch (e) {
            rendererString = `Error: ${e.message}`;
            suspicion = 'Could not determine';
            factors.push(`Error: ${e.message}`);
        }

        return { data: rendererString, suspicion: suspicion, factors: factors };
    }

    checkNavigatorProperties() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const hardwareConcurrency = navigator.hardwareConcurrency;
        const maxTouchPoints = navigator.maxTouchPoints;

        let suspicion = 'Normal';
        const factors = [];

        const uaSuspiciousKeywords = [
            'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'electron',
            'rdp', 'remotedesktop', 'anydesk', 'teamviewer', 'vmware', 'virtualbox', 'qemu'
        ];

        for (const keyword of uaSuspiciousKeywords) {
            if (userAgent.toLowerCase().includes(keyword.toLowerCase())) {
                suspicion = 'Suspicious';
                factors.push(`User Agent contains '${keyword}'`);
            }
        }

        if (hardwareConcurrency && hardwareConcurrency < 2) {
            suspicion = 'Suspicious';
            factors.push(`Low Hardware Concurrency (${hardwareConcurrency} cores)`);
        }

        return {
            data: { userAgent: userAgent, platform: platform, hardwareConcurrency: hardwareConcurrency, maxTouchPoints: maxTouchPoints },
            suspicion: suspicion,
            factors: factors
        };
    }

    getOverallRDPSuspicion(screenResult, webglResult, navigatorResult) {
        let totalSuspicionPoints = 0;
        const contributingFactors = [];

        if (screenResult.suspicion === 'Suspicious') {
            totalSuspicionPoints += 2;
            contributingFactors.push(...screenResult.factors.map(f => `Screen: ${f}`));
        }
        if (webglResult.suspicion === 'Suspicious') {
            totalSuspicionPoints += 3;
            contributingFactors.push(...webglResult.factors.map(f => `WebGL: ${f}`));
        }
        if (navigatorResult.suspicion === 'Suspicious') {
            totalSuspicionPoints += 2;
            contributingFactors.push(...navigatorResult.factors.map(f => `Navigator: ${f}`));
        }

        let overallLevel = 'Low';
        let type = 'authentic';

        if (totalSuspicionPoints >= 3) {
            overallLevel = 'Medium';
            type = 'suspicious';
        }
        if (totalSuspicionPoints >= 5) {
            overallLevel = 'High';
            type = 'fake';
        }

        return {
            level: overallLevel,
            type: type,
            score: totalSuspicionPoints,
            factors: contributingFactors.length > 0 ? contributingFactors : ['No significant indicators detected.']
        };
    }
}




/**
 * @class UIController
 * @description Handles all interactions with the DOM, including event listeners and result display.
 */
class UIController {
    constructor() {
        this.detector = new FraudDetector();
        this.map = null;
        this.marker = null;

        // Initialize behavioral analyzer if available
        this.behaviorAnalyzer = null;
        if (window.LocationBehaviorAnalyzer) {
            this.behaviorAnalyzer = new window.LocationBehaviorAnalyzer();
            this.behaviorAnalyzer.setFraudDetector(this.detector);
        }

        this.initializeEventListeners();

        // Set up DevTools detector reference
        if (window.DevToolsDetector) {
            window.DevToolsDetector.setUIController(this);
        }
    }

    /**
     * @description Binds the click event to the main button.
     */
    initializeEventListeners() {
        const locateBtn = document.getElementById('locateBtn');
        locateBtn.addEventListener('click', () => this.handleLocateClick());
    }

    /**
     * @description Orchestrates the analysis and display process when the button is clicked.
     */
    async handleLocateClick() {
        const btn = document.getElementById('locateBtn');
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');

        try {
            btn.disabled = true;
            loading.style.display = 'block';
            results.style.display = 'none';

            if (this.behaviorAnalyzer) {
                this.behaviorAnalyzer.startLocationMonitoring();
            }

            const analysis = await this.detector.performFullAnalysis();
            
            // Perform RDP/VM analysis
            this.performRDPAnalysis();
            
            // Display results
            this.displayResults(analysis);
            this.displayMap(analysis.location.latitude, analysis.location.longitude);

        } catch (error) {
            this.displayError(error.message);
        } finally {
            loading.style.display = 'none';
            btn.disabled = false;
        }
    }

    /**
     * @description Renders the analysis results on the page.
     * @param {object} analysis - The comprehensive analysis report from FraudDetector.
     */
    displayResults(analysis) {
        const results = document.getElementById('results');
        const locationResult = document.getElementById('locationResult');
        const environmentResult = document.getElementById('environmentResult');
        const locationStatus = document.getElementById('locationStatus');
        const environmentStatus = document.getElementById('environmentStatus');
        const detectionDetails = document.getElementById('detectionDetails');

        const locationAuth = analysis.location.isSpoofed ? '🚨 SPOOFED' : '✅ AUTHENTIC';
        locationStatus.innerHTML = `
            <strong>${locationAuth}</strong><br>
            Coordinates: ${analysis.location.coordinates}<br>
            Accuracy: ${analysis.location.accuracy}<br>
            Response Time: ${analysis.location.responseTime}
        `;

        const envType = analysis.environment.isRemoteDesktop ? 'REMOTE DESKTOP DETECTED' : 'LOCAL DESKTOP';
        const devToolsStatus = analysis.devTools.detected ? '⚠️ DEV TOOLS DETECTED' : '✅ No Dev Tools';
        const extensionStatus = analysis.extensions.detected ? '⚠️ EXTENSIONS DETECTED' : '✅ No Extensions';
        const consoleStatus = analysis.console.overridden ? '⚠️ CONSOLE OVERRIDE' : '✅ Console Normal';
        const maskingStatus = analysis.deviceMasking.detected ? '⚠️ DEVICE MASKING' : '✅ Device Normal';
        const vpnStatus = analysis.vpn.detected ? 
            `🚨 VPN DETECTED${analysis.vpn.provider ? ` (${analysis.vpn.provider})` : ''}` : 
            '✅ No VPN';
        environmentStatus.innerHTML = `
            <strong>${envType}</strong><br>
            Platform: ${analysis.environment.platform}<br>
            Resolution: ${analysis.environment.resolution}<br>
            Timezone: ${analysis.environment.timezone}<br><br>
            <strong>Advanced Detection:</strong><br>
            ${devToolsStatus}<br>
            ${extensionStatus}<br>
            ${consoleStatus}<br>
            ${maskingStatus}<br>
            ${vpnStatus}
        `;

        // Apply appropriate styling based on overall risk
        const hasHighRisk = analysis.devTools.detected || analysis.extensions.detected || 
                           analysis.console.overridden || analysis.location.isSpoofed || 
                           analysis.deviceMasking.detected || analysis.vpn.detected;
        locationResult.className = `result-card ${this.getStatusClass(analysis.location.isSpoofed)}`;
        environmentResult.className = `result-card ${this.getStatusClass(hasHighRisk)}`;

        const detectionBreakdown = `
            <strong>Detection Breakdown:</strong><br>
            • Location Spoofing: ${analysis.location.spoofingScore} points<br>
            • Remote Desktop: ${analysis.environment.rdpScore} points<br>
            • Developer Tools: ${analysis.devTools.score} points<br>
            • Extension Detection: ${analysis.extensions.score} points<br>
            • Console Override: ${analysis.console.score} points<br>
            • Device Masking: ${analysis.deviceMasking.score} points<br>
            • VPN Detection: ${analysis.vpn.score} points<br>
        `;

        detectionDetails.innerHTML = `
            <strong>Risk Level: ${analysis.overall.riskLevel}</strong> (Total Score: ${analysis.overall.suspicionScore})<br><br>
            ${detectionBreakdown}<br>
            ${analysis.overall.allIndicators.length > 0 ?
                '<strong>All Detected Indicators:</strong><ul>' +
                analysis.overall.allIndicators.map(indicator => `<li>${indicator}</li>`).join('') +
                '</ul>' :
                'No suspicious indicators detected.'
            }
        `;

        results.style.display = 'block';
    }
    
    /**
     * @description Displays an error message in the UI.
     * @param {string} message - The error message to display.
     */
    displayError(message) {
        const results = document.getElementById('results');
        const locationStatus = document.getElementById('locationStatus');
        const environmentStatus = document.getElementById('environmentStatus');
        const detectionDetails = document.getElementById('detectionDetails');

        locationStatus.innerHTML = '<strong>🚨 SPOOFED</strong><br>Error occurred - Location cannot be verified';
        environmentStatus.innerHTML = '<strong>ERROR</strong><br>Could not analyze environment';
        detectionDetails.innerHTML = `<strong>Error:</strong> ${message}`;

        document.getElementById('locationResult').className = 'result-card status-fake';
        document.getElementById('environmentResult').className = 'result-card status-fake';

        results.style.display = 'block';
    }

    /**
     * @description Returns a CSS class name based on the spoofing status.
     * @param {boolean} isSpoofed - Whether an item is considered spoofed or high-risk.
     * @returns {string} The CSS class name ('status-fake' or 'status-authentic').
     */
    getStatusClass(isSpoofed) {
        return isSpoofed ? 'status-fake' : 'status-authentic';
    }

    /**
     * @description Updates the DevTools status in the UI in real-time.
     * @param {boolean} devToolsDetected - The current detection status of DevTools.
     */
    updateDevToolsStatus(devToolsDetected) {
        const results = document.getElementById('results');
        if (results.style.display !== 'block') return;

        const environmentStatus = document.getElementById('environmentStatus');
        const environmentResult = document.getElementById('environmentResult');

        if (environmentStatus && environmentResult) {
            const devToolsStatus = devToolsDetected ?
                '⚠️ DEV TOOLS DETECTED (LIVE)' :
                '✅ Dev Tools Closed (but was detected)';
            const updatedHTML = environmentStatus.innerHTML.replace(
                /(⚠️ DEV TOOLS DETECTED.*?|✅ No Dev Tools|✅ Dev Tools Closed.*?)<br>/,
                `${devToolsStatus}<br>`
            );
            environmentStatus.innerHTML = updatedHTML;
            if (this.detector && this.detector.devToolsDetected) {
                environmentResult.className = 'result-card status-fake';
            }
        }
    }

    /**
     * @description Updates the location spoofing status if DevTools is detected.
     * @param {boolean} locationSpoofed - Whether the location is considered spoofed.
     */
    updateLocationSpoofingStatus(locationSpoofed) {
        const results = document.getElementById('results');
        if (results.style.display !== 'block') return;

        const locationStatus = document.getElementById('locationStatus');
        const locationResult = document.getElementById('locationResult');

        if (locationStatus && locationResult && locationSpoofed && this.detector && this.detector.locationSpoofedByDevTools) {
             const updatedHTML = locationStatus.innerHTML.replace(
                /<strong>(✅ AUTHENTIC|🚨 SPOOFED)<\/strong>/,
                '<strong>🚨 SPOOFED - DEVTOOLS DETECTED</strong><br><span style="color: #dc3545; font-weight: bold;">Location cannot be trusted - DevTools allows geolocation manipulation</span>'
            );
            locationStatus.innerHTML = updatedHTML;
            locationResult.className = 'result-card status-fake';
        }
    }

    performRDPAnalysis() {
        // Run RDP/VM detection checks
        const screenResult = this.detector.checkScreenProperties();
        const webglResult = this.detector.checkWebGLRenderer();
        const navigatorResult = this.detector.checkNavigatorProperties();
        const overallRdp = this.detector.getOverallRDPSuspicion(screenResult, webglResult, navigatorResult);

        // Update RDP result cards
        this.updateRDPResultCard('screenResult', 'screenStatus', 'screenDetails', screenResult);
        this.updateRDPResultCard('webglResult', 'webglStatus', 'webglDetails', webglResult);
        this.updateRDPResultCard('navigatorResult', 'navigatorStatus', 'navigatorDetails', navigatorResult);
        
        // Update overall RDP result
        this.updateOverallRDPResult(overallRdp);
    }

    updateRDPResultCard(resultId, statusId, detailsId, result) {
        const resultCard = document.getElementById(resultId);
        const statusEl = document.getElementById(statusId);
        const detailsEl = document.getElementById(detailsId);

        if (statusEl) {
            statusEl.textContent = result.suspicion;
        }

        if (detailsEl) {
            if (typeof result.data === 'string') {
                detailsEl.textContent = result.data;
            } else {
                detailsEl.textContent = JSON.stringify(result.data, null, 2);
            }
        }

        if (resultCard) {
            // Apply styling based on suspicion level
            resultCard.classList.remove('status-authentic', 'status-suspicious', 'status-fake');
            if (result.suspicion === 'Normal') {
                resultCard.classList.add('status-authentic');
            } else if (result.suspicion === 'Suspicious') {
                resultCard.classList.add('status-suspicious');
            } else {
                resultCard.classList.add('status-fake');
            }
        }
    }

    updateOverallRDPResult(overallRdp) {
        const overallRdpResult = document.getElementById('overallRdpResult');
        const overallRdpStatus = document.getElementById('overallRdpStatus');
        const overallRdpFactors = document.getElementById('overallRdpFactors');

        if (overallRdpStatus) {
            overallRdpStatus.textContent = `Suspicion Level: ${overallRdp.level}`;
        }

        if (overallRdpFactors) {
            overallRdpFactors.innerHTML = '';
            overallRdp.factors.forEach(factor => {
                const li = document.createElement('li');
                li.textContent = factor;
                overallRdpFactors.appendChild(li);
            });
        }

        if (overallRdpResult) {
            overallRdpResult.classList.remove('status-authentic', 'status-suspicious', 'status-fake');
            if (overallRdp.type === 'authentic') {
                overallRdpResult.classList.add('status-authentic');
            } else if (overallRdp.type === 'suspicious') {
                overallRdpResult.classList.add('status-suspicious');
            } else if (overallRdp.type === 'fake') {
                overallRdpResult.classList.add('status-fake');
            }
        }
    }

    /**
     * @description Displays the detected location on a Leaflet map.
     * @param {number} latitude - The latitude of the location.
     * @param {number} longitude - The longitude of the location.
     */
    displayMap(latitude, longitude) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.style.display = 'block';

        if (!this.map) {
            this.map = L.map('map').setView([latitude, longitude], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);
        } else {
            this.map.setView([latitude, longitude], 13);
        }

        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        this.marker = L.marker([latitude, longitude])
            .addTo(this.map)
            .bindPopup(`<b>📍 Detected Location</b><br>Latitude: ${latitude.toFixed(6)}<br>Longitude: ${longitude.toFixed(6)}`)
            .openPopup();
            
        if (this.detector.locationData && this.detector.locationData.accuracy) {
             const accuracyCircle = L.circle([latitude, longitude], {
                color: 'blue',
                fillColor: '#add8e6',
                fillOpacity: 0.2,
                radius: this.detector.locationData.accuracy
            }).addTo(this.map);
            
            const group = new L.featureGroup([this.marker, accuracyCircle]);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

// Dummy classes to prevent errors if other scripts aren't loaded.
// In the final project, these would be in their own files.
if (typeof ExtensionDetector === 'undefined') {
    class ExtensionDetector {
        performFullExtensionDetection() {
            // Placeholder implementation
            return { score: 0, indicators: [], detected: false };
        }
    }
}
if (typeof LocationBehaviorAnalyzer === 'undefined') {
    class LocationBehaviorAnalyzer {
        setFraudDetector(detector) {}
        startLocationMonitoring() {}
    }
}
if (typeof DevToolsDetector === 'undefined') {
    class DevToolsDetector {
        static setUIController(controller) {}
        static initialize() {}
    }
}


// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
    
    // Initialize DevTools detection if it exists
    if (window.DevToolsDetector && typeof window.DevToolsDetector.initialize === 'function') {
        window.DevToolsDetector.initialize();
    }
});