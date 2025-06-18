// Location Behavioral Analysis Module
// Detects patterns that indicate manual location spoofing

class LocationBehaviorAnalyzer {
    constructor() {
        this.locationHistory = [];
        this.watchId = null;
        this.monitoringActive = false;
        this.behavioralIndicators = [];
        this.behavioralScore = 0;
        this.fraudDetector = null;
    }

    // Set reference to the main fraud detector
    setFraudDetector(detector) {
        this.fraudDetector = detector;
    }

    // Start continuous location monitoring for behavioral analysis
    startLocationMonitoring() {
        if (!navigator.geolocation || this.monitoringActive) return;
        
        this.monitoringActive = true;
        console.log('Starting location monitoring for behavioral analysis...');
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.analyzeLocationUpdate(position),
            (error) => console.log('Location monitoring error:', error),
            options
        );
        
        // Stop monitoring after 2 minutes to avoid excessive tracking
        setTimeout(() => this.stopLocationMonitoring(), 1);
    }
    
    stopLocationMonitoring() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.monitoringActive = false;
            console.log('Location monitoring stopped');
        }
    }
    
    analyzeLocationUpdate(position) {
        const currentTime = Date.now();
        const locationPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: currentTime,
            coords: position.coords
        };
        
        this.locationHistory.push(locationPoint);
        
        // Keep only last 10 location points to avoid memory issues
        if (this.locationHistory.length > 10) {
            this.locationHistory.shift();
        }
        
        // Analyze behavioral patterns if we have enough data
        if (this.locationHistory.length >= 2) {
            this.detectBehavioralAnomalies();
        }
    }
    
    detectBehavioralAnomalies() {
        const indicators = [];
        let score = 0;
        
        // Check for instantaneous jumps (impossible travel speed)
        score += this.detectInstantaneousJumps(indicators);
        
        // Check for perfectly round coordinates
        score += this.detectPerfectCoordinates(indicators);
        
        // Check for unusual accuracy patterns
        score += this.detectAccuracyAnomalies(indicators);
        
        // Check for static accuracy values
        score += this.detectStaticAccuracy(indicators);
        
        // Update behavioral analysis results
        this.behavioralScore = score;
        this.behavioralIndicators = indicators;
        
        if (score > 0) {
            console.log('Behavioral anomalies detected:', indicators);
            
            // Update the main fraud detector if available
            if (this.fraudDetector) {
                this.fraudDetector.behavioralScore = score;
                this.fraudDetector.behavioralIndicators = indicators;
                
                // Mark location as spoofed if behavioral score is high
                if (score >= 50) {
                    this.fraudDetector.locationSpoofedByBehavior = true;
                }
            }
        }
    }
    
    detectInstantaneousJumps(indicators) {
        let score = 0;
        
        for (let i = 1; i < this.locationHistory.length; i++) {
            const prev = this.locationHistory[i - 1];
            const current = this.locationHistory[i];
            
            const distance = this.calculateDistance(
                prev.latitude, prev.longitude,
                current.latitude, current.longitude
            );
            
            const timeDiff = (current.timestamp - prev.timestamp) / 1000; // seconds
            const speed = distance / timeDiff; // meters per second
            const speedKmh = speed * 3.6; // km/h
            
            // Flag impossibly fast travel (faster than commercial aircraft)
            if (speedKmh > 1000 && distance > 1000) { // 1000 km/h and moved more than 1km
                score += 60;
                indicators.push(`Impossible travel speed: ${speedKmh.toFixed(0)} km/h over ${distance.toFixed(0)}m`);
            }
            // Flag very fast travel (faster than car on highway)
            else if (speedKmh > 200 && distance > 500) { // 200 km/h and moved more than 500m
                score += 40;
                indicators.push(`Suspicious travel speed: ${speedKmh.toFixed(0)} km/h over ${distance.toFixed(0)}m`);
            }
        }
        
        return score;
    }
    
    detectPerfectCoordinates(indicators) {
        let score = 0;
        const recent = this.locationHistory.slice(-3); // Check last 3 positions
        
        for (const location of recent) {
            const lat = location.latitude;
            const lng = location.longitude;
            
            // Check for perfectly round numbers (common in manual entry)
            const latStr = lat.toString();
            const lngStr = lng.toString();
            
            const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
            const lngDecimals = lngStr.includes('.') ? lngStr.split('.')[1].length : 0;
            
            // Flag coordinates with suspiciously few decimal places
            if (latDecimals <= 4 && lngDecimals <= 4) {
                score += 25;
                indicators.push(`Suspiciously precise coordinates: ${lat}, ${lng} (${latDecimals}/${lngDecimals} decimals)`);
            }
            
            // Check for exact round numbers
            if (lat % 0.1 === 0 || lng % 0.1 === 0) {
                score += 35;
                indicators.push(`Perfect round coordinates detected: ${lat}, ${lng}`);
            }
        }
        
        return score;
    }
    
    detectAccuracyAnomalies(indicators) {
        let score = 0;
        const accuracies = this.locationHistory.map(loc => loc.accuracy);
        
        if (accuracies.length < 2) return score;
        
        // Check for unrealistic accuracy patterns
        const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
        const maxAccuracy = Math.max(...accuracies);
        const minAccuracy = Math.min(...accuracies);
        
        // Flag consistently perfect accuracy (unrealistic)
        if (maxAccuracy < 5 && avgAccuracy < 3) {
            score += 30;
            indicators.push(`Unrealistically high accuracy: avg ${avgAccuracy.toFixed(1)}m, max ${maxAccuracy.toFixed(1)}m`);
        }
        
        // Flag wild accuracy swings (inconsistent with real GPS)
        if (maxAccuracy / minAccuracy > 100 && maxAccuracy > 1000) {
            score += 25;
            indicators.push(`Extreme accuracy variations: ${minAccuracy.toFixed(1)}m to ${maxAccuracy.toFixed(1)}m`);
        }
        
        return score;
    }
    
    detectStaticAccuracy(indicators) {
        let score = 0;
        const accuracies = this.locationHistory.map(loc => loc.accuracy);
        
        if (accuracies.length < 3) return score;
        
        // Check if accuracy never changes (suspicious)
        const uniqueAccuracies = [...new Set(accuracies)];
        if (uniqueAccuracies.length === 1) {
            score += 20;
            indicators.push(`Static accuracy value: ${accuracies[0]}m (never changes)`);
        }
        
        // Check for common spoofed accuracy values
        const commonSpoofedValues = [10, 20, 50, 100, 150];
        if (commonSpoofedValues.includes(accuracies[0]) && uniqueAccuracies.length === 1) {
            score += 30;
            indicators.push(`Common spoofed accuracy value: ${accuracies[0]}m`);
        }
        
        return score;
    }
    
    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Get current analysis results
    getAnalysisResults() {
        return {
            behavioralScore: this.behavioralScore,
            behavioralIndicators: this.behavioralIndicators,
            isLocationSpoofedByBehavior: this.behavioralScore >= 50,
            locationHistory: this.locationHistory,
            monitoringActive: this.monitoringActive
        };
    }
}

// Export the analyzer
window.LocationBehaviorAnalyzer = LocationBehaviorAnalyzer;