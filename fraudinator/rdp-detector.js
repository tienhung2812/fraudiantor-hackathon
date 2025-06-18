/**
 * Creates a detector for identifying potential Remote Desktop Protocol (RDP) usage
 * by analyzing mouse movement patterns.
 */
function createRDPDetector() {
  let mousePositions = [];
  let suspicionScore = 0;
  let lastEventTime = performance.now();
  let analysisInterval;

  const config = {
    // How often to analyze the collected data (in milliseconds)
    analysisFrequency: 1000,
    // The number of recent mouse positions to keep for analysis
    positionHistorySize: 50,
    // Thresholds for flagging suspicious movements
    linearityThreshold: 0.8, // How close to a straight line a movement is
    jumpThreshold: 100, // Maximum distance (in pixels) for a legitimate single movement
    lowEventFrequencyThreshold: 20, // Minimum expected events per analysis interval for active movement
    velocityChangeThreshold: 5, // How much the velocity can change between movements
  };

  /**
   * Records the mouse position and timestamp.
   * @param {MouseEvent} event The mousemove event.
   */
  function recordMouseMovement(event) {
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastEventTime;
    lastEventTime = currentTime;

    mousePositions.push({
      x: event.clientX,
      y: event.clientY,
      time: currentTime,
      elapsedTime: elapsedTime,
    });

    // Keep the array at a manageable size
    if (mousePositions.length > config.positionHistorySize) {
      mousePositions.shift();
    }
  }

  /**
   * Analyzes the collected mouse movement data for RDP-like patterns.
   */
  function analyzeMouseData() {
    if (mousePositions.length < 3) {
      // Not enough data to analyze
      return;
    }

    // 1. Check for unnaturally straight lines
    const recentPositions = mousePositions.slice(-3);
    const [p1, p2, p3] = recentPositions;
    const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
    const slope2 = (p3.y - p2.y) / (p3.x - p2.x);

    if (Math.abs(slope1 - slope2) < 0.1 && isFinite(slope1) && isFinite(slope2)) {
      suspicionScore += config.linearityThreshold;
    }

    // 2. Check for large jumps (teleportation)
    const distance = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
    if (distance > config.jumpThreshold) {
      suspicionScore += 1;
    }
    
    // 3. Check for inconsistent velocities
    const velocity1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / p2.elapsedTime;
    const velocity2 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2)) / p3.elapsedTime;

    if (velocity1 > 0 && Math.abs(velocity1 - velocity2) > config.velocityChangeThreshold) {
        suspicionScore += 0.5;
    }

    // 4. Check for low event frequency during movement
    if (mousePositions.length < config.lowEventFrequencyThreshold) {
      suspicionScore += 0.2;
    }

    // Decay the suspicion score over time
    suspicionScore *= 0.95;

    // Normalize the score
    if (suspicionScore > 10) suspicionScore = 10;
    if (suspicionScore < 0) suspicionScore = 0;
  }

  return {
    /**
     * Starts the RDP detection.
     */
    start() {
      document.addEventListener("mousemove", recordMouseMovement);
      analysisInterval = setInterval(analyzeMouseData, config.analysisFrequency);
      console.log("RDP detection started.");
    },

    /**
     * Stops the RDP detection.
     */
    stop() {
      document.removeEventListener("mousemove", recordMouseMovement);
      clearInterval(analysisInterval);
      mousePositions = [];
      suspicionScore = 0;
      console.log("RDP detection stopped.");
    },

    /**
     * @returns {number} The current suspicion score (0-10).
     */
    getSuspicionScore() {
      return suspicionScore;
    },
  };
}

// --- Example Usage ---
const rdpDetector = createRDPDetector();
rdpDetector.start();

// You can periodically check the suspicion score
setInterval(() => {
  const score = rdpDetector.getSuspicionScore();
  console.log(`Current RDP Suspicion Score: ${score.toFixed(2)}`);
  if (score > 5) {
    console.warn("High suspicion of RDP usage detected!");
    // Here you could trigger additional security measures
  }
}, 3000);

// To stop the detection:
// rdpDetector.stop();