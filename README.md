# Neon Breaker VR

A holodeck brick-breaker game built with IWSDK 0.4.1 — dual-runtime VR + browser.

**[Play Now](https://ellyz2426.github.io/neon-breaker/)**

## Features

### 7 Game Modes
- **Classic** — 36 handcrafted levels across 3 zones, 3 lives, boss battles
- **Endless** — Levels loop with rising difficulty
- **Time Attack** — 90 seconds, maximum score
- **Zen** — Unlimited lives, relax and play
- **Daily Challenge** — Date-seeded random level, 2x XP bonus
- **Survival** — Wave-based endless mode, 1 life, escalating difficulty (1.8x XP)
- **Practice** — Replay any unlocked level (no XP)

### 8 Power-Ups
- **Multi-Ball** — Splits into 3 balls
- **Wide Paddle** — 1.5x wider for 15 seconds
- **Laser** — Shoot lasers for 10 seconds
- **Shield** — Floor safety net, 1 use
- **Magnet** — Ball sticks to paddle
- **Slow-Mo** — Ball speed -30% for 12 seconds
- **Fireball** — Ball passes through bricks for 8 seconds
- **Mega Ball** — Ball becomes 3x size for 10 seconds

### Progression System
- 50 player levels with exponential XP curve
- 8 ball skins + 7 paddle skins (progression-locked)
- Career stats tracking
- Per-mode best scores

### Content
- 36 handcrafted levels in 3 zones (Zone 1–3)
- 3 boss levels (L12, L24, L36) with moving brick formations
- 6 brick types: Normal, Tough, Armored, Explosive, Golden, Indestructible
- 8 arena themes
- 3 challenge modifiers: Shrinking Paddle (+30% XP), Speed Surge (+30% XP), No Power-Ups (+40% XP)
- 75 achievements
- Interactive tutorial
- Leaderboard with top 20 scores

### Technical
- Built with IWSDK 0.4.1 (dual-runtime: VR + browser)
- 22 PanelUI `.uikitml` templates — zero HTML DOM overlays
- All spatial UI: `PanelUI`, `Follower` (HUDs), `ScreenSpace`
- XR controller support (laser pointer, trigger, grip)
- Procedural Web Audio: 15+ SFX + arpeggiator synthwave music
- Screen shake, combo visual escalation, particle effects

### Controls
- **Browser**: Mouse move / WASD / Arrow keys for paddle, Click for magnet release/laser
- **VR**: Controller position for paddle, Trigger for actions
- **Escape**: Pause/Resume

## Tech Stack
- IWSDK 0.4.1 (`@iwsdk/core`, `@iwsdk/vite-plugin-dev`, `@iwsdk/vite-plugin-uikitml`)
- TypeScript, Vite
- Web Audio API (procedural synthesis)
