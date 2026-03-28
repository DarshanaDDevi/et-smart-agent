// API key loaded from config.js
const API_KEY = GEMINI_KEY;

// ── CONVERSATION HISTORY ──
const conversationHistory = [];

// ── PHASE TRACKER ──
let currentPhase = 0;

// ── TRACK SHOWN PANELS & ANSWERED QUICK REPLIES ──
let chartShown = false;
let newsShown  = false;
let quickRepliesAnswered = {};

// ── NIFTY DATA ──
let niftyData = null;

// ── LOAD NIFTY CSV ──
function loadNiftyCSV() {
  return new Promise((resolve, reject) => {
    Papa.parse('NIFTY_50-28-03-2025-to-28-03-2026.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
      complete: function(results) {
        const rows = results.data.reverse();
        const dates   = rows.map(r => r['Date'].trim());
        const closes  = rows.map(r => parseFloat(r['Close']));
        const highs   = rows.map(r => parseFloat(r['High']));
        const lows    = rows.map(r => parseFloat(r['Low']));
        const opens   = rows.map(r => parseFloat(r['Open']));
        const volumes = rows.map(r => parseInt(r['Shares Traded'].replace(/,/g, '')));

        const high52w      = Math.max(...highs);
        const low52w       = Math.min(...lows);
        const latestClose  = closes[closes.length - 1];
        const yearAgoClose = closes[0];
        const yearlyReturn = (((latestClose - yearAgoClose) / yearAgoClose) * 100).toFixed(2);

        niftyData = {
          dates, closes, highs, lows, opens, volumes,
          high52w, low52w, latestClose,
          yearlyReturn: parseFloat(yearlyReturn),
          totalDays: dates.length
        };
        resolve(niftyData);
      },
      error: reject
    });
  });
}

// ── DRAW MARKET CHART (only for stock/market interest) ──
function drawMarketChart() {
  if (!niftyData || chartShown) return;
  chartShown = true;

  const sidebar = document.querySelector('.sidebar');
  const chartSection = document.createElement('div');
  chartSection.id = 'market-chart-section';
  chartSection.innerHTML = `
    <h3 style="font-size:11px;letter-spacing:1.5px;color:#6B6B80;text-transform:uppercase;margin-top:16px;margin-bottom:6px;">
      Market Overview
    </h3>
    <canvas id="niftyCanvas" width="220" height="90" style="display:block;margin:0 auto 4px;"></canvas>
    <div id="niftyStats" style="font-size:11px;color:#6B6B80;line-height:1.8;text-align:center;">Loading...</div>
  `;

  const productsHeading = Array.from(sidebar.querySelectorAll('h3'))
    .find(h => h.textContent.includes('ET Products'));
  if (productsHeading) sidebar.insertBefore(chartSection, productsHeading);
  else sidebar.appendChild(chartSection);

  const step = 5;
  const labels = niftyData.dates.filter((_, i) => i % step === 0);
  const prices = niftyData.closes.filter((_, i) => i % step === 0);

  new Chart(document.getElementById('niftyCanvas'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: prices,
        borderColor: '#E8001C',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        backgroundColor: 'rgba(232,0,28,0.08)'
      }]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          display: true,
          ticks: { color: '#6B6B80', font: { size: 9 }, maxTicksLimit: 4 },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });

  const returnColor = niftyData.yearlyReturn >= 0 ? '#00C896' : '#FF7A7A';
  const returnArrow = niftyData.yearlyReturn >= 0 ? '▲' : '▼';
  document.getElementById('niftyStats').innerHTML = `
    <span style="color:${returnColor}">${returnArrow} ${niftyData.yearlyReturn}%</span> 1yr &nbsp;|&nbsp;
    High: <span style="color:#00C896">₹${niftyData.high52w.toLocaleString('en-IN')}</span><br>
    Low: <span style="color:#FF7A7A">₹${niftyData.low52w.toLocaleString('en-IN')}</span> &nbsp;|&nbsp;
    Days: ${niftyData.totalDays}
  `;
}

// ── SHOW NEWS CONTENT (only for news interest) ──
function showNewsContent() {
  if (newsShown) return;
  newsShown = true;

  const sidebar = document.querySelector('.sidebar');
  const newsSection = document.createElement('div');
  newsSection.id = 'news-section';
  newsSection.innerHTML = `
    <h3 style="font-size:11px;letter-spacing:1.5px;color:#6B6B80;text-transform:uppercase;margin-top:16px;margin-bottom:6px;">
      Top ET Categories
    </h3>
    ${[
      { icon: '🏦', label: 'Economy & Policy', desc: 'RBI, Budget, GDP updates' },
      { icon: '🌏', label: 'Global Markets',   desc: 'US Fed, Dow, Nasdaq' },
      { icon: '🏢', label: 'Corporate News',   desc: 'Earnings, M&A, Results' },
      { icon: '📱', label: 'Tech & Startups',  desc: 'Funding, IPO pipeline' },
      { icon: '🛢️', label: 'Commodities',      desc: 'Gold, Oil, Agri prices' },
    ].map(n => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1A1A26;">
        <span style="font-size:18px;">${n.icon}</span>
        <div>
          <div style="font-size:13px;color:#E8E8F0;font-weight:600;">${n.label}</div>
          <div style="font-size:11px;color:#6B6B80;">${n.desc}</div>
        </div>
      </div>
    `).join('')}
    <div style="margin-top:10px;padding:10px;background:rgba(74,158,255,0.08);border:1px solid rgba(74,158,255,0.2);border-radius:8px;font-size:12px;color:#4A9EFF;">
      📰 ET Now live TV for real-time business news
    </div>
  `;

  const productsHeading = Array.from(sidebar.querySelectorAll('h3'))
    .find(h => h.textContent.includes('ET Products'));
  if (productsHeading) sidebar.insertBefore(newsSection, productsHeading);
  else sidebar.appendChild(newsSection);
}

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

SECTOR RISK DATA:
- Large Cap Index: 15% risk (LOW)
- FMCG: 18% risk (LOW)
- IT & Tech: 28% risk (MEDIUM)
- Pharma: 32% risk (MEDIUM)
- Banking & NBFC: 35% risk (MEDIUM)
- Realty: 62% risk (HIGH)
- Small Caps: 71% risk (HIGH)

Follow these phases strictly:
Phase 0 - GREETING: Warmly greet. Ask how they feel today.
Phase 1 - GOALS: Ask what they want. Ask experience level.
Phase 2 - INTERESTS: Ask if they like stocks, mutual funds, IPOs, or just news. Once answered NEVER ask again.
Phase 3 - RISK: Ask ONE risk scenario. Skip if user only wants news.
Phase 4 - PLAN: Summarise profile and recommend ET products.

Rules:
- Be warm, never robotic
- Keep replies 3-4 sentences max
- Ask only ONE question per reply
- NEVER repeat a question already answered
- Move forward once each phase is answered

At the end of every reply add:
<<<PROFILE>>>
{"mood":"curious","goal":"learn investing","experience":"beginner","risk":"moderate","interest":"stocks","phase":1,"products":["ET Markets","ET Money"]}
<<<END>>>

Always include phase and products. Only include fields detected so far.`;

// ── CALL GROQ API ──
async function callClaude(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
  });

  const data = await response.json();
  if (!data.choices) throw new Error(data.error?.message || "Groq API call failed");

  const fullText = data.choices[0].message.content;

  const profileMatch = fullText.match(/<<<PROFILE>>>([\s\S]*?)<<<END>>>/);
  if (profileMatch) {
    try {
      const extracted = JSON.parse(profileMatch[1].trim());
      updateProfile(extracted);
      currentPhase = extracted.phase || 0;

      // Conditionally show chart or news based on interest
      const interest = (extracted.interest || '').toLowerCase();
      if (interest.includes('stock') || interest.includes('market') ||
          interest.includes('ipo')   || interest.includes('mutual')) {
        drawMarketChart();
      }
      if (interest.includes('news')) {
        showNewsContent();
      }
    } catch(e) { console.log("Profile parse error", e); }
  }

  const cleanText = fullText.replace(/<<<PROFILE>>>[\s\S]*?<<<END>>>/g, "").trim();
  conversationHistory.push({ role: "assistant", content: cleanText });
  return cleanText;
}

// ── FLASH ANIMATION ──
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
  if (data.mood)       updateField('prof-mood', data.mood);
  if (data.goal)       updateField('prof-goal', data.goal);
  if (data.experience) updateField('prof-exp',  data.experience);
  if (data.risk)       updateField('prof-risk', data.risk);

  if (data.products && data.products.length > 0) {
    document.getElementById('products-container').innerHTML =
      data.products.map(p => `<div class="product-pill">${p}</div>`).join('');
  }

  if (data.interest && data.interest.toLowerCase().includes('stock')) showSectorRisk();
  if (data.phase !== undefined) { updatePathSteps(data.phase); updateScore(data.phase); }
}

// ── SECTOR RISK ──
function showSectorRisk() {
  const sectors = [
    { name: "Large Cap", pct: 15, level: "low"  },
    { name: "FMCG",      pct: 18, level: "low"  },
    { name: "IT & Tech", pct: 28, level: "med"  },
    { name: "Pharma",    pct: 32, level: "med"  },
    { name: "Banking",   pct: 35, level: "med"  },
    { name: "Realty",    pct: 62, level: "high" },
    { name: "Small Cap", pct: 71, level: "high" }
  ];
  const color = l => l === 'high' ? '#FF7A7A' : l === 'med' ? '#F5C518' : '#00C896';
  document.getElementById('risk-sectors').innerHTML = sectors.map(s => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${s.name}</span>
        <span style="color:${color(s.level)};font-weight:700">${s.pct}%</span>
      </div>
      <div class="risk-bar">
        <div class="risk-bar-fill" style="background:${color(s.level)}" data-width="${s.pct}"></div>
      </div>
    </div>
  `).join('');
  setTimeout(() => {
    document.querySelectorAll('.risk-bar-fill').forEach(b => {
      b.style.width = b.getAttribute('data-width') + '%';
    });
  }, 100);
}

// ── RISK PROFILE ──
function calculateRiskProfile() {
  const experience = document.getElementById('prof-exp').textContent;
  const risk = document.getElementById('prof-risk').textContent;
  let score = 50;
  if (experience.includes('beginner'))    score -= 20;
  if (experience.includes('experienced')) score += 20;
  if (risk.includes('cautious') || risk.includes('sell'))       score -= 15;
  if (risk.includes('aggressive') || risk.includes('buy more')) score += 15;
  if (score < 35) return { label: 'Conservative', color: '#00C896', advice: 'Stick to Large Cap & FMCG' };
  if (score < 65) return { label: 'Moderate',     color: '#F5C518', advice: 'Mix of Large Cap & IT stocks' };
  return           { label: 'Aggressive',          color: '#FF7A7A', advice: 'Can explore Mid & Small Caps' };
}

// ── PATH STEPS ──
function updatePathSteps(phase) {
  for (let i = 0; i <= 4; i++) {
    const el = document.getElementById('step-' + i);
    if (!el) continue;
    el.className = 'path-step';
    if (i < phase) el.classList.add('done');
    else if (i === phase) el.classList.add('active');
  }
  if (phase >= 4) {
    const rp = calculateRiskProfile();
    document.getElementById('scoreNum').innerHTML = `
      Profile: 100% complete<br><br>
      <span style="color:${rp.color};font-weight:700">${rp.label} Investor</span><br>
      <span style="font-size:11px;color:#6B6B80">${rp.advice}</span>
    `;
  }
}

function updateScore(phase) {
  if (phase < 4) {
    document.getElementById('scoreNum').textContent =
      'Profile: ' + Math.min(100, phase * 22) + '% complete';
  }
}

// ── ADD MESSAGE ──
function addMessage(role, text) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = role === 'user' ? 'msg-user' : 'msg-agent';
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ── QUICK REPLIES — shown once per phase only ──
const phaseOptions = {
  0: ['😄 Excited to invest!', '🤔 Just curious', '😰 A bit nervous', '📰 Here for news'],
  1: ['💰 Grow my wealth', '📚 Learn investing', '📊 Track markets', '🏦 Plan finances'],
  2: ['📈 Stocks', '💼 Mutual Funds', '🆕 IPOs', '📰 Just news'],
  3: ['😬 Sell immediately', '⏳ Hold and wait', '📉 Buy more!']
};

function setQuickReplies(phase) {
  if (quickRepliesAnswered[phase]) return; // already answered, don't show again
  const options = phaseOptions[phase];
  if (!options) return;

  document.getElementById('quickReplies').innerHTML = options.map(opt =>
    `<button class="qr-btn" onclick="handleQuickReply('${opt}', ${phase})">${opt}</button>`
  ).join('');
}

function handleQuickReply(text, phase) {
  quickRepliesAnswered[phase] = true;  // mark phase as done
  document.getElementById('quickReplies').innerHTML = '';
  sendMessage(text);
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
    setQuickReplies(currentPhase); // show options only if not already answered
  } catch(e) {
    document.getElementById('typing')?.remove();
    addMessage('agent', 'Sorry, something went wrong. Please try again!');
    console.error(e);
  }

  document.getElementById('sendBtn').disabled = false;
}

// ── ENTER KEY ──
document.getElementById('inputBox').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendMessage();
});

// ── INIT ──
async function init() {
  // Silently preload CSV in background
  try { await loadNiftyCSV(); } catch(e) { console.warn('CSV load failed:', e); }

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
    setQuickReplies(0);
  } catch(e) {
    document.getElementById('typing')?.remove();
    addMessage('agent', 'Namaste! I am Artha, your ET Smart Advisor. How are you feeling today?');
    setQuickReplies(0);
    console.error(e);
  }
}

init();