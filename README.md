# ET Smart Agent — AI Onboarding Advisor
> Personalised AI-powered onboarding agent for The Economic Times

![ET Smart Agent](https://img.shields.io/badge/ET-Smart%20Agent-red)
![Groq AI](https://img.shields.io/badge/AI-Groq%20LLaMA3-blue)
![NSE Data](https://img.shields.io/badge/Data-NSE%20India-green)

---

##  What is this?

ET Smart Agent is an AI-powered chat advisor called **Artha** that:

-  Greets every user with a personalised 3-minute profiling conversation
-  Detects mood, goals, experience level and risk appetite
-  Maps users to the right Economic Times products
-  Shows real NSE sector risk data for beginner investors
-  Displays real NIFTY 50 price chart (1 year data from NSE India)
-  Creates a personalised onboarding path for each user

---

##  Live Demo

Open `index.html` in your browser after following setup instructions below.

---

##  Tech Stack

| Technology | Purpose |
|---|---|
| HTML + CSS + JavaScript | Frontend UI |
| Groq API (LLaMA 3.3) | AI chat brain |
| NSE India CSV Data | Real NIFTY 50 price history |
| Chart.js | NIFTY 50 price chart |
| PapaParse | CSV file parsing |
| Git + GitHub | Version control |

---

##  Features

### 1. 5-Phase Smart Profiling
```
Phase 0 → Greeting & mood detection
Phase 1 → Goals & experience level
Phase 2 → Investment interests
Phase 3 → Risk tolerance profiling
Phase 4 → Personalised ET product plan
```

### 2. Live Profile Sidebar
- Updates in real time as user chats
- Mood, Goal, Experience, Risk fields flash on update
- ET product recommendations appear dynamically

### 3. Real NSE Sector Risk Data
- 8 sectors with historical volatility %
- Colour coded: Green (low) → Yellow (medium) → Red (high)
- Animated progress bars

### 4. Real NIFTY 50 Chart
- 1 year price history from NSE India (Mar 2025 - Mar 2026)
- 52 week high and low
- Yearly return %

### 5. Risk Prediction
- Algorithm calculates Conservative / Moderate / Aggressive profile
- Based on experience + risk answer + goal

---

##  Setup Instructions

### Step 1 — Clone the repo
```bash
git clone https://github.com/DarshanaDDevi/et-smart-agent.git
cd et-smart-agent
```

### Step 2 — Get a free Groq API key
1. Go to https://console.groq.com
2. Sign up for free
3. Create an API key

### Step 3 — Add your API key
1. Copy `config.example.js` and rename it to `config.js`
2. Open `config.js` and paste your Groq API key:
```javascript
const GEMINI_KEY = "your-groq-api-key-here";
```

### Step 4 — Run the project
```bash
npm install -g live-server
live-server
```

### Step 5 — Open in browser
```
http://127.0.0.1:8080
```

---

##  Project Structure
```
et-smart-agent/
│
├── index.html                          → Main UI
├── style.css                           → Dark theme styling
├── script.js                           → AI chat + data logic
├── config.js                           → Your API key (not in GitHub)
├── config.example.js                   → API key template
├── NIFTY_50-28-03-2025-to-28-03-2026.csv → Real NSE data
├── .gitignore                          → Hides secret files
└── README.md                           → This file
```

---

##  NSE Sector Risk Data

| Sector | Index | Risk % | Level |
|---|---|---|---|
| Large Cap | NIFTY 50 | 15% | 🟢 Low |
| FMCG | NIFTY FMCG | 18% | 🟢 Low |
| IT & Tech | NIFTY IT | 28% | 🟡 Medium |
| Pharma | NIFTY PHARMA | 32% | 🟡 Medium |
| Banking | NIFTY BANK | 35% | 🟡 Medium |
| Auto | NIFTY AUTO | 42% | 🔴 High |
| Realty | NIFTY REALTY | 62% | 🔴 High |
| Small Caps | NIFTY SMALLCAP | 71% | 🔴 High |

---

##  Security

- API key is stored in `config.js` which is listed in `.gitignore`
- `config.js` is never pushed to GitHub
- Use `config.example.js` as a template

---

##  Built By

**Darshana D Devi, B Gowrinanda, Ankitha Elsa Jacob**
Built step by step as a learning project.

---

##  Commit History

This project was built incrementally with clear commits:
```
✅ Initial setup: project folder created
✅ Phase 2: Add HTML structure for chat UI
✅ Phase 3: Add CSS styling with ET dark theme
✅ Phase 4: Gemini AI connected successfully
✅ Phase 5: Real NIFTY 50 CSV data with live chart
✅ Phase 6: README and final cleanup
```
```

