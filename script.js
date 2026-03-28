// API key is loaded from config.js
const API_KEY = GEMINI_KEY;

// ── CONVERSATION HISTORY ──
const conversationHistory = [];

// ── PHASE TRACKER ──
let currentPhase = 0;

// ── SYSTEM PROMPT ──
const SYSTEM_PROMPT = `You are Artha, a warm and friendly onboarding advisor for The Economic Times (ET), India's top financial newspaper.

Your job is to profile the user in a short friendly conversation and recommend the right ET products for them.

Follow these phases strictly:
Phase 0 - GREETING: Warmly greet the user. Ask how they feel and what brings them to ET. Detect mood.
Phase 1 - GOALS: Ask what they want (grow wealth / learn investing / track markets / stay informed). Ask experience level.
Phase 2 - INTERESTS: Ask if they like stocks, mutual funds, IPOs, or just news. If stocks, ask which sectors.
Phase 3 - RISK: Ask one simple scenario to understand risk tolerance.
Phase 4 - PLAN: Summarise their profile and recommend specific ET products with reasons.

Rules:
- Be warm and conversational, never robotic
- Use simple Indian context (mention Sensex, Nifty, SIP naturally)
- Keep replies short — 3 to 4 sentences max
- Ask only ONE question per reply

At the end of every reply, add a JSON block like this:
<<<PROFILE>>>
{"mood":"curious","goal":"learn investing","experience":"beginner","risk":"moderate","interest":"stocks","phase":1,"products":["ET Markets","ET Money"]}
<<<END>>>

Only include fields you have detected so far. Always include phase and products.`;

// ── CALL GEMINI API ──
async function callClaude(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage
  });

  const geminiMessages = [];

  if (conversationHistory.length === 1) {
    geminiMessages.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT + "\n\nUser said: " + userMessage }]
    });
  } else {
    geminiMessages.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT + "\n\nUser said: " + conversationHistory[0].content }]
    });
    for (let i = 1; i < conversationHistory.length; i++) {
      const msg = conversationHistory[i];
      geminiMessages.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: geminiMessages })
    }
  );

  const data = await response.json();
  console.log("Gemini Response:", JSON.stringify(data));

  if (!data.candidates) {
    console.error("Gemini Error:", data);
    throw new Error(data.error?.message || "Gemini API call failed");
  }

  const fullText = data.candidates[0].content.parts[0].text;

  const profileMatch = fullText.match(/<<<PROFILE>>>([\s\S]*?)<<<END>>>/);
  if (profileMatch) {
    try {
      const extracted = JSON.parse(profileMatch[1].trim());
      updateProfile(extracted);
      currentPhase = extracted.phase || 0;
    } catch(e) {
      console.log("Profile parse error", e);
    }
  }

  const cleanText = fullText.replace(/<<<PROFILE>>>[\s\S]*?<<<END>>>/g, "").trim();

  conversationHistory.push({
    role: "assistant",
    content: cleanText
  });

  return cleanText;
}

// ── FLASH ANIMATION WHEN PROFILE UPDATES ──
function updateField(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  el.classList.remove('highlight');
  void el.offsetWidth;
  el.classList.add('highlight');
}

// ── UPDATE PROFILE SIDEBAR ──
function updateProfile(data) {
  if (data.mood) updateField('prof-mood', data.mood);
  if (data.goal) updateField('prof-goal', data.goal);
  if (data.experience) updateField('prof-exp', data.experience);
  if (data.risk) updateField('prof-risk', data.risk);

  if (data.products && data.products.length > 0) {
    document.getElementById('products-container').innerHTML =
      data.products.map(p => `<div class="product-pill">${p}</div>`).join('');
  }

  if (data.interest && data.interest.toLowerCase().includes('stock')) {
    showSectorRisk();
  }

  if (data.phase !== undefined) {
    updatePathSteps(data.phase);
    updateScore(data.phase);
  }
}

// ── SECTOR RISK DATA ──
function showSectorRisk() {
  const sectors = [
    { name: "IT & Tech",       pct: 28, level: "med"  },
    { name: "Banking & NBFC",  pct: 35, level: "med"  },
    { name: "Pharma",          pct: 32, level: "med"  },
    { name: "Realty",          pct: 62, level: "high" },
    { name: "Small Caps",      pct: 71, level: "high" },
    { name: "FMCG",            pct: 18, level: "low"  },
    { name: "Large Cap Index", pct: 15, level: "low"  }
  ];

  const container = document.getElementById('risk-sectors');
  container.innerHTML = sectors.map(s => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${s.name}</span>
        <span style="color:${s.level==='high'?'#FF7A7A':s.level==='med'?'#F5C518':'#00C896'};font-weight:700">${s.pct}%</span>
      </div>
      <div style="height:5px;background:rgba(255,255,255,0.06);border-radius:100px">
        <div style="height:100%;width:${s.pct}%;background:${s.level==='high'?'#FF7A7A':s.level==='med'?'#F5C518':'#00C896'};border-radius:100px"></div>
      </div>
    </div>
  `).join('');
}

// ── UPDATE PATH STEPS ──
function updatePathSteps(phase) {
  for (let i = 0; i <= 4; i++) {
    const el = document.getElementById('step-' + i);
    if (!el) continue;
    el.className = 'path-step';
    if (i < phase) el.classList.add('done');
    else if (i === phase) el.classList.add('active');
  }
}

// ── UPDATE SCORE ──
function updateScore(phase) {
  const score = Math.min(100, phase * 22);
  document.getElementById('scoreNum').textContent = 'Profile: ' + score + '% complete';
}

// ── ADD MESSAGE TO CHAT ──
function addMessage(role, text) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = role === 'user' ? 'msg-user' : 'msg-agent';
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ── QUICK REPLY BUTTONS ──
function setQuickReplies(options) {
  const container = document.getElementById('quickReplies');
  container.innerHTML = options.map(opt =>
    `<button class="qr-btn" onclick="sendMessage('${opt}')">${opt}</button>`
  ).join('');
}

function clearQuickReplies() {
  document.getElementById('quickReplies').innerHTML = '';
}

// ── SEND MESSAGE ──
async function sendMessage(text) {
  const inputBox = document.getElementById('inputBox');
  const message = text || inputBox.value.trim();
  if (!message) return;

  inputBox.value = '';
  clearQuickReplies();
  addMessage('user', message);
  document.getElementById('sendBtn').disabled = true;

  const messages = document.getElementById('messages');
  const typing = document.createElement('div');
  typing.className = 'msg-agent';
  typing.id = 'typing';
  typing.textContent = '...';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  try {
    const reply = await callClaude(message);
    document.getElementById('typing').remove();
    addMessage('agent', reply);

    if (currentPhase === 0) {
      setQuickReplies(['😄 Excited to invest!', '🤔 Just curious', '😰 A bit nervous', '📰 Here for news']);
    } else if (currentPhase === 1) {
      setQuickReplies(['💰 Grow my wealth', '📚 Learn investing', '📊 Track markets', '🏦 Plan finances']);
    } else if (currentPhase === 2) {
      setQuickReplies(['📈 Stocks', '💼 Mutual Funds', '🆕 IPOs', '📰 Just news']);
    } else if (currentPhase === 3) {
      setQuickReplies(['😬 Sell immediately', '⏳ Hold and wait', '📉 Buy more!']);
    }

  } catch(e) {
    document.getElementById('typing')?.remove();
    addMessage('agent', 'Sorry, something went wrong. Please try again!');
    console.error(e);
  }

  document.getElementById('sendBtn').disabled = false;
}

// ── SEND ON ENTER KEY ──
document.getElementById('inputBox').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendMessage();
});

// ── START CONVERSATION ──
async function init() {
  const messages = document.getElementById('messages');
  const typing = document.createElement('div');
  typing.className = 'msg-agent';
  typing.id = 'typing';
  typing.textContent = '...';
  messages.appendChild(typing);

  try {
    const greeting = await callClaude('Hello, I just arrived at The Economic Times website.');
    document.getElementById('typing').remove();
    addMessage('agent', greeting);
    setQuickReplies(['😄 Excited to invest!', '🤔 Just curious', '😰 A bit nervous', '📰 Here for news']);
  } catch(e) {
    document.getElementById('typing')?.remove();
    addMessage('agent', 'Namaste! I am Artha, your ET Smart Advisor. How are you feeling today?');
    setQuickReplies(['😄 Excited to invest!', '🤔 Just curious', '😰 A bit nervous', '📰 Here for news']);
    console.error(e);
  }
}

init();