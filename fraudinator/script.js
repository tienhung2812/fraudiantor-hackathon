class FraudDetector {
    constructor() {
        this.locationData = null;
        this.environmentData = {};
        this.suspicionScore = 0;
        this.detectionDetails = [];
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
            
            // Calculate overall scores
            const totalSuspicion = envData.rdpScore + locationAnalysis.spoofingScore;
            
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
                overall: {
                    suspicionScore: totalSuspicion,
                    riskLevel: this.getRiskLevel(totalSuspicion)
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

        // Environment analysis
        const envType = analysis.environment.isRemoteDesktop ? 'REMOTE DESKTOP DETECTED' : 'LOCAL DESKTOP';
        environmentStatus.innerHTML = `
            <strong>${envType}</strong><br>
            Platform: ${analysis.environment.platform}<br>
            Resolution: ${analysis.environment.resolution}<br>
            Timezone: ${analysis.environment.timezone}
        `;

        // Apply appropriate styling
        locationResult.className = `result-card ${this.getStatusClass(analysis.location.isSpoofed)}`;
        environmentResult.className = `result-card ${this.getStatusClass(analysis.environment.isRemoteDesktop)}`;

        // Detection details
        const allIndicators = [...analysis.location.indicators, ...analysis.environment.indicators];
        detectionDetails.innerHTML = `
            <strong>Risk Level: ${analysis.overall.riskLevel}</strong> (Score: ${analysis.overall.suspicionScore})<br><br>
            ${allIndicators.length > 0 ? 
                '<strong>Detected Indicators:</strong><ul>' + 
                allIndicators.map(indicator => `<li>${indicator}</li>`).join('') + 
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