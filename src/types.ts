// types.ts — Neon Breaker VR: Types, constants, themes, achievements

// ─── Game State ───
export type GameState =
  | 'title' | 'modeselect' | 'difficulty' | 'playing' | 'paused'
  | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help'
  | 'levelcomplete' | 'countdown';

// ─── Brick Types ───
export enum BrickType {
  NORMAL = 0,     // 1 hit, 100 pts
  TOUGH = 1,      // 2 hits, 200 pts
  ARMORED = 2,    // 3 hits, 300 pts
  EXPLOSIVE = 3,  // 1 hit, 150 pts, destroys neighbors
  INDESTRUCTIBLE = 4, // can't break
  GOLDEN = 5,     // 1 hit, 500 pts, always drops power-up
}

export const BRICK_HP: Record<BrickType, number> = {
  [BrickType.NORMAL]: 1,
  [BrickType.TOUGH]: 2,
  [BrickType.ARMORED]: 3,
  [BrickType.EXPLOSIVE]: 1,
  [BrickType.INDESTRUCTIBLE]: 999,
  [BrickType.GOLDEN]: 1,
};

export const BRICK_POINTS: Record<BrickType, number> = {
  [BrickType.NORMAL]: 100,
  [BrickType.TOUGH]: 200,
  [BrickType.ARMORED]: 300,
  [BrickType.EXPLOSIVE]: 150,
  [BrickType.INDESTRUCTIBLE]: 0,
  [BrickType.GOLDEN]: 500,
};

// ─── Power-Up Types ───
export enum PowerUpType {
  MULTI_BALL = 0,   // Split ball into 3
  WIDE_PADDLE = 1,  // Paddle 1.5x wider for 15s
  LASER = 2,        // Shoot lasers for 10s
  SHIELD = 3,       // Floor shield for 1 use
  MAGNET = 4,       // Ball sticks to paddle
  SLOW = 5,         // Ball speed -30% for 12s
  FIREBALL = 6,     // Ball passes through bricks for 8s
}

// ─── Arena Themes ───
export interface ArenaTheme {
  name: string;
  wall: string;
  floor: string;
  accent: string;
  brick1: string;
  brick2: string;
  brick3: string;
  paddle: string;
  ball: string;
  glow: string;
  fog: string;
}

export const THEMES: ArenaTheme[] = [
  {
    name: 'Neon Holodeck',
    wall: '#001a33', floor: '#000d1a', accent: '#00ffff',
    brick1: '#00ffff', brick2: '#ff00ff', brick3: '#00ff88',
    paddle: '#00ffff', ball: '#ffffff', glow: '#00ffff', fog: '#000a14',
  },
  {
    name: 'Crimson Grid',
    wall: '#1a0000', floor: '#0d0000', accent: '#ff3333',
    brick1: '#ff3333', brick2: '#ff8800', brick3: '#ffff00',
    paddle: '#ff3333', ball: '#ffcccc', glow: '#ff3333', fog: '#0a0000',
  },
  {
    name: 'Toxic Neon',
    wall: '#001a00', floor: '#000d00', accent: '#00ff44',
    brick1: '#00ff44', brick2: '#88ff00', brick3: '#44ffaa',
    paddle: '#00ff44', ball: '#ccffcc', glow: '#00ff44', fog: '#000a00',
  },
  {
    name: 'Ultra Violet',
    wall: '#0d001a', floor: '#060010', accent: '#aa44ff',
    brick1: '#aa44ff', brick2: '#ff44aa', brick3: '#4488ff',
    paddle: '#aa44ff', ball: '#ddccff', glow: '#aa44ff', fog: '#04000a',
  },
  {
    name: 'Solar Blaze',
    wall: '#1a0d00', floor: '#0d0600', accent: '#ff8800',
    brick1: '#ff8800', brick2: '#ffcc00', brick3: '#ff4400',
    paddle: '#ff8800', ball: '#ffeecc', glow: '#ff8800', fog: '#0a0400',
  },
];

// ─── Achievements ───
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_break', name: 'First Break', desc: 'Destroy your first brick', unlocked: false },
  { id: 'level_5', name: 'Brick Buster', desc: 'Complete level 5', unlocked: false },
  { id: 'level_10', name: 'Demolition Expert', desc: 'Complete level 10', unlocked: false },
  { id: 'combo_5', name: 'Combo Starter', desc: 'Reach a 5x combo', unlocked: false },
  { id: 'combo_10', name: 'Combo Master', desc: 'Reach a 10x combo', unlocked: false },
  { id: 'combo_25', name: 'Combo Legend', desc: 'Reach a 25x combo', unlocked: false },
  { id: 'score_10k', name: 'Ten Grand', desc: 'Score 10,000 points', unlocked: false },
  { id: 'score_50k', name: 'High Roller', desc: 'Score 50,000 points', unlocked: false },
  { id: 'score_100k', name: 'Century Club', desc: 'Score 100,000 points', unlocked: false },
  { id: 'multi_ball', name: 'Ball Storm', desc: 'Have 3+ balls active at once', unlocked: false },
  { id: 'powerup_5', name: 'Power Hungry', desc: 'Collect 5 power-ups in one game', unlocked: false },
  { id: 'no_miss', name: 'Perfect Level', desc: 'Clear a level without losing a ball', unlocked: false },
  { id: 'fireball', name: 'Through the Fire', desc: 'Destroy 10 bricks with fireball', unlocked: false },
  { id: 'explosive', name: 'Chain Reaction', desc: 'Trigger 3 explosive bricks in one chain', unlocked: false },
  { id: 'golden', name: 'Gold Rush', desc: 'Destroy 10 golden bricks total', unlocked: false },
  { id: 'laser_20', name: 'Sharpshooter', desc: 'Hit 20 bricks with lasers', unlocked: false },
  { id: 'shield_save', name: 'Safety Net', desc: 'Have the shield save you', unlocked: false },
  { id: 'speed_clear', name: 'Speed Demon', desc: 'Clear a level in under 30 seconds', unlocked: false },
  { id: 'all_themes', name: 'Decorator', desc: 'Play with all 5 themes', unlocked: false },
  { id: 'endurance', name: 'Endurance', desc: 'Play for 20+ minutes in one session', unlocked: false },
];

// ─── Level Data ───
export interface LevelData {
  name: string;
  rows: number;
  cols: number;
  grid: BrickType[][]; // row-major, -1 = empty
}

function createGrid(rows: number, cols: number, fill: (r: number, c: number) => BrickType | -1): BrickType[][] {
  const g: BrickType[][] = [];
  for (let r = 0; r < rows; r++) {
    g[r] = [];
    for (let c = 0; c < cols; c++) {
      g[r][c] = fill(r, c) as BrickType;
    }
  }
  return g;
}

export function getLevels(): LevelData[] {
  return [
    // Level 1: Simple rows
    {
      name: 'First Contact', rows: 4, cols: 8,
      grid: createGrid(4, 8, (r) => r < 2 ? BrickType.NORMAL : BrickType.NORMAL),
    },
    // Level 2: Checkerboard
    {
      name: 'Checkerboard', rows: 5, cols: 8,
      grid: createGrid(5, 8, (r, c) => (r + c) % 2 === 0 ? BrickType.NORMAL : -1),
    },
    // Level 3: Tough center
    {
      name: 'Tough Center', rows: 5, cols: 8,
      grid: createGrid(5, 8, (r, c) => (c >= 2 && c <= 5 && r >= 1 && r <= 3) ? BrickType.TOUGH : BrickType.NORMAL),
    },
    // Level 4: Diamond
    {
      name: 'Diamond', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        const cx = 3.5, cy = 3;
        const dx = Math.abs(c - cx), dy = Math.abs(r - cy);
        if (dx + dy <= 3) return r === cy ? BrickType.TOUGH : BrickType.NORMAL;
        return -1;
      }),
    },
    // Level 5: Explosive intro
    {
      name: 'Chain Reaction', rows: 5, cols: 8,
      grid: createGrid(5, 8, (r, c) => {
        if (r === 2 && (c === 2 || c === 5)) return BrickType.EXPLOSIVE;
        if (r === 0) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 6: Golden rain
    {
      name: 'Golden Rain', rows: 6, cols: 8,
      grid: createGrid(6, 8, (r, c) => {
        if (r === 0 && c % 2 === 0) return BrickType.GOLDEN;
        if (r === 1) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 7: Fortress
    {
      name: 'Fortress', rows: 6, cols: 8,
      grid: createGrid(6, 8, (r, c) => {
        if (c === 0 || c === 7) return BrickType.INDESTRUCTIBLE;
        if (r === 0) return BrickType.ARMORED;
        if (r <= 2) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 8: Zigzag
    {
      name: 'Zigzag', rows: 6, cols: 8,
      grid: createGrid(6, 8, (r, c) => {
        const shift = r % 2 === 0 ? 0 : 1;
        if ((c + shift) % 3 === 0) return -1;
        if (r === 0 || r === 5) return BrickType.ARMORED;
        return r % 2 === 0 ? BrickType.TOUGH : BrickType.NORMAL;
      }),
    },
    // Level 9: Explosive grid
    {
      name: 'Minefield', rows: 6, cols: 8,
      grid: createGrid(6, 8, (r, c) => {
        if ((r + c) % 3 === 0) return BrickType.EXPLOSIVE;
        if (r < 2) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 10: Boss formation
    {
      name: 'The Wall', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        if (r === 0) return BrickType.ARMORED;
        if (r === 1 && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r === 1) return BrickType.GOLDEN;
        if (r === 3 && c >= 2 && c <= 5) return BrickType.EXPLOSIVE;
        if (r <= 3) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 11: Spiral
    {
      name: 'Spiral', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        if (r === 0 && c <= 6) return BrickType.NORMAL;
        if (c === 7 && r <= 5) return BrickType.TOUGH;
        if (r === 6 && c >= 2) return BrickType.NORMAL;
        if (c === 2 && r >= 2 && r <= 5) return BrickType.TOUGH;
        if (r === 2 && c >= 3 && c <= 5) return BrickType.ARMORED;
        if (r === 4 && c === 4) return BrickType.GOLDEN;
        return -1;
      }),
    },
    // Level 12: Endgame
    {
      name: 'Endgame', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        if (r === 0 || r === 7) return BrickType.INDESTRUCTIBLE;
        if (r === 1 || r === 6) return BrickType.ARMORED;
        if ((r === 3 || r === 4) && (c === 3 || c === 4)) return BrickType.GOLDEN;
        if ((r + c) % 4 === 0) return BrickType.EXPLOSIVE;
        return BrickType.TOUGH;
      }),
    },
  ];
}

// ─── Playfield Constants ───
export const FIELD_WIDTH = 2.0;   // meters
export const FIELD_HEIGHT = 2.5;  // meters
export const FIELD_DEPTH = 0.1;   // brick thickness
export const FIELD_Y_OFFSET = 1.2; // center Y position
export const FIELD_Z = -2.0;      // distance from player

export const PADDLE_WIDTH = 0.35;
export const PADDLE_HEIGHT = 0.06;
export const PADDLE_DEPTH = 0.04;
export const PADDLE_Y = FIELD_Y_OFFSET - FIELD_HEIGHT / 2 + 0.15;
export const PADDLE_Z = FIELD_Z + 0.05;

export const BALL_RADIUS = 0.025;
export const BALL_SPEED = 1.8;

export const BRICK_W = FIELD_WIDTH / 8 - 0.01;
export const BRICK_H = 0.06;
export const BRICK_D = FIELD_DEPTH;

// ─── Game State Manager ───
export class GameStateManager {
  state: GameState = 'title';
  score = 0;
  lives = 3;
  level = 1;
  combo = 0;
  maxCombo = 0;
  bricksDestroyed = 0;
  powerupsCollected = 0;
  ballsLost = 0;
  levelStartTime = 0;
  sessionStartTime = Date.now();
  goldensDestroyed = 0;
  laserHits = 0;
  fireballHits = 0;
  explosiveChains = 0;
  themesUsed = new Set<number>();
  shieldSaves = 0;
  selectedTheme = 0;
  difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  mode: 'classic' | 'endless' | 'timeattack' | 'zen' = 'classic';
  masterVolume = 0.7;
  sfxVolume = 0.8;
  musicVolume = 0.5;
  achievements: Record<string, boolean> = {};
  leaderboard: { score: number; level: number; mode: string; combo: number; date: string }[] = [];

  constructor() {
    this.loadPersistence();
  }

  loadPersistence() {
    try {
      const a = localStorage.getItem('neon-breaker-achievements');
      if (a) this.achievements = JSON.parse(a);
      const l = localStorage.getItem('neon-breaker-leaderboard');
      if (l) this.leaderboard = JSON.parse(l);
      const t = localStorage.getItem('neon-breaker-theme');
      if (t) this.selectedTheme = parseInt(t, 10);
      const v = localStorage.getItem('neon-breaker-volumes');
      if (v) {
        const vols = JSON.parse(v);
        this.masterVolume = vols.master ?? 0.7;
        this.sfxVolume = vols.sfx ?? 0.8;
        this.musicVolume = vols.music ?? 0.5;
      }
    } catch { /* ignore */ }
  }

  savePersistence() {
    try {
      localStorage.setItem('neon-breaker-achievements', JSON.stringify(this.achievements));
      localStorage.setItem('neon-breaker-leaderboard', JSON.stringify(this.leaderboard));
      localStorage.setItem('neon-breaker-theme', String(this.selectedTheme));
      localStorage.setItem('neon-breaker-volumes', JSON.stringify({
        master: this.masterVolume, sfx: this.sfxVolume, music: this.musicVolume,
      }));
    } catch { /* ignore */ }
  }

  unlockAchievement(id: string): boolean {
    if (this.achievements[id]) return false;
    this.achievements[id] = true;
    this.savePersistence();
    return true;
  }

  addToLeaderboard() {
    this.leaderboard.push({
      score: this.score, level: this.level, mode: this.mode,
      combo: this.maxCombo, date: new Date().toISOString().slice(0, 10),
    });
    this.leaderboard.sort((a, b) => b.score - a.score);
    if (this.leaderboard.length > 20) this.leaderboard.length = 20;
    this.savePersistence();
  }

  resetGame() {
    this.score = 0;
    this.lives = this.mode === 'zen' ? 99 : 3;
    this.level = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.bricksDestroyed = 0;
    this.powerupsCollected = 0;
    this.ballsLost = 0;
    this.levelStartTime = Date.now();
    this.sessionStartTime = Date.now();
    this.goldensDestroyed = 0;
    this.laserHits = 0;
    this.fireballHits = 0;
    this.explosiveChains = 0;
    this.shieldSaves = 0;
  }

  getDifficultyMultiplier(): number {
    return this.difficulty === 'easy' ? 0.75 : this.difficulty === 'hard' ? 1.3 : 1.0;
  }
}
