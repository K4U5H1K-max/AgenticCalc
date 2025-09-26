// content.js
// Receives results and renders floating card UI

// UI rendering of results occurs here
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "AGENTIC_MATH_RESULT") {
    showAgenticMathCard(msg.answer, msg.steps);
  } else if (msg.type === "AGENTIC_MATH_ERROR") {
    showAgenticMathError(msg.error);
  }
});

function showAgenticMathCard(answer, steps) {
  removeExistingCard();
  const card = document.createElement("div");
  card.id = "agentic-math-card";
  card.style = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
    padding: 0;
    min-width: 320px;
    max-width: 450px;
    max-height: 550px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #fff;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
    animation: slideInFromRight 0.3s ease-out;
    overflow: hidden;
  `;
  
  // Add CSS animation keyframes if not already added
  if (!document.getElementById('agentic-math-styles')) {
    const style = document.createElement('style');
    style.id = 'agentic-math-styles';
    style.textContent = `
      @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      #agentic-math-card::-webkit-scrollbar { width: 6px; }
      #agentic-math-card::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
      #agentic-math-card::-webkit-scrollbar-thumb { 
        background: rgba(255,255,255,0.3); 
        border-radius: 3px; 
      }
    `;
    document.head.appendChild(style);
  }
  
  const header = document.createElement("div");
  header.style = `
    background: rgba(255,255,255,0.15);
    padding: 16px 20px;
    font-weight: 600;
    font-size: 1.2em;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  const titleDiv = document.createElement("div");
  titleDiv.style = "display: flex; align-items: center; gap: 10px;";
  titleDiv.innerHTML = `
    <span style="font-size: 1.4em;">∑</span>
    <span>Agentic Math</span>
  `;
  
  const closeBtn = document.createElement("button");
  closeBtn.style = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;
  closeBtn.innerHTML = "×";
  closeBtn.onmouseover = () => {
    closeBtn.style.background = "rgba(255,255,255,0.3)";
    closeBtn.style.transform = "scale(1.1)";
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = "rgba(255,255,255,0.2)";
    closeBtn.style.transform = "scale(1)";
  };
  
  header.appendChild(titleDiv);
  header.appendChild(closeBtn);
  
  const content_area = document.createElement("div");
  content_area.style = "padding: 20px; flex: 1; display: flex; flex-direction: column;";
  
  const answer_div = document.createElement("div");
  answer_div.style = `
    background: rgba(255,255,255,0.12);
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.2);
  `;
  answer_div.innerHTML = `
    <div style="font-size: 0.9em; opacity: 0.8; margin-bottom: 6px;">Final Answer</div>
    <div style="font-size: 1.1em; font-weight: 600; font-family: 'Courier New', monospace; color: #a8e6cf;">${answer}</div>
  `;
  
  const steps_header = document.createElement("div");
  steps_header.style = `
    font-weight: 600;
    margin-bottom: 12px;
    flex-shrink: 0;
    font-size: 1.05em;
    opacity: 0.9;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  steps_header.innerHTML = `
    <span style="font-size: 1.2em;">📋</span>
    <span>Step-by-Step Solution</span>
  `;
  
  const steps_container = document.createElement("div");
  steps_container.style = `
    background: rgba(0,0,0,0.1);
    border-radius: 12px;
    padding: 16px;
    overflow-y: auto;
    max-height: 280px;
    flex: 1;
    margin-bottom: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  `;
  
  const steps_content = document.createElement("div");
  steps_content.style = `
    white-space: pre-wrap;
    font-size: 0.95em;
    margin: 0;
    color: rgba(255,255,255,0.95);
    line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  // Format steps with better styling
  const formattedSteps = steps.split('\n').map((step, index) => {
    if (step.trim()) {
      return `<div style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 10px;">
        <span style="color: #a8e6cf; font-weight: 600; min-width: 20px;">${index + 1}.</span>
        <span>${step.trim()}</span>
      </div>`;
    }
    return '';
  }).join('');
  
  steps_content.innerHTML = formattedSteps;
  
  const close_button = document.createElement("button");
  close_button.id = "agentic-math-close";
  close_button.style = `
    background: rgba(255,255,255,0.15);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95em;
    font-weight: 500;
    flex-shrink: 0;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  `;
  close_button.textContent = "✕ Close";
  close_button.onmouseover = () => {
    close_button.style.background = "rgba(255,255,255,0.25)";
    close_button.style.transform = "scale(1.02)";
  };
  close_button.onmouseout = () => {
    close_button.style.background = "rgba(255,255,255,0.15)";
    close_button.style.transform = "scale(1)";
  };
  
  steps_container.appendChild(steps_content);
  content_area.appendChild(answer_div);
  content_area.appendChild(steps_header);
  content_area.appendChild(steps_container);
  content_area.appendChild(close_button);
  
  card.appendChild(header);
  card.appendChild(content_area);
  
  document.body.appendChild(card);
  
  // Close button functionality for both header close button and bottom close button
  const closeCard = () => {
    card.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(removeExistingCard, 300);
  };
  
  close_button.onclick = closeCard;
  closeBtn.onclick = closeCard;
}

function showAgenticMathError(error) {
  removeExistingCard();
  const card = document.createElement("div");
  card.id = "agentic-math-card";
  card.style = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    border: none;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(238,90,82,0.3), 0 0 0 1px rgba(255,255,255,0.1);
    padding: 0;
    min-width: 320px;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #fff;
    backdrop-filter: blur(10px);
    animation: slideInFromRight 0.3s ease-out;
    overflow: hidden;
  `;
  
  const header = document.createElement("div");
  header.style = `
    background: rgba(255,255,255,0.15);
    padding: 16px 20px;
    font-weight: 600;
    font-size: 1.2em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  const titleDiv = document.createElement("div");
  titleDiv.style = "display: flex; align-items: center; gap: 10px;";
  titleDiv.innerHTML = `<span style="font-size: 1.4em;">⚠️</span><span>Agentic Math - Error</span>`;
  
  const closeBtn = document.createElement("button");
  closeBtn.style = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;
  closeBtn.innerHTML = "×";
  closeBtn.onmouseover = () => {
    closeBtn.style.background = "rgba(255,255,255,0.3)";
    closeBtn.style.transform = "scale(1.1)";
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = "rgba(255,255,255,0.2)";
    closeBtn.style.transform = "scale(1)";
  };
  
  header.appendChild(titleDiv);
  header.appendChild(closeBtn);
  
  const content = document.createElement("div");
  content.style = "padding: 20px;";
  
  const error_div = document.createElement("div");
  error_div.style = `
    background: rgba(0,0,0,0.1);
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 0.95em;
    line-height: 1.5;
  `;
  error_div.textContent = error;
  
  const close_button = document.createElement("button");
  close_button.id = "agentic-math-close";
  close_button.style = `
    background: rgba(255,255,255,0.15);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95em;
    font-weight: 500;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    width: 100%;
  `;
  close_button.textContent = "✕ Close";
  close_button.onmouseover = () => {
    close_button.style.background = "rgba(255,255,255,0.25)";
    close_button.style.transform = "scale(1.02)";
  };
  close_button.onmouseout = () => {
    close_button.style.background = "rgba(255,255,255,0.15)";
    close_button.style.transform = "scale(1)";
  };
  
  content.appendChild(error_div);
  content.appendChild(close_button);
  card.appendChild(header);
  card.appendChild(content);
  
  document.body.appendChild(card);
  
  // Close button functionality for both header close button and bottom close button
  const closeCard = () => {
    card.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(removeExistingCard, 300);
  };
  
  close_button.onclick = closeCard;
  closeBtn.onclick = closeCard;
}

function removeExistingCard() {
  const old = document.getElementById("agentic-math-card");
  if (old) old.remove();
}
