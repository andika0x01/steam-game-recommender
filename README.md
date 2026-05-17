# Steam Game Recommender

A high-performance Steam library analyzer and discovery engine built with Hono, Cloudflare Workers, and D1.

## Core Features
- **Naive Bayes Recommendation Engine**: Rigorous mathematical scoring using SteamSpy tags and user playtime weighted by Fuzzy Logic.
- **MMR Diversity Sorting**: Replaced Simulated Annealing with Maximal Marginal Relevance for deterministic and diverse game suggestions.
- **Backlog Priority**: Smart ranking for owned but unplayed games.
- **Deal Hunter**: Bayesian-filtered discount discovery via CheapShark API.
- **Co-op Nexus**: Collective interest convergence for group play sessions.
- **Tier List**: Manual organization tool for your digital legacy.

## Tech Stack
- **Framework**: [Hono](https://hono.dev/) (Full-stack)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Styling**: Vanilla CSS (Modern aesthetic)

## Getting Started
1. Clone the repository.
2. Run `npm install`.
3. Configure `wrangler.jsonc` with your Steam API Key and D1 database.
4. Run `npm run dev` for local development.
5. Deploy using `npm run deploy`.

License: MIT
