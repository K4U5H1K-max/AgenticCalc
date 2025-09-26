// math.js - Load from CDN and provide evaluation functions
// Tool calculation happens here (math.js library)

// Load math.js locally if not already loaded
if (typeof math === 'undefined') {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('math.min.js');
  script.onload = function() {
    console.log('Math.js loaded successfully');
    // Notify that math.js is ready
    window.mathJsReady = true;
  };
  script.onerror = function() {
    console.error('Failed to load Math.js');
    window.mathJsReady = false;
  };
  document.head.appendChild(script);
} else {
  window.mathJsReady = true;
}

// Function to evaluate mathematical expressions safely
function evaluateMathExpression(expression) {
  if (typeof math === 'undefined') {
    throw new Error('Math.js library not loaded');
  }
  
  try {
    // Tool calculation happens here (math.js)
    const result = math.evaluate(expression);
    
    // Handle different result types
    if (typeof result === 'number') {
      // Format numbers nicely
      return Number.isInteger(result) ? result.toString() : result.toPrecision(10).replace(/\.?0+$/, '');
    } else if (math.typeOf(result) === 'Complex') {
      return result.toString();
    } else if (math.typeOf(result) === 'Matrix' || math.typeOf(result) === 'Array') {
      return math.format(result);
    } else if (math.typeOf(result) === 'BigNumber') {
      return result.toString();
    } else if (math.typeOf(result) === 'Fraction') {
      return result.toString();
    } else {
      return result.toString();
    }
  } catch (error) {
    console.error('Math.js evaluation failed:', error);
    throw new Error(`Math evaluation failed: ${error.message}`);
  }
}

// Make function available globally for content script
window.evaluateMathExpression = evaluateMathExpression;
