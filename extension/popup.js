// popup.js
// UI for saving settings to chrome.storage

document.addEventListener('DOMContentLoaded', function() {
  console.log('DEBUG: DOM Content Loaded');
  
  // Form submission handler
  document.getElementById('api-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const groqKey = document.getElementById('groq-key').value.trim();
    const sympyUrl = document.getElementById('sympy-url').value.trim();
    
    const settings = {
      GROQ_API_KEY: groqKey,
      SYMPY_SERVER_URL: sympyUrl || "http://localhost:5000/solve"
    };
    
    chrome.storage.local.set(settings, function() {
      const status = document.getElementById('status');
      status.style.display = 'block';
      status.textContent = '✅ Settings saved successfully!';
      setTimeout(() => {
        status.style.display = 'none';
      }, 2000);
    });
  });

  // Close button functionality
  const closeButton = document.getElementById('close-popup');
  console.log('DEBUG: Close button element:', closeButton);
  
  if (closeButton) {
    console.log('DEBUG: Adding click listener to close button');
    closeButton.addEventListener('click', function() {
      console.log('DEBUG: Close button clicked');
      window.close();
    });
    closeButton.onclick = function() {
      console.log('DEBUG: Close button onclick fired');
      window.close();
    };
  } else {
    console.error('DEBUG: Close button not found!');
  }

  // Load existing settings
  chrome.storage.local.get(['GROQ_API_KEY', 'SYMPY_SERVER_URL'], function(result) {
    if (result.GROQ_API_KEY) {
      document.getElementById('groq-key').value = result.GROQ_API_KEY;
    }
    if (result.SYMPY_SERVER_URL) {
      document.getElementById('sympy-url').value = result.SYMPY_SERVER_URL;
    }
  });
});
