// background.js
// Handles context menu, tool solving, and Groq API call

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "agentic-math-solve",
    title: "Solve with Agentic Math",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "agentic-math-solve" && info.selectionText) {
    try {
      // Tool calculation happens here
      const expression = info.selectionText.trim();
      
      // Preprocess mathematical notation for better compatibility
      const processedExpression = preprocessMathExpression(expression);
      console.log('Original:', expression, 'Processed:', processedExpression);
      
      let toolResult = null;
      
      try {
        toolResult = await solveWithMathJS(processedExpression, tab.id);
      } catch (e) {
        console.log('Math.js failed, trying SymPy:', e);
        try {
          toolResult = await solveWithSymPy(processedExpression);
        } catch (sympyError) {
          console.error('Both solvers failed:', sympyError);
          // Send error to content script with helpful message
          chrome.tabs.sendMessage(tab.id, {
            type: "AGENTIC_MATH_ERROR",
            error: `Unable to solve "${expression}". Try formats like: integrate(x**2, x) for integrals, diff(x**2, x) for derivatives.`
          });
          return;
        }
      }
      
      // Groq API call is made here
      const steps = await getGroqSteps(expression, toolResult);
      
      // Send result to content script for UI rendering
      chrome.tabs.sendMessage(tab.id, {
        type: "AGENTIC_MATH_RESULT",
        answer: toolResult,
        steps: steps
      });
    } catch (error) {
      console.error('Extension error:', error);
      chrome.tabs.sendMessage(tab.id, {
        type: "AGENTIC_MATH_ERROR",
        error: "An unexpected error occurred."
      });
    }
  }
});

// Tool calculation: math.js (local)
async function solveWithMathJS(expr, tabId) {
  // math.js is loaded in content script, so we use scripting API
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      func: (expression) => {
        try {
          // Wait for math.js to load if needed
          if (typeof window.evaluateMathExpression === 'function') {
            // Tool calculation happens here (math.js)
            return window.evaluateMathExpression(expression);
          } else if (typeof math !== 'undefined') {
            // Fallback to direct math.js if available
            return math.evaluate(expression).toString();
          } else {
            throw new Error('Math.js not loaded');
          }
        } catch (e) {
          throw e;
        }
      },
      args: [expr]
    }, (results) => {
      if (chrome.runtime.lastError || !results || !results[0].result) {
        reject(chrome.runtime.lastError || new Error("math.js failed"));
      } else {
        resolve(results[0].result);
      }
    });
  });
}

// Tool calculation: SymPy server (fallback)
async function solveWithSymPy(expr) {
  const sympyUrl = await getSymPyServerUrl();
  const resp = await fetch(sympyUrl, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({expression: expr})
  });
  
  if (!resp.ok) {
    throw new Error(`SymPy server error: ${resp.status}`);
  }
  
  const data = await resp.json();
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.result;
}

// Groq API call
async function getGroqSteps(problem, answer) {
  const apiKey = await getGroqApiKey();
  
  console.log('API key length:', apiKey ? apiKey.length : 0);
  console.log('API key starts with gsk_:', apiKey ? apiKey.startsWith('gsk_') : false);
  
  if (!apiKey) {
    return "Please set your Groq API key in the extension settings to get step-by-step explanations.";
  }
  
  const prompt = `You are a math tutor helping students understand solutions. Given a math problem and its correct answer (already computed), explain HOW to solve it step-by-step.

Rules:
- Write exactly one clear action per line
- Each step should be a simple, actionable instruction  
- End with "Final Answer: ${answer}"
- Do NOT recalculate - trust the given answer
- Keep steps concise (max 5-6 steps)

Problem: ${problem}
Correct Answer: ${answer}

Steps:`;
  
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{role: "user", content: prompt}],
        max_tokens: 200,
        temperature: 0.1
      })
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Groq API error:', resp.status, resp.statusText, errorText);
      
      if (resp.status === 401) {
        return "Invalid API key. Please check your Groq API key in settings.";
      } else if (resp.status === 429) {
        return "Rate limit exceeded. Please try again in a moment.";
      } else {
        return `API Error (${resp.status}): Please check your API key and try again.`;
      }
    }
    
    const data = await resp.json();
    console.log('Groq API response:', data);
    return data.choices?.[0]?.message?.content || "No explanation generated.";
  } catch (error) {
    console.error('Groq API call failed:', error);
    return "Error connecting to explanation service.";
  }
}

// Get Groq API key from storage
async function getGroqApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["GROQ_API_KEY"], (result) => {
      resolve(result.GROQ_API_KEY || "");
    });
  });
}

// Get SymPy server URL from storage or use default
async function getSymPyServerUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["SYMPY_SERVER_URL"], (result) => {
      resolve(result.SYMPY_SERVER_URL || "http://localhost:5000/solve");
    });
  });
}

// Preprocess mathematical expressions to convert common notation
function preprocessMathExpression(expr) {
  let processed = expr;
  
  // Convert integral notation: ∫x²dx → integrate(x**2, x)
  processed = processed.replace(/∫([^d]+)d([a-zA-Z])/g, 'integrate($1, $2)');
  
  // Convert superscript numbers to ** notation
  processed = processed.replace(/([a-zA-Z0-9\)])²/g, '$1**2');
  processed = processed.replace(/([a-zA-Z0-9\)])³/g, '$1**3');
  processed = processed.replace(/([a-zA-Z0-9\)])⁴/g, '$1**4');
  processed = processed.replace(/([a-zA-Z0-9\)])⁵/g, '$1**5');
  
  // Convert common mathematical notation
  processed = processed.replace(/×/g, '*');
  processed = processed.replace(/÷/g, '/');
  processed = processed.replace(/²/g, '**2');
  processed = processed.replace(/³/g, '**3');
  
  // Handle derivative notation: d/dx(f) → diff(f, x)
  processed = processed.replace(/d\/d([a-zA-Z])\(([^)]+)\)/g, 'diff($2, $1)');
  
  return processed;
}
