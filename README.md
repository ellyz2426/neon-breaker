# Neon Breaker VR

A holodeck-style brick breaker game built with [IWSDK](https://iwsdk.dev) 0.4.1. Playable in VR headsets and desktop browsers.

🎮 **[Play Now](https://ellyz2426.github.io/neon-breaker/)**

## Features

### Core Gameplay
- Custom brick-breaker physics with precise paddle collision response
- 6 brick types: Normal, Tough (2HP), Armored (3HP), Explosive (chain reactions), Indestructible, Golden (always drops power-up)
- 7 power-ups: Multi-Ball, Wide Paddle, Laser, Shield, Magnet, Slow-Mo, Fireball
- Combo scoring up to x10 multiplier with visual feedback

### 36 Handcrafted Levels (3 Zones)
- **Zone 1** (Levels 1-12): Classic formations — Checkerboard, Diamond, Fortress, Spiral, Minefield
- **Zone 2** (Levels 13-24): Advanced patterns — Hourglass, Cross, Maze, Castle, Mirror, Omega
- **Zone 3** (Levels 25-36): Expert designs — Vortex, Fracture, DNA, Fortress II, Singularity

### Boss Levels
- Levels 12, 24, and 36 feature boss encounters with moving brick formations
- Horizontal, vertical, and circular movement patterns
- Unique boss intro/defeat audio cues and screen shake

### 5 Game Modes
- **Classic**: Progress through all 36 levels with 3 lives
- **Endless**: Infinite looping levels, increasing speed
- **Time Attack**: 90 seconds, maximize your score
- **Zen**: 99 lives, pure relaxation
- **Daily Challenge**: Seeded random level, 2x XP bonus

### Challenge Modifiers
- **Shrinking Paddle** (+30% XP): Paddle shrinks 5% with each brick destroyed
- **Speed Surge** (+30% XP): Ball accelerates every 10 seconds
- **No Power-Ups** (+40% XP): Power-ups disabled entirely
- Stack all 3 for up to x2.4 XP multiplier

### Progression System
- 50 player levels with exponential XP curve
- 8 ball skins (Neon Pulse, Plasma Orb, Void Sphere, Starfire, Nebula, Supernova, Cosmic)
- 7 paddle skins (Hologram, Crystal, Ember, Aurora, Quantum, Singularity)
- Skins unlock at specific progression levels

### 60 Achievements
- Combo milestones (5x → 100x)
- Score milestones (10K → 2M)
- Boss defeats, modifier challenges, zone completions
- Speed clears, perfect levels, daily challenges
- Campaign completion, power-up chains, consecutive perfects

### Campaign Victory
- Complete all 36 levels in Classic mode for a special victory celebration
- 1.5x XP campaign bonus on completion
- Fireworks, screen shake, boss defeat fanfare

### Active Power-Up HUD
- Real-time display of active power-ups with countdown timers
- Head-locked panel visible in VR and browser

### Visual & Audio
- 8 arena themes: Neon Holodeck, Crimson Grid, Toxic Neon, Ultra Violet, Solar Blaze, Frozen Abyss, Void Pulse, Emerald Matrix
- Procedural Web Audio: 15+ SFX, evolving arpeggiator music, ambient drone
- Screen shake on impacts and explosions
- Particle effects, glow trails, wireframe decorations
- Holodeck-style grid floor and ceiling

### VR Support
- Full dual-runtime: VR headsets (Quest, Vision Pro) and desktop browsers
- XR controller input for paddle movement
- Spatial PanelUI — all 18 `.uikitml` templates, zero HTML DOM overlays
- Head-locked HUD for score, lives, and combo display

## Controls

### Desktop
- **Mouse**: Move paddle
- **A/D or Arrow Keys**: Move paddle
- **Click**: Release magnet ball / Fire laser
- **Escape**: Pause

### VR
- **Right Controller**: Move paddle
- **Trigger**: Release magnet ball / Fire laser
- **Laser Pointer**: Navigate menus

## Tech Stack

- **IWSDK 0.4.1** — Meta's WebXR development framework
- **TypeScript** — Full type safety
- **PanelUI** — IWSDK's spatial UI system (`.uikitml` templates)
- **Web Audio API** — Procedural sound synthesis
- **Vite** — Build tooling with `@iwsdk/vite-plugin-dev` and `@iwsdk/vite-plugin-uikitml`

## Development

```bash
npm install
npx vite        # Dev server with hot reload
npx vite build  # Production build
```

## License

MIT
