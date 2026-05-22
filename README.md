# Steam Game Recommender

A personalized game recommendation system using Fuzzy Logic to analyze Steam libraries and discover new titles.

## Features

- **Library Analysis**: Scores games you already own based on playtime, recency, and activity using `FuzzyOwnGamesScorer`.
- **Discovery Engine**: Recommends new games from the Steam Store using a proportional tag-based fetching strategy and `FuzzyNonOwnGamesScorer`.
- **Co-op Nexus**: Find the best games to play together with friends by analyzing collective interests.
- **Deal Hunter**: Optimizes your budget to find the highest-value deals matching your profile.

## Recommendation System

The system has been revamped to use a dual-scorer Fuzzy Logic architecture:

### 1. FuzzyOwnGamesScorer
Evaluates your library to build a "Preference Profile".
- **Inputs**: `Playtime Forever`, `Recent Activity (2 weeks)`, `Recency (Days since last played)`.
- **Output**: A preference score (0-1) used to weight the importance of a game's tags in your profile.

### 2. FuzzyNonOwnGamesScorer
Predicts how much you'll like a game from the Steam Store.
- **Inputs**:
    - `Review Positivity`: Ratio of positive reviews.
    - `Tag Similarity`: Jaccard similarity between the game's tags and your weighted preference profile.
    - `Review Volume`: Total number of reviews (provides confidence to the score).
- **Output**: A recommendation score (0-1).

### 3. Proportional Fetching
Instead of a simple top-tag search, the engine calculates the proportion of interest for your top tags. If 40% of your weighted profile points to "Action" and 30% to "RPG", the engine fetches candidates in those exact proportions to ensure a balanced and diverse set of recommendations.

## Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Cloudflare Workers)
- **Frontend**: React (SSR + Hydration)
- **Styling**: Vanilla CSS with a futuristic aesthetic
- **Logic**: Custom Fuzzy Logic implementation in TypeScript
- **Database**: Cloudflare D1 (for friend syncing)
- **Cache**: Cloudflare KV (for Steam API responses)

## Development

```bash
# Install dependencies
npm install

# Run locally with Wrangler
npm run dev

# Run tests
npm test
```
