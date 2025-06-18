// A simple function to check for DevTools.
function detectDevTools() {
  const threshold = 160; // Time difference threshold in milliseconds.

  const startTime = new Date().getTime();

  // The debugger statement will only pause execution if DevTools is open.
  // debugger;

  const endTime = new Date().getTime();

  const elapsedTime = endTime - startTime;

  if (elapsedTime > threshold) {
    console.log('Inspector tools are open.');
    // You can trigger an action here.
    // For example: alert('Please close the inspector to continue.');
    return true;
  }

  return false;
}

// How to use it:
// You can run this check periodically.
setInterval(() => {
  if (detectDevTools()) {
    console.log('Periodic check: Inspector is active.');
  }
}, 2000); // Check every 2 seconds.

let devtoolsOpen = false;
const devToolsDetector = document.createElement('div');

// Define a getter for the 'id' property.
Object.defineProperty(devToolsDetector, 'id', {
  get: function() {
    devtoolsOpen = true; // This flag will be set when the getter is triggered.
  }
});

setInterval(() => {
  devtoolsOpen = false;
  // Logging the element will trigger the getter if the console is open.
  console.log(devToolsDetector);
  // Optional: clear the console to keep it clean.
  console.clear();

  if (devtoolsOpen) {
    console.log('Inspector tools are likely open.');
    // You can trigger an action here.
  }
}, 1500); // Check every 1.5 seconds.

function detectDockedDevTools() {
  const threshold = 160; // Size difference threshold in pixels.

  const widthDifference = window.outerWidth - window.innerWidth;
  const heightDifference = window.outerHeight - window.innerHeight;

  if (widthDifference > threshold || heightDifference > threshold) {
    console.log('Docked inspector tools detected.');
    return true;
  }
  return false;
}

// How to use it:
window.addEventListener('resize', detectDockedDevTools);
detectDockedDevTools(); // Initial check
