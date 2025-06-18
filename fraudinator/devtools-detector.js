// DevTools Detection Module
// Global reference to UI controller for DevTools detection
let globalUIController = null;

// Standalone DevTools detection function
function detectDevTools() {
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  const isDevToolsOpen = widthThreshold || heightThreshold;

  if (isDevToolsOpen) {
    console.log("Docked DevTools is likely open.");
    
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
        globalUIController.detector.environmentData.devToolsIndicators.push('DevTools detected via window dimensions (real-time detection)');
      }
      
      // Always update UI when DevTools is detected
      globalUIController.updateDevToolsStatus(true);
    }
  } else {
    console.log("Docked DevTools is likely closed.");
    
    // Update UI to show DevTools is closed (but keep the detection score)
    if (globalUIController) {
      globalUIController.updateDevToolsStatus(false);
    }
  }
}

// Enhanced detection that runs immediately and continuously
function initializeDevToolsDetection() {
  // Run initial detection
  detectDevTools();
  
  // Set up resize listener
  window.addEventListener('resize', detectDevTools);
  
  // Also check periodically in case resize events are missed
  setInterval(detectDevTools, 1000);
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