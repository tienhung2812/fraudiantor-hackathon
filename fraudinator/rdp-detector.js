// rdp-detector.js

// DOM Elements
const detectBtn = document.getElementById('detectBtn');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');
const mapContainer = document.getElementById('mapContainer');

const locationStatusEl = document.getElementById('locationStatus');
const environmentStatusEl = document.getElementById('environmentResult').querySelector('.result-value'); // Correctly target existing environment status
const detectionDetailsEl = document.getElementById('detectionDetails');

// New RDP/VM elements
const screenResultEl = document.getElementById('screenResult');
const screenStatusEl = document.getElementById('screenStatus');
const screenDetailsEl = document.getElementById('screenDetails');
const webglResultEl = document.getElementById('webglResult');
const webglStatusEl = document.getElementById('webglStatus');
const webglDetailsEl = document.getElementById('webglDetails');
const navigatorResultEl = document.getElementById('navigatorResult');
const navigatorStatusEl = document.getElementById('navigatorStatus');
const navigatorDetailsEl = document.getElementById('navigatorDetails');
const overallRdpResult = document.getElementById('overallRdpResult'); // This is the card div
const overallRdpStatusEl = document.getElementById('overallRdpStatus'); // This is the value inside the card
const overallRdpFactorsEl = document.getElementById('overallRdpFactors'); // This is the ul for factors

let map = null; // Leaflet map instance

/**
 * Shows the loading indicator and hides results.
 */
function showLoading() {
    loadingDiv.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    detectBtn.disabled = true;
    detectBtn.textContent = 'Analyzing...';
}

/**
 * Hides the loading indicator and shows results.
 */
function hideLoading() {
    loadingDiv.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    detectBtn.disabled = false;
    detectBtn.textContent = 'Start Detection';
}

/**
 * Updates a result card's status and applies appropriate styling.
 * @param {HTMLElement} element - The result card element (e.g., locationResult, screenResultEl).
 * @param {string} statusText - The status text (e.g., 'Authentic', 'Suspicious', 'Fake').
 * @param {string} type - The type of status ('authentic', 'suspicious', 'fake').
 */
function updateResultCard(element, statusText, type) {
    // Update the text content of the .result-value within the element
    const resultValueElement = element.querySelector('.result-value');
    if (resultValueElement) {
        resultValueElement.textContent = statusText;
    } else {
        // For overallRdpResult, which has a specific ul, just update the top status text
        if (element === overallRdpResult) {
            overallRdpStatusEl.textContent = statusText;
        }
    }

    // Remove all existing status classes and add the correct one
    element.classList.remove('status-authentic', 'status-suspicious', 'status-fake');
    if (type === 'authentic') {
        element.classList.add('status-authentic');
    } else if (type === 'suspicious') {
        element.classList.add('status-suspicious');
    } else if (type === 'fake') {
        element.classList.add('status-fake');
    } else {
        // Fallback for default blue border if type doesn't match predefined statuses
        element.style.borderLeftColor = '#007bff';
    }
}

/**
 * Performs location detection using Geolocation API and displays it on a map.
 * @returns {Promise<Object>} A promise that resolves with location data and status.
 */
async function detectLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const accuracy = position.coords.accuracy;

                    // Display map if successfully obtained location
                    mapContainer.style.display = 'block'; // Show map container
                    if (!map) {
                        map = L.map('map').setView([lat, lon], 13);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(map);
                    } else {
                        map.setView([lat, lon], 13);
                    }
                    L.marker([lat, lon]).addTo(map)
                        .bindPopup(`Your approximate location. Accuracy: ${accuracy} meters.`)
                        .openPopup();

                    resolve({
                        status: 'Authentic Location Detected',
                        type: 'authentic',
                        details: { latitude: lat, longitude: lon, accuracy: accuracy }
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let status = 'Not Available';
                    let type = '';
                    if (error.code === error.PERMISSION_DENIED) {
                        status = 'Location: Blocked by User';
                        type = 'fake';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        status = 'Location: Unavailable';
                        type = 'suspicious';
                    } else if (error.code === error.TIMEOUT) {
                        status = 'Location: Timeout';
                        type = 'suspicious';
                    }
                    mapContainer.style.display = 'none'; // Hide map if location not available
                    resolve({
                        status: status,
                        type: type,
                        details: `Error: ${error.message}`
                    });
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            mapContainer.style.display = 'none'; // Hide map if not supported
            resolve({
                status: 'Location: Geolocation Not Supported',
                type: 'fake',
                details: 'Your browser does not support Geolocation.'
            });
        }
    });
}

/**
 * Checks screen properties for RDP/VM indicators.
 * @returns {Object} An object with data, suspicion level, and contributing factors.
 */
function checkScreenProperties() {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const colorDepth = window.screen.colorDepth;
    const devicePixelRatio = window.devicePixelRatio;

    let suspicion = 'Normal';
    const factors = [];

    // Low color depth often used in RDP for performance
    if (colorDepth < 24) { // Typical modern displays are 24-bit or 32-bit
        suspicion = 'Suspicious';
        factors.push(`Low Color Depth (${colorDepth} bits)`);
    }

    // Very low device pixel ratio might indicate a scaled environment, though less common as a direct RDP indicator.
    if (devicePixelRatio < 1 && devicePixelRatio <= 0.75) { // Arbitrary threshold for "very low"
        suspicion = 'Suspicious';
        factors.push(`Unusual Device Pixel Ratio (${devicePixelRatio})`);
    }

    // Heuristics for "unusual" resolutions for a typical user
    if ((screenWidth < 1024 || screenHeight < 768) && (screenWidth > 0 && screenHeight > 0)) { // Very small resolutions
        suspicion = 'Suspicious';
        factors.push(`Very Small Resolution (${screenWidth}x${screenHeight})`);
    }

    // Check for non-standard aspect ratios that are not common for physical monitors.
    const aspectRatio = screenWidth / screenHeight;
    const commonAspectRatios = [16 / 9, 16 / 10, 4 / 3, 5 / 4];
    let isCommonAspectRatio = false;
    for (const commonRatio of commonAspectRatios) {
        if (Math.abs(aspectRatio - commonRatio) < 0.01) { // Allow for small floating point differences
            isCommonAspectRatio = true;
            break;
        }
    }
    if (!isCommonAspectRatio) {
        suspicion = 'Suspicious';
        factors.push(`Uncommon Aspect Ratio (${aspectRatio.toFixed(2)})`);
    }

    return {
        data: {
            width: screenWidth,
            height: screenHeight,
            colorDepth: colorDepth,
            devicePixelRatio: devicePixelRatio
        },
        suspicion: suspicion,
        factors: factors
    };
}

/**
 * Attempts to retrieve WebGL renderer string and checks for virtualization indicators.
 * @returns {Object} An object with data, suspicion level, and contributing factors.
 */
function checkWebGLRenderer() {
    let rendererString = 'Not available';
    let suspicion = 'Normal';
    const factors = [];

    try {
        const canvas = document.createElement('canvas');
        // Try both webgl and webgl2 contexts
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                rendererString = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                const suspiciousKeywords = [
                    'vmware', 'virtualbox', 'mesa offscreen', 'microsoft basic render driver',
                    'rdp display miniport', 'qemu', 'llvmpipe', 'software renderer',
                    'parsec', 'anydesk', 'teamviewer', 'chrome remote desktop', 'google gfx',
                    'virtual', 'remotefx' // Broader terms
                ];

                for (const keyword of suspiciousKeywords) {
                    if (rendererString.includes(keyword)) {
                        suspicion = 'Suspicious';
                        factors.push(`WebGL Renderer contains '${keyword}'`);
                    }
                }
            } else {
                rendererString = 'WEBGL_debug_renderer_info not available';
                // This might be suspicious if expected in a typical environment, but not strong enough alone.
            }
        } else {
            rendererString = 'WebGL not supported';
            // This could be suspicious if a modern browser is expected, but not strong enough alone.
        }
    } catch (e) {
        rendererString = `Error retrieving WebGL info: ${e.message}`;
        suspicion = 'Could not determine';
        factors.push(`Error: ${e.message}`);
    }

    return {
        data: rendererString,
        suspicion: suspicion,
        factors: factors
    };
}

/**
 * Inspects navigator properties (User Agent, Platform, Hardware Concurrency) for RDP/VM indicators.
 * @returns {Object} An object with data, suspicion level, and contributing factors.
 */
function checkNavigatorProperties() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency; // Number of logical processor cores
    const maxTouchPoints = navigator.maxTouchPoints; // Max number of simultaneous touch contacts

    let suspicion = 'Normal';
    const factors = [];

    // Check for common virtual environment indicators in User Agent
    const uaSuspiciousKeywords = [
        'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'electron', // Automation/headless browsers
        'rdp', 'remotedesktop', 'anydesk', 'teamviewer', 'zoom meetings', 'google meet', // Direct software names
        'vmware', 'virtualbox', 'qemu' // VM software names
    ];

    for (const keyword of uaSuspiciousKeywords) {
        if (userAgent.toLowerCase().includes(keyword.toLowerCase())) {
            suspicion = 'Suspicious';
            factors.push(`User Agent contains '${keyword}'`);
        }
    }

    // Inconsistent platform vs. user agent
    const uaLower = userAgent.toLowerCase();
    const platformLower = platform.toLowerCase();

    if (uaLower.includes('linux') && !platformLower.includes('linux') && platformLower.includes('win')) {
        suspicion = 'Suspicious';
        factors.push('User Agent/Platform mismatch (Linux in UA, Windows in Platform)');
    } else if (uaLower.includes('macintosh') && !platformLower.includes('mac') && platformLower.includes('win')) {
        suspicion = 'Suspicious';
        factors.push('User Agent/Platform mismatch (Mac in UA, Windows in Platform)');
    } else if (uaLower.includes('windows') && !platformLower.includes('win') && (platformLower.includes('linux') || platformLower.includes('mac'))) {
        suspicion = 'Suspicious';
        factors.push('User Agent/Platform mismatch (Windows in UA, Linux/Mac in Platform)');
    }

    // Very low hardware concurrency might suggest a constrained VM
    if (hardwareConcurrency && hardwareConcurrency < 2) { // Most modern systems have 2+ cores
        suspicion = 'Suspicious';
        factors.push(`Low Hardware Concurrency (${hardwareConcurrency} cores)`);
    }

    // Check for inconsistent `maxTouchPoints` (e.g., 0 on a device that should be touch-enabled)
    // This is more for general device spoofing than RDP specifically, but can be relevant.
    if (maxTouchPoints === 0 && (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone') || uaLower.includes('ipad'))) {
        suspicion = 'Suspicious';
        factors.push(`0 Max Touch Points on a suspected mobile/tablet device`);
    }

    return {
        data: {
            userAgent: userAgent,
            platform: platform,
            hardwareConcurrency: hardwareConcurrency,
            maxTouchPoints: maxTouchPoints
        },
        suspicion: suspicion,
        factors: factors
    };
}

/**
 * Calculates the overall RDP/VM suspicion level based on individual checks.
 * @param {Object} screenResult - Result from screen properties check.
 * @param {Object} webglResult - Result from WebGL renderer check.
 * @param {Object} navigatorResult - Result from navigator properties check.
 * @returns {Object} An object with overall level and contributing factors.
 */
function getOverallRDPSuspicion(screenResult, webglResult, navigatorResult) {
    let totalSuspicionPoints = 0;
    const contributingFactors = [];

    // Assign weights to indicators
    if (screenResult.suspicion === 'Suspicious') {
        totalSuspicionPoints += 2; // Medium weight
        contributingFactors.push(...screenResult.factors.map(f => `Screen: ${f}`));
    }
    if (webglResult.suspicion === 'Suspicious') {
        totalSuspicionPoints += 3; // High weight
        contributingFactors.push(...webglResult.factors.map(f => `WebGL: ${f}`));
    }
    if (navigatorResult.suspicion === 'Suspicious') {
        totalSuspicionPoints += 2; // Medium weight
        contributingFactors.push(...navigatorResult.factors.map(f => `Navigator: ${f}`));
    }

    let overallLevel = 'Low';
    let type = 'authentic';

    if (totalSuspicionPoints >= 3) { // Threshold for Medium
        overallLevel = 'Medium';
        type = 'suspicious';
    }
    if (totalSuspicionPoints >= 5) { // Threshold for High
        overallLevel = 'High';
        type = 'fake';
    }

    return {
        level: overallLevel,
        type: type,
        factors: contributingFactors.length > 0 ? contributingFactors : ['No significant suspicious indicators detected.']
    };
}

/**
 * Handles the click event for the detection button, performing all checks.
 */
detectBtn.addEventListener('click', async () => {
    showLoading();

    const rawDetails = {};

    // 1. Location Detection
    const locationDetection = await detectLocation();
    updateResultCard(document.getElementById('locationResult'), locationDetection.status, locationDetection.type);
    rawDetails.location = locationDetection.details;

    // 2. RDP/VM Detection Checks
    const screenResult = checkScreenProperties();
    updateResultCard(screenResultEl, screenResult.suspicion, screenResult.suspicion.toLowerCase());
    screenDetailsEl.textContent = JSON.stringify(screenResult.data, null, 2);
    rawDetails.screenProperties = { data: screenResult.data, factors: screenResult.factors };

    const webglResult = checkWebGLRenderer();
    updateResultCard(webglResultEl, webglResult.suspicion, webglResult.suspicion.toLowerCase());
    webglDetailsEl.textContent = webglResult.data; // WebGL data is already a string
    rawDetails.webglRenderer = { data: webglResult.data, factors: webglResult.factors };

    const navigatorResult = checkNavigatorProperties();
    updateResultCard(navigatorResultEl, navigatorResult.suspicion, navigatorResult.suspicion.toLowerCase());
    navigatorDetailsEl.textContent = JSON.stringify(navigatorResult.data, null, 2);
    rawDetails.navigatorProperties = { data: navigatorResult.data, factors: navigatorResult.factors };

    // 3. Overall RDP/VM Suspicion
    const overallRdp = getOverallRDPSuspicion(screenResult, webglResult, navigatorResult);
    updateResultCard(overallRdpResult, `Suspicion Level: ${overallRdp.level}`, overallRdp.type);
    overallRdpFactorsEl.innerHTML = ''; // Clear previous factors
    overallRdp.factors.forEach(factor => {
        const li = document.createElement('li');
        li.textContent = factor;
        overallRdpFactorsEl.appendChild(li);
    });

    // Update raw detection details
    detectionDetailsEl.textContent = JSON.stringify(rawDetails, null, 2);

    // Hide the generic "Environment Analysis" if the detailed RDP sections are present.
    // You can remove the original `environmentResult` div entirely if it's no longer needed.
    document.getElementById('environmentResult').style.display = 'none';

    hideLoading();
});