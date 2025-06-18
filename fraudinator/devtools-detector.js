// DevTools Detection Module
// Global reference to UI controller for DevTools detection
let globalUIController = null;
let devToolsOpen = false;
let consoleDetectionElement = null;

// Console-based DevTools detection (more reliable)
function setupConsoleDetection() {
  consoleDetectionElement = new Image();
  
  Object.defineProperty(consoleDetectionElement, 'id', {
    get: function() {
      devToolsOpen = true;
      return 'devtools-detection';
    }
  });
}

// Returns true if the current device is a mobile device, false otherwise
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Console detection check
function checkConsoleDetection() {
  if (!consoleDetectionElement) {
    setupConsoleDetection();
  }
  
  devToolsOpen = false;
  console.log(consoleDetectionElement);
  
  // Give a small delay for the getter to be called
  setTimeout(() => {
    if (devToolsOpen) {
      handleDevToolsDetected('console');
    }
  }, 100);
}

// Window dimension-based detection (fallback)
function checkDimensionDetection() {
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  const isDevToolsOpen = widthThreshold || heightThreshold;

  if (isDevToolsOpen) {
    handleDevToolsDetected('dimensions');
  }
}

// Keyboard shortcut detection
function setupKeyboardDetection() {
  window.addEventListener('keydown', function(event) {
    // F12 key
    if (event.key === 'F12') {
      handleDevToolsDetected('keyboard-F12');
      event.preventDefault(); // Optional: prevent DevTools from opening
      return;
    }
    
    // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
    if ((event.ctrlKey && event.shiftKey && event.key === 'I') || 
        (event.metaKey && event.altKey && event.key === 'I')) {
      handleDevToolsDetected('keyboard-Ctrl+Shift+I');
      event.preventDefault(); // Optional: prevent DevTools from opening
      return;
    }
    
    // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Console
    if ((event.ctrlKey && event.shiftKey && event.key === 'J') || 
        (event.metaKey && event.altKey && event.key === 'J')) {
      handleDevToolsDetected('keyboard-Ctrl+Shift+J');
      event.preventDefault(); // Optional: prevent DevTools from opening
      return;
    }
    
    // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Element inspector
    if ((event.ctrlKey && event.shiftKey && event.key === 'C') || 
        (event.metaKey && event.altKey && event.key === 'C')) {
      handleDevToolsDetected('keyboard-Ctrl+Shift+C');
      event.preventDefault(); // Optional: prevent DevTools from opening
      return;
    }
    
    // Ctrl+U (Windows/Linux) or Cmd+U (Mac) - View source
    if ((event.ctrlKey && event.key === 'U') || 
        (event.metaKey && event.key === 'U')) {
      handleDevToolsDetected('keyboard-Ctrl+U');
      event.preventDefault(); // Optional: prevent view source
      return;
    }
  });
}

// Consolidated DevTools detection function
function detectDevTools() {
  // Use both methods for maximum reliability
  checkConsoleDetection();
  if (!isMobileDevice()) {
    // Only check dimensions if not on a mobile device
    checkDimensionDetection();
  }
}

// Handle DevTools detection
function handleDevToolsDetected(method) {
  console.log(`DevTools detected via ${method} method - MARKING SESSION AS SPOOFED`);
  
  // Update the detector if available
  if (globalUIController && globalUIController.detector) {
    // Only add score if not already detected to avoid duplicate scoring
    if (!globalUIController.detector.devToolsDetected) {
      globalUIController.detector.devToolsDetected = true;
      if (!globalUIController.detector.environmentData.devToolsScore) {
        globalUIController.detector.environmentData.devToolsScore = 0;
      }
      if (!globalUIController.detector.environmentData.devToolsIndicators) {
        globalUIController.detector.environmentData.devToolsIndicators = [];
      }
      
      globalUIController.detector.environmentData.devToolsScore += 25;
      globalUIController.detector.environmentData.devToolsIndicators.push(`DevTools detected via ${method} (real-time detection)`);
      
      // CRITICAL: Mark location as spoofed when DevTools is detected
      markLocationAsSpoofed(method);
    }
    
    // Always update UI when DevTools is detected
    globalUIController.updateDevToolsStatus(true);
  }
}

// Mark the entire session location as spoofed due to DevTools detection
function markLocationAsSpoofed(detectionMethod) {
  if (globalUIController && globalUIController.detector) {
    // Force location to be marked as spoofed
    globalUIController.detector.locationSpoofedByDevTools = true;
    
    // Add high spoofing score
    if (!globalUIController.detector.locationSpoofingScore) {
      globalUIController.detector.locationSpoofingScore = 0;
    }
    globalUIController.detector.locationSpoofingScore += 100; // Maximum penalty
    
    // Add critical indicator
    if (!globalUIController.detector.locationSpoofingIndicators) {
      globalUIController.detector.locationSpoofingIndicators = [];
    }
    globalUIController.detector.locationSpoofingIndicators.push(
      `CRITICAL: DevTools detected (${detectionMethod}) - Location cannot be trusted`
    );
    
    // Update UI to show location as spoofed
    if (globalUIController.updateLocationSpoofingStatus) {
      globalUIController.updateLocationSpoofingStatus(true);
    }
  }
}

// Enhanced detection that runs immediately and continuously
function initializeDevToolsDetection() {
  // Setup console detection element
  setupConsoleDetection();
  
  // Setup keyboard shortcut detection
  setupKeyboardDetection();
  
  // Run initial detection
  detectDevTools();
  
  // Set up resize listener for dimension-based detection
  window.addEventListener('resize', checkDimensionDetection);
  
  // Run periodic checks using console and dimension methods
  setInterval(() => {
    checkConsoleDetection();
    checkDimensionDetection();
  }, 1000);
}

// Function to set the global UI controller reference
function setUIController(uiController) {
  globalUIController = uiController;
}

// Export functions for use in main script
window.DevToolsDetector = {
  initialize: initializeDevToolsDetection,
  setUIController: setUIController,
  detect: detectDevTools
};