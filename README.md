# DrishtiAI — AI Healthcare Companion

> An AI-powered healthcare companion designed for elderly and disabled Indians. Reads medicines, explains government documents, plays brain games, and answers questions — all with voice support in Hindi and English.

---

## Features

### 💊 Medicine Reader
- Point the camera at any medicine label
- OCR extracts text, searches a medicine database, then DeepSeek AI explains:
  - Medicine name, dosage, when to take it, purpose, and warnings
- Results spoken aloud in Hindi or English

### 📄 Document Helper
- Scan government documents (Aadhaar, PAN, prescriptions, bills)
- AI explains the document in simple language with action steps

### 🧠 Brain Games
- **Memory Match** — flip cards and find matching pairs
- **Word Quiz** — 10 Hindi/English knowledge questions, read aloud by narrator
- **Pattern Finder** — Simon-says style color/emoji sequence game

### ☀️ Daily Companion
- Live clock and date display
- Daily medicine reminders with check-off
- Morning motivational message
- Mood tracker (saved to database)

### 🎤 Voice Commands (Hindi + English)
Say any of these to navigate hands-free:
| Say | Action |
|-----|--------|
| "दवाई" / "medicine" | Open Medicine Reader |
| "दस्तावेज़" / "document" | Open Document Helper |
| "खेल" / "games" | Open Brain Games |
| "साथी" / "daily" | Open Daily Companion |
| "रुको" / "stop" | Stop narrator |
| "हिंदी" / "english" | Switch language |

### 🤖 AI Chat
- Tap the 💬 button for a full chat window
- Type or speak your question
- Streaming responses with a funny, goofy personality
- Knows today's date, time, and live weather

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Vanilla HTML / CSS / JS | Frontend — single file app, no build step |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | OCR — reads text from camera images |
| [DeepSeek API](https://platform.deepseek.com) | AI analysis and general chat |
| [Supabase](https://supabase.com) | Medicine database + scan history + mood logs |
| Web Speech API | Text-to-speech narrator + voice command recognition |
| [wttr.in](https://wttr.in) | Live weather for AI context |
| Vercel | Hosting and deployment |

---

## Project Structure

```
├── demo.html          # Main app (entry point)
├── demo.css           # All styles — dark medical luxury theme
├── demo.js            # All JavaScript — AI, OCR, games, voice, DB
├── index.html         # Landing page
├── manifest.json      # PWA manifest
├── sw.js              # Service worker (offline support)
├── icon-192.png       # PWA icon
├── icon-512.png       # PWA icon (large)
├── supabase_setup.sql # Database schema (run once in Supabase)
└── populate_medicines.py  # Script to seed medicine data
```

---

## Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase_setup.sql`
3. Run `populate_medicines.py` to seed the medicines table
4. Copy your **Project URL** and **anon/public key** into `demo.js`:

```js
const SUPA_URL = 'your-project-url';
const SUPA_KEY = 'your-anon-key';
```

---

## API Keys

| Key | Where to get it |
|---|---|
| `DEEPSEEK_KEY` | [platform.deepseek.com](https://platform.deepseek.com) → API Keys |
| `SUPA_URL` + `SUPA_KEY` | Supabase project → Settings → API |

Add them to the top of `demo.js`:

```js
const DEEPSEEK_KEY = 'your-deepseek-key';
const SUPA_URL     = 'your-supabase-url';
const SUPA_KEY     = 'your-supabase-anon-key';
```

---

## Deployment (Vercel + GitHub)

1. Push all files to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Framework: **Other** | Build command: *(empty)* | Output: *(empty)*
4. Click **Deploy**

Auto-deploys on every push to main branch.

---

## PWA — Install on Phone

On mobile Chrome/Safari, open the deployed URL and tap:
- **"Add to Home Screen"** (Android Chrome: menu → Add to Home Screen)
- **"Add to Home Screen"** (iOS Safari: Share → Add to Home Screen)

The app works offline for previously loaded content.

---

## Screenshots

> Medicine Reader · Document Helper · Brain Games · Daily Companion · AI Chat

*(Add screenshots here)*

---

## Built For

DrishtiAI is built for **elderly and disabled Indians** who may have limited digital literacy. Design principles:
- Large text, high contrast dark theme
- Full Hindi + English bilingual support
- Voice-first interaction — every feature accessible by voice
- Simple, single-screen navigation

---

## License

MIT — free to use, modify, and distribute.
