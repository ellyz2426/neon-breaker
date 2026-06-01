// types.ts — Neon Breaker VR: Types, constants, themes, achievements

// ─── Game State ───
export type GameState =
  | 'title' | 'modeselect' | 'difficulty' | 'playing' | 'paused'
  | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help'
  | 'levelcomplete' | 'countdown' | 'tutorial' | 'practiceselect';

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
  MEGA_BALL = 7,    // Ball becomes 3x size for 10s
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
  {
    name: 'Frozen Abyss',
    wall: '#001a1a', floor: '#000d0d', accent: '#44ddff',
    brick1: '#44ddff', brick2: '#88eeff', brick3: '#0088aa',
    paddle: '#44ddff', ball: '#ddeeff', glow: '#44ddff', fog: '#000808',
  },
  {
    name: 'Void Pulse',
    wall: '#0a000a', floor: '#050005', accent: '#cc00ff',
    brick1: '#cc00ff', brick2: '#8800aa', brick3: '#ff44ff',
    paddle: '#cc00ff', ball: '#eeccff', glow: '#cc00ff', fog: '#030003',
  },
  {
    name: 'Emerald Matrix',
    wall: '#001a0d', floor: '#000d06', accent: '#00ff66',
    brick1: '#00ff66', brick2: '#44ffaa', brick3: '#00cc44',
    paddle: '#00ff66', ball: '#ccffdd', glow: '#00ff66', fog: '#000a04',
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
  // Original 20
  { id: 'first_break', name: 'First Break', desc: 'Destroy your first brick', unlocked: false },
  { id: 'level_5', name: 'Brick Buster', desc: 'Complete level 5', unlocked: false },
  { id: 'level_10', name: 'Demolition Expert', desc: 'Complete level 10', unlocked: false },
  { id: 'level_20', name: 'Wall Crusher', desc: 'Complete level 20', unlocked: false },
  { id: 'level_24', name: 'Final Boss', desc: 'Complete all 24 levels', unlocked: false },
  { id: 'combo_5', name: 'Combo Starter', desc: 'Reach a 5x combo', unlocked: false },
  { id: 'combo_10', name: 'Combo Master', desc: 'Reach a 10x combo', unlocked: false },
  { id: 'combo_25', name: 'Combo Legend', desc: 'Reach a 25x combo', unlocked: false },
  { id: 'combo_50', name: 'Combo God', desc: 'Reach a 50x combo', unlocked: false },
  { id: 'score_10k', name: 'Ten Grand', desc: 'Score 10,000 points', unlocked: false },
  { id: 'score_50k', name: 'High Roller', desc: 'Score 50,000 points', unlocked: false },
  { id: 'score_100k', name: 'Century Club', desc: 'Score 100,000 points', unlocked: false },
  { id: 'score_500k', name: 'Half Million', desc: 'Score 500,000 points', unlocked: false },
  { id: 'multi_ball', name: 'Ball Storm', desc: 'Have 3+ balls active at once', unlocked: false },
  { id: 'powerup_5', name: 'Power Hungry', desc: 'Collect 5 power-ups in one game', unlocked: false },
  { id: 'powerup_20', name: 'Power Addict', desc: 'Collect 20 power-ups in one game', unlocked: false },
  { id: 'no_miss', name: 'Perfect Level', desc: 'Clear a level without losing a ball', unlocked: false },
  { id: 'fireball', name: 'Through the Fire', desc: 'Destroy 10 bricks with fireball', unlocked: false },
  { id: 'explosive', name: 'Chain Reaction', desc: 'Trigger 3 explosive bricks in one chain', unlocked: false },
  { id: 'golden', name: 'Gold Rush', desc: 'Destroy 10 golden bricks total', unlocked: false },
  { id: 'laser_20', name: 'Sharpshooter', desc: 'Hit 20 bricks with lasers', unlocked: false },
  { id: 'shield_save', name: 'Safety Net', desc: 'Have the shield save you', unlocked: false },
  { id: 'speed_clear', name: 'Speed Demon', desc: 'Clear a level in under 30 seconds', unlocked: false },
  { id: 'all_themes', name: 'Decorator', desc: 'Play with all 5 themes', unlocked: false },
  { id: 'endurance', name: 'Endurance', desc: 'Play for 20+ minutes in one session', unlocked: false },
  // Progression 15
  { id: 'xp_level_10', name: 'Rising Star', desc: 'Reach player level 10', unlocked: false },
  { id: 'xp_level_25', name: 'Veteran', desc: 'Reach player level 25', unlocked: false },
  { id: 'xp_level_50', name: 'Grandmaster', desc: 'Reach player level 50', unlocked: false },
  { id: 'games_10', name: 'Regular', desc: 'Play 10 games', unlocked: false },
  { id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', unlocked: false },
  { id: 'daily_1', name: 'Daily Player', desc: 'Complete a Daily Challenge', unlocked: false },
  { id: 'daily_7', name: 'Weekly Warrior', desc: 'Complete 7 Daily Challenges', unlocked: false },
  { id: 'bricks_500', name: 'Destroyer', desc: 'Destroy 500 bricks total', unlocked: false },
  { id: 'bricks_2000', name: 'Annihilator', desc: 'Destroy 2,000 bricks total', unlocked: false },
  { id: 'perfect_3', name: 'Triple Perfection', desc: 'Clear 3 levels without losing a ball', unlocked: false },
  { id: 'endless_50', name: 'Marathon Runner', desc: 'Reach level 50 in Endless mode', unlocked: false },
  { id: 'time_60k', name: 'Time Master', desc: 'Score 60,000+ in Time Attack', unlocked: false },
  { id: 'no_powerup', name: 'Purist', desc: 'Clear a level without using power-ups', unlocked: false },
  { id: 'all_skins', name: 'Collector', desc: 'Unlock all ball and paddle skins', unlocked: false },
  { id: 'explosive_5', name: 'Pyromaniac', desc: 'Trigger 5 explosive chains in one level', unlocked: false },
  // Round 3: Boss & modifier achievements
  { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat a boss level', unlocked: false },
  { id: 'boss_master', name: 'Boss Master', desc: 'Defeat all 3 boss levels', unlocked: false },
  { id: 'modifier_1', name: 'Risk Taker', desc: 'Complete a level with a challenge modifier', unlocked: false },
  { id: 'modifier_3', name: 'Triple Threat', desc: 'Complete a level with all 3 modifiers active', unlocked: false },
  { id: 'level_36', name: 'Zone Master', desc: 'Complete all 36 levels', unlocked: false },
  { id: 'combo_100', name: 'Combo Ascendant', desc: 'Reach a 100x combo', unlocked: false },
  { id: 'score_1m', name: 'Millionaire', desc: 'Score 1,000,000 points', unlocked: false },
  { id: 'speed_15', name: 'Lightning Clear', desc: 'Clear a level in under 15 seconds', unlocked: false },
  { id: 'zone_2', name: 'Zone 2 Entry', desc: 'Reach Zone 2 (level 13)', unlocked: false },
  { id: 'zone_3', name: 'Zone 3 Entry', desc: 'Reach Zone 3 (level 25)', unlocked: false },
  // Round 4: Advanced achievements
  { id: 'campaign_victory', name: 'Campaign Complete', desc: 'Beat all 36 levels in Classic mode', unlocked: false },
  { id: 'all_bosses_no_miss', name: 'Flawless Commander', desc: 'Defeat a boss without losing a ball', unlocked: false },
  { id: 'triple_modifier', name: 'Iron Will', desc: 'Complete 3 levels with all modifiers active', unlocked: false },
  { id: 'speed_run_10', name: 'Blitz Run', desc: 'Clear 10 levels in under 5 minutes total', unlocked: false },
  { id: 'all_themes_used', name: 'World Traveler', desc: 'Play a game in all 8 arena themes', unlocked: false },
  { id: 'no_miss_5', name: 'Perfect Streak', desc: 'Clear 5 consecutive levels without losing a ball', unlocked: false },
  { id: 'score_2m', name: 'Double Millionaire', desc: 'Score 2,000,000 points total', unlocked: false },
  { id: 'bricks_5000', name: 'Demolition King', desc: 'Destroy 5,000 bricks total', unlocked: false },
  { id: 'games_100', name: 'Century Player', desc: 'Play 100 games', unlocked: false },
  { id: 'powerup_chain', name: 'Power Surge', desc: 'Collect 3 power-ups in 10 seconds', unlocked: false },
  // Round 5: Survival & advanced achievements
  { id: 'survival_wave_5', name: 'Wave Rider', desc: 'Survive 5 waves in Survival mode', unlocked: false },
  { id: 'survival_wave_10', name: 'Storm Chaser', desc: 'Survive 10 waves in Survival mode', unlocked: false },
  { id: 'survival_wave_20', name: 'Apocalypse Survivor', desc: 'Survive 20 waves in Survival mode', unlocked: false },
  { id: 'survival_score_50k', name: 'Survival Scorer', desc: 'Score 50,000 in Survival mode', unlocked: false },
  { id: 'survival_score_200k', name: 'Survival Legend', desc: 'Score 200,000 in Survival mode', unlocked: false },
  { id: 'mega_ball_50', name: 'Mega Crusher', desc: 'Destroy 50 bricks with Mega Ball', unlocked: false },
  { id: 'mega_ball_chain', name: 'Wrecking Ball', desc: 'Destroy 10+ bricks with one Mega Ball', unlocked: false },
  { id: 'practice_complete', name: 'Practice Champion', desc: 'Complete any level in Practice mode', unlocked: false },
  { id: 'all_modes', name: 'Jack of All Modes', desc: 'Play all 7 game modes at least once', unlocked: false },
  { id: 'score_5m', name: 'Five Million Club', desc: 'Score 5,000,000 points total', unlocked: false },
  { id: 'bricks_10000', name: 'Brick Annihilator', desc: 'Destroy 10,000 bricks total', unlocked: false },
  { id: 'combo_200', name: 'Combo Transcendent', desc: 'Reach a 200x combo', unlocked: false },
  { id: 'survival_no_powerup', name: 'Survival Purist', desc: 'Survive 5 waves without collecting power-ups', unlocked: false },
  { id: 'tutorial_complete', name: 'Student', desc: 'Complete the tutorial', unlocked: false },
  // Round 6: Zone 4 & paddle abilities
  { id: 'zone_4', name: 'Zone 4 Entry', desc: 'Reach Zone 4 (level 37)', unlocked: false },
  { id: 'level_48', name: 'Event Horizon', desc: 'Complete all 48 levels', unlocked: false },
  { id: 'boss_4', name: 'Horizon Breaker', desc: 'Defeat the Event Horizon Boss', unlocked: false },
  { id: 'all_bosses', name: 'Boss Annihilator', desc: 'Defeat all 4 boss levels', unlocked: false },
  { id: 'campaign_48', name: 'Ultimate Champion', desc: 'Beat all 48 levels in Classic', unlocked: false },
  { id: 'dash_50', name: 'Speedster', desc: 'Use paddle dash 50 times', unlocked: false },
  { id: 'slam_25', name: 'Earthquake', desc: 'Use paddle slam 25 times', unlocked: false },
  { id: 'slam_hit_5', name: 'Shockwave Master', desc: 'Hit 5 bricks with a single slam', unlocked: false },
  { id: 'score_10m', name: 'Ten Million Club', desc: 'Score 10,000,000 points total', unlocked: false },
  { id: 'bricks_20000', name: 'Brick Obliterator', desc: 'Destroy 20,000 bricks total', unlocked: false },
  // Round 7: Boss Rush & mastery achievements
  { id: 'boss_rush_clear', name: 'Boss Rush Champion', desc: 'Defeat all 4 bosses in Boss Rush', unlocked: false },
  { id: 'boss_rush_no_miss', name: 'Boss Rush Flawless', desc: 'Clear Boss Rush without losing a ball', unlocked: false },
  { id: 'boss_rush_speed', name: 'Boss Rush Speedrun', desc: 'Clear Boss Rush in under 5 minutes', unlocked: false },
  { id: 'combo_300', name: 'Combo Infinite', desc: 'Reach a 300x combo', unlocked: false },
  { id: 'score_20m', name: 'Twenty Million', desc: 'Score 20,000,000 points total', unlocked: false },
  { id: 'all_8_modes', name: 'Mode Master', desc: 'Play all 8 game modes at least once', unlocked: false },
  { id: 'survival_wave_30', name: 'Survival God', desc: 'Survive 30 waves in Survival mode', unlocked: false },
  { id: 'bricks_50000', name: 'Brick Eraser', desc: 'Destroy 50,000 bricks total', unlocked: false },
  { id: 'zen_100k', name: 'Zen Master', desc: 'Score 100,000 in Zen mode', unlocked: false },
  { id: 'explosive_chain_8', name: 'Chain Overlord', desc: 'Trigger 8+ bricks in one explosive chain', unlocked: false },
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
    // Level 13: Hourglass
    {
      name: 'Hourglass', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const w = r <= 3 ? (4 - r) : (r - 3);
        if (c < w || c >= 8 - w) return -1;
        if (r === 0 || r === 7) return BrickType.ARMORED;
        if (r === 3 || r === 4) return BrickType.GOLDEN;
        return r <= 2 ? BrickType.TOUGH : BrickType.NORMAL;
      }),
    },
    // Level 14: Cross
    {
      name: 'Cross', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        const isVert = c >= 3 && c <= 4;
        const isHoriz = r >= 2 && r <= 4;
        if (!isVert && !isHoriz) return -1;
        if (r === 3 && (c === 3 || c === 4)) return BrickType.EXPLOSIVE;
        if (isVert && isHoriz) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 15: Columns
    {
      name: 'Columns', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        if (c % 2 !== 0) return -1;
        if (r === 0) return BrickType.INDESTRUCTIBLE;
        if (r === 1) return BrickType.GOLDEN;
        if (r <= 3) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 16: Rings
    {
      name: 'Rings', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        const cx = 3.5, cy = 3;
        const d = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (d < 1) return BrickType.GOLDEN;
        if (d >= 1.5 && d < 2.5) return BrickType.TOUGH;
        if (d >= 3 && d < 4) return BrickType.NORMAL;
        return -1;
      }),
    },
    // Level 17: Invasion
    {
      name: 'Invasion', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        // Space invader-ish pattern
        if (r === 0 && (c === 1 || c === 6)) return BrickType.TOUGH;
        if (r === 1 && (c === 0 || c === 2 || c === 5 || c === 7)) return BrickType.NORMAL;
        if (r === 1 && (c >= 3 && c <= 4)) return BrickType.EXPLOSIVE;
        if (r === 2) return BrickType.ARMORED;
        if (r === 3 && (c === 0 || c === 7)) return -1;
        if (r === 3) return BrickType.TOUGH;
        if (r === 4 && (c <= 1 || c >= 6)) return -1;
        if (r === 4 && (c === 3 || c === 4)) return BrickType.GOLDEN;
        if (r === 4) return BrickType.NORMAL;
        if (r === 5 && (c === 2 || c === 5)) return BrickType.NORMAL;
        if (r === 6 && (c === 1 || c === 6)) return BrickType.NORMAL;
        return -1;
      }),
    },
    // Level 18: Maze
    {
      name: 'Maze', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Maze-like walls with golden prizes
        if (r === 0) return BrickType.INDESTRUCTIBLE;
        if (r === 2 && c >= 2) return BrickType.INDESTRUCTIBLE;
        if (r === 4 && c <= 5) return BrickType.INDESTRUCTIBLE;
        if (r === 6 && c >= 2) return BrickType.INDESTRUCTIBLE;
        if (r === 1 && c === 7) return BrickType.GOLDEN;
        if (r === 3 && c === 0) return BrickType.GOLDEN;
        if (r === 5 && c === 7) return BrickType.GOLDEN;
        if (r === 7 && c === 0) return BrickType.GOLDEN;
        return BrickType.NORMAL;
      }),
    },
    // Level 19: Arrow
    {
      name: 'Arrow', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        const cx = 3.5;
        // Arrow head pointing up
        if (r <= 3) {
          const width = r;
          if (Math.abs(c - cx) <= width + 0.5) {
            if (r === 0) return BrickType.GOLDEN;
            if (r === 1) return BrickType.ARMORED;
            return BrickType.TOUGH;
          }
          return -1;
        }
        // Arrow shaft
        if (c >= 3 && c <= 4) return BrickType.NORMAL;
        return -1;
      }),
    },
    // Level 20: Explosive Grid
    {
      name: 'Detonation', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        if ((r + c) % 2 === 0) return BrickType.EXPLOSIVE;
        if (r <= 1) return BrickType.ARMORED;
        if (r >= 5) return BrickType.ARMORED;
        return BrickType.NORMAL;
      }),
    },
    // Level 21: Castle
    {
      name: 'Castle', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Battlements
        if (r === 0 && (c % 2 === 0)) return BrickType.ARMORED;
        if (r === 0 && (c % 2 === 1)) return -1;
        if (r === 1) return BrickType.ARMORED;
        // Walls
        if (r >= 2 && r <= 5 && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r >= 2 && r <= 5 && (c === 1 || c === 6)) return BrickType.TOUGH;
        // Gate
        if (r >= 5 && r <= 7 && c >= 3 && c <= 4) return BrickType.GOLDEN;
        if (r >= 2 && r <= 4 && c >= 3 && c <= 4) return BrickType.EXPLOSIVE;
        // Fill
        if (r >= 2 && r <= 7 && c >= 2 && c <= 5) return BrickType.NORMAL;
        if (r >= 6) return BrickType.TOUGH;
        return -1;
      }),
    },
    // Level 22: Mirror
    {
      name: 'Mirror', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        // Symmetric pattern
        const mc = c <= 3 ? c : 7 - c;
        const mr = r <= 3 ? r : 6 - r;
        if (mc === 0 && mr === 0) return BrickType.INDESTRUCTIBLE;
        if (mc === 0 || mr === 0) return BrickType.ARMORED;
        if (mc === mr) return BrickType.GOLDEN;
        if (mc < mr) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 23: Gauntlet
    {
      name: 'Gauntlet', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        if (r % 2 === 0) {
          if (c === 0 || c === 7) return BrickType.INDESTRUCTIBLE;
          if (c === 1 || c === 6) return BrickType.ARMORED;
          return BrickType.TOUGH;
        } else {
          if (c >= 2 && c <= 5) return -1;
          if (r === 3 && (c === 0 || c === 7)) return BrickType.GOLDEN;
          return BrickType.EXPLOSIVE;
        }
      }),
    },
    // Level 24: Omega
    {
      name: 'Omega', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Dense final level with every brick type
        if (r === 0 && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r === 0) return BrickType.ARMORED;
        if (r === 1 && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r === 1) return BrickType.TOUGH;
        if (r === 2 && (c === 2 || c === 5)) return BrickType.EXPLOSIVE;
        if (r === 2) return BrickType.ARMORED;
        if (r === 3) return c === 3 || c === 4 ? BrickType.GOLDEN : BrickType.TOUGH;
        if (r === 4) return (c + r) % 3 === 0 ? BrickType.EXPLOSIVE : BrickType.ARMORED;
        if (r === 5 && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r === 5) return BrickType.TOUGH;
        if (r === 6) return c % 2 === 0 ? BrickType.GOLDEN : BrickType.ARMORED;
        if (r === 7) return BrickType.ARMORED;
        return BrickType.NORMAL;
      }),
    },
    // ─── Zone 3: Levels 25–36 ───
    // Level 25: Vortex
    {
      name: 'Vortex', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const cx = 3.5, cy = 3.5;
        const angle = Math.atan2(r - cy, c - cx);
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 1.2) return BrickType.GOLDEN;
        if (dist < 2.5) {
          const ring = Math.floor(angle / (Math.PI / 4)) % 3;
          if (ring === 0) return BrickType.ARMORED;
          if (ring === 1) return BrickType.EXPLOSIVE;
          return BrickType.TOUGH;
        }
        if (dist < 3.8) return BrickType.NORMAL;
        return -1;
      }),
    },
    // Level 26: Fracture
    {
      name: 'Fracture', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Diagonal crack pattern
        if (Math.abs(r - c) <= 0) return BrickType.GOLDEN;
        if (Math.abs(r - c) === 1) return BrickType.EXPLOSIVE;
        if (Math.abs(r - (7 - c)) <= 0) return BrickType.GOLDEN;
        if (Math.abs(r - (7 - c)) === 1) return BrickType.EXPLOSIVE;
        if (r === 0 || r === 7) return BrickType.INDESTRUCTIBLE;
        if (r <= 2) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 27: Honeycomb
    {
      name: 'Honeycomb', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        const off = r % 2 === 0 ? 0 : 1;
        if ((c + off) % 3 === 0) return -1;
        if (r === 3 && c >= 3 && c <= 4) return BrickType.GOLDEN;
        if ((r + c) % 5 === 0) return BrickType.EXPLOSIVE;
        if (r <= 1 || r >= 5) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 28: Pillars
    {
      name: 'Pillars', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        if (c === 1 || c === 3 || c === 5) {
          if (r === 0) return BrickType.INDESTRUCTIBLE;
          if (r === 7) return BrickType.GOLDEN;
          return BrickType.ARMORED;
        }
        if (r >= 2 && r <= 5) return BrickType.NORMAL;
        if (r === 0 || r === 7) return BrickType.TOUGH;
        return -1;
      }),
    },
    // Level 29: Chessboard
    {
      name: 'Chessboard', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const isBlack = (r + c) % 2 === 0;
        if (!isBlack) return -1;
        if (r === 0 || r === 7) return BrickType.ARMORED;
        if (r === 3 || r === 4) return c >= 3 && c <= 4 ? BrickType.GOLDEN : BrickType.EXPLOSIVE;
        return BrickType.TOUGH;
      }),
    },
    // Level 30: Pyramid
    {
      name: 'Pyramid', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const indent = Math.floor(r / 2);
        if (c < indent || c >= 8 - indent) return -1;
        if (r === 0) return BrickType.GOLDEN;
        if (r === 7) return BrickType.INDESTRUCTIBLE;
        if (r % 2 === 0) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 31: Scatter
    {
      name: 'Scatter', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Pseudo-random scatter with clusters
        const s = ((r * 13 + c * 7 + 5) % 11);
        if (s < 2) return -1;
        if (s === 2) return BrickType.GOLDEN;
        if (s === 3) return BrickType.EXPLOSIVE;
        if (s <= 5) return BrickType.ARMORED;
        if (s <= 7) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 32: Barricade
    {
      name: 'Barricade', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        if (r === 1 || r === 3 || r === 5) return BrickType.INDESTRUCTIBLE;
        if (r === 0) return BrickType.GOLDEN;
        if (r === 2 && (c === 0 || c === 1)) return -1;
        if (r === 4 && (c === 6 || c === 7)) return -1;
        if (r === 6 && (c === 0 || c === 1)) return -1;
        if (r === 7) return BrickType.EXPLOSIVE;
        return BrickType.TOUGH;
      }),
    },
    // Level 33: DNA
    {
      name: 'DNA', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Double helix pattern
        const wave1 = 3.5 + Math.sin(r * 0.9) * 2.5;
        const wave2 = 3.5 - Math.sin(r * 0.9) * 2.5;
        const onStrand1 = Math.abs(c - wave1) < 0.8;
        const onStrand2 = Math.abs(c - wave2) < 0.8;
        if (onStrand1 && onStrand2) return BrickType.GOLDEN;
        if (onStrand1) return BrickType.ARMORED;
        if (onStrand2) return BrickType.ARMORED;
        // Connecting rungs every 2 rows
        if (r % 2 === 0) {
          const minC = Math.min(Math.round(wave1), Math.round(wave2));
          const maxC = Math.max(Math.round(wave1), Math.round(wave2));
          if (c >= minC && c <= maxC) return BrickType.NORMAL;
        }
        return -1;
      }),
    },
    // Level 34: Fortress II
    {
      name: 'Fortress II', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Concentric fortress walls
        if (r === 0 || r === 7 || c === 0 || c === 7) return BrickType.INDESTRUCTIBLE;
        if (r === 1 || r === 6 || c === 1 || c === 6) return BrickType.ARMORED;
        if (r === 2 || r === 5 || c === 2 || c === 5) return BrickType.TOUGH;
        if (r === 3 && c === 3) return BrickType.GOLDEN;
        if (r === 3 && c === 4) return BrickType.GOLDEN;
        if (r === 4 && c === 3) return BrickType.GOLDEN;
        if (r === 4 && c === 4) return BrickType.EXPLOSIVE;
        return -1;
      }),
    },
    // Level 35: Countdown
    {
      name: 'Countdown', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Dense final challenge
        if (r === 0) return c % 2 === 0 ? BrickType.INDESTRUCTIBLE : BrickType.GOLDEN;
        if (r === 7) return c % 2 === 0 ? BrickType.GOLDEN : BrickType.INDESTRUCTIBLE;
        if ((r + c) % 4 === 0) return BrickType.EXPLOSIVE;
        if (r <= 2) return BrickType.ARMORED;
        if (r >= 5) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 36: Singularity
    {
      name: 'Singularity', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Ultimate final level: everything at max difficulty
        const cx = 3.5, cy = 3.5;
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 1) return BrickType.GOLDEN;
        if (dist < 2 && (r + c) % 2 === 0) return BrickType.EXPLOSIVE;
        if (dist < 2) return BrickType.ARMORED;
        if (dist < 3) return BrickType.TOUGH;
        if ((r === 0 || r === 7) && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        return BrickType.ARMORED;
      }),
    },
    // ─── Zone 4: Levels 37–48 ───
    // Level 37: Supernova
    {
      name: 'Supernova', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const cx = 3.5, cy = 3.5;
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 0.8) return BrickType.GOLDEN;
        if (dist < 1.8) return BrickType.EXPLOSIVE;
        if (dist < 2.8 && (r + c) % 2 === 0) return BrickType.ARMORED;
        if (dist < 2.8) return BrickType.TOUGH;
        if (dist < 3.8) return BrickType.NORMAL;
        return BrickType.INDESTRUCTIBLE;
      }),
    },
    // Level 38: Circuit Board
    {
      name: 'Circuit Board', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Traces + nodes
        if (r === 0 || r === 7) return c % 3 === 0 ? BrickType.GOLDEN : BrickType.INDESTRUCTIBLE;
        if (c === 0 || c === 7) return r % 3 === 0 ? BrickType.EXPLOSIVE : BrickType.ARMORED;
        if (r === 2 && c <= 5) return BrickType.TOUGH;
        if (r === 5 && c >= 2) return BrickType.TOUGH;
        if (c === 3 && r >= 2 && r <= 5) return BrickType.ARMORED;
        if (r === 4 && c === 5) return BrickType.GOLDEN;
        if ((r + c) % 4 === 0) return BrickType.NORMAL;
        return -1;
      }),
    },
    // Level 39: Wormhole
    {
      name: 'Wormhole', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const cx = 3.5, cy = 3.5;
        const angle = Math.atan2(r - cy, c - cx);
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        const spiral = (angle + Math.PI) / (2 * Math.PI) * 4;
        if (dist < 1) return BrickType.GOLDEN;
        if (Math.abs((dist - spiral) % 2) < 0.8) return BrickType.ARMORED;
        if (dist > 3.5) return BrickType.INDESTRUCTIBLE;
        return BrickType.TOUGH;
      }),
    },
    // Level 40: Labyrinth
    {
      name: 'Labyrinth', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Nested rectangles with gaps
        if (r === 0 || r === 7) return c === 4 ? -1 : BrickType.INDESTRUCTIBLE;
        if (c === 0 || c === 7) return r === 3 ? -1 : BrickType.INDESTRUCTIBLE;
        if ((r === 2 || r === 5) && c >= 2 && c <= 5) return c === 2 ? -1 : BrickType.ARMORED;
        if ((c === 2 || c === 5) && r >= 2 && r <= 5) return r === 5 ? -1 : BrickType.ARMORED;
        if (r === 3 && c === 4) return BrickType.GOLDEN;
        if (r === 4 && c === 3) return BrickType.GOLDEN;
        if ((r + c) % 3 === 0) return BrickType.EXPLOSIVE;
        return BrickType.NORMAL;
      }),
    },
    // Level 41: Shockwave
    {
      name: 'Shockwave', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Concentric diamond ripples
        const cx = 3.5, cy = 3.5;
        const md = Math.abs(c - cx) + Math.abs(r - cy);
        if (md < 1) return BrickType.GOLDEN;
        if (md >= 1.5 && md < 2.5) return BrickType.EXPLOSIVE;
        if (md >= 3 && md < 4) return BrickType.ARMORED;
        if (md >= 4.5 && md < 5.5) return BrickType.TOUGH;
        return -1;
      }),
    },
    // Level 42: Quantum Grid
    {
      name: 'Quantum Grid', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Alternating dense/sparse stripes with all types
        const stripe = (r + c * 2) % 5;
        if (stripe === 0) return BrickType.INDESTRUCTIBLE;
        if (stripe === 1) return BrickType.GOLDEN;
        if (stripe === 2) return BrickType.EXPLOSIVE;
        if (stripe === 3) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 43: Reactor Core
    {
      name: 'Reactor Core', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Center core surrounded by explosive ring and armor shell
        const cx = 3.5, cy = 3.5;
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 0.9) return BrickType.GOLDEN;
        if (dist < 1.5) return BrickType.EXPLOSIVE;
        if (dist < 2.3 && (r + c) % 2 === 0) return BrickType.ARMORED;
        if (dist < 2.3) return BrickType.INDESTRUCTIBLE;
        if (dist < 3.2) return BrickType.TOUGH;
        if ((r === 0 || r === 7) || (c === 0 || c === 7)) return BrickType.ARMORED;
        return BrickType.NORMAL;
      }),
    },
    // Level 44: Domino
    {
      name: 'Domino', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Tilted columns of explosive chains
        const col = (c + Math.floor(r / 2)) % 4;
        if (col === 0) return BrickType.EXPLOSIVE;
        if (col === 1) return BrickType.ARMORED;
        if (col === 2 && (r === 0 || r === 7)) return BrickType.GOLDEN;
        if (col === 2) return BrickType.TOUGH;
        return BrickType.NORMAL;
      }),
    },
    // Level 45: Nebula Drift
    {
      name: 'Nebula Drift', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Sinusoidal wave pattern
        const wave = 3.5 + Math.sin(r * 1.2 + c * 0.4) * 2;
        if (Math.abs(c - wave) < 0.7) return BrickType.GOLDEN;
        if (Math.abs(c - wave) < 1.5) return BrickType.EXPLOSIVE;
        if (r === 0 || r === 7) return BrickType.INDESTRUCTIBLE;
        if ((r + c) % 3 === 0) return BrickType.ARMORED;
        return BrickType.TOUGH;
      }),
    },
    // Level 46: Iron Curtain
    {
      name: 'Iron Curtain', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Alternating indestructible rows with narrow gaps
        if (r % 2 === 0) {
          if (c === (r + 2) % 8) return -1; // gap
          return BrickType.INDESTRUCTIBLE;
        }
        if (c === 0 || c === 7) return BrickType.GOLDEN;
        if ((r + c) % 3 === 0) return BrickType.EXPLOSIVE;
        return BrickType.ARMORED;
      }),
    },
    // Level 47: Endurance Gauntlet
    {
      name: 'Endurance Gauntlet', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Every tile filled, maximum density
        if ((r === 0 || r === 7) && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r === 0 || r === 7) return BrickType.ARMORED;
        if (r === 1 || r === 6) return c % 2 === 0 ? BrickType.EXPLOSIVE : BrickType.ARMORED;
        if (r === 3 && c === 3) return BrickType.GOLDEN;
        if (r === 3 && c === 4) return BrickType.GOLDEN;
        if (r === 4 && c === 3) return BrickType.GOLDEN;
        if (r === 4 && c === 4) return BrickType.GOLDEN;
        if ((r + c) % 4 === 0) return BrickType.EXPLOSIVE;
        return BrickType.TOUGH;
      }),
    },
    // Level 48: Event Horizon
    {
      name: 'Event Horizon', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        // Absolute final level — dense layered nightmare
        const cx = 3.5, cy = 3.5;
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 0.8) return BrickType.GOLDEN;
        if (dist < 1.5 && (r + c) % 2 === 0) return BrickType.EXPLOSIVE;
        if (dist < 1.5) return BrickType.ARMORED;
        if (dist < 2.5) return BrickType.TOUGH;
        if (dist < 3) return BrickType.ARMORED;
        if ((r === 0 || r === 7) || (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        return BrickType.ARMORED;
      }),
    },
  ];
}

// Boss levels occur at levels 12, 24, 36
export function getBossLevels(): Record<number, BossData> {
  return {
    12: {
      name: 'Endgame Boss', rows: 6, cols: 8,
      grid: createGrid(6, 8, (r, c) => {
        if (r === 0) return BrickType.INDESTRUCTIBLE;
        if (r === 1 && (c === 3 || c === 4)) return BrickType.GOLDEN;
        if (r === 1) return BrickType.ARMORED;
        if (r === 2 && (c === 2 || c === 5)) return BrickType.EXPLOSIVE;
        if (r === 2) return BrickType.TOUGH;
        if (r >= 3) return BrickType.NORMAL;
        return BrickType.NORMAL;
      }),
      movePattern: 'horizontal', moveSpeed: 0.3, moveRange: 0.15,
    },
    24: {
      name: 'Omega Boss', rows: 7, cols: 8,
      grid: createGrid(7, 8, (r, c) => {
        if (r === 0 && (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        if (r === 0) return BrickType.ARMORED;
        if (r === 1) return BrickType.TOUGH;
        if (r === 2 && (c === 2 || c === 5)) return BrickType.EXPLOSIVE;
        if (r === 3 && (c === 3 || c === 4)) return BrickType.GOLDEN;
        if (r >= 4) return BrickType.NORMAL;
        return BrickType.TOUGH;
      }),
      movePattern: 'vertical', moveSpeed: 0.25, moveRange: 0.12,
    },
    36: {
      name: 'Singularity Boss', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const cx = 3.5, cy = 3.5;
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 1.2) return BrickType.GOLDEN;
        if ((r + c) % 3 === 0) return BrickType.EXPLOSIVE;
        if (r === 0 || r === 7) return BrickType.INDESTRUCTIBLE;
        return BrickType.ARMORED;
      }),
      movePattern: 'circular', moveSpeed: 0.2, moveRange: 0.08,
    },
    48: {
      name: 'Event Horizon Boss', rows: 8, cols: 8,
      grid: createGrid(8, 8, (r, c) => {
        const cx = 3.5, cy = 3.5;
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        if (dist < 1) return BrickType.GOLDEN;
        if (dist < 1.8 && (r + c) % 2 === 0) return BrickType.EXPLOSIVE;
        if (dist < 1.8) return BrickType.ARMORED;
        if (dist < 2.8) return BrickType.TOUGH;
        if ((r === 0 || r === 7) || (c === 0 || c === 7)) return BrickType.INDESTRUCTIBLE;
        return BrickType.ARMORED;
      }),
      movePattern: 'figure8' as any, moveSpeed: 0.18, moveRange: 0.1,
    },
  };
}

// ─── Challenge Modifiers ───
export enum ChallengeModifier {
  SHRINKING_PADDLE = 'shrinking_paddle',
  SPEED_SURGE = 'speed_surge',
  NO_POWERUPS = 'no_powerups',
}

export const MODIFIER_INFO: Record<ChallengeModifier, { name: string; desc: string; xpMult: number }> = {
  [ChallengeModifier.SHRINKING_PADDLE]: { name: 'Shrinking Paddle', desc: 'Paddle shrinks 5% each brick', xpMult: 1.3 },
  [ChallengeModifier.SPEED_SURGE]: { name: 'Speed Surge', desc: 'Ball speeds up every 10s', xpMult: 1.3 },
  [ChallengeModifier.NO_POWERUPS]: { name: 'No Power-Ups', desc: 'Power-ups are disabled', xpMult: 1.4 },
};

// ─── Boss Level Data ───
export interface BossData {
  name: string;
  rows: number;
  cols: number;
  grid: BrickType[][];
  movePattern: 'horizontal' | 'vertical' | 'circular' | 'figure8';
  moveSpeed: number; // units per second
  moveRange: number; // amplitude
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
  mode: 'classic' | 'endless' | 'timeattack' | 'zen' | 'daily' | 'survival' | 'practice' | 'bossrush' = 'classic';
  bossRushIdx = 0;
  bossRushBossesDefeatedThisRun = 0;
  activeModifiers: Set<ChallengeModifier> = new Set();
  bossesDefeated: Set<number> = new Set();
  consecutivePerfectLevels = 0;
  tripleModifierLevels = 0;
  lastPowerUpTime = 0;
  powerUpTimestamps: number[] = [];
  levelStartTimes: number[] = [];
  survivalWave = 0;
  survivalBricksInWave = 0;
  survivalSpawnTimer = 0;
  megaBallHits = 0;
  megaBallSessionHits = 0;
  modesPlayed: Set<string> = new Set();
  practiceLevel = 1;
  dashCount = 0;
  slamCount = 0;
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
      const b = localStorage.getItem('neon-breaker-bosses');
      if (b) this.bossesDefeated = new Set(JSON.parse(b));
      const mp = localStorage.getItem('neon-breaker-modes-played');
      if (mp) this.modesPlayed = new Set(JSON.parse(mp));
    } catch { /* ignore */ }
  }

  savePersistence() {
    try {
      localStorage.setItem('neon-breaker-achievements', JSON.stringify(this.achievements));
      localStorage.setItem('neon-breaker-leaderboard', JSON.stringify(this.leaderboard));
      localStorage.setItem('neon-breaker-theme', String(this.selectedTheme));
      localStorage.setItem('neon-breaker-bosses', JSON.stringify([...this.bossesDefeated]));
      localStorage.setItem('neon-breaker-modes-played', JSON.stringify([...this.modesPlayed]));
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
    this.lives = this.mode === 'zen' ? 99 : this.mode === 'survival' ? 1 : 3;
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
    this.consecutivePerfectLevels = 0;
    this.tripleModifierLevels = 0;
    this.lastPowerUpTime = 0;
    this.powerUpTimestamps = [];
    this.levelStartTimes = [];
    this.survivalWave = 0;
    this.survivalBricksInWave = 0;
    this.survivalSpawnTimer = 0;
    this.megaBallHits = 0;
    this.megaBallSessionHits = 0;
    this.bossRushIdx = 0;
    this.bossRushBossesDefeatedThisRun = 0;
    // Modifiers persist across reset (set before startLevel)
  }

  getModifierXPMultiplier(): number {
    let mult = 1.0;
    for (const mod of this.activeModifiers) {
      mult *= MODIFIER_INFO[mod].xpMult;
    }
    return mult;
  }

  getDifficultyMultiplier(): number {
    return this.difficulty === 'easy' ? 0.75 : this.difficulty === 'hard' ? 1.3 : 1.0;
  }
}
