# The Oregon Trail

A browser-based recreation of the classic Oregon Trail game, built with TypeScript, Vite, and vanilla HTML/CSS.

![Oregon Trail retro terminal screenshot](https://img.shields.io/badge/style-retro%20terminal-33ff33?style=flat&labelColor=0a1a0a&color=33ff33)

## Features

- Retro green-phosphor Apple II aesthetic with CRT scanline effect
- Full classic gameplay — profession selection, supply store, 16 historical landmarks
- Hunting mini-game with keyboard/mouse controls
- River crossings (ford, caulk & float, ferry, or wait)
- Random events: illness, broken parts, bad weather, good fortune, and more
- Party health system with ailments and recovery
- Save & resume via `localStorage` — your progress persists between sessions
- Tombstone system — epitaphs from past runs appear on the trail

## Requirements

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/chrissantiago/oregon-trail.git
cd oregon-trail

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` or `j` / `k` | Navigate menus |
| `Enter` | Confirm selection |
| `1`–`8` | Select menu option by number |
| Arrow keys / WASD | Move crosshair (hunting) |
| `Space` / click | Fire (hunting) |

## Build for Production

```bash
npm run build
```

Output is written to `dist/`. Serve it with any static file host (GitHub Pages, Netlify, etc.).

## Project Structure

```
src/
├── core/          # Game engine, state, save manager
├── data/          # Landmarks, events, store prices
├── screens/       # One file per game screen
├── systems/       # Travel, health, weather, hunting, scoring
├── styles/        # CSS theme and reset
└── ui/            # DOM helpers, text animator, ASCII art
```

## License

MIT
