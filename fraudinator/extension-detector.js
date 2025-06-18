class ExtensionDetector {
    constructor() {
        this.LOCATION_SPOOFING_EXTENSIONS = [
            // Popular Location Spoofing Extensions
            'Vytal', 'Location Guard', 'Change Location', 'Hide My Location',
            'Fake GPS Location', 'Location Spoofer', 'GPS Location Changer',
            'Geo Location Changer', 'Location Faker', 'Mock Location',
            'Virtual Location', 'Location Privacy', 'Geo Spoof', 'IP Location Changer',
            
            // VPN Extensions (often include location spoofing)
            'Surfshark', 'NordVPN', 'ExpressVPN', 'CyberGhost VPN', 'Windscribe',
            'ProtonVPN', 'Hotspot Shield', 'TunnelBear', 'Hola VPN', 'Browsec VPN',
            'ZenMate VPN', 'Touch VPN', 'SetupVPN', 'Urban VPN', 'VPN Unlimited',
            'Hide.me VPN', 'PureVPN', 'AtlasVPN',
            
            // Privacy Extensions that may affect location
            'LocationGuard', 'Chameleon', 'Privacy Possum', 'uBlock Origin',
            'Ghostery', 'DuckDuckGo Privacy Essentials', 'Privacy Badger',
            'Disconnect', 'AdBlock Plus', 'AdBlocker Ultimate',
            
            // Developer/Testing Extensions
            'Location Emulator', 'Geo Developer Tools', 'Location Mock', 'GPS Emulator'
        ];

        this.EXTENSION_IDS = [
            'kpfopkelmapcoipemfendmdcghnegimn', // Vytal
            'cfohepagpmnodfdmjliccbbigdkfcgia', // Location Guard
            'lejoknkbcogjceoniealiipllomkpioe', // Change Location
            'ailoabdmgclmfmhdagmlohpjlbpffblp', // Surfshark
            'fjoaledfpmneenckfbpdfhkmimjbppie', // NordVPN
            'fgddmllnllkalaagkghckoinaemmogpe', // ExpressVPN
            'jinjaccalgkegednnccohejagnlnfdag', // Windscribe
            'hhojmcideegekjjjmnmolkmicnoodknb', // Hotspot Shield
            'oiigbmnaadbkfbmpbflllaodcchpdnmo', // TunnelBear
            'gkojfkhlekighikafcpjkiklfbnlmeio', // Hola VPN
            'omghfjlpggmjjaagoclmmobgdodcjboh', // Browsec VPN
            'fdcgdnkidjaadafnichfpabhfomcebme', // ZenMate VPN
            'bihmplhobchoageeokmgbdihknkjbknd', // Touch VPN
            'oofgbpoabipfcfjapgnbbjjaenockbdp', // SetupVPN
            'eppiocemhmnlbhjplcgkofciiegomcon', // Urban VPN
            'bhmmomiinigofkjcapegjjndpbikblnp', // Hide.me VPN
            'bfidboloedlamgdmenmlbipfnccokknp', // PureVPN
            'leecbajbhappipfipglakolfhllpgfej', // AtlasVPN
        ];
    }

    detectExtensionsBySignature() {
        let detectionScore = 0;
        const detectionIndicators = [];
        let detected = false;

        try {
            // Method 1: Check for extension-specific global objects
            this.LOCATION_SPOOFING_EXTENSIONS.forEach(extensionName => {
                const normalizedName = extensionName.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // Check for global window objects
                if (window[normalizedName] || window[extensionName] || 
                    window[extensionName.replace(/ /g, '')] || window[extensionName.replace(/ /g, '_')]) {
                    detectionScore += 50;
                    detectionIndicators.push(`${extensionName} extension detected via global object`);
                    console.warn(`🚨 EXTENSION DETECTED: ${extensionName} (via global object)`);
                    detected = true;
                }
                
                // Check for DOM elements with extension-specific attributes
                const selectors = [
                    `[data-${normalizedName}]`,
                    `[class*="${normalizedName}"]`,
                    `[id*="${normalizedName}"]`,
                    `.${normalizedName}`,
                    `#${normalizedName}`
                ];
                
                selectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            detectionScore += 30;
                            detectionIndicators.push(`${extensionName} extension detected via DOM elements`);
                            console.warn(`🚨 EXTENSION DETECTED: ${extensionName} (via DOM elements)`);
                            detected = true;
                        }
                    } catch (e) {
                        // Ignore invalid selectors
                    }
                });
            });

            // Method 2: Check for extension content script modifications
            const originalFetch = window.fetch;
            const originalXHR = window.XMLHttpRequest;
            
            if (originalFetch && originalFetch.toString().indexOf('[native code]') === -1) {
                detectionScore += 25;
                detectionIndicators.push('Fetch API has been modified (possible extension)');
                console.warn('🚨 API MODIFICATION: Fetch API has been modified (possible extension)');
                detected = true;
            }
            
            if (originalXHR && originalXHR.prototype.open.toString().indexOf('[native code]') === -1) {
                detectionScore += 25;
                detectionIndicators.push('XMLHttpRequest has been modified (possible extension)');
                console.warn('🚨 API MODIFICATION: XMLHttpRequest has been modified (possible extension)');
                detected = true;
            }

            // Method 3: Check for extension resource URLs in document
            const scripts = document.querySelectorAll('script[src]');
            const links = document.querySelectorAll('link[href]');
            
            [...scripts, ...links].forEach(element => {
                const url = element.src || element.href;
                if (url && url.includes('chrome-extension://')) {
                    const extensionId = url.split('chrome-extension://')[1].split('/')[0];
                    if (this.EXTENSION_IDS.includes(extensionId)) {
                        detectionScore += 60;
                        detectionIndicators.push(`Known location spoofing extension ID detected: ${extensionId}`);
                        console.error(`🚨 KNOWN THREAT: Location spoofing extension detected with ID: ${extensionId}`);
                        detected = true;
                    } else if (extensionId) {
                        detectionScore += 20;
                        detectionIndicators.push(`Unknown extension detected: ${extensionId}`);
                        console.warn(`🔍 UNKNOWN EXTENSION: Extension detected with ID: ${extensionId}`);
                        detected = true;
                    }
                }
            });

            // Method 4: Check for extension-specific CSS modifications
            const computedStyle = window.getComputedStyle(document.documentElement);
            const suspiciousStyles = [
                '--vytal-color', '--location-guard-color', '--surfshark-color',
                '--nordvpn-color', '--expressvpn-color'
            ];
            
            suspiciousStyles.forEach(styleVar => {
                if (computedStyle.getPropertyValue(styleVar)) {
                    detectionScore += 15;
                    detectionIndicators.push(`Extension-specific CSS variable detected: ${styleVar}`);
                    console.warn(`🎨 CSS MODIFICATION: Extension-specific CSS variable detected: ${styleVar}`);
                    detected = true;
                }
            });

            // Method 5: Check for extension error messages in console
            const originalConsoleError = console.error;
            let extensionErrorDetected = false;
            console.error = function(...args) {
                const message = args.join(' ').toLowerCase();
                if (message.includes('extension') && (message.includes('location') || message.includes('geolocation'))) {
                    extensionErrorDetected = true;
                }
                return originalConsoleError.apply(console, args);
            };
            
            setTimeout(() => {
                console.error = originalConsoleError;
                if (extensionErrorDetected) {
                    detectionScore += 20;
                    detectionIndicators.push('Extension-related geolocation errors detected');
                    console.warn('🚨 CONSOLE ERRORS: Extension-related geolocation errors detected');
                    detected = true;
                }
            }, 100);

        } catch (error) {
            // Silently handle any detection errors
        }

        return {
            score: detectionScore,
            indicators: detectionIndicators,
            detected: detected
        };
    }

    // Basic artifact detection methods
    detectBasicArtifacts() {
        const extensionIndicators = [];
        let extensionScore = 0;
        let detected = false;

        // Vytal extension detection
        if (window.vytal || document.querySelector('[data-vytal]') || 
            document.documentElement.getAttribute('data-vytal')) {
            extensionScore += 40;
            extensionIndicators.push('Vytal extension detected');
            console.error('🚨 VYTAL DETECTED: Vytal location spoofing extension found!');
            detected = true;
        }

        // Location Guard detection
        if (window.locationGuard || navigator.geolocation.getCurrentPosition.toString().includes('locationguard')) {
            extensionScore += 35;
            extensionIndicators.push('Location Guard extension detected');
            console.error('🚨 LOCATION GUARD DETECTED: Location Guard privacy extension found!');
            detected = true;
        }

        // Change Location detection
        if (window.changeLocation || document.querySelector('[data-change-location]')) {
            extensionScore += 35;
            extensionIndicators.push('Change Location extension detected');
            console.error('🚨 CHANGE LOCATION DETECTED: Change Location extension found!');
            detected = true;
        }

        // SurfShark extension detection
        if (window.surfshark || document.querySelector('[data-surfshark]') ||
            document.documentElement.hasAttribute('data-surfshark-vpn')) {
            extensionScore += 30;
            extensionIndicators.push('SurfShark extension detected');
            console.error('🚨 SURFSHARK VPN DETECTED: SurfShark VPN extension found!');
            detected = true;
        }

        // Generic extension detection via DOM modifications
        const extensionElements = document.querySelectorAll('[data-extension], [data-vpn], [data-location-spoof]');
        if (extensionElements.length > 0) {
            extensionScore += 20;
            extensionIndicators.push('Generic location spoofing extension detected');
            console.warn('🚨 GENERIC EXTENSION: Location spoofing extension detected via DOM elements');
            detected = true;
        }

        // Check for modified geolocation API
        if (navigator.geolocation.getCurrentPosition.toString().length > 100) {
            extensionScore += 25;
            extensionIndicators.push('Geolocation API appears to be modified');
            console.warn('🚨 API TAMPERING: Geolocation API has been modified');
            detected = true;
        }

        // Check for WebRTC modifications (common in VPN extensions)
        if (window.RTCPeerConnection && 
            window.RTCPeerConnection.prototype.createDataChannel.toString().includes('native') === false) {
            extensionScore += 20;
            extensionIndicators.push('WebRTC modifications detected (possible VPN)');
            console.warn('🚨 WEBRTC MODIFICATION: WebRTC API modified (possible VPN)');
        }

        return {
            score: extensionScore,
            indicators: extensionIndicators,
            detected: detected
        };
    }

    // Main detection method that combines all techniques
    performFullExtensionDetection() {
        console.log('🔍 Starting comprehensive extension detection scan...');
        
        const basicDetection = this.detectBasicArtifacts();
        const signatureDetection = this.detectExtensionsBySignature();

        const result = {
            score: basicDetection.score + signatureDetection.score,
            indicators: [...basicDetection.indicators, ...signatureDetection.indicators],
            detected: basicDetection.detected || signatureDetection.detected
        };

        // Summary logging
        if (result.detected) {
            console.error(`🚨 FRAUD ALERT: ${result.indicators.length} location spoofing extension(s) detected! Risk Score: ${result.score}`);
            console.group('📋 Detection Summary:');
            result.indicators.forEach((indicator, index) => {
                console.warn(`${index + 1}. ${indicator}`);
            });
            console.groupEnd();
        } else {
            console.log('✅ Extension scan complete: No location spoofing extensions detected');
        }

        return result;
    }
}

// Make ExtensionDetector available globally
window.ExtensionDetector = ExtensionDetector;