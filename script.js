// API key loaded from config.js
const API_KEY = GEMINI_KEY;

// ── CONVERSATION HISTORY ──
const conversationHistory = [];

// ── PHASE TRACKER ──
let currentPhase = 0;

// ── SYSTEM PROMPT ──
const SYSTEM_PROMPT = `You are Artha, a warm and friendly onboarding advisor for The Economic Times (ET), India's top financial newspaper.

Your job is to profile the user in a short friendly conversation and recommend the right ET products for them.

ET PRODUCTS YOU CAN RECOMMEND:
- ET Markets → Live stocks, F&O, portfolio tracker
- ET Money → Mutual funds, SIP calculator, tax filing
- ETPrime → Premium analysis, expert views (₹999/month)
- ET Now → Business news TV and videos
- ET Wealth → Personal finance planning
- ET Screener → Stock discovery and filters
- IPO Watch → Upcoming and ongoing IPOs
- Market Data → Indices, charts, screener

USER PERSONAS:
- Young professional 22-30 → Recommend SIP + ET Money + ET Markets
- Business owner → Recommend ET Markets + ETPrime
- Retired person → Recommend ET Wealth + low risk funds
- Student → Recommend free ET app + learning content
- Beginner → Recommend ET Money + ET Wealth
- Experienced investor → Recommend ET Screener + ETPrime

SECTOR RISK DATA FOR BEGINNERS:
- Large Cap Index: 15% risk (LOW) → Safe for beginners
- FMCG: 18% risk (LOW) → Safe for beginners
- IT & Tech: 28% risk (MEDIUM) → Moderate for beginners
- Pharma: 32% risk (MEDIUM) → Moderate for beginners
- Banking & NBFC: 35% risk (MEDIUM) → Moderate for beginners
- Realty: 62% risk (HIGH) → Risky for beginners
- Small Caps: 71% risk (HIGH) → Very risky for beginners

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
- Always recommend specific ET products based on user profile

At the end of every reply, add a JSON block like this:
<<<PROFILE>>>
{"mood":"curious","goal":"learn investing","experience":"beginner","risk":"moderate","interest":"stocks","phase":1,"products":["ET Markets","ET Money"]}
<<<END>>>

Only include fields you have detected so far. Always include phase and products.`;

// ── CALL GROQ API ──
async function callClaude(userMessage) {

  // Add user message to history
  conversationHistory.push({
    role: "user",
    content: userMessage
  });

  // Call Groq API
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...conversationHistory.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
          }))
        ],
        max_tokens: 1000
      })
    }
  );

  const data = await response.json();
  console.log("Groq Response:", JSON.stringify(data));

  if (!data.choices) {
    console.error("Groq Error:", data);
    throw new Error(data.error?.message || "Groq API call failed");
  }

  const fullText = data.choices[0].message.content;

  // Extract profile JSON if present
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

  // Remove JSON block from displayed message
  const cleanText = fullText.replace(/<<<PROFILE>>>[\s\S]*?<<<END>>>/g, "").trim();

  // Add assistant reply to history
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

  // Update products list
  if (data.products && data.products.length > 0) {
    document.getElementById('products-container').innerHTML =
      data.products.map(p => `<div class="product-pill">${p}</div>`).join('');
  }

  // Show sector risk if interested in stocks
  if (data.interest && data.interest.toLowerCase().includes('stock')) {
    showSectorRisk();
  }

  // Update path steps and score
  if (data.phase !== undefined) {
    updatePathSteps(data.phase);
    updateScore(data.phase);
  }
}

// ── SECTOR RISK DATA ──
function showSectorRisk() {
  const sectors = [
    { name: "Large Cap Index", pct: 15, level: "low"  },
    { name: "FMCG",            pct: 18, level: "low"  },
    { name: "IT & Tech",       pct: 28, level: "med"  },
    { name: "Pharma",          pct: 32, level: "med"  },
    { name: "Banking & NBFC",  pct: 35, level: "med"  },
    { name: "Realty",          pct: 62, level: "high" },
    { name: "Small Caps",      pct: 71, level: "high" }
  ];

  const color = (level) =>
    level === 'high' ? '#FF7A7A' : level === 'med' ? '#F5C518' : '#00C896';

  const container = document.getElementById('risk-sectors');
  container.innerHTML = sectors.map(s => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${s.name}</span>
        <span style="color:${color(s.level)};font-weight:700">${s.pct}% risk</span>
      </div>
      <div class="risk-bar">
        <div class="risk-bar-fill" 
             style="background:${color(s.level)}" 
             data-width="${s.pct}">
        </div>
      </div>
    </div>
  `).join('');

  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll('.risk-bar-fill').forEach(bar => {
      bar.style.width = bar.getAttribute('data-width') + '%';
    });
  }, 100);
}

// ── RISK PREDICTION based on user profile ──
function calculateRiskProfile() {
  const experience = document.getElementById('prof-exp').textContent;
  const risk = document.getElementById('prof-risk').textContent;
  const interest = document.getElementById('prof-interest') ?
    document.getElementById('prof-interest').textContent : '';

  let score = 50; // base score

  if (experience.includes('beginner')) score -= 20;
  if (experience.includes('experienced')) score += 20;
  if (risk.includes('cautious') || risk.includes('sell')) score -= 15;
  if (risk.includes('aggressive') || risk.includes('buy more')) score += 15;

  if (score < 35) return { label: 'Conservative', color: '#00C896', advice: 'Stick to Large Cap & FMCG' };
  if (score < 65) return { label: 'Moderate', color: '#F5C518', advice: 'Mix of Large Cap & IT stocks' };
  return { label: 'Aggressive', color: '#FF7A7A', advice: 'Can explore Mid & Small Caps' };
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

  // Show risk profile when plan phase reached
  if (phase >= 4) {
    const riskProfile = calculateRiskProfile();
    const scoreEl = document.getElementById('scoreNum');
    scoreEl.innerHTML = `
      Profile: 100% complete<br><br>
      <span style="color:${riskProfile.color};font-weight:700">
        ${riskProfile.label} Investor
      </span><br>
      <span style="font-size:11px;color:#6B6B80">
        ${riskProfile.advice}
      </span>
    `;
  }
}

// ── UPDATE SCORE ──
function updateScore(phase) {
  const score = Math.min(100, phase * 22);
  if (phase < 4) {
    document.getElementById('scoreNum').textContent =
      'Profile: ' + score + '% complete';
  }
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

  // Show typing indicator
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

    // Show quick replies based on phase
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
    setQuickReplies([
      '😄 Excited to invest!',
      '🤔 Just curious',
      '😰 A bit nervous',
      '📰 Here for news'
    ]);
  } catch(e) {
    document.getElementById('typing')?.remove();
    addMessage('agent', 'Namaste! I am Artha, your ET Smart Advisor. How are you feeling today?');
    setQuickReplies([
      '😄 Excited to invest!',
      '🤔 Just curious',
      '😰 A bit nervous',
      '📰 Here for news'
    ]);
    console.error(e);
  }
}

// Start when page loads
init();