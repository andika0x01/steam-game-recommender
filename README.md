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

## 🧠 How the Logic Works

The recommender doesn't just look at what you own; it looks at how you **play**:

1. **Fuzzification**: Playtime for each game is converted into fuzzy sets: `Low`, `Medium`, and `High` engagement using trapezoidal membership functions.
2. **Preference Scoring**: Each genre from your played games is assigned a weight based on the membership value of its playtime.
3. **Recommendation**: Backlog games are scored by aggregating your affinity weights for their specific genres, normalized to a 0-1 range.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for gamers who can't decide what to play next.*
