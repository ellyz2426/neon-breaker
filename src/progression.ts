// progression.ts — Neon Breaker VR: XP, Levels, Unlocks

export interface PlayerProfile {
  xp: number;
  level: number;
  totalGames: number;
  totalBricks: number;
  totalScore: number;
  totalPlayTime: number; // seconds
  bestCombo: number;
  bestScore: number;
  bestLevel: number;
  powerupsCollected: number;
  ballsLost: number;
  perfectLevels: number;
  explosiveChains: number;
  goldenBricks: number;
  laserHits: number;
  fireballHits: number;
  shieldSaves: number;
  gamesWon: number;
  dailyChallengesCompleted: number;
  unlockedBallSkins: string[];
  unlockedPaddleSkins: string[];
  selectedBallSkin: string;
  selectedPaddleSkin: string;
  dailyChallengeDate: string;
  dailyChallengeScore: number;
  bestScoreByMode: Record<string, number>;
  totalModifierLevels: number;
  campaignCompleted: boolean;
}

// XP required for each level (cumulative thresholds)
const XP_TABLE: number[] = [];
for (let i = 0; i < 50; i++) {
  // Level 1 = 0 XP, Level 2 = 200 XP, exponential growth
  XP_TABLE.push(i === 0 ? 0 : Math.floor(200 * Math.pow(1.15, i - 1)));
}

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < Math.min(level, 50); i++) {
    total += XP_TABLE[i];
  }
  return total;
}

export function getXPToNextLevel(level: number): number {
  if (level >= 50) return 0;
  return XP_TABLE[level];
}

export function getLevelFromXP(xp: number): number {
  let total = 0;
  for (let i = 1; i < 50; i++) {
    total += XP_TABLE[i];
    if (xp < total) return i;
  }
  return 50;
}

export function getXPProgressInLevel(xp: number): { current: number; needed: number; pct: number } {
  const level = getLevelFromXP(xp);
  if (level >= 50) return { current: 0, needed: 0, pct: 1 };
  const prevTotal = getXPForLevel(level);
  const needed = getXPToNextLevel(level);
  const current = xp - prevTotal;
  return { current, needed, pct: needed > 0 ? current / needed : 1 };
}

// XP rewards
export function calculateGameXP(score: number, bricksDestroyed: number, levelsCleared: number, maxCombo: number, mode: string): number {
  let xp = 0;
  xp += Math.floor(score / 100);    // 1 XP per 100 points
  xp += bricksDestroyed * 2;        // 2 XP per brick
  xp += levelsCleared * 25;         // 25 XP per level cleared
  xp += maxCombo * 5;               // 5 XP per best combo
  // Mode bonuses
  if (mode === 'classic') xp = Math.floor(xp * 1.0);
  if (mode === 'endless') xp = Math.floor(xp * 1.2);
  if (mode === 'timeattack') xp = Math.floor(xp * 1.5);
  if (mode === 'zen') xp = Math.floor(xp * 0.5);
  if (mode === 'daily') xp = Math.floor(xp * 2.0);
  if (mode === 'survival') xp = Math.floor(xp * 1.8);
  if (mode === 'practice') xp = 0; // no XP in practice
  return xp;
}

// Unlock thresholds
export interface UnlockInfo {
  type: 'ball_skin' | 'paddle_skin' | 'title';
  id: string;
  name: string;
  requiredLevel: number;
}

export const UNLOCKS: UnlockInfo[] = [
  { type: 'ball_skin', id: 'neon_pulse', name: 'Neon Pulse', requiredLevel: 3 },
  { type: 'paddle_skin', id: 'hologram', name: 'Hologram', requiredLevel: 5 },
  { type: 'ball_skin', id: 'plasma_orb', name: 'Plasma Orb', requiredLevel: 8 },
  { type: 'paddle_skin', id: 'crystal', name: 'Crystal', requiredLevel: 10 },
  { type: 'ball_skin', id: 'void_sphere', name: 'Void Sphere', requiredLevel: 15 },
  { type: 'paddle_skin', id: 'ember', name: 'Ember', requiredLevel: 18 },
  { type: 'ball_skin', id: 'starfire', name: 'Starfire', requiredLevel: 22 },
  { type: 'paddle_skin', id: 'aurora', name: 'Aurora', requiredLevel: 25 },
  { type: 'ball_skin', id: 'nebula', name: 'Nebula', requiredLevel: 30 },
  { type: 'paddle_skin', id: 'quantum', name: 'Quantum', requiredLevel: 35 },
  { type: 'ball_skin', id: 'supernova', name: 'Supernova', requiredLevel: 40 },
  { type: 'paddle_skin', id: 'singularity', name: 'Singularity', requiredLevel: 45 },
  { type: 'ball_skin', id: 'cosmic', name: 'Cosmic', requiredLevel: 50 },
];

export function getUnlocksForLevel(level: number): UnlockInfo[] {
  return UNLOCKS.filter(u => u.requiredLevel === level);
}

export function getAvailableUnlocks(level: number): UnlockInfo[] {
  return UNLOCKS.filter(u => u.requiredLevel <= level);
}

// Ball skins
export interface BallSkin {
  id: string;
  name: string;
  color: string;
  emissive: string;
  trailColor: string;
  glowColor: string;
  intensity: number;
}

export const BALL_SKINS: BallSkin[] = [
  { id: 'default', name: 'Default', color: '#ffffff', emissive: '#ffffff', trailColor: '#00ffff', glowColor: '#00ffff', intensity: 0.8 },
  { id: 'neon_pulse', name: 'Neon Pulse', color: '#00ffff', emissive: '#00ffff', trailColor: '#00ddff', glowColor: '#00ffff', intensity: 1.0 },
  { id: 'plasma_orb', name: 'Plasma Orb', color: '#ff00ff', emissive: '#ff00ff', trailColor: '#ff44ff', glowColor: '#ff00ff', intensity: 1.1 },
  { id: 'void_sphere', name: 'Void Sphere', color: '#4400ff', emissive: '#6600ff', trailColor: '#4400ff', glowColor: '#6600ff', intensity: 0.9 },
  { id: 'starfire', name: 'Starfire', color: '#ffaa00', emissive: '#ff8800', trailColor: '#ffcc00', glowColor: '#ff8800', intensity: 1.2 },
  { id: 'nebula', name: 'Nebula', color: '#ff44aa', emissive: '#ff2288', trailColor: '#ff66cc', glowColor: '#ff44aa', intensity: 1.0 },
  { id: 'supernova', name: 'Supernova', color: '#ffff00', emissive: '#ffee00', trailColor: '#ffff88', glowColor: '#ffff44', intensity: 1.3 },
  { id: 'cosmic', name: 'Cosmic', color: '#88ffff', emissive: '#44ffff', trailColor: '#aaffff', glowColor: '#88ffff', intensity: 1.4 },
];

// Paddle skins
export interface PaddleSkin {
  id: string;
  name: string;
  color: string;
  emissive: string;
  edgeColor: string;
  glowColor: string;
  intensity: number;
}

export const PADDLE_SKINS: PaddleSkin[] = [
  { id: 'default', name: 'Default', color: '#00ffff', emissive: '#00ffff', edgeColor: '#00ffff', glowColor: '#00ffff', intensity: 0.6 },
  { id: 'hologram', name: 'Hologram', color: '#44ffaa', emissive: '#44ffaa', edgeColor: '#00ff88', glowColor: '#44ffaa', intensity: 0.8 },
  { id: 'crystal', name: 'Crystal', color: '#aaccff', emissive: '#8888ff', edgeColor: '#aaccff', glowColor: '#8888ff', intensity: 0.7 },
  { id: 'ember', name: 'Ember', color: '#ff4400', emissive: '#ff6600', edgeColor: '#ff8800', glowColor: '#ff4400', intensity: 0.9 },
  { id: 'aurora', name: 'Aurora', color: '#00ff88', emissive: '#44ff88', edgeColor: '#00ffaa', glowColor: '#44ff88', intensity: 0.8 },
  { id: 'quantum', name: 'Quantum', color: '#aa44ff', emissive: '#cc66ff', edgeColor: '#bb55ff', glowColor: '#aa44ff', intensity: 1.0 },
  { id: 'singularity', name: 'Singularity', color: '#ff00aa', emissive: '#ff22bb', edgeColor: '#ff44cc', glowColor: '#ff00aa', intensity: 1.1 },
];

// Daily challenge seed
export function getDailyChallengeSeed(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const chr = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return () => {
    hash = (hash * 16807 + 0) % 2147483647;
    return (hash & 0x7FFFFFFF) / 0x7FFFFFFF;
  };
}

// Profile persistence
const PROFILE_KEY = 'neon-breaker-profile';

export function loadProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      const p = JSON.parse(data);
      return {
        xp: p.xp ?? 0,
        level: p.level ?? 1,
        totalGames: p.totalGames ?? 0,
        totalBricks: p.totalBricks ?? 0,
        totalScore: p.totalScore ?? 0,
        totalPlayTime: p.totalPlayTime ?? 0,
        bestCombo: p.bestCombo ?? 0,
        bestScore: p.bestScore ?? 0,
        bestLevel: p.bestLevel ?? 0,
        powerupsCollected: p.powerupsCollected ?? 0,
        ballsLost: p.ballsLost ?? 0,
        perfectLevels: p.perfectLevels ?? 0,
        explosiveChains: p.explosiveChains ?? 0,
        goldenBricks: p.goldenBricks ?? 0,
        laserHits: p.laserHits ?? 0,
        fireballHits: p.fireballHits ?? 0,
        shieldSaves: p.shieldSaves ?? 0,
        gamesWon: p.gamesWon ?? 0,
        dailyChallengesCompleted: p.dailyChallengesCompleted ?? 0,
        unlockedBallSkins: p.unlockedBallSkins ?? ['default'],
        unlockedPaddleSkins: p.unlockedPaddleSkins ?? ['default'],
        selectedBallSkin: p.selectedBallSkin ?? 'default',
        selectedPaddleSkin: p.selectedPaddleSkin ?? 'default',
        dailyChallengeDate: p.dailyChallengeDate ?? '',
        dailyChallengeScore: p.dailyChallengeScore ?? 0,
        bestScoreByMode: p.bestScoreByMode ?? {},
        totalModifierLevels: p.totalModifierLevels ?? 0,
        campaignCompleted: p.campaignCompleted ?? false,
      };
    }
  } catch { /* ignore */ }
  return {
    xp: 0, level: 1, totalGames: 0, totalBricks: 0, totalScore: 0,
    totalPlayTime: 0, bestCombo: 0, bestScore: 0, bestLevel: 0,
    powerupsCollected: 0, ballsLost: 0, perfectLevels: 0, explosiveChains: 0,
    goldenBricks: 0, laserHits: 0, fireballHits: 0, shieldSaves: 0,
    gamesWon: 0, dailyChallengesCompleted: 0,
    unlockedBallSkins: ['default'], unlockedPaddleSkins: ['default'],
    selectedBallSkin: 'default', selectedPaddleSkin: 'default',
    dailyChallengeDate: '', dailyChallengeScore: 0,
    bestScoreByMode: {}, totalModifierLevels: 0, campaignCompleted: false,
  };
}

export function saveProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}
