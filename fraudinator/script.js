class FraudDetector {
    constructor() {
        this.locationData = null;
        this.environmentData = {};
        this.suspicionScore = 0;
        this.detectionDetails = [];
        this.devToolsDetected = false;
        this.extensionDetected = false;
        this.consoleOverridden = false;
        this.initializeDetection();
    }

    initializeDetection() {
        this.detectDevToolsInitial();
        this.detectConsoleOverrides();
        this.detectExtensionArtifacts();
        this.setupAntiEvasion();
    }

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

    detectDevToolsRuntime() {
        // Runtime DevTools detection that bypasses common evasion attempts
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if ((widthThreshold || heightThreshold) && !this.devToolsDetected) {
            this.devToolsDetected = true;
            this.environmentData.devToolsScore += 25;
            this.environmentData.devToolsIndicators.push('DevTools opened during session');
        }
    }

    checkForExtensionArtifacts(node) {
        // Check for extension-injected elements
        const extensionAttributes = [
            'data-vytal', 'data-surfshark', 'data-location-guard', 
            'data-change-location', 'data-extension', 'data-vpn'
        ];
        
        extensionAttributes.forEach(attr => {
            if (node.hasAttribute && node.hasAttribute(attr)) {
                this.extensionDetected = true;
                this.environmentData.extensionScore += 20;
                this.environmentData.extensionIndicators.push(`Extension artifact detected: ${attr}`);
            }
        });
    }

    detectDevToolsInitial() {
        const devToolsIndicators = [];
        let devToolsScore = 0;

        // Method 1: Timing-based detection
        const startTime = performance.now();
        debugger;
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

    detectConsoleOverrides() {
        const consoleOverrides = [];
        let overrideScore = 0;

        // Check if console methods have been overridden
        const nativeToString = Function.prototype.toString;
        const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace'];
        
        consoleMethods.forEach(method => {
            const consoleMethod = console[method];
            const methodString = nativeToString.call(consoleMethod);
            
            if (!methodString.includes('[native code]')) {
                overrideScore += 10;
                consoleOverrides.push(`Console.${method} has been overridden`);
                this.consoleOverridden = true;
            }
        });

        // Check for function modification detection
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

    detectExtensionArtifacts() {
        const extensionIndicators = [];
        let extensionScore = 0;

        // Vytal extension detection
        if (window.vytal || document.querySelector('[data-vytal]') || 
            document.documentElement.getAttribute('data-vytal')) {
            extensionScore += 40;
            extensionIndicators.push('Vytal extension detected');
            this.extensionDetected = true;
        }

        // Location Guard detection
        if (window.locationGuard || navigator.geolocation.getCurrentPosition.toString().includes('locationguard')) {
            extensionScore += 35;
            extensionIndicators.push('Location Guard extension detected');
            this.extensionDetected = true;
        }

        // Change Location detection
        if (window.changeLocation || document.querySelector('[data-change-location]')) {
            extensionScore += 35;
            extensionIndicators.push('Change Location extension detected');
            this.extensionDetected = true;
        }

        // SurfShark extension detection
        if (window.surfshark || document.querySelector('[data-surfshark]') ||
            document.documentElement.hasAttribute('data-surfshark-vpn')) {
            extensionScore += 30;
            extensionIndicators.push('SurfShark extension detected');
            this.extensionDetected = true;
        }

        // Generic extension detection via DOM modifications
        const extensionElements = document.querySelectorAll('[data-extension], [data-vpn], [data-location-spoof]');
        if (extensionElements.length > 0) {
            extensionScore += 20;
            extensionIndicators.push('Generic location spoofing extension detected');
            this.extensionDetected = true;
        }

        // Check for modified geolocation API
        if (navigator.geolocation.getCurrentPosition.toString().length > 100) {
            extensionScore += 25;
            extensionIndicators.push('Geolocation API appears to be modified');
            this.extensionDetected = true;
        }

        // Check for WebRTC modifications (common in VPN extensions)
        if (window.RTCPeerConnection && 
            window.RTCPeerConnection.prototype.createDataChannel.toString().includes('native') === false) {
            extensionScore += 20;
            extensionIndicators.push('WebRTC modifications detected (possible VPN)');
        }

        this.environmentData.extensionScore = extensionScore;
        this.environmentData.extensionIndicators = extensionIndicators;
    }

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

        // Check for unrealistic precision patterns
        const latStr = currentLat.toString();
        const lngStr = currentLng.toString();
        
        if (latStr.includes('.000000') || lngStr.includes('.000000')) {
            signatureScore += 30;
            signatureIndicators.push('Unrealistic coordinate precision detected');
        }

        // Check for common emulator coordinates
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
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

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

        // Remote Desktop Indicators
        let rdpScore = 0;
        const rdpIndicators = [];

        // Check for common RDP resolutions
        const commonRdpResolutions = [
            [1024, 768], [1280, 1024], [1440, 900], [1920, 1080]
        ];
        const currentRes = [checks.screen.width, checks.screen.height];
        if (commonRdpResolutions.some(res => res[0] === currentRes[0] && res[1] === currentRes[1])) {
            rdpScore += 10;
            rdpIndicators.push('Common RDP resolution detected');
        }

        // Check for unusual screen properties
        if (checks.screen.colorDepth < 24) {
            rdpScore += 15;
            rdpIndicators.push('Low color depth (typical of RDP)');
        }

        // Check for window size mismatches
        if (checks.window.outerWidth !== checks.screen.width || 
            checks.window.outerHeight !== checks.screen.height) {
            rdpScore += 5;
            rdpIndicators.push('Window size mismatch');
        }

        // Check for RDP-specific user agent patterns
        if (checks.userAgent.includes('RDP') || checks.userAgent.includes('Remote')) {
            rdpScore += 20;
            rdpIndicators.push('RDP indicator in user agent');
        }

        // Check for virtualization indicators
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

    async detectLocationSpoofing() {
        if (!this.locationData) {
            throw new Error('Location data not available');
        }

        const spoofingIndicators = [];
        let spoofingScore = 0;

        // Check response time (spoofed locations often respond too quickly)
        if (this.locationData.responseTime < 100) {
            spoofingScore += 15;
            spoofingIndicators.push('Suspiciously fast geolocation response');
        }

        // Check accuracy (fake locations often have unrealistic precision)
        if (this.locationData.accuracy < 5) {
            spoofingScore += 10;
            spoofingIndicators.push('Unrealistically high accuracy');
        } else if (this.locationData.accuracy > 10000) {
            spoofingScore += 5;
            spoofingIndicators.push('Very low accuracy');
        }

        // Check for common spoofed coordinates (rounded numbers)
        const lat = this.locationData.latitude;
        const lng = this.locationData.longitude;
        
        if (Math.abs(lat % 1) < 0.001 || Math.abs(lng % 1) < 0.001) {
            spoofingScore += 20;
            spoofingIndicators.push('Coordinates appear rounded/artificial');
        }

        // Check timezone vs location consistency
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const timezoneFromCoords = await this.getTimezoneFromCoords(lat, lng);
            
            if (timezone !== timezoneFromCoords) {
                spoofingScore += 25;
                spoofingIndicators.push(`Timezone mismatch: Browser(${timezone}) vs Location(${timezoneFromCoords})`);
            }
        } catch (e) {
            // Timezone API might not be available
        }

        // Check for suspicious locations (middle of ocean, etc.)
        if (this.isSuspiciousLocation(lat, lng)) {
            spoofingScore += 30;
            spoofingIndicators.push('Location appears to be in suspicious area');
        }

        // Add location signature detection
        const signatureDetection = this.detectLocationSignatures();
        spoofingScore += signatureDetection.signatureScore;
        spoofingIndicators.push(...signatureDetection.signatureIndicators);

        return {
            spoofingScore,
            spoofingIndicators,
            isLocationSpoofed: spoofingScore >= 20
        };
    }

    async getTimezoneFromCoords(lat, lng) {
        // Simple timezone approximation based on longitude
        // In a real implementation, you'd use a proper timezone API
        const timezoneOffset = Math.round(lng / 15);
        const utcOffset = timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;
        return `UTC${utcOffset}`;
    }

    isSuspiciousLocation(lat, lng) {
        // Check if coordinates are in the middle of ocean or other suspicious areas
        // This is a simplified check - real implementation would use detailed geographic data
        
        // Check for exact 0,0 coordinates (Null Island)
        if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) {
            return true;
        }

        // Check for other common fake coordinates
        const suspiciousCoords = [
            [37.7749, -122.4194], // San Francisco (commonly spoofed)
            [40.7128, -74.0060],  // New York (commonly spoofed)
            [51.5074, -0.1278],   // London (commonly spoofed)
        ];

        return suspiciousCoords.some(coords => 
            Math.abs(lat - coords[0]) < 0.01 && Math.abs(lng - coords[1]) < 0.01
        );
    }

    async performFullAnalysis() {
        try {
            // Analyze environment first
            const envData = this.detectRemoteDesktop();
            
            // Get location data
            await this.analyzeLocation();
            
            // Analyze location spoofing
            const locationAnalysis = await this.detectLocationSpoofing();
            
            // Calculate overall scores including new detection methods
            const totalSuspicion = envData.rdpScore + 
                                 locationAnalysis.spoofingScore + 
                                 this.environmentData.devToolsScore + 
                                 this.environmentData.consoleOverrideScore + 
                                 this.environmentData.extensionScore;
            
            // Combine all indicators
            const allIndicators = [
                ...locationAnalysis.spoofingIndicators,
                ...envData.rdpIndicators,
                ...this.environmentData.devToolsIndicators,
                ...this.environmentData.consoleOverrides,
                ...this.environmentData.extensionIndicators
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
                    detected: this.environmentData.devToolsDetected,
                    score: this.environmentData.devToolsScore,
                    indicators: this.environmentData.devToolsIndicators
                },
                console: {
                    overridden: this.consoleOverridden,
                    score: this.environmentData.consoleOverrideScore,
                    indicators: this.environmentData.consoleOverrides
                },
                extensions: {
                    detected: this.extensionDetected,
                    score: this.environmentData.extensionScore,
                    indicators: this.environmentData.extensionIndicators
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

    getRiskLevel(score) {
        if (score < 20) return 'LOW';
        if (score < 40) return 'MEDIUM';
        if (score < 60) return 'HIGH';
        return 'CRITICAL';
    }
}

// UI Controller
class UIController {
    constructor() {
        this.detector = new FraudDetector();
        this.map = null;
        this.marker = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const locateBtn = document.getElementById('locateBtn');
        locateBtn.addEventListener('click', () => this.handleLocateClick());
    }

    async handleLocateClick() {
        const btn = document.getElementById('locateBtn');
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');

        try {
            // Show loading, hide results
            btn.disabled = true;
            loading.style.display = 'block';
            results.style.display = 'none';

            // Perform analysis
            const analysis = await this.detector.performFullAnalysis();
            
            // Display results
            this.displayResults(analysis);
            
            // Display map
            this.displayMap(analysis.location.latitude, analysis.location.longitude);
            
        } catch (error) {
            this.displayError(error.message);
        } finally {
            // Hide loading, enable button
            loading.style.display = 'none';
            btn.disabled = false;
        }
    }

    displayResults(analysis) {
        const results = document.getElementById('results');
        const locationResult = document.getElementById('locationResult');
        const environmentResult = document.getElementById('environmentResult');
        const locationStatus = document.getElementById('locationStatus');
        const environmentStatus = document.getElementById('environmentStatus');
        const detectionDetails = document.getElementById('detectionDetails');

        // Location authenticity
        const locationAuth = analysis.location.isSpoofed ? 'SUSPICIOUS - Potentially Spoofed' : 'AUTHENTIC';
        locationStatus.innerHTML = `
            <strong>${locationAuth}</strong><br>
            Coordinates: ${analysis.location.coordinates}<br>
            Accuracy: ${analysis.location.accuracy}<br>
            Response Time: ${analysis.location.responseTime}
        `;

        // Environment analysis with enhanced detection info
        const envType = analysis.environment.isRemoteDesktop ? 'REMOTE DESKTOP DETECTED' : 'LOCAL DESKTOP';
        const devToolsStatus = analysis.devTools.detected ? '⚠️ DEV TOOLS DETECTED' : '✅ No Dev Tools';
        const extensionStatus = analysis.extensions.detected ? '⚠️ EXTENSIONS DETECTED' : '✅ No Extensions';
        const consoleStatus = analysis.console.overridden ? '⚠️ CONSOLE OVERRIDE' : '✅ Console Normal';
        
        environmentStatus.innerHTML = `
            <strong>${envType}</strong><br>
            Platform: ${analysis.environment.platform}<br>
            Resolution: ${analysis.environment.resolution}<br>
            Timezone: ${analysis.environment.timezone}<br><br>
            <strong>Advanced Detection:</strong><br>
            ${devToolsStatus}<br>
            ${extensionStatus}<br>
            ${consoleStatus}
        `;

        // Apply appropriate styling based on overall risk
        const hasHighRisk = analysis.devTools.detected || analysis.extensions.detected || 
                           analysis.console.overridden || analysis.location.isSpoofed;
        
        locationResult.className = `result-card ${this.getStatusClass(analysis.location.isSpoofed)}`;
        environmentResult.className = `result-card ${this.getStatusClass(hasHighRisk)}`;

        // Enhanced detection details
        const detectionBreakdown = `
            <strong>Detection Breakdown:</strong><br>
            • Location Spoofing: ${analysis.location.spoofingScore} points<br>
            • Remote Desktop: ${analysis.environment.rdpScore} points<br>
            • Developer Tools: ${analysis.devTools.score} points<br>
            • Extension Detection: ${analysis.extensions.score} points<br>
            • Console Override: ${analysis.console.score} points<br>
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

    displayError(message) {
        const results = document.getElementById('results');
        const locationStatus = document.getElementById('locationStatus');
        const environmentStatus = document.getElementById('environmentStatus');
        const detectionDetails = document.getElementById('detectionDetails');

        locationStatus.innerHTML = '<strong>ERROR</strong><br>Could not determine location authenticity';
        environmentStatus.innerHTML = '<strong>ERROR</strong><br>Could not analyze environment';
        detectionDetails.innerHTML = `<strong>Error:</strong> ${message}`;

        document.getElementById('locationResult').className = 'result-card status-suspicious';
        document.getElementById('environmentResult').className = 'result-card status-suspicious';

        results.style.display = 'block';
    }

    getStatusClass(isSuspicious) {
        return isSuspicious ? 'status-fake' : 'status-authentic';
    }

    displayMap(latitude, longitude) {
        const mapContainer = document.getElementById('mapContainer');
        
        // Show the map container
        mapContainer.style.display = 'block';
        
        // Initialize map if not already done
        if (!this.map) {
            this.map = L.map('map').setView([latitude, longitude], 13);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);
        } else {
            // Update existing map view
            this.map.setView([latitude, longitude], 13);
        }
        
        // Remove existing marker if any
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }
        
        // Add new marker
        this.marker = L.marker([latitude, longitude])
            .addTo(this.map)
            .bindPopup(`
                <b>📍 Detected Location</b><br>
                Latitude: ${latitude.toFixed(6)}<br>
                Longitude: ${longitude.toFixed(6)}
            `)
            .openPopup();
            
        // Add accuracy circle if accuracy data is available
        if (this.detector.locationData && this.detector.locationData.accuracy) {
            const accuracyCircle = L.circle([latitude, longitude], {
                color: 'blue',
                fillColor: '#add8e6',
                fillOpacity: 0.2,
                radius: this.detector.locationData.accuracy
            }).addTo(this.map);
            
            // Fit map to show both marker and accuracy circle
            const group = new L.featureGroup([this.marker, accuracyCircle]);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});