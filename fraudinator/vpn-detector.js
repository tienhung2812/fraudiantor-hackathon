class VPNDetector {
    constructor() {
        this.VPN_PROVIDERS = {
            'NordVPN': {
                extensionId: 'fjoaledfpmneenckfbpdfhkmimjbppie',
                globalObjects: ['nordvpn', 'NordVPN'],
                domSelectors: ['[data-nordvpn]', '.nordvpn', '#nordvpn'],
                score: 50
            },
            'ExpressVPN': {
                extensionId: 'fgddmllnllkalaagkghckoinaemmogpe',
                globalObjects: ['expressvpn', 'ExpressVPN'],
                domSelectors: ['[data-expressvpn]', '.expressvpn', '#expressvpn'],
                score: 50
            },
            'Surfshark': {
                extensionId: 'ailoabdmgclmfmhdagmlohpjlbpffblp',
                globalObjects: ['surfshark', 'Surfshark'],
                domSelectors: ['[data-surfshark]', '.surfshark', '#surfshark'],
                score: 45
            },
            'CyberGhost': {
                extensionId: 'ffbicmgkjkjjlgjkjjkfkfjjlgjjpjp',
                globalObjects: ['cyberghost', 'CyberGhost'],
                domSelectors: ['[data-cyberghost]', '.cyberghost', '#cyberghost'],
                score: 45
            },
            'ProtonVPN': {
                extensionId: 'jplgfhpmjnbigmhklmmbgecoobifkmpa',
                globalObjects: ['protonvpn', 'ProtonVPN'],
                domSelectors: ['[data-protonvpn]', '.protonvpn', '#protonvpn'],
                score: 45
            },
            'Windscribe': {
                extensionId: 'jinjaccalgkegednnccohejagnlnfdag',
                globalObjects: ['windscribe', 'Windscribe'],
                domSelectors: ['[data-windscribe]', '.windscribe', '#windscribe'],
                score: 40
            },
            'Hotspot Shield': {
                extensionId: 'hhojmcideegekjjjmnmolkmicnoodknb',
                globalObjects: ['hotspotshield', 'HotspotShield'],
                domSelectors: ['[data-hotspotshield]', '.hotspotshield', '#hotspotshield'],
                score: 40
            },
            'TunnelBear': {
                extensionId: 'oiigbmnaadbkfbmpbflllaodcchpdnmo',
                globalObjects: ['tunnelbear', 'TunnelBear'],
                domSelectors: ['[data-tunnelbear]', '.tunnelbear', '#tunnelbear'],
                score: 40
            },
            'Zscaler': {
                extensionId: 'cgfkddephppbfbobgbldimcbcmkholjb',
                globalObjects: ['zscaler', 'Zscaler', 'ZscalerApp'],
                domSelectors: ['[data-zscaler]', '.zscaler', '#zscaler', '.zscaler-client'],
                userAgentKeywords: ['Zscaler', 'ZPA'],
                score: 55
            },
            'Cisco AnyConnect': {
                extensionId: 'kcidjnaebmakapomnghkkgblopjghiad',
                globalObjects: ['anyconnect', 'CiscoAnyConnect'],
                domSelectors: ['[data-anyconnect]', '.anyconnect', '#anyconnect'],
                userAgentKeywords: ['AnyConnect', 'Cisco'],
                score: 50
            },
            'Palo Alto GlobalProtect': {
                extensionId: 'nkoimibhblcddjcdmkhpdokomhhbkdol',
                globalObjects: ['globalprotect', 'PaloAltoGP'],
                domSelectors: ['[data-globalprotect]', '.globalprotect', '#globalprotect'],
                userAgentKeywords: ['GlobalProtect', 'PaloAlto'],
                score: 50
            },
            'FortiClient': {
                extensionId: 'gjhmeahnighphfcpmmhfplonokpjedbo',
                globalObjects: ['forticlient', 'FortiClient'],
                domSelectors: ['[data-forticlient]', '.forticlient', '#forticlient'],
                userAgentKeywords: ['FortiClient', 'Fortinet'],
                score: 50
            }
        };
    }

    detectVPN() {
        console.log('🔍 Starting VPN detection scan...');
        
        const vpnIndicators = [];
        let vpnScore = 0;
        let detectedProvider = null;

        try {
            // Method 1: Check for VPN extension global objects
            Object.entries(this.VPN_PROVIDERS).forEach(([providerName, config]) => {
                config.globalObjects.forEach(globalObj => {
                    if (window[globalObj]) {
                        vpnScore += config.score;
                        vpnIndicators.push(`${providerName} VPN detected via global object (${globalObj})`);
                        console.error(`🚨 VPN DETECTED: ${providerName} found via global object`);
                        detectedProvider = providerName;
                    }
                });

                // Check DOM elements for VPN provider artifacts
                config.domSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            vpnScore += config.score - 10;
                            vpnIndicators.push(`${providerName} VPN detected via DOM elements`);
                            console.error(`🚨 VPN DETECTED: ${providerName} found via DOM elements`);
                            detectedProvider = providerName;
                        }
                    } catch (e) {
                        // Ignore invalid selectors
                    }
                });

                // Check user agent for VPN keywords (especially for enterprise solutions)
                if (config.userAgentKeywords) {
                    const userAgent = navigator.userAgent;
                    config.userAgentKeywords.forEach(keyword => {
                        if (userAgent.includes(keyword)) {
                            vpnScore += config.score;
                            vpnIndicators.push(`${providerName} detected via user agent keyword: ${keyword}`);
                            console.error(`🚨 VPN DETECTED: ${providerName} found via user agent`);
                            detectedProvider = providerName;
                        }
                    });
                }
            });

            // Method 2: Check for VPN extension IDs in loaded resources
            const scripts = document.querySelectorAll('script[src]');
            const links = document.querySelectorAll('link[href]');
            
            [...scripts, ...links].forEach(element => {
                const url = element.src || element.href;
                if (url && url.includes('chrome-extension://')) {
                    const extensionId = url.split('chrome-extension://')[1].split('/')[0];
                    
                    Object.entries(this.VPN_PROVIDERS).forEach(([providerName, config]) => {
                        if (config.extensionId === extensionId) {
                            vpnScore += config.score + 10;
                            vpnIndicators.push(`${providerName} VPN extension detected via extension ID: ${extensionId}`);
                            console.error(`🚨 VPN EXTENSION: ${providerName} detected with ID: ${extensionId}`);
                            detectedProvider = providerName;
                        }
                    });
                }
            });

            // Method 3: Network-level VPN detection
            // Check for WebRTC IP leak prevention (common VPN feature)
            if (window.RTCPeerConnection) {
                const originalCreateDataChannel = window.RTCPeerConnection.prototype.createDataChannel;
                if (originalCreateDataChannel.toString().indexOf('[native code]') === -1) {
                    vpnScore += 25;
                    vpnIndicators.push('WebRTC modifications detected (possible VPN IP leak protection)');
                    console.warn('🚨 NETWORK MODIFICATION: WebRTC modified (possible VPN)');
                }
            }

            // Method 4: Check for proxy settings indicators
            if (navigator.connection && navigator.connection.type === 'other') {
                vpnScore += 15;
                vpnIndicators.push('Unusual network connection type detected');
                console.warn('🚨 NETWORK ANOMALY: Unusual connection type (possible VPN)');
            }

            // Method 5: Check for VPN-specific user agent modifications
            const userAgent = navigator.userAgent;
            const vpnKeywords = ['VPN', 'Proxy', 'Tunnel', 'Shield'];
            vpnKeywords.forEach(keyword => {
                if (userAgent.includes(keyword)) {
                    vpnScore += 20;
                    vpnIndicators.push(`VPN keyword detected in user agent: ${keyword}`);
                    console.warn(`🚨 USER AGENT: VPN keyword detected: ${keyword}`);
                }
            });

            // Method 6: Check for DNS over HTTPS modifications (common with VPN)
            if (window.navigator.dns || window.DoH) {
                vpnScore += 15;
                vpnIndicators.push('DNS over HTTPS modifications detected');
                console.warn('🚨 DNS MODIFICATION: DoH detected (possible VPN)');
            }

            // Method 7: Check for enterprise proxy indicators
            const enterpriseProxyIndicators = this.detectEnterpriseProxy();
            vpnScore += enterpriseProxyIndicators.score;
            vpnIndicators.push(...enterpriseProxyIndicators.indicators);
            if (enterpriseProxyIndicators.provider) {
                detectedProvider = enterpriseProxyIndicators.provider;
            }

        } catch (error) {
            console.warn('VPN detection error:', error.message);
        }

        return {
            score: vpnScore,
            indicators: vpnIndicators,
            detected: vpnScore > 0,
            provider: detectedProvider
        };
    }

    detectEnterpriseProxy() {
        const indicators = [];
        let score = 0;
        let provider = null;

        try {
            // Check for Zscaler specific indicators
            if (this.detectZscaler()) {
                score += 55;
                indicators.push('Zscaler enterprise proxy detected');
                console.error('🚨 ENTERPRISE PROXY: Zscaler detected');
                provider = 'Zscaler';
            }

            // Check for corporate proxy headers or artifacts
            if (document.querySelector('meta[name*="proxy"]') || 
                document.querySelector('meta[content*="proxy"]')) {
                score += 30;
                indicators.push('Corporate proxy metadata detected');
                console.warn('🚨 PROXY METADATA: Corporate proxy indicators found');
            }

            // Check for PAC (Proxy Auto-Configuration) files
            if (window.FindProxyForURL || window.pac) {
                score += 40;
                indicators.push('Proxy Auto-Configuration (PAC) detected');
                console.warn('🚨 PAC DETECTED: Proxy Auto-Configuration found');
            }

            // Check for WPAD (Web Proxy Autodiscovery Protocol)
            if (navigator.userAgent.includes('WPAD') || window.wpad) {
                score += 35;
                indicators.push('Web Proxy Autodiscovery Protocol (WPAD) detected');
                console.warn('🚨 WPAD DETECTED: Web Proxy Autodiscovery found');
            }

        } catch (error) {
            console.warn('Enterprise proxy detection error:', error.message);
        }

        return { score, indicators, provider };
    }

    detectZscaler() {
        try {
            // Check for Zscaler-specific indicators
            const zscalerIndicators = [
                // Global objects
                window.zscaler,
                window.Zscaler,
                window.ZscalerApp,
                
                // DOM elements
                document.querySelector('.zscaler-client'),
                document.querySelector('[data-zscaler]'),
                document.querySelector('#zscaler'),
                
                // User agent
                navigator.userAgent.includes('Zscaler'),
                navigator.userAgent.includes('ZPA'),
                
                // Network headers (if accessible)
                document.querySelector('meta[name="X-Zscaler-Client"]'),
                
                // Check for Zscaler certificate or proxy artifacts
                window.location.protocol === 'https:' && 
                (document.referrer.includes('zscaler') || 
                 window.location.search.includes('zscaler'))
            ];

            return zscalerIndicators.some(indicator => indicator);
        } catch (error) {
            return false;
        }
    }

    performFullVPNDetection() {
        console.log('🔍 Starting comprehensive VPN detection scan...');
        
        const result = this.detectVPN();

        // Summary logging
        if (result.detected) {
            const providerText = result.provider ? ` (${result.provider})` : '';
            console.error(`🚨 VPN ALERT: VPN usage detected${providerText}! Risk Score: ${result.score}`);
            console.group('📋 VPN Detection Summary:');
            result.indicators.forEach((indicator, index) => {
                console.warn(`${index + 1}. ${indicator}`);
            });
            console.groupEnd();
        } else {
            console.log('✅ VPN scan complete: No VPN usage detected');
        }

        return result;
    }
}

// Make VPNDetector available globally
window.VPNDetector = VPNDetector;