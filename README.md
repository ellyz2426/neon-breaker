# Neon Breaker VR

A holodeck-style brick-breaking game built with [IWSDK](https://iwsdk.dev) (Immersive Web SDK) 0.4.1. Play in VR with XR controllers or in your browser with mouse/keyboard — same codebase, same physics, same neon aesthetic.

**[▶ Play Now](https://ellyz2426.github.io/neon-breaker/)**

## Features

### 🎮 8 Game Modes
- **Classic** — 48 handcrafted levels across 4 zones, 3 lives, full campaign progression
- **Endless** — Levels loop with escalating difficulty, no end in sight
- **Time Attack** — 90-second score sprint
- **Zen** — Unlimited lives, pure relaxation
- **Daily Challenge** — Seeded daily layout, compete against your own high score
- **Survival** — Wave-based spawning, 1 life, how long can you last?
- **Practice** — Replay any previously cleared level
- **Boss Rush** — All 4 bosses back-to-back, 2x XP rewards

### 🧱 6 Brick Types
- **Normal** — 1 hit, 100 points
- **Tough** — 2 hits, 200 points (shows visible damage on hit)
- **Armored** — 3 hits, 300 points (progressive damage visualization)
- **Explosive** — 1 hit, 150 points, chain-reaction AoE
- **Indestructible** — Can't be broken, shapes the puzzle
- **Golden** — 1 hit, 500 points, always drops a power-up

### ⚡ 8 Power-Ups
Multi-Ball, Wide Paddle, Laser, Shield, Magnet, Slow-Mo, Fireball (pass-through), Mega Ball (3x size)

### 🏆 96 Achievements
Ranging from beginner milestones to mastery challenges: combo streaks, boss defeats, speed clears, survival endurance, career totals, mode completion, and more.

### 🎯 4 Boss Levels
Moving brick formations at levels 12, 24, 36, and 48 — each with unique movement patterns (horizontal, vertical, circular, figure-8).

### 📈 Progression System
- 50 player levels with XP scaling
- 8 ball skins and 7 paddle skins (unlocked through leveling)
- Career stats tracking: games played, bricks destroyed, combos, play time, per-mode best scores
- 3 challenge modifiers with XP multiplier bonuses
- Campaign completion tracking

### 🕹️ Controls
| Action | Browser | VR |
|--------|---------|-----|
| Move paddle | Mouse / A/D / ←/→ | Right controller position |
| Fire / Release magnet | Click | Trigger |
| Dash | Shift | — |
| Slam | X | — |
| Pause | Escape | — |

### 🎨 Visual Design
- 8 arena themes (Neon Holodeck, Crimson Grid, Toxic Neon, Ultra Violet, Solar Blaze, Frozen Abyss, Void Pulse, Emerald Matrix)
- Ring explosion VFX on brick destruction
- Brick entry elastic animations per level
- Brick damage visualization (darkening, roughness, edge fade)
- Brick glow pulsing (golden and explosive types)
- Combo visual escalation with paddle glow
- Screen shake on impacts
- Paddle dash trail particles
- Dynamic ball trails with skin-specific colors
- Wireframe holodeck environment with floating decorations
- Ambient particle system

### 🔊 Audio
- Procedural Web Audio engine — no audio file dependencies
- Arpeggiator music system with chord progression
- 15+ distinct SFX: brick hit/destroy, explosion, paddle, wall bounce, power-up, ball lost, level complete, game over, boss intro/defeat, laser, shield block, countdown, achievement
- Per-category volume controls (Master, SFX, Music)

### 🖥️ Spatial UI (PanelUI)
All 22 UI panels use IWSDK's native PanelUI system (`.uikitml` templates) — zero HTML DOM overlays:

`title` · `modeselect` · `difficulty` · `hud` · `pause` · `gameover` · `levelcomplete` · `leaderboard` · `achievements` · `settings` · `help` · `toast` · `countdown` · `profile` · `ballskins` · `paddleskins` · `levelup` · `modifiers` · `powerups` · `victory` · `tutorial` · `practiceselect`

Head-locked HUD panels (score, combo, active power-ups, wave counter) follow the player's gaze in VR via the `Follower` component.

## Tech Stack

- **IWSDK 0.4.1** — dual-runtime WebXR framework (VR + browser)
- **Three.js** — 3D rendering (via IWSDK)
- **PanelUI** — spatial UI system with `.uikitml` templates
- **Web Audio API** — procedural sound synthesis
- **TypeScript** — full type safety
- **Vite** — build and dev server
- **GitHub Pages** — hosting

## Development

```bash
npm install
npx iwsdk dev up        # Start dev server with XR emulation
npm run build           # Production build
```

## Stats

- **4,895+ lines** of source code (4,254 TypeScript + 641 uikitml)
- **22 PanelUI templates** — zero HTML DOM
- **48 handcrafted levels** across 4 themed zones
- **4 boss encounters** with unique movement patterns
- **96 achievements** across all modes and milestones
- **8 arena themes** · 8 ball skins · 7 paddle skins
- **50-level XP progression** with unlock rewards

## License

MIT

---

Built with [IWSDK](https://iwsdk.dev) by [ellyz2426](https://github.com/ellyz2426)
