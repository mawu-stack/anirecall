# AniRecall 🎬🔍

> **“You remember the scene. We’ll find the anime.”**  
> *Developed by Mawutorwu Klu and Skythen Therlonge.*

AniRecall is an agentic AI-powered web application that identifies anime titles from fragmented, uncertain, or obscure human memories: memorable scenes, character appearance, clothing, superpowers, settings, dialogue fragments, approximate release dates, or viewing platforms.

Developed as a university software engineering project combining natural language processing, tool-using AI agents, and open anime catalog APIs.

---

## 👥 Developers & University Credits

**Developed by Mawutorwu Klu and Skythen Therlonge.**  
- **Course Project:** Agentic AI Web Application & Media Discovery  
- **GitHub Repository:** [https://github.com/mawu-stack/anirecall](https://github.com/mawu-stack/anirecall)  
- **Live Deployment:** [https://anirecall-j8s1rwnh6-klum-3379.vercel.app](https://anirecall-j8s1rwnh6-klum-3379.vercel.app) *(Vercel)*

---

## 🌟 Key Features

### 1. Natural-Language Memory Search
- Prominent **“What do you remember?”** search box.
- Tolerates typos, partial memories, uncertain recollections, and obscure scene fragments.
- Quick-start clickable example prompts.
- Switchable **Exact Title** mode for conventional lookup.

### 2. Editable Structured Memory Clues
- Automatically parses user prose into typed memory chips:
  - `Character`: Hair, clothing, accessories, weapons, quirks.
  - `Setting`: World, location, time period.
  - `Scene`: Memorable events, twists, actions.
  - `Genre`: Themes, tones, demographic classifications.
  - `Approx Year`: When the anime was produced/released.
  - `Watched In`: When the *user* watched it (cleanly separated from production year).
  - `Format`: TV series, Standalone Movie, OVA.
  - `Platform`: Netflix, Crunchyroll, Hulu, etc.
- **Certainty Toggle**: Mark clues as **Sure** (hard constraints) or **Maybe** (soft preferences).
- Edit or delete clues without losing search context.

### 3. Grounded & Verified Candidate Results
- Ranked candidates with verified posters, release years, formats, studios, synopses, and direct catalog links to MyAnimeList and AniList.
- **Verification Matrix**:
  - `✓ Matches`: Clues confirmed by catalog records.
  - `✕ Conflicting`: Discrepancies in year, format, or core premise.
  - `? Unverified`: Obscure details absent from high-level summaries (avoids AI hallucinations).
- **Match Tiers**: Grounded labels (`Strong match`, `Possible match`, `Needs more clues`). Does not force 5 results when fewer are relevant.

### 4. Interactive Agent Follow-Up
- Detects ambiguous candidate pools and generates a **single discriminating question** to isolate the intended title.
- Quick-answer pills, free-text input, and an `"I don't remember"` bypass button.

### 5. Candidate Rejection & Refinement
- **“Found it!”**: Confirms the title, adds it to the user's private collection, and suggests similar vibes.
- **“That's not it”**: Permanently excludes that candidate for the session and re-ranks the remaining pool.
- **“Close, but...”**: Accepts user corrections and injects new clues.

### 6. Side-by-Side Comparison Modal
- Compares any two candidates side by side.
- Cross-references both anime against the user's clues in a structured table.
- Highlights a key distinguishing question between the two.

### 7. Character Finder Mode
- Dedicated search mode focused on physical appearance, hair/eye color, weapons, clothing, and quirks.
- Associates verified character records with their parent anime.

### 8. Spoiler Shielding
- Default spoiler-light explanations.
- Climactic resolutions and plot twists are hidden behind an explicit toggle (`Reveal Key Plot Twist`).

### 9. Found It! Collection (Local & Private)
- Saves confirmed anime and the original query into browser `localStorage`.
- No account or login required.
- Reopen previous search sessions with one click.

### 10. Similar Vibes Recommendations
- After confirmation, offers verified recommendations based on the user's choice:
  - **Tone**: Dark psychological tension, emotional drama.
  - **Setting**: Cyberpunk, historical fantasy, sci-fi worldbuilding.
  - **Character**: Dynamic rivalries, anti-heroes.

### 11. Screenshot Match Extension (Trace.moe)
- Uploads anime screenshots (PNG, JPG, WebP $\le$ 5MB).
- Integrated with Trace.moe API for exact video frame recognition.
- Transparently distinguishes exact-frame matching from broader visual interpretation.
- Privacy guaranteed: Images are processed in-memory and **never stored**.

### 12. Mystery Guessing Game
- Progressive 5-stage guessing game with hints ranging from production era to scene quotes and shielded spoilers.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (Pages Router) | React 18, Server-Side API Routes |
| **Styling** | Custom Responsive CSS | Dark charcoal/navy `#0B0F19`, violet `#8B5CF6`, cyan `#06B6D4` accents |
| **Icons** | Lucide React | Accessible, lightweight SVG iconography |
| **AI Agent** | Tool-Using Workflow | Clue extractor, query builder, catalog search, candidate grounder, follow-up generator |
| **AI Provider** | Google Gemini (Optional) | `gemini-1.5-flash` with structured JSON tool-use via `GEMINI_API_KEY` |
| **Catalog APIs**| AniList GraphQL + Jikan v4 | Live anime metadata, characters, posters, and external URLs |
| **Offline Fallback**| Curated Fixture Catalog | 27 verified classic and contemporary anime across all genres |
| **Screenshot Engine**| Trace.moe API | Exact anime frame search |
| **Storage** | Client-Side LocalStorage | Zero-tracking, zero-server privacy architecture |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js `v18.0.0` or higher (tested on Node `v24.21.0`)
- `npm` or `pnpm`

### Installation
```bash
# 1. Clone repository
git clone https://github.com/[YOUR-USERNAME]/anirecall.git
cd anirecall

# 2. Install dependencies
npm install

# 3. Configure environment variables (Optional)
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY (optional)

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

AniRecall functions fully out-of-the-box in **Curated Ground-Truth Catalog Mode** without any API keys. To enable live generative AI extraction and reasoning, add your Gemini API key:

```env
# .env.local
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=3000
```
Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 🧪 Testing & Verification

Run the test suite with:
```bash
npm test
```
The automated test runner executes 12 comprehensive integration test suites (36 assertions total):
1. Recognizable plot description (Steins;Gate)
2. Ambiguous description generating discriminating follow-up questions
3. Uncertain (`maybe`) clue handling as soft preference (Bunny Girl Senpai)
4. Candidate rejection (`"That's not it"`) and exclusion preservation across turns
5. Character finder appearance & trait matching (Ken Kaneki / Tokyo Ghoul)
6. No-match / ungrounded query rejection (zero hallucinations)
7. Watched year vs. production release year distinction (Neon Genesis Evangelion)
8. Conflicting "Sure" clue flagging without discarding candidates (Death Note)
9. Missing credentials graceful fallback & fixture transparency disclosure
10. Non-repeating follow-up question prevention across multi-turn sessions
11. Full end-to-end multi-turn search & saved history interaction sequence
12. In-memory caching & throttling resilience

---

## 🚢 Deployment Guide

AniRecall is fully production-ready and optimized for serverless deployment on Vercel:

### Step 1: Push to GitHub
```bash
# If using GitHub CLI:
gh repo create anirecall --public --source=. --remote=origin --push

# Or if using standard Git:
git remote add origin https://github.com/[YOUR-USERNAME]/anirecall.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel
You can deploy directly via the Vercel CLI or via the Vercel Web Dashboard:

#### Option A: Via Vercel CLI (Terminal)
```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy to production
npx vercel deploy --prod
```

#### Option B: Via Vercel Web Dashboard
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Import your `anirecall` GitHub repository.
3. In **Environment Variables**, optionally add:
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key.
4. Click **Deploy**.

---

## 🔒 Security & Privacy

- **No Server Tracking:** Raw search queries and session data are never stored in databases.
- **In-Memory Image Processing:** Screenshots uploaded for frame matching are held in ephemeral RAM buffers and immediately released after API querying.
- **Strict Input Validation:** Payloads are validated against size limits (1MB for JSON text, 6MB for image uploads) and string length bounds.
- **Prompt Injection Defense:** Model outputs are validated as structured JSON schemas; arbitrary model-generated code execution is strictly prohibited.

---

## 📚 Project Links & Deliverables

- **Live Application:** `https://anirecall.vercel.app` *(or custom Vercel domain)*
- **GitHub Repository:** [https://github.com/mawu-stack/anirecall](https://github.com/mawu-stack/anirecall)
- **Academic Report:** See `report/report.tex` (and compiled `report/report.pdf` / `report/report.html`)
- **Demo Walkthrough:** See `DEMO_SCRIPT.md`
