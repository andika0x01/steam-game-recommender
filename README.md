# Steam Game Recommender 🎮

An advanced game recommendation engine powered by **Fuzzy Logic** and **Steam engagement data**. Built with a modern tech stack and designed for performance on the edge.

## 🚀 Overview

Steam Game Recommender analyzes your Steam library and playtime history using a fuzzy reasoning engine to calculate your "Genre Affinity Spectrum." It identifies hidden gems in your backlog that align with your actual playing habits, rather than just raw popularity.

### Key Features

- **Fuzzy Logic Engine**: Uses trapezoidal membership functions to calculate engagement scores based on playtime.
- **Steam OpenID Integration**: Secure authentication directly with Valve's ecosystem.
- **Genre Affinity Mapping**: Dynamically weights your preferences across various genres.
- **Edge Computing**: Deployed on Cloudflare Workers for global low-latency performance.
- **Modern UI**: Polished, high-signal interface with a "brutalist-modern" aesthetic.

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Ultra-fast web framework for the edge)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Frontend**: React (JSX) with Vanilla CSS and Tailwind for layout.
- **Logic**: Custom Fuzzy Inference System (FIS).
- **Bundler**: Vite.

## 📁 Project Structure

```text
src/
├── recommender/        # Fuzzy logic engine & preference calculations
│   ├── fuzzyLogic.ts   # Membership functions (Trapezoidal)
│   ├── types.ts        # Recommender-specific types
│   └── index.ts        # Scoring logic
├── lib/
│   ├── auth.ts         # Steam OpenID implementation
│   └── steam.ts        # Steam API wrapper (Web API)
├── components/         # Reusable UI components
├── index.tsx           # Main application routes & server-side rendering
└── style.css           # Global aesthetics
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (Latest LTS)
- A Steam API Key (Get it at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey))
- Cloudflare Account (for deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/steam-game-recommender.git
   cd steam-game-recommender
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.dev.vars` file for local development:
   ```text
   STEAM_API_KEY=your_api_key_here
   HOST_URL=http://localhost:5173
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

Deploy to Cloudflare Workers using Wrangler:

```bash
npm run deploy
```

Make sure to set your production secrets on Cloudflare:
```bash
npx wrangler secret put STEAM_API_KEY
npx wrangler secret put HOST_URL
```

## 🧠 The Fuzzy Logic Engine

### Why Fuzzy Logic?

Traditional recommendation systems often use binary logic (e.g., "played vs. not played") or simple linear regressions. However, human interest in games is inherently **ambiguous and non-linear**:
- Is 2 hours of playtime "low interest" or "high interest"? For a short indie game, it might be high; for an RPG, it's just the tutorial.
- Interest isn't a toggle; it's a spectrum.

**Fuzzy Logic** allows us to handle this uncertainty by using "degrees of truth" (0 to 1) rather than absolute 0 or 1. This project treats playtime as a linguistic variable that can belong to multiple categories (Low, Medium, High) simultaneously.

### The Mechanism

The engine operates through three main phases:

#### 1. Fuzzification (Input Processing)
Raw playtime hours are passed through **Trapezoidal Membership Functions**. A single value like `22 hours` might be:
- **0%** "Low Engagement"
- **60%** "Medium Engagement"
- **20%** "High Engagement"

This overlapping membership ensures smooth transitions between user behavior states.

#### 2. Fuzzy Inference (Genre Weighting)
We map these engagement levels to weighted scores for each genre associated with the game:
- **Low Engagement** (e.g., < 5 hrs): Weighted at **0.2** (User tried it, but didn't stick).
- **Medium Engagement** (e.g., 5-25 hrs): Weighted at **0.6** (User liked it).
- **High Engagement** (e.g., > 30 hrs): Weighted at **1.0** (User is deeply invested).

#### 3. Scoring (Output)
The final recommendation score for a backlog game is calculated by:
- Finding the user's affinity weight for each genre of the target game.
- Normalizing the aggregate score to a 0-1 range.
- **Baseline Bias**: In the current implementation, we apply a **70% baseline floor** (`0.7 + (score * 0.3)`).

**Why are the percentages so high?**
1. **Encouraging Discovery**: Since the engine analyzes games you *already own* in your backlog, a high baseline ensures the system remains encouraging. A 70% match means "This is a safe bet since you already bought it," while the remaining 30% is the "Fuzzy Boost" based on your specific habits.
2. **Genre Density**: Most popular games share broad genres (e.g., "Action," "Indie"). If your library is dense with these, the overlap will naturally result in higher base scores.
3. **Probabilistic Confidence**: In fuzzy systems, we often prefer "High Confidence" outputs for recommendations to reduce user friction.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for gamers who can't decide what to play next.*
