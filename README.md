# Neon Breaker VR

Holodeck VR brick breaker arcade — break neon brick formations with an energy ball and paddle. Built with IWSDK 0.4.1.

## Features

- **12 handcrafted levels** with progressive difficulty across unique brick formations
- **6 brick types**: Normal, Tough (2 hits), Armored (3 hits), Explosive (chain reaction), Golden (drops power-up), Indestructible
- **7 power-ups**: Multi-Ball, Wide Paddle, Laser, Shield, Magnet, Slow-Mo, Fireball
- **4 game modes**: Classic (12 levels, 3 lives), Endless (looping difficulty), Time Attack (90s), Zen (unlimited lives)
- **3 difficulty levels**: Easy, Medium, Hard (ball speed scaling)
- **Combo scoring**: Consecutive brick hits build multiplier up to x10
- **20 achievements** with localStorage persistence
- **Top 20 leaderboard** with score, level, mode, combo, date
- **5 arena themes**: Neon Holodeck, Crimson Grid, Toxic Neon, Ultra Violet, Solar Blaze
- **Procedural Web Audio**: 15+ SFX + ambient synthwave drone
- **Holodeck environment**: neon grid floor/ceiling, 14 floating wireframe decorations, 40 ambient particles, fog, accent lights
- **Ball trail** with additive blending, speed-reactive coloring
- **Particle effects**: brick destruction, explosions, power-up collect, shield block
- **Dual runtime**: VR (XR offer once) + browser fallback

## Controls

### Browser
- **Mouse**: Move paddle left/right
- **A/D or Arrows**: Move paddle
- **Click**: Release magnet / Fire laser
- **ESC**: Pause

### VR
- **Right Controller**: Paddle position
- **Trigger**: Release magnet / Fire laser
- **B**: Pause
- **Laser Pointer**: UI interaction

## Tech

- IWSDK 0.4.1 with dual-runtime (`xr: { offer: 'once' }`)
- 13 PanelUI `.uikitml` templates, zero HTML DOM
- 3 TypeScript source modules (index, types, audio)
- Procedural Web Audio API (no audio files)
- localStorage persistence for achievements, leaderboard, settings, themes

## Links

- **Live**: https://ellyz2426.github.io/neon-breaker/
- **Repo**: https://github.com/ellyz2426/neon-breaker
