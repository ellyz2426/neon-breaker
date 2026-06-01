// index.ts — Neon Breaker VR: Main game entry point
import {
  World, PanelUI, Follower, FollowBehavior, ScreenSpace, PanelDocument,
  Mesh, Group, BoxGeometry, SphereGeometry, CylinderGeometry, PlaneGeometry,
  ConeGeometry, TorusGeometry, MeshStandardMaterial, MeshBasicMaterial,
  LineBasicMaterial, Color, Vector3, Quaternion, Fog, AmbientLight, PointLight,
  EdgesGeometry, LineSegments, AdditiveBlending, Float32BufferAttribute,
  BufferGeometry,
} from '@iwsdk/core';
import type { UIKitDocument } from '@iwsdk/core';
import {
  GameState, GameStateManager, BrickType, BRICK_HP, BRICK_POINTS, PowerUpType,
  THEMES, ACHIEVEMENTS, getLevels, LevelData, getBossLevels, BossData,
  ChallengeModifier, MODIFIER_INFO,
  FIELD_WIDTH, FIELD_HEIGHT, FIELD_Y_OFFSET, FIELD_Z,
  PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, PADDLE_Y, PADDLE_Z,
  BALL_RADIUS, BALL_SPEED, BRICK_W, BRICK_H, BRICK_D,
} from './types.js';
import { AudioManager } from './audio.js';
import {
  PlayerProfile, loadProfile, saveProfile,
  calculateGameXP, getLevelFromXP, getXPProgressInLevel,
  getAvailableUnlocks, getDailyChallengeSeed, seededRandom,
  BALL_SKINS, BallSkin, PADDLE_SKINS, PaddleSkin, UNLOCKS,
} from './progression.js';

// ─── Globals ───
let world: World;
const gsm = new GameStateManager();
const audio = new AudioManager();
const activeBalls: BallObj[] = [];
const activeBricks: BrickObj[] = [];
const activePowerUps: PowerUpObj[] = [];
const particles: ParticleObj[] = [];
const laserBeams: LaserObj[] = [];
let profile: PlayerProfile = loadProfile();

let paddleMesh: Mesh;
let paddleGlow: Mesh;
let paddleEdges: LineSegments;
let shieldMesh: Mesh | null = null;
let hasShield = false;
let hasMagnet = false;
let magnetBall: BallObj | null = null;
let hasLaser = false;
let laserTimer = 0;
let hasFireball = false;
let fireballTimer = 0;
let hasMegaBall = false;
let megaBallTimer = 0;
let megaBallKillsThisActivation = 0;
let wideTimer = 0;
let slowTimer = 0;
let paddleWidthMult = 1;
let countdownVal = 0;
let countdownTimer = 0;
let levelCompleteTimer = 0;
let gameStartTime = 0;
let levelBallsLost = 0;
let levelPowerupsUsed = 0;
let levelExplosiveChains = 0;

// Active power-up timers for HUD display
interface ActivePowerUpTimer {
  type: PowerUpType;
  remaining: number;
  total: number;
}
const activePowerUpTimers: ActivePowerUpTimer[] = [];

// Combo visual escalation state
let comboGlowIntensity = 0;

// Brick entry animation state
let brickEntryAnimating = false;
let brickEntryTimer = 0;
const BRICK_ENTRY_DURATION = 0.6; // seconds

// Paddle dash/slam abilities
let dashCooldown = 0;
let dashVelocity = 0;
let dashTrailTimer = 0;
let slamCooldown = 0;
let slamActive = false;
let slamImpactTimer = 0;

// Boss & screen shake
let currentBoss: BossData | null = null;
let bossTime = 0;
let brickGroup: Group | null = null;
let screenShakeAmount = 0;
let screenShakeDecay = 0;
let speedSurgeTimer = 0;
let shrinkPaddleCount = 0;

// UI entities
const uiEntities: Record<string, any> = {};
const uiDocs: Record<string, UIKitDocument | null> = {};

// ─── Types ───
interface BallObj {
  mesh: Mesh;
  glow: Mesh;
  trail: Mesh[];
  vx: number;
  vy: number;
  active: boolean;
}

interface BrickObj {
  mesh: Mesh;
  edges: LineSegments;
  glow: Mesh;
  type: BrickType;
  hp: number;
  row: number;
  col: number;
  x: number;
  y: number;
  active: boolean;
}

interface PowerUpObj {
  mesh: Mesh;
  glow: Mesh;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

interface ParticleObj {
  mesh: Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface LaserObj {
  mesh: Mesh;
  y: number;
  active: boolean;
}

// ─── Skin Helpers ───
function getCurrentBallSkin(): BallSkin {
  return BALL_SKINS.find(s => s.id === profile.selectedBallSkin) || BALL_SKINS[0];
}

function getCurrentPaddleSkin(): PaddleSkin {
  return PADDLE_SKINS.find(s => s.id === profile.selectedPaddleSkin) || PADDLE_SKINS[0];
}

// ─── Power-Up Timer Tracking ───
function trackPowerUpTimer(type: PowerUpType, duration: number) {
  const existing = activePowerUpTimers.find(t => t.type === type);
  if (existing) {
    existing.remaining = duration;
    existing.total = duration;
  } else {
    activePowerUpTimers.push({ type, remaining: duration, total: duration });
  }
  updatePowerUpHUD();
}

function updatePowerUpTimers(dt: number) {
  for (let i = activePowerUpTimers.length - 1; i >= 0; i--) {
    activePowerUpTimers[i].remaining -= dt;
    if (activePowerUpTimers[i].remaining <= 0) {
      activePowerUpTimers.splice(i, 1);
    }
  }
  if (activePowerUpTimers.length > 0) {
    showUI('powerups');
    updatePowerUpHUD();
  } else {
    hideUI('powerups');
  }
}

function updatePowerUpHUD() {
  const doc = getDoc('powerups');
  if (!doc) return;
  for (let i = 0; i < 4; i++) {
    if (i < activePowerUpTimers.length) {
      const t = activePowerUpTimers[i];
      const name = getPowerUpName(t.type);
      const secs = Math.ceil(t.remaining);
      setText(doc, `pu-${i}`, `${name} ${secs}s`);
    } else {
      setText(doc, `pu-${i}`, '');
    }
  }
}

// ─── Combo Visual Escalation ───
function updateComboVisuals(combo: number) {
  // Escalate glow intensity based on combo
  comboGlowIntensity = Math.min(combo * 0.05, 1.5);

  // At high combos, intensify the paddle glow
  if (paddleGlow) {
    const mat = paddleGlow.material as MeshBasicMaterial;
    mat.opacity = 0.2 + comboGlowIntensity * 0.3;
  }

  // Spawn bonus particles at combo thresholds
  if (combo === 10 || combo === 25 || combo === 50 || combo === 100) {
    const theme = THEMES[gsm.selectedTheme];
    for (let i = 0; i < combo / 5; i++) {
      spawnParticles(
        paddleMesh.position.x + (Math.random() - 0.5) * 0.5,
        PADDLE_Y + 0.2,
        theme.accent, 5
      );
    }
    triggerScreenShake(0.005 + combo * 0.0002);
  }
}

// ─── Screen Shake ───
function triggerScreenShake(intensity: number) {
  screenShakeAmount = Math.min(screenShakeAmount + intensity, 0.03);
  screenShakeDecay = 0.15;
}

function applyScreenShake(dt: number) {
  if (screenShakeAmount > 0) {
    screenShakeDecay -= dt;
    if (screenShakeDecay <= 0) {
      screenShakeAmount *= 0.85;
      if (screenShakeAmount < 0.0005) screenShakeAmount = 0;
    }
    const camera = (world as any).camera;
    if (camera) {
      camera.position.x += (Math.random() - 0.5) * screenShakeAmount;
      camera.position.y += (Math.random() - 0.5) * screenShakeAmount;
    }
  }
}

// ─── Zone Helper ───
function getZoneName(level: number): string {
  if (level <= 12) return 'Zone 1';
  if (level <= 24) return 'Zone 2';
  if (level <= 36) return 'Zone 3';
  return 'Zone 4';
}

// ─── Init ───
async function main() {
  const container = document.getElementById('app') as HTMLDivElement;
  world = await World.create(container, {
    xr: { offer: 'once' as const },
    features: {
      grabbing: false,
      locomotion: false,
      physics: false,
      spatialUI: true,
    },
  } as any);

  setupEnvironment();
  setupPaddle();
  setupUI();
  setupInputListeners();
  audio.startMusic();

  // Game loop
  let lastTime = performance.now();
  function update() {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    gameUpdate(dt);
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ─── Environment ───
function setupEnvironment() {
  const theme = THEMES[gsm.selectedTheme];

  world.scene.fog = new Fog(new Color(theme.fog), 4, 12);
  world.scene.add(new AmbientLight(new Color('#222233'), 0.4));

  // Floor grid
  const floorGeo = new PlaneGeometry(20, 20);
  const floorMat = new MeshBasicMaterial({ color: new Color(theme.floor), transparent: true, opacity: 0.3 });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  world.scene.add(floor);

  // Grid lines
  const gridGeo = new BufferGeometry();
  const gridPts: number[] = [];
  for (let i = -10; i <= 10; i++) {
    gridPts.push(i, -0.09, -10, i, -0.09, 10);
    gridPts.push(-10, -0.09, i, 10, -0.09, i);
  }
  gridGeo.setAttribute('position', new Float32BufferAttribute(gridPts, 3));
  const gridMat = new LineBasicMaterial({ color: new Color(theme.accent), transparent: true, opacity: 0.12 });
  world.scene.add(new LineSegments(gridGeo, gridMat));

  // Ceiling grid
  const ceilGeo = new BufferGeometry();
  const ceilPts: number[] = [];
  for (let i = -10; i <= 10; i += 2) {
    ceilPts.push(i, 4, -10, i, 4, 10);
    ceilPts.push(-10, 4, i, 10, 4, i);
  }
  ceilGeo.setAttribute('position', new Float32BufferAttribute(ceilPts, 3));
  world.scene.add(new LineSegments(ceilGeo, new LineBasicMaterial({ color: new Color(theme.accent), transparent: true, opacity: 0.06 })));

  // Accent lights
  const l1 = new PointLight(new Color(theme.accent), 1.5, 8);
  l1.position.set(-1.5, 3, FIELD_Z);
  world.scene.add(l1);
  const l2 = new PointLight(new Color(theme.brick2 || '#ff00ff'), 1.2, 8);
  l2.position.set(1.5, 3, FIELD_Z);
  world.scene.add(l2);
  const l3 = new PointLight(new Color(theme.ball), 0.8, 5);
  l3.position.set(0, PADDLE_Y, PADDLE_Z + 0.5);
  world.scene.add(l3);

  // Floating wireframe decorations
  const shapes = [
    new TorusGeometry(0.15, 0.04, 8, 16),
    new BoxGeometry(0.2, 0.2, 0.2),
    new SphereGeometry(0.12, 8, 6),
    new ConeGeometry(0.1, 0.2, 6),
  ];
  for (let i = 0; i < 14; i++) {
    const geo = shapes[i % shapes.length];
    const mat = new MeshBasicMaterial({
      color: new Color(i % 2 === 0 ? theme.accent : theme.brick2),
      wireframe: true, transparent: true, opacity: 0.15,
    });
    const m = new Mesh(geo, mat);
    m.position.set(
      (Math.random() - 0.5) * 8,
      0.5 + Math.random() * 3,
      FIELD_Z + (Math.random() - 0.5) * 6
    );
    m.userData.rotSpeed = (Math.random() - 0.5) * 0.5;
    m.userData.bobSpeed = 0.3 + Math.random() * 0.5;
    m.userData.bobPhase = Math.random() * Math.PI * 2;
    m.userData.baseY = m.position.y;
    world.scene.add(m);
  }

  // Ambient particles
  for (let i = 0; i < 40; i++) {
    const pGeo = new SphereGeometry(0.008, 4, 4);
    const pMat = new MeshBasicMaterial({
      color: new Color(theme.accent), transparent: true, opacity: 0.3,
      blending: AdditiveBlending,
    });
    const p = new Mesh(pGeo, pMat);
    p.position.set(
      (Math.random() - 0.5) * 8,
      Math.random() * 4,
      FIELD_Z + (Math.random() - 0.5) * 6
    );
    p.userData.driftSpeed = (Math.random() - 0.5) * 0.1;
    p.userData.pulseSpeed = 1 + Math.random() * 2;
    p.userData.pulsePhase = Math.random() * Math.PI * 2;
    world.scene.add(p);
  }

  // Playfield walls (side + top)
  const wallMat = new MeshBasicMaterial({
    color: new Color(theme.accent), transparent: true, opacity: 0.08,
  });
  const lw = new Mesh(new BoxGeometry(0.02, FIELD_HEIGHT, 0.05), wallMat);
  lw.position.set(-FIELD_WIDTH / 2 - 0.01, FIELD_Y_OFFSET, FIELD_Z);
  world.scene.add(lw);
  const rw = new Mesh(new BoxGeometry(0.02, FIELD_HEIGHT, 0.05), wallMat);
  rw.position.set(FIELD_WIDTH / 2 + 0.01, FIELD_Y_OFFSET, FIELD_Z);
  world.scene.add(rw);
  const tw = new Mesh(new BoxGeometry(FIELD_WIDTH + 0.04, 0.02, 0.05), wallMat);
  tw.position.set(0, FIELD_Y_OFFSET + FIELD_HEIGHT / 2 + 0.01, FIELD_Z);
  world.scene.add(tw);

  // Wall edge glow
  const edgeMat = new LineBasicMaterial({ color: new Color(theme.accent), transparent: true, opacity: 0.5 });
  [lw, rw, tw].forEach(w => {
    const e = new LineSegments(new EdgesGeometry(w.geometry), edgeMat);
    e.position.copy(w.position);
    world.scene.add(e);
  });
}

// ─── Paddle ───
function setupPaddle() {
  const skin = getCurrentPaddleSkin();
  const paddleGeo = new BoxGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH);
  const paddleMat = new MeshStandardMaterial({
    color: new Color(skin.color),
    emissive: new Color(skin.emissive),
    emissiveIntensity: skin.intensity,
    metalness: 0.8,
    roughness: 0.2,
  });
  paddleMesh = new Mesh(paddleGeo, paddleMat);
  paddleMesh.position.set(0, PADDLE_Y, PADDLE_Z);
  world.scene.add(paddleMesh);

  const edgeMat = new LineBasicMaterial({ color: new Color(skin.edgeColor), transparent: true, opacity: 0.8 });
  paddleEdges = new LineSegments(new EdgesGeometry(paddleGeo), edgeMat);
  paddleMesh.add(paddleEdges);

  const glowGeo = new SphereGeometry(0.08, 8, 6);
  const glowMat = new MeshBasicMaterial({
    color: new Color(skin.glowColor), transparent: true, opacity: 0.2,
    blending: AdditiveBlending,
  });
  paddleGlow = new Mesh(glowGeo, glowMat);
  paddleGlow.scale.set(2.5, 1, 1);
  paddleMesh.add(paddleGlow);
}

function updatePaddleSkin() {
  const skin = getCurrentPaddleSkin();
  const mat = paddleMesh.material as MeshStandardMaterial;
  mat.color.set(skin.color);
  mat.emissive.set(skin.emissive);
  mat.emissiveIntensity = skin.intensity;
  const edgeMat = paddleEdges.material as LineBasicMaterial;
  edgeMat.color.set(skin.edgeColor);
  const glowMat = paddleGlow.material as MeshBasicMaterial;
  glowMat.color.set(skin.glowColor);
}

// ─── Ball ───
function createBall(x: number, y: number, vx: number, vy: number): BallObj {
  const skin = getCurrentBallSkin();
  const ballGeo = new SphereGeometry(BALL_RADIUS, 12, 8);
  const ballMat = new MeshStandardMaterial({
    color: new Color(skin.color),
    emissive: new Color(skin.emissive),
    emissiveIntensity: skin.intensity,
    metalness: 0.5,
    roughness: 0.2,
  });
  const mesh = new Mesh(ballGeo, ballMat);
  mesh.position.set(x, y, PADDLE_Z);
  world.scene.add(mesh);

  const glowGeo = new SphereGeometry(BALL_RADIUS * 2.5, 6, 4);
  const glowMat = new MeshBasicMaterial({
    color: new Color(skin.glowColor), transparent: true, opacity: 0.25,
    blending: AdditiveBlending,
  });
  const glow = new Mesh(glowGeo, glowMat);
  mesh.add(glow);

  const ball: BallObj = { mesh, glow, trail: [], vx, vy, active: true };
  activeBalls.push(ball);
  return ball;
}

function launchBall() {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
  const speed = BALL_SPEED * gsm.getDifficultyMultiplier();
  createBall(
    paddleMesh.position.x, PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + 0.01,
    Math.cos(angle) * speed, Math.sin(angle) * speed
  );
}

// ─── Bricks ───
function spawnLevel(levelData: LevelData) {
  activeBricks.forEach(b => {
    world.scene.remove(b.mesh);
    world.scene.remove(b.edges);
    world.scene.remove(b.glow);
  });
  activeBricks.length = 0;

  const theme = THEMES[gsm.selectedTheme];
  const brickColors: Record<BrickType, string> = {
    [BrickType.NORMAL]: theme.brick1,
    [BrickType.TOUGH]: theme.brick2,
    [BrickType.ARMORED]: theme.brick3,
    [BrickType.EXPLOSIVE]: '#ff4400',
    [BrickType.INDESTRUCTIBLE]: '#888888',
    [BrickType.GOLDEN]: '#ffd700',
  };

  const startX = -FIELD_WIDTH / 2 + BRICK_W / 2 + 0.005;
  const startY = FIELD_Y_OFFSET + FIELD_HEIGHT / 2 - BRICK_H / 2 - 0.1;

  for (let r = 0; r < levelData.rows; r++) {
    for (let c = 0; c < levelData.cols; c++) {
      const bType = levelData.grid[r][c];
      if (bType === -1 as any) continue;

      const bx = startX + c * (BRICK_W + 0.01);
      const by = startY - r * (BRICK_H + 0.008);
      const color = brickColors[bType as BrickType] || theme.brick1;

      const geo = new BoxGeometry(BRICK_W, BRICK_H, BRICK_D);
      const mat = new MeshStandardMaterial({
        color: new Color(color),
        emissive: new Color(color),
        emissiveIntensity: bType === BrickType.GOLDEN ? 0.8 : 0.4,
        metalness: 0.6,
        roughness: 0.3,
        transparent: bType === BrickType.INDESTRUCTIBLE,
        opacity: bType === BrickType.INDESTRUCTIBLE ? 0.7 : 1,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(bx, by, FIELD_Z);
      world.scene.add(mesh);

      const edgeMat = new LineBasicMaterial({ color: new Color(color), transparent: true, opacity: 0.9 });
      const edges = new LineSegments(new EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      world.scene.add(edges);

      const glowGeo = new SphereGeometry(BRICK_W * 0.4, 4, 4);
      const glowMat = new MeshBasicMaterial({
        color: new Color(color), transparent: true, opacity: 0.1,
        blending: AdditiveBlending,
      });
      const glow = new Mesh(glowGeo, glowMat);
      glow.position.copy(mesh.position);
      world.scene.add(glow);

      activeBricks.push({
        mesh, edges, glow,
        type: bType as BrickType,
        hp: BRICK_HP[bType as BrickType],
        row: r, col: c,
        x: bx, y: by,
        active: true,
      });

      // Brick entry animation — start at scale 0
      mesh.scale.setScalar(0.01);
      edges.scale.setScalar(0.01);
      glow.scale.setScalar(0.01);
    }
  }

  // Start brick entry animation
  brickEntryAnimating = true;
  brickEntryTimer = 0;
}

// ─── Power-ups ───
function spawnPowerUp(x: number, y: number) {
  // No power-ups modifier check
  if (gsm.activeModifiers.has(ChallengeModifier.NO_POWERUPS)) return;

  const type = Math.floor(Math.random() * 8) as PowerUpType;
  const colors = ['#00ffff', '#00ff88', '#ff4444', '#4488ff', '#ffaa00', '#88ff00', '#ff8800', '#ff00ff'];
  const color = colors[type];

  const geo = new SphereGeometry(0.03, 8, 6);
  const mat = new MeshStandardMaterial({
    color: new Color(color),
    emissive: new Color(color),
    emissiveIntensity: 0.7,
    metalness: 0.5,
  });
  const mesh = new Mesh(geo, mat);
  mesh.position.set(x, y, PADDLE_Z);
  world.scene.add(mesh);

  const glowGeo = new SphereGeometry(0.05, 4, 4);
  const glowMat = new MeshBasicMaterial({
    color: new Color(color), transparent: true, opacity: 0.3,
    blending: AdditiveBlending,
  });
  const glow = new Mesh(glowGeo, glowMat);
  mesh.add(glow);

  activePowerUps.push({ mesh, glow, type, x, y, vy: -0.8, active: true });
}

function applyPowerUp(pu: PowerUpObj) {
  gsm.powerupsCollected++;
  levelPowerupsUsed++;
  audio.playPowerUp();
  showToast(getPowerUpName(pu.type) + '!');

  // Track timestamps for power-up chain achievement
  const now = Date.now();
  gsm.powerUpTimestamps.push(now);
  // Keep only last 10 seconds
  gsm.powerUpTimestamps = gsm.powerUpTimestamps.filter(t => now - t <= 10000);
  if (gsm.powerUpTimestamps.length >= 3) checkAchievement('powerup_chain');

  switch (pu.type) {
    case PowerUpType.MULTI_BALL: {
      const existing = activeBalls.find(b => b.active);
      if (existing) {
        const speed = Math.sqrt(existing.vx * existing.vx + existing.vy * existing.vy);
        createBall(existing.mesh.position.x, existing.mesh.position.y,
          speed * Math.cos(Math.PI / 4), speed * Math.sin(Math.PI / 4));
        createBall(existing.mesh.position.x, existing.mesh.position.y,
          speed * Math.cos(3 * Math.PI / 4), speed * Math.sin(Math.PI / 4));
      }
      if (activeBalls.filter(b => b.active).length >= 3) {
        checkAchievement('multi_ball');
      }
      break;
    }
    case PowerUpType.WIDE_PADDLE:
      paddleWidthMult = 1.5;
      wideTimer = 15;
      updatePaddleScale();
      trackPowerUpTimer(PowerUpType.WIDE_PADDLE, 15);
      break;
    case PowerUpType.LASER:
      hasLaser = true;
      laserTimer = 10;
      trackPowerUpTimer(PowerUpType.LASER, 10);
      break;
    case PowerUpType.SHIELD:
      hasShield = true;
      if (!shieldMesh) {
        const geo = new BoxGeometry(FIELD_WIDTH, 0.015, 0.04);
        const mat = new MeshBasicMaterial({
          color: new Color('#4488ff'), transparent: true, opacity: 0.5,
          blending: AdditiveBlending,
        });
        shieldMesh = new Mesh(geo, mat);
        shieldMesh.position.set(0, PADDLE_Y - 0.15, PADDLE_Z);
        world.scene.add(shieldMesh);
      }
      shieldMesh.visible = true;
      break;
    case PowerUpType.MAGNET:
      hasMagnet = true;
      break;
    case PowerUpType.SLOW:
      slowTimer = 12;
      activeBalls.forEach(b => {
        if (b.active) { b.vx *= 0.7; b.vy *= 0.7; }
      });
      trackPowerUpTimer(PowerUpType.SLOW, 12);
      break;
    case PowerUpType.FIREBALL:
      hasFireball = true;
      fireballTimer = 8;
      trackPowerUpTimer(PowerUpType.FIREBALL, 8);
      activeBalls.forEach(b => {
        if (b.active) {
          (b.mesh.material as MeshStandardMaterial).emissive.set('#ff4400');
          (b.mesh.material as MeshStandardMaterial).emissiveIntensity = 1.2;
        }
      });
      break;
    case PowerUpType.MEGA_BALL:
      hasMegaBall = true;
      megaBallTimer = 10;
      megaBallKillsThisActivation = 0;
      trackPowerUpTimer(PowerUpType.MEGA_BALL, 10);
      activeBalls.forEach(b => {
        if (b.active) {
          b.mesh.scale.setScalar(3);
          b.glow.scale.setScalar(2);
          (b.mesh.material as MeshStandardMaterial).emissive.set('#ff00ff');
          (b.mesh.material as MeshStandardMaterial).emissiveIntensity = 1.5;
        }
      });
      break;
  }

  if (gsm.powerupsCollected >= 5) checkAchievement('powerup_5');
  if (gsm.powerupsCollected >= 20) checkAchievement('powerup_20');
}

function getPowerUpName(type: PowerUpType): string {
  const names = ['MULTI-BALL', 'WIDE PADDLE', 'LASER', 'SHIELD', 'MAGNET', 'SLOW-MO', 'FIREBALL', 'MEGA BALL'];
  return names[type] || 'POWER-UP';
}

function updatePaddleScale() {
  paddleMesh.scale.x = paddleWidthMult;
}

// ─── Particles ───
function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const geo = new SphereGeometry(0.008, 4, 4);
    const mat = new MeshBasicMaterial({
      color: new Color(color), transparent: true, opacity: 0.8,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, PADDLE_Z);
    world.scene.add(mesh);
    particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 0.3,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 0.5 + Math.random() * 0.5,
      active: true,
    });
  }
}

// ─── Laser ───
function fireLaser() {
  const geo = new BoxGeometry(0.01, 0.15, 0.01);
  const mat = new MeshBasicMaterial({ color: new Color('#ff4444'), blending: AdditiveBlending });
  const mesh = new Mesh(geo, mat);
  mesh.position.set(paddleMesh.position.x - 0.05 * paddleWidthMult, PADDLE_Y + 0.1, PADDLE_Z);
  world.scene.add(mesh);
  laserBeams.push({ mesh, y: mesh.position.y, active: true });

  const mesh2 = new Mesh(geo.clone(), mat.clone());
  mesh2.position.set(paddleMesh.position.x + 0.05 * paddleWidthMult, PADDLE_Y + 0.1, PADDLE_Z);
  world.scene.add(mesh2);
  laserBeams.push({ mesh: mesh2, y: mesh2.position.y, active: true });

  audio.playLaser();
}

// ─── Collision ───
function checkBallBrickCollision(ball: BallObj, dt: number) {
  const bx = ball.mesh.position.x;
  const by = ball.mesh.position.y;
  const r = hasMegaBall ? BALL_RADIUS * 3 : BALL_RADIUS;

  for (const brick of activeBricks) {
    if (!brick.active) continue;

    const hw = BRICK_W / 2;
    const hh = BRICK_H / 2;
    const dx = bx - brick.x;
    const dy = by - brick.y;

    if (Math.abs(dx) < hw + r && Math.abs(dy) < hh + r) {
      if (!hasFireball || brick.type === BrickType.INDESTRUCTIBLE) {
        if (Math.abs(dx) / (hw + r) > Math.abs(dy) / (hh + r)) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }
      }
      hitBrick(brick, ball);
      break;
    }
  }
}

function hitBrick(brick: BrickObj, ball?: BallObj) {
  if (brick.type === BrickType.INDESTRUCTIBLE) {
    audio.playBrickHit(0);
    return;
  }

  brick.hp--;
  audio.playBrickHit(gsm.combo);

  if (brick.hp <= 0) {
    destroyBrick(brick);
  } else {
    const mat = brick.mesh.material as MeshStandardMaterial;
    mat.emissiveIntensity = 1.2;
    setTimeout(() => { mat.emissiveIntensity = 0.4; }, 100);
  }
}

function destroyBrick(brick: BrickObj) {
  brick.active = false;
  brick.mesh.visible = false;
  brick.edges.visible = false;
  brick.glow.visible = false;

  gsm.bricksDestroyed++;
  gsm.combo++;
  if (gsm.combo > gsm.maxCombo) gsm.maxCombo = gsm.combo;
  gsm.score += BRICK_POINTS[brick.type] * Math.min(gsm.combo, 10);

  audio.playBrickDestroy();
  triggerScreenShake(0.004);
  updateComboVisuals(gsm.combo);

  // Shrinking paddle modifier
  if (gsm.activeModifiers.has(ChallengeModifier.SHRINKING_PADDLE)) {
    shrinkPaddleCount++;
    paddleWidthMult = Math.max(0.4, paddleWidthMult * 0.95);
    updatePaddleScale();
  }

  const colors: Record<number, string> = {
    [BrickType.NORMAL]: THEMES[gsm.selectedTheme].brick1,
    [BrickType.TOUGH]: THEMES[gsm.selectedTheme].brick2,
    [BrickType.ARMORED]: THEMES[gsm.selectedTheme].brick3,
    [BrickType.EXPLOSIVE]: '#ff4400',
    [BrickType.GOLDEN]: '#ffd700',
  };
  spawnParticles(brick.x, brick.y, colors[brick.type] || '#ffffff', 8);

  if (brick.type === BrickType.EXPLOSIVE) {
    audio.playExplosion();
    triggerScreenShake(0.015);
    spawnParticles(brick.x, brick.y, '#ff4400', 15);
    let chainCount = 0;
    for (const b of activeBricks) {
      if (!b.active) continue;
      const dist = Math.sqrt((b.x - brick.x) ** 2 + (b.y - brick.y) ** 2);
      if (dist < BRICK_W * 2.5 && b.type !== BrickType.INDESTRUCTIBLE) {
        chainCount++;
        setTimeout(() => destroyBrick(b), 50 + chainCount * 30);
      }
    }
    gsm.explosiveChains = Math.max(gsm.explosiveChains, chainCount);
    levelExplosiveChains++;
    if (chainCount >= 3) checkAchievement('explosive');
    if (levelExplosiveChains >= 5) checkAchievement('explosive_5');
  }

  if (brick.type === BrickType.GOLDEN) {
    gsm.goldensDestroyed++;
    audio.playGoldenCollect();
    spawnPowerUp(brick.x, brick.y);
    if (gsm.goldensDestroyed >= 10) checkAchievement('golden');
  } else if (Math.random() < 0.15) {
    spawnPowerUp(brick.x, brick.y);
  }

  if (hasFireball) {
    gsm.fireballHits++;
    if (gsm.fireballHits >= 10) checkAchievement('fireball');
  }
  if (hasMegaBall) {
    gsm.megaBallHits++;
    gsm.megaBallSessionHits++;
    megaBallKillsThisActivation++;
    if (gsm.megaBallSessionHits >= 50) checkAchievement('mega_ball_50');
    if (megaBallKillsThisActivation >= 10) checkAchievement('mega_ball_chain');
  }

  if (gsm.bricksDestroyed === 1) checkAchievement('first_break');
  if (gsm.combo >= 5) checkAchievement('combo_5');
  if (gsm.combo >= 10) checkAchievement('combo_10');
  if (gsm.combo >= 25) checkAchievement('combo_25');
  if (gsm.combo >= 50) checkAchievement('combo_50');
  if (gsm.combo >= 100) checkAchievement('combo_100');
  if (gsm.combo >= 200) checkAchievement('combo_200');
  if (gsm.score >= 10000) checkAchievement('score_10k');
  if (gsm.score >= 50000) checkAchievement('score_50k');
  if (gsm.score >= 100000) checkAchievement('score_100k');
  if (gsm.score >= 500000) checkAchievement('score_500k');
  if (gsm.score >= 1000000) checkAchievement('score_1m');

  updateHUD();

  const remaining = activeBricks.filter(b => b.active && b.type !== BrickType.INDESTRUCTIBLE);
  if (remaining.length === 0) {
    onLevelComplete();
  }
}

// ─── Game Logic ───
function gameUpdate(dt: number) {
  // Animate decorations
  world.scene.children.forEach((child: any) => {
    if (child.userData.rotSpeed != null) {
      child.rotation.y += child.userData.rotSpeed * dt;
      child.position.y = child.userData.baseY + Math.sin(performance.now() * 0.001 * child.userData.bobSpeed + child.userData.bobPhase) * 0.15;
    }
    if (child.userData.driftSpeed != null) {
      child.position.x += child.userData.driftSpeed * dt;
      const mat = child.material as MeshBasicMaterial;
      if (mat && mat.opacity != null) {
        mat.opacity = 0.15 + 0.15 * Math.sin(performance.now() * 0.001 * child.userData.pulseSpeed + child.userData.pulsePhase);
      }
    }
  });

  if (gsm.state === 'countdown') {
    // Animate brick entry during countdown
    if (brickEntryAnimating) {
      brickEntryTimer += dt;
      const t = Math.min(brickEntryTimer / BRICK_ENTRY_DURATION, 1);
      for (const brick of activeBricks) {
        if (!brick.active) continue;
        // Stagger by row — later rows animate slightly later
        const rowDelay = brick.row * 0.06;
        const localT = Math.max(0, Math.min(1, (brickEntryTimer - rowDelay) / (BRICK_ENTRY_DURATION * 0.6)));
        // Ease out elastic
        const s = localT === 0 ? 0 : localT === 1 ? 1 :
          Math.pow(2, -10 * localT) * Math.sin((localT * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
        brick.mesh.scale.setScalar(s);
        brick.edges.scale.setScalar(s);
        brick.glow.scale.setScalar(s);
      }
      if (t >= 1) brickEntryAnimating = false;
    }

    countdownTimer -= dt;
    if (countdownTimer <= 0) {
      countdownVal--;
      if (countdownVal <= 0) {
        gsm.state = 'playing';
        audio.playCountdownGo();
        hideUI('countdown');
        launchBall();
        gsm.levelStartTime = Date.now();
      } else {
        audio.playCountdownTick();
        updateCountdown();
        countdownTimer = 1;
      }
    }
    return;
  }

  if (gsm.state === 'levelcomplete') {
    levelCompleteTimer -= dt;
    if (levelCompleteTimer <= 0) {
      gsm.level++;
      startLevel();
    }
    return;
  }

  if (gsm.state !== 'playing') return;

  updatePaddleFromInput();
  applyScreenShake(dt);
  updatePowerUpTimers(dt);

  // Brick glow pulse — golden and explosive bricks pulse
  for (const brick of activeBricks) {
    if (!brick.active) continue;
    if (brick.type === BrickType.GOLDEN || brick.type === BrickType.EXPLOSIVE) {
      const pulse = 0.1 + 0.12 * Math.sin(performance.now() * 0.004 + brick.row * 0.5 + brick.col * 0.3);
      (brick.glow.material as MeshBasicMaterial).opacity = pulse;
      const brickMat = brick.mesh.material as MeshStandardMaterial;
      brickMat.emissiveIntensity = brick.type === BrickType.GOLDEN
        ? 0.8 + 0.4 * Math.sin(performance.now() * 0.003)
        : 0.4 + 0.3 * Math.sin(performance.now() * 0.005);
    }
  }

  // Paddle dash update
  if (dashCooldown > 0) dashCooldown -= dt;
  if (dashVelocity !== 0) {
    paddleMesh.position.x += dashVelocity * dt;
    const halfField = FIELD_WIDTH / 2 - PADDLE_WIDTH * paddleWidthMult / 2;
    paddleMesh.position.x = Math.max(-halfField, Math.min(halfField, paddleMesh.position.x));
    dashVelocity *= 0.88; // decelerate
    if (Math.abs(dashVelocity) < 0.3) dashVelocity = 0;
    // Dash trail particles
    dashTrailTimer -= dt;
    if (dashTrailTimer <= 0) {
      const theme = THEMES[gsm.selectedTheme];
      spawnParticles(paddleMesh.position.x, PADDLE_Y, theme.paddle, 2);
      dashTrailTimer = 0.03;
    }
  }

  // Paddle slam update
  if (slamCooldown > 0) slamCooldown -= dt;
  if (slamActive) {
    slamImpactTimer -= dt;
    if (slamImpactTimer <= 0) {
      slamActive = false;
      // Slam shockwave — damage nearby bricks in bottom rows
      const slamX = paddleMesh.position.x;
      const slamRadius = 0.4;
      let slamHits = 0;
      for (const brick of activeBricks) {
        if (!brick.active || brick.type === BrickType.INDESTRUCTIBLE) continue;
        const dx = Math.abs(brick.x - slamX);
        const dy = brick.y - PADDLE_Y;
        if (dx < slamRadius && dy > 0 && dy < 0.8) {
          hitBrick(brick);
          slamHits++;
        }
      }
      if (slamHits >= 5) checkAchievement('slam_hit_5');
      triggerScreenShake(0.015);
      const theme = THEMES[gsm.selectedTheme];
      // Slam visual burst
      for (let i = 0; i < 8; i++) {
        spawnParticles(
          slamX + (Math.random() - 0.5) * slamRadius * 2,
          PADDLE_Y + Math.random() * 0.3,
          theme.accent, 3
        );
      }
    }
  }

  // Boss brick movement
  if (currentBoss && brickGroup) {
    bossTime += dt;
    const boss = currentBoss;
    switch (boss.movePattern) {
      case 'horizontal':
        brickGroup.position.x = Math.sin(bossTime * boss.moveSpeed * Math.PI * 2) * boss.moveRange;
        break;
      case 'vertical':
        brickGroup.position.y = Math.sin(bossTime * boss.moveSpeed * Math.PI * 2) * boss.moveRange;
        break;
      case 'circular':
        brickGroup.position.x = Math.sin(bossTime * boss.moveSpeed * Math.PI * 2) * boss.moveRange;
        brickGroup.position.y = Math.cos(bossTime * boss.moveSpeed * Math.PI * 2) * boss.moveRange * 0.5;
        break;
      case 'figure8':
        brickGroup.position.x = Math.sin(bossTime * boss.moveSpeed * Math.PI * 2) * boss.moveRange;
        brickGroup.position.y = Math.sin(bossTime * boss.moveSpeed * Math.PI * 4) * boss.moveRange * 0.5;
        break;
    }
    // Update actual brick positions for collision
    for (const brick of activeBricks) {
      if (brick.active) {
        brick.mesh.position.x = brick.x + brickGroup.position.x;
        brick.mesh.position.y = brick.y + brickGroup.position.y;
        brick.edges.position.copy(brick.mesh.position);
        brick.glow.position.copy(brick.mesh.position);
      }
    }
  }

  // Speed surge modifier
  if (gsm.activeModifiers.has(ChallengeModifier.SPEED_SURGE)) {
    speedSurgeTimer += dt;
    if (speedSurgeTimer >= 10) {
      speedSurgeTimer = 0;
      activeBalls.forEach(b => {
        if (b.active) {
          b.vx *= 1.08;
          b.vy *= 1.08;
        }
      });
    }
  }

  // Timers
  if (wideTimer > 0) {
    wideTimer -= dt;
    if (wideTimer <= 0) { paddleWidthMult = 1; updatePaddleScale(); }
  }
  if (laserTimer > 0) {
    laserTimer -= dt;
    if (laserTimer <= 0) hasLaser = false;
  }
  if (fireballTimer > 0) {
    fireballTimer -= dt;
    if (fireballTimer <= 0) {
      hasFireball = false;
      const skin = getCurrentBallSkin();
      activeBalls.forEach(b => {
        if (b.active) {
          (b.mesh.material as MeshStandardMaterial).emissive.set(skin.emissive);
          (b.mesh.material as MeshStandardMaterial).emissiveIntensity = skin.intensity;
        }
      });
    }
  }
  if (megaBallTimer > 0) {
    megaBallTimer -= dt;
    if (megaBallTimer <= 0) {
      hasMegaBall = false;
      const skin = getCurrentBallSkin();
      activeBalls.forEach(b => {
        if (b.active) {
          b.mesh.scale.setScalar(1);
          b.glow.scale.setScalar(1);
          if (!hasFireball) {
            (b.mesh.material as MeshStandardMaterial).emissive.set(skin.emissive);
            (b.mesh.material as MeshStandardMaterial).emissiveIntensity = skin.intensity;
          }
        }
      });
    }
  }
  if (slowTimer > 0) {
    slowTimer -= dt;
    if (slowTimer <= 0) {
      activeBalls.forEach(b => {
        if (b.active) {
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (speed > 0) {
            const factor = (BALL_SPEED * gsm.getDifficultyMultiplier()) / speed;
            b.vx *= factor;
            b.vy *= factor;
          }
        }
      });
    }
  }

  // Update balls
  for (const ball of activeBalls) {
    if (!ball.active) continue;

    if (hasMagnet && magnetBall === ball) {
      ball.mesh.position.x = paddleMesh.position.x;
      ball.mesh.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + 0.01;
      continue;
    }

    ball.mesh.position.x += ball.vx * dt;
    ball.mesh.position.y += ball.vy * dt;

    // Wall collisions
    const halfField = FIELD_WIDTH / 2;
    if (ball.mesh.position.x - BALL_RADIUS < -halfField) {
      ball.mesh.position.x = -halfField + BALL_RADIUS;
      ball.vx = Math.abs(ball.vx);
      audio.playWallBounce();
    }
    if (ball.mesh.position.x + BALL_RADIUS > halfField) {
      ball.mesh.position.x = halfField - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx);
      audio.playWallBounce();
    }
    if (ball.mesh.position.y + BALL_RADIUS > FIELD_Y_OFFSET + FIELD_HEIGHT / 2) {
      ball.mesh.position.y = FIELD_Y_OFFSET + FIELD_HEIGHT / 2 - BALL_RADIUS;
      ball.vy = -Math.abs(ball.vy);
      audio.playWallBounce();
    }

    // Paddle collision
    const pw = PADDLE_WIDTH * paddleWidthMult / 2;
    const paddleX = paddleMesh.position.x;
    if (
      ball.vy < 0 &&
      ball.mesh.position.y - BALL_RADIUS < PADDLE_Y + PADDLE_HEIGHT / 2 &&
      ball.mesh.position.y + BALL_RADIUS > PADDLE_Y - PADDLE_HEIGHT / 2 &&
      ball.mesh.position.x > paddleX - pw &&
      ball.mesh.position.x < paddleX + pw
    ) {
      const hitPos = (ball.mesh.position.x - paddleX) / pw;
      const angle = hitPos * (Math.PI / 3) + Math.PI / 2;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.abs(Math.sin(angle) * speed);
      ball.mesh.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS;
      gsm.combo = 0;
      audio.playPaddleHit();

      if (hasMagnet) {
        magnetBall = ball;
        ball.vx = 0;
        ball.vy = 0;
      }
    }

    // Shield collision
    if (hasShield && shieldMesh && ball.vy < 0 &&
      ball.mesh.position.y - BALL_RADIUS < PADDLE_Y - 0.15 + 0.01) {
      ball.vy = Math.abs(ball.vy);
      hasShield = false;
      shieldMesh.visible = false;
      gsm.shieldSaves++;
      audio.playShieldBlock();
      spawnParticles(ball.mesh.position.x, PADDLE_Y - 0.15, '#4488ff', 10);
      checkAchievement('shield_save');
    }

    // Ball lost
    if (ball.mesh.position.y < PADDLE_Y - 0.3) {
      ball.active = false;
      ball.mesh.visible = false;
      ball.glow.visible = false;
      gsm.ballsLost++;
      levelBallsLost++;
      audio.playBallLost();
      spawnParticles(ball.mesh.position.x, PADDLE_Y - 0.2, '#ff4444', 12);

      const aliveBalls = activeBalls.filter(b => b.active);
      if (aliveBalls.length === 0) {
        gsm.lives--;
        if (gsm.lives <= 0) {
          onGameOver();
        } else {
          hasMagnet = false;
          magnetBall = null;
          launchBall();
        }
      }
    }

    checkBallBrickCollision(ball, dt);

    // Ball trail
    if (ball.active && ball.trail.length < 20) {
      const trailGeo = new SphereGeometry(BALL_RADIUS * 0.5, 4, 4);
      const skin = getCurrentBallSkin();
      const trailColor = hasFireball ? '#ff4400' : skin.trailColor;
      const trailMat = new MeshBasicMaterial({
        color: new Color(trailColor), transparent: true, opacity: 0.3,
        blending: AdditiveBlending,
      });
      const trailMesh = new Mesh(trailGeo, trailMat);
      trailMesh.position.copy(ball.mesh.position);
      world.scene.add(trailMesh);
      ball.trail.push(trailMesh);
    }
    for (let i = ball.trail.length - 1; i >= 0; i--) {
      const t = ball.trail[i];
      const mat = t.material as MeshBasicMaterial;
      mat.opacity -= dt * 1.5;
      if (mat.opacity <= 0) {
        world.scene.remove(t);
        ball.trail.splice(i, 1);
      }
    }
  }

  // Update power-ups
  for (const pu of activePowerUps) {
    if (!pu.active) continue;
    pu.y += pu.vy * dt;
    pu.mesh.position.y = pu.y;
    pu.mesh.rotation.y += dt * 3;
    pu.mesh.position.x = pu.x + Math.sin(performance.now() * 0.003) * 0.02;

    const pw = PADDLE_WIDTH * paddleWidthMult / 2;
    if (
      pu.y < PADDLE_Y + PADDLE_HEIGHT / 2 &&
      pu.y > PADDLE_Y - PADDLE_HEIGHT / 2 &&
      pu.mesh.position.x > paddleMesh.position.x - pw &&
      pu.mesh.position.x < paddleMesh.position.x + pw
    ) {
      pu.active = false;
      pu.mesh.visible = false;
      pu.glow.visible = false;
      applyPowerUp(pu);
    }

    if (pu.y < PADDLE_Y - 0.5) {
      pu.active = false;
      pu.mesh.visible = false;
      pu.glow.visible = false;
    }
  }

  // Update lasers
  for (const laser of laserBeams) {
    if (!laser.active) continue;
    laser.y += 4 * dt;
    laser.mesh.position.y = laser.y;

    for (const brick of activeBricks) {
      if (!brick.active) continue;
      if (Math.abs(laser.mesh.position.x - brick.x) < BRICK_W / 2 &&
        Math.abs(laser.y - brick.y) < BRICK_H / 2) {
        laser.active = false;
        laser.mesh.visible = false;
        hitBrick(brick);
        gsm.laserHits++;
        if (gsm.laserHits >= 20) checkAchievement('laser_20');
        break;
      }
    }

    if (laser.y > FIELD_Y_OFFSET + FIELD_HEIGHT / 2 + 0.2) {
      laser.active = false;
      laser.mesh.visible = false;
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (!p.active) continue;
    p.life -= dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 1.5 * dt;
    const mat = p.mesh.material as MeshBasicMaterial;
    mat.opacity = (p.life / p.maxLife) * 0.8;
    if (p.life <= 0) {
      p.active = false;
      world.scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }

  // Time attack
  if (gsm.mode === 'timeattack') {
    const elapsed = (Date.now() - gsm.levelStartTime) / 1000;
    if (elapsed >= 90) {
      if (gsm.score >= 60000) checkAchievement('time_60k');
      onGameOver();
    }
  }

  // Endurance
  if ((Date.now() - gsm.sessionStartTime) / 60000 >= 20) {
    checkAchievement('endurance');
  }

  updateHUD();
}

// ─── Level Management ───
function startLevel() {
  activeBalls.forEach(b => {
    b.active = false;
    b.mesh.visible = false;
    b.glow.visible = false;
    b.trail.forEach(t => world.scene.remove(t));
  });
  activeBalls.length = 0;

  activePowerUps.forEach(pu => { pu.active = false; pu.mesh.visible = false; });
  activePowerUps.length = 0;

  laserBeams.forEach(l => { l.active = false; l.mesh.visible = false; });
  laserBeams.length = 0;

  // Reset power-up states
  hasLaser = false;
  hasFireball = false;
  hasMegaBall = false;
  hasMagnet = false;
  magnetBall = null;
  slowTimer = 0;
  fireballTimer = 0;
  megaBallTimer = 0;
  laserTimer = 0;
  wideTimer = 0;
  paddleWidthMult = 1;
  updatePaddleScale();
  levelBallsLost = 0;
  levelPowerupsUsed = 0;
  levelExplosiveChains = 0;
  activePowerUpTimers.length = 0;
  megaBallKillsThisActivation = 0;
  dashVelocity = 0;
  dashCooldown = 0;
  slamActive = false;
  slamCooldown = 0;
  slamImpactTimer = 0;
  hideUI('powerups');

  const levels = getLevels();
  const bossLevels = getBossLevels();
  let levelData: LevelData;

  // Reset boss state
  currentBoss = null;
  bossTime = 0;
  if (brickGroup) {
    brickGroup.position.set(0, 0, 0);
    brickGroup = null;
  }
  speedSurgeTimer = 0;
  shrinkPaddleCount = 0;

  if (gsm.mode === 'daily') {
    // Generate daily challenge level from seed
    levelData = generateDailyLevel();
  } else if (gsm.mode === 'survival') {
    // Survival: generate wave-based level
    gsm.survivalWave++;
    levelData = generateSurvivalWave(gsm.survivalWave);
    showToast(`WAVE ${gsm.survivalWave}`);
  } else if (gsm.mode === 'practice') {
    // Practice: use selected level
    const levelIdx = ((gsm.practiceLevel - 1) % levels.length);
    levelData = levels[levelIdx];
    gsm.level = gsm.practiceLevel;
  } else if (bossLevels[gsm.level]) {
    // Boss level
    const boss = bossLevels[gsm.level];
    levelData = { name: boss.name, rows: boss.rows, cols: boss.cols, grid: boss.grid };
    currentBoss = boss;
    brickGroup = new Group();
    world.scene.add(brickGroup);
    audio.playBossIntro();
    showToast('⚠ BOSS LEVEL ⚠');
  } else {
    const levelIdx = ((gsm.level - 1) % levels.length);
    levelData = levels[levelIdx];
  }

  // Zone achievements
  if (gsm.level >= 13) checkAchievement('zone_2');
  if (gsm.level >= 25) checkAchievement('zone_3');
  if (gsm.level >= 37) checkAchievement('zone_4');

  spawnLevel(levelData);

  hideUI('levelcomplete');
  showUI('hud');

  gsm.state = 'countdown';
  countdownVal = 3;
  countdownTimer = 1;
  showUI('countdown');
  updateCountdown();
  audio.playCountdownTick();
}

function generateDailyLevel(): LevelData {
  const seed = getDailyChallengeSeed();
  const rng = seededRandom(seed);
  const rows = 6 + Math.floor(rng() * 3); // 6-8 rows
  const cols = 8;
  const types = [BrickType.NORMAL, BrickType.TOUGH, BrickType.ARMORED, BrickType.EXPLOSIVE, BrickType.GOLDEN, BrickType.INDESTRUCTIBLE];

  const grid: BrickType[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const roll = rng();
      if (roll < 0.1) { grid[r][c] = -1 as any; continue; }
      if (roll < 0.35) grid[r][c] = BrickType.NORMAL;
      else if (roll < 0.55) grid[r][c] = BrickType.TOUGH;
      else if (roll < 0.7) grid[r][c] = BrickType.ARMORED;
      else if (roll < 0.8) grid[r][c] = BrickType.EXPLOSIVE;
      else if (roll < 0.88) grid[r][c] = BrickType.GOLDEN;
      else grid[r][c] = BrickType.INDESTRUCTIBLE;
    }
  }

  return { name: `Daily ${seed}`, rows, cols, grid };
}

function generateSurvivalWave(wave: number): LevelData {
  const rows = Math.min(4 + Math.floor(wave / 3), 8);
  const cols = 8;
  const grid: BrickType[][] = [];
  const toughChance = Math.min(0.1 + wave * 0.03, 0.5);
  const armorChance = Math.min(wave * 0.02, 0.25);
  const explosiveChance = Math.min(0.05 + wave * 0.01, 0.15);
  const goldenChance = Math.max(0.08 - wave * 0.002, 0.03);

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const roll = Math.random();
      if (roll < 0.08) { grid[r][c] = -1 as any; continue; }
      if (roll < 0.08 + goldenChance) grid[r][c] = BrickType.GOLDEN;
      else if (roll < 0.08 + goldenChance + explosiveChance) grid[r][c] = BrickType.EXPLOSIVE;
      else if (roll < 0.08 + goldenChance + explosiveChance + armorChance) grid[r][c] = BrickType.ARMORED;
      else if (roll < 0.08 + goldenChance + explosiveChance + armorChance + toughChance) grid[r][c] = BrickType.TOUGH;
      else grid[r][c] = BrickType.NORMAL;
    }
  }

  return { name: `Wave ${wave}`, rows, cols, grid };
}

function onLevelComplete() {
  gsm.state = 'levelcomplete';
  levelCompleteTimer = 2.5;
  audio.playLevelComplete();

  const elapsed = (Date.now() - gsm.levelStartTime) / 1000;
  if (elapsed < 30) checkAchievement('speed_clear');
  if (elapsed < 15) checkAchievement('speed_15');
  if (levelBallsLost === 0) {
    checkAchievement('no_miss');
    profile.perfectLevels++;
    if (profile.perfectLevels >= 3) checkAchievement('perfect_3');
  }
  if (levelPowerupsUsed === 0) checkAchievement('no_powerup');

  if (gsm.level >= 5) checkAchievement('level_5');
  if (gsm.level >= 10) checkAchievement('level_10');
  if (gsm.level >= 20) checkAchievement('level_20');
  if (gsm.level >= 24) checkAchievement('level_24');
  if (gsm.level >= 36) checkAchievement('level_36');
  if (gsm.level >= 48) checkAchievement('level_48');

  if (gsm.mode === 'endless' && gsm.level >= 50) checkAchievement('endless_50');

  // Track consecutive perfect levels
  if (levelBallsLost === 0) {
    gsm.consecutivePerfectLevels++;
    if (gsm.consecutivePerfectLevels >= 5) checkAchievement('no_miss_5');
  } else {
    gsm.consecutivePerfectLevels = 0;
  }

  // Track level completion times for speed run
  gsm.levelStartTimes.push(elapsed);
  if (gsm.levelStartTimes.length >= 10) {
    const last10Sum = gsm.levelStartTimes.slice(-10).reduce((a, b) => a + b, 0);
    if (last10Sum < 300) checkAchievement('speed_run_10');
  }

  // Track triple modifier levels
  if (gsm.activeModifiers.size >= 3) {
    gsm.tripleModifierLevels++;
    if (gsm.tripleModifierLevels >= 3) checkAchievement('triple_modifier');
  }

  // Boss defeat
  const bossLevels = getBossLevels();
  if (bossLevels[gsm.level]) {
    gsm.bossesDefeated.add(gsm.level);
    gsm.savePersistence();
    checkAchievement('boss_slayer');
    if (gsm.bossesDefeated.size >= 3) checkAchievement('boss_master');
    if (gsm.bossesDefeated.size >= 4) checkAchievement('all_bosses');
    if (gsm.level === 48) checkAchievement('boss_4');
    if (levelBallsLost === 0) checkAchievement('all_bosses_no_miss');
    triggerScreenShake(0.02);
  }

  // Modifier achievements
  if (gsm.activeModifiers.size >= 1) checkAchievement('modifier_1');
  if (gsm.activeModifiers.size >= 3) checkAchievement('modifier_3');

  showUI('levelcomplete');
  updateLevelComplete();

  // Campaign victory — completed all 48 levels in Classic
  if (gsm.mode === 'classic' && gsm.level >= 48) {
    checkAchievement('campaign_victory');
    checkAchievement('campaign_48');
    profile.campaignCompleted = true;
    saveProfile(profile);
    setTimeout(() => {
      hideUI('levelcomplete');
      gsm.state = 'gameover'; // prevent further level progression
      onCampaignVictory();
    }, 2500);
  }

  // Practice mode — single level, then back to menu
  if (gsm.mode === 'practice') {
    checkAchievement('practice_complete');
    setTimeout(() => {
      hideUI('levelcomplete');
      hideAllUI();
      gsm.state = 'title';
      showUI('title');
      updateTitleLevel();
    }, 2500);
  }
}

function onGameOver() {
  gsm.state = 'gameover';
  audio.playGameOver();
  gsm.addToLeaderboard();

  // Calculate and award XP
  const levelsCleared = gsm.level - 1;
  let xpEarned = calculateGameXP(gsm.score, gsm.bricksDestroyed, levelsCleared, gsm.maxCombo, gsm.mode);
  // No XP in practice mode
  if (gsm.mode === 'practice') xpEarned = 0;
  xpEarned = Math.floor(xpEarned * gsm.getModifierXPMultiplier());
  const oldLevel = profile.level;
  profile.xp += xpEarned;
  profile.level = getLevelFromXP(profile.xp);
  profile.totalGames++;
  profile.totalBricks += gsm.bricksDestroyed;
  profile.totalScore += gsm.score;
  profile.totalPlayTime += (Date.now() - gameStartTime) / 1000;
  if (gsm.score > profile.bestScore) profile.bestScore = gsm.score;
  if (gsm.maxCombo > profile.bestCombo) profile.bestCombo = gsm.maxCombo;
  if (gsm.level > profile.bestLevel) profile.bestLevel = gsm.level;
  profile.powerupsCollected += gsm.powerupsCollected;
  profile.ballsLost += gsm.ballsLost;
  profile.explosiveChains += gsm.explosiveChains;
  profile.goldenBricks += gsm.goldensDestroyed;
  profile.laserHits += gsm.laserHits;
  profile.fireballHits += gsm.fireballHits;
  profile.shieldSaves += gsm.shieldSaves;

  // Per-mode best scores
  const modeKey = gsm.mode;
  if (!profile.bestScoreByMode[modeKey] || gsm.score > profile.bestScoreByMode[modeKey]) {
    profile.bestScoreByMode[modeKey] = gsm.score;
  }

  // Track modifier levels
  if (gsm.activeModifiers.size >= 3) {
    profile.totalModifierLevels += gsm.tripleModifierLevels;
  }

  // Theme tracking
  gsm.themesUsed.add(gsm.selectedTheme);
  if (gsm.themesUsed.size >= 8) checkAchievement('all_themes_used');
  if (gsm.themesUsed.size >= 5) checkAchievement('all_themes');

  // Daily challenge tracking
  if (gsm.mode === 'daily') {
    const today = getDailyChallengeSeed();
    if (profile.dailyChallengeDate !== today) {
      profile.dailyChallengesCompleted++;
      profile.dailyChallengeDate = today;
      profile.dailyChallengeScore = gsm.score;
      checkAchievement('daily_1');
      if (profile.dailyChallengesCompleted >= 7) checkAchievement('daily_7');
    } else if (gsm.score > profile.dailyChallengeScore) {
      profile.dailyChallengeScore = gsm.score;
    }
  }

  // Track modes played
  gsm.modesPlayed.add(gsm.mode);
  gsm.savePersistence();
  if (gsm.modesPlayed.size >= 7) checkAchievement('all_modes');

  // Survival achievements
  if (gsm.mode === 'survival') {
    if (gsm.survivalWave >= 5) checkAchievement('survival_wave_5');
    if (gsm.survivalWave >= 10) checkAchievement('survival_wave_10');
    if (gsm.survivalWave >= 20) checkAchievement('survival_wave_20');
    if (gsm.score >= 50000) checkAchievement('survival_score_50k');
    if (gsm.score >= 200000) checkAchievement('survival_score_200k');
    if (gsm.powerupsCollected === 0 && gsm.survivalWave >= 5) checkAchievement('survival_no_powerup');
  }

  // Extended career achievements
  if (profile.totalScore >= 5000000) checkAchievement('score_5m');
  if (profile.totalScore >= 10000000) checkAchievement('score_10m');
  if (profile.totalBricks >= 10000) checkAchievement('bricks_10000');
  if (profile.totalBricks >= 20000) checkAchievement('bricks_20000');

  // Check progression unlocks
  if (profile.level !== oldLevel) {
    const newUnlocks = getAvailableUnlocks(profile.level).filter(u =>
      u.requiredLevel > oldLevel && u.requiredLevel <= profile.level
    );
    for (const unlock of newUnlocks) {
      if (unlock.type === 'ball_skin' && !profile.unlockedBallSkins.includes(unlock.id)) {
        profile.unlockedBallSkins.push(unlock.id);
      }
      if (unlock.type === 'paddle_skin' && !profile.unlockedPaddleSkins.includes(unlock.id)) {
        profile.unlockedPaddleSkins.push(unlock.id);
      }
    }
    // Check all skins achievement
    if (profile.unlockedBallSkins.length >= BALL_SKINS.length &&
      profile.unlockedPaddleSkins.length >= PADDLE_SKINS.length) {
      checkAchievement('all_skins');
    }
  }

  // XP-based achievements
  if (profile.level >= 10) checkAchievement('xp_level_10');
  if (profile.level >= 25) checkAchievement('xp_level_25');
  if (profile.level >= 50) checkAchievement('xp_level_50');
  if (profile.totalGames >= 10) checkAchievement('games_10');
  if (profile.totalGames >= 50) checkAchievement('games_50');
  if (profile.totalGames >= 100) checkAchievement('games_100');
  if (profile.totalBricks >= 500) checkAchievement('bricks_500');
  if (profile.totalBricks >= 2000) checkAchievement('bricks_2000');
  if (profile.totalBricks >= 5000) checkAchievement('bricks_5000');
  if (profile.totalScore >= 2000000) checkAchievement('score_2m');

  saveProfile(profile);

  showUI('gameover');
  updateGameOver(xpEarned);

  // Show level-up notification
  if (profile.level > oldLevel) {
    setTimeout(() => {
      showUI('levelup');
      updateLevelUp(profile.level, xpEarned, oldLevel);
      setTimeout(() => hideUI('levelup'), 3000);
    }, 1500);
  }
}

// ─── Campaign Victory ───
function onCampaignVictory() {
  const levelsCleared = 48;
  let xpEarned = calculateGameXP(gsm.score, gsm.bricksDestroyed, levelsCleared, gsm.maxCombo, gsm.mode);
  xpEarned = Math.floor(xpEarned * gsm.getModifierXPMultiplier() * 1.5); // 50% campaign bonus
  const oldLevel = profile.level;
  profile.xp += xpEarned;
  profile.level = getLevelFromXP(profile.xp);

  // Award all game-end stats
  profile.totalGames++;
  profile.totalBricks += gsm.bricksDestroyed;
  profile.totalScore += gsm.score;
  profile.totalPlayTime += (Date.now() - gameStartTime) / 1000;
  if (gsm.score > profile.bestScore) profile.bestScore = gsm.score;
  if (gsm.maxCombo > profile.bestCombo) profile.bestCombo = gsm.maxCombo;
  profile.bestLevel = 48;
  profile.gamesWon++;
  if (!profile.bestScoreByMode['classic'] || gsm.score > profile.bestScoreByMode['classic']) {
    profile.bestScoreByMode['classic'] = gsm.score;
  }
  saveProfile(profile);
  gsm.addToLeaderboard();

  // Show victory screen
  showUI('victory');
  const totalTime = (Date.now() - gameStartTime) / 1000;
  const mins = Math.floor(totalTime / 60);
  const secs = Math.floor(totalTime % 60);
  updateVictory(gsm.score, `${mins}m ${secs}s`, gsm.maxCombo, xpEarned);

  // Celebratory particles
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const theme = THEMES[gsm.selectedTheme];
      spawnParticles(
        (Math.random() - 0.5) * FIELD_WIDTH,
        FIELD_Y_OFFSET + Math.random() * FIELD_HEIGHT,
        i % 2 === 0 ? theme.accent : '#ffd700', 12
      );
      triggerScreenShake(0.003);
    }, i * 200);
  }

  audio.playBossDefeat();

  // Level up if applicable
  if (profile.level > oldLevel) {
    setTimeout(() => {
      showUI('levelup');
      updateLevelUp(profile.level, xpEarned, oldLevel);
      setTimeout(() => hideUI('levelup'), 3000);
    }, 2000);
  }
}

function updateVictory(score: number, time: string, combo: number, xp: number) {
  const doc = getDoc('victory');
  setText(doc, 'victory-score', `Score: ${score.toLocaleString()}`);
  setText(doc, 'victory-time', `Time: ${time}`);
  setText(doc, 'victory-combo', `Best Combo: x${combo}`);
  setText(doc, 'victory-xp', `+${xp} XP (1.5x Campaign Bonus!)`);
}

// ─── Input ───
let mouseX = 0;
let laserCooldown = 0;

function setupInputListeners() {
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * FIELD_WIDTH;
  });

  window.addEventListener('click', () => {
    if (gsm.state === 'playing') {
      if (hasMagnet && magnetBall) {
        const speed = BALL_SPEED * gsm.getDifficultyMultiplier();
        magnetBall.vy = speed;
        magnetBall.vx = (Math.random() - 0.5) * speed * 0.3;
        magnetBall = null;
        hasMagnet = false;
      }
      if (hasLaser && laserCooldown <= 0) {
        fireLaser();
        laserCooldown = 0.3;
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (gsm.state === 'playing') {
        gsm.state = 'paused';
        showUI('pause');
      } else if (gsm.state === 'paused') {
        gsm.state = 'playing';
        hideUI('pause');
      }
    }
    // Paddle dash — Shift key
    if ((e.key === 'Shift' || e.key === 'ShiftLeft') && gsm.state === 'playing' && dashCooldown <= 0) {
      const kbLeft = (world.input as any).keyboard?.getKeyPressed?.('KeyA') ||
                     (world.input as any).keyboard?.getKeyPressed?.('ArrowLeft');
      const dir = kbLeft ? -1 : 1;
      dashVelocity = dir * 8;
      dashCooldown = 0.8;
      dashTrailTimer = 0;
      gsm.dashCount++;
      if (gsm.dashCount >= 50) checkAchievement('dash_50');
      audio.playWallBounce(); // reuse bounce as dash sfx
    }
    // Paddle slam — X key
    if ((e.key === 'x' || e.key === 'X') && gsm.state === 'playing' && slamCooldown <= 0) {
      slamActive = true;
      slamImpactTimer = 0.15;
      slamCooldown = 2.0;
      gsm.slamCount++;
      if (gsm.slamCount >= 25) checkAchievement('slam_25');
      audio.playPaddleHit();
      triggerScreenShake(0.008);
    }
  });
}

function updatePaddleFromInput() {
  const halfField = FIELD_WIDTH / 2 - PADDLE_WIDTH * paddleWidthMult / 2;
  let targetX = mouseX;

  try {
    const xr = (world.input as any).xr;
    if (xr) {
      const rightGrip = (world as any).playerSpaceEntities?.gripSpaces?.get?.('right');
      if (rightGrip?.object3D) {
        targetX = rightGrip.object3D.position.x;
      }
    }
  } catch { /* no XR */ }

  if ((world.input as any).keyboard?.getKeyPressed('KeyA') || (world.input as any).keyboard?.getKeyPressed('ArrowLeft')) {
    targetX = paddleMesh.position.x - 2.5 * 0.016;
  }
  if ((world.input as any).keyboard?.getKeyPressed('KeyD') || (world.input as any).keyboard?.getKeyPressed('ArrowRight')) {
    targetX = paddleMesh.position.x + 2.5 * 0.016;
  }

  targetX = Math.max(-halfField, Math.min(halfField, targetX));
  paddleMesh.position.x += (targetX - paddleMesh.position.x) * 0.2;

  if (laserCooldown > 0) laserCooldown -= 0.016;
}

// ─── UI Setup ───
function setupUI() {
  const panels: { name: string; config: string; maxW: number; maxH: number; mode: 'world' | 'hud' | 'screen'; pos?: [number, number, number]; offset?: [number, number, number] }[] = [
    { name: 'title', config: '/ui/title.json', maxW: 0.9, maxH: 0.8, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'modeselect', config: '/ui/modeselect.json', maxW: 0.9, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'difficulty', config: '/ui/difficulty.json', maxW: 0.7, maxH: 0.5, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'hud', config: '/ui/hud.json', maxW: 0.35, maxH: 0.12, mode: 'hud', offset: [0, 0.22, -0.5] },
    { name: 'pause', config: '/ui/pause.json', maxW: 0.6, maxH: 0.5, mode: 'world', pos: [0, 1.5, -1.8] },
    { name: 'gameover', config: '/ui/gameover.json', maxW: 0.8, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'levelcomplete', config: '/ui/levelcomplete.json', maxW: 0.6, maxH: 0.4, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'leaderboard', config: '/ui/leaderboard.json', maxW: 0.8, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'achievements', config: '/ui/achievements.json', maxW: 0.9, maxH: 1.0, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'settings', config: '/ui/settings.json', maxW: 0.8, maxH: 0.6, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'help', config: '/ui/help.json', maxW: 0.9, maxH: 0.8, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'toast', config: '/ui/toast.json', maxW: 0.3, maxH: 0.06, mode: 'hud', offset: [0, -0.08, -0.5] },
    { name: 'countdown', config: '/ui/countdown.json', maxW: 0.25, maxH: 0.15, mode: 'hud', offset: [0, 0, -0.5] },
    { name: 'profile', config: '/ui/profile.json', maxW: 0.9, maxH: 0.9, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'ballskins', config: '/ui/ballskins.json', maxW: 0.9, maxH: 0.9, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'paddleskins', config: '/ui/paddleskins.json', maxW: 0.9, maxH: 0.8, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'levelup', config: '/ui/levelup.json', maxW: 0.5, maxH: 0.3, mode: 'hud', offset: [0, 0.1, -0.6] },
    { name: 'modifiers', config: '/ui/modifiers.json', maxW: 0.8, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'powerups', config: '/ui/powerups.json', maxW: 0.25, maxH: 0.12, mode: 'hud', offset: [-0.2, 0.12, -0.5] },
    { name: 'victory', config: '/ui/victory.json', maxW: 0.9, maxH: 0.9, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'tutorial', config: '/ui/tutorial.json', maxW: 0.9, maxH: 1.0, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'practiceselect', config: '/ui/practiceselect.json', maxW: 0.9, maxH: 1.0, mode: 'world', pos: [0, 1.5, -2] },
  ];

  for (const p of panels) {
    const entity = world.createTransformEntity(undefined, { persistent: true });
    entity.addComponent(PanelUI, {
      config: p.config,
      maxWidth: p.maxW,
      maxHeight: p.maxH,
    });

    if (p.mode === 'world' && p.pos) {
      entity.object3D!.position.set(p.pos[0], p.pos[1], p.pos[2]);
    } else if (p.mode === 'hud' && p.offset) {
      entity.addComponent(Follower, {
        target: (world as any).player?.head,
        offsetPosition: p.offset,
        behavior: FollowBehavior.PivotY,
        speed: 5,
        tolerance: 0.3,
      });
    }

    entity.object3D!.visible = false;
    uiEntities[p.name] = entity;
    uiDocs[p.name] = null;
  }

  setTimeout(() => {
    showUI('title');
    updateTitleLevel();
    wireUIEvents();
  }, 500);
}

function getDoc(name: string): UIKitDocument | null {
  if (uiDocs[name]) return uiDocs[name];
  const entity = uiEntities[name];
  if (!entity) return null;
  const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
  if (doc) uiDocs[name] = doc;
  return doc || null;
}

function showUI(name: string) {
  const entity = uiEntities[name];
  if (entity?.object3D) entity.object3D.visible = true;
}

function hideUI(name: string) {
  const entity = uiEntities[name];
  if (entity?.object3D) entity.object3D.visible = false;
}

function hideAllUI() {
  for (const name of Object.keys(uiEntities)) {
    hideUI(name);
  }
}

function setText(doc: UIKitDocument | null, id: string, text: string) {
  if (!doc) return;
  const el = doc.getElementById(id);
  if (el && (el as any).text) (el as any).text.value = text;
}

// ─── Wire UI Events ───
let eventsWired = false;

function wireUIEvents() {
  if (eventsWired) return;

  const tryWire = () => {
    let allReady = true;

    // Title
    const titleDoc = getDoc('title');
    if (titleDoc) {
      titleDoc.getElementById('btn-play')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('modeselect'); });
      titleDoc.getElementById('btn-daily')?.addEventListener('click', () => {
        audio.playButtonClick();
        hideUI('title');
        gsm.mode = 'daily' as any;
        showUI('difficulty');
      });
      titleDoc.getElementById('btn-leaderboard')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('leaderboard'); updateLeaderboard(); });
      titleDoc.getElementById('btn-achievements')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('achievements'); updateAchievements(); });
      titleDoc.getElementById('btn-settings')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('settings'); updateSettings(); });
      titleDoc.getElementById('btn-help')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('help'); });
      titleDoc.getElementById('btn-tutorial')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('tutorial'); });
      titleDoc.getElementById('btn-profile')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('profile'); updateProfile(); });
      titleDoc.getElementById('btn-ballskins')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('ballskins'); updateBallSkins(); });
      titleDoc.getElementById('btn-paddleskins')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('paddleskins'); updatePaddleSkins(); });
    } else { allReady = false; }

    // Mode select
    const modeDoc = getDoc('modeselect');
    if (modeDoc) {
      const modes: { id: string; mode: string }[] = [
        { id: 'btn-classic', mode: 'classic' },
        { id: 'btn-endless', mode: 'endless' },
        { id: 'btn-timeattack', mode: 'timeattack' },
        { id: 'btn-zen', mode: 'zen' },
      ];
      for (const m of modes) {
        modeDoc.getElementById(m.id)?.addEventListener('click', () => {
          audio.playButtonClick();
          gsm.mode = m.mode as any;
          hideUI('modeselect');
          showUI('difficulty');
        });
      }
      modeDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('modeselect'); showUI('title'); updateTitleLevel(); });
      modeDoc.getElementById('btn-survival')?.addEventListener('click', () => {
        audio.playButtonClick();
        gsm.mode = 'survival' as any;
        hideUI('modeselect');
        showUI('difficulty');
      });
      modeDoc.getElementById('btn-practice')?.addEventListener('click', () => {
        audio.playButtonClick();
        gsm.mode = 'practice' as any;
        hideUI('modeselect');
        showUI('practiceselect');
        updatePracticeSelect();
      });
    } else { allReady = false; }

    // Difficulty
    const diffDoc = getDoc('difficulty');
    if (diffDoc) {
      const diffs: { id: string; diff: 'easy' | 'medium' | 'hard' }[] = [
        { id: 'btn-easy', diff: 'easy' },
        { id: 'btn-medium', diff: 'medium' },
        { id: 'btn-hard', diff: 'hard' },
      ];
      for (const d of diffs) {
        diffDoc.getElementById(d.id)?.addEventListener('click', () => {
          audio.playButtonClick();
          gsm.difficulty = d.diff;
          hideUI('difficulty');
          gsm.activeModifiers.clear();
          showUI('modifiers');
          updateModifiers();
        });
      }
      diffDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('difficulty'); showUI('modeselect'); });
    } else { allReady = false; }

    // Pause
    const pauseDoc = getDoc('pause');
    if (pauseDoc) {
      pauseDoc.getElementById('btn-resume')?.addEventListener('click', () => { audio.playButtonClick(); gsm.state = 'playing'; hideUI('pause'); });
      pauseDoc.getElementById('btn-quit')?.addEventListener('click', () => { audio.playButtonClick(); hideAllUI(); gsm.state = 'title'; showUI('title'); updateTitleLevel(); });
    } else { allReady = false; }

    // Game over
    const goDoc = getDoc('gameover');
    if (goDoc) {
      goDoc.getElementById('btn-rematch')?.addEventListener('click', () => { audio.playButtonClick(); hideAllUI(); gsm.resetGame(); gameStartTime = Date.now(); startLevel(); });
      goDoc.getElementById('btn-title')?.addEventListener('click', () => { audio.playButtonClick(); hideAllUI(); gsm.state = 'title'; showUI('title'); updateTitleLevel(); });
    } else { allReady = false; }

    // Leaderboard
    const lbDoc = getDoc('leaderboard');
    if (lbDoc) {
      lbDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('leaderboard'); showUI('title'); updateTitleLevel(); });
    } else { allReady = false; }

    // Achievements
    const achDoc = getDoc('achievements');
    if (achDoc) {
      achDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('achievements'); showUI('title'); updateTitleLevel(); });
    } else { allReady = false; }

    // Settings
    const setDoc = getDoc('settings');
    if (setDoc) {
      setDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('settings'); showUI('title'); updateTitleLevel(); });
      ['master', 'sfx', 'music'].forEach(cat => {
        setDoc.getElementById(`btn-${cat}-up`)?.addEventListener('click', () => {
          audio.playButtonClick();
          if (cat === 'master') gsm.masterVolume = Math.min(1, gsm.masterVolume + 0.1);
          if (cat === 'sfx') gsm.sfxVolume = Math.min(1, gsm.sfxVolume + 0.1);
          if (cat === 'music') gsm.musicVolume = Math.min(1, gsm.musicVolume + 0.1);
          audio.setVolumes(gsm.masterVolume, gsm.sfxVolume, gsm.musicVolume);
          gsm.savePersistence();
          updateSettings();
        });
        setDoc.getElementById(`btn-${cat}-down`)?.addEventListener('click', () => {
          audio.playButtonClick();
          if (cat === 'master') gsm.masterVolume = Math.max(0, gsm.masterVolume - 0.1);
          if (cat === 'sfx') gsm.sfxVolume = Math.max(0, gsm.sfxVolume - 0.1);
          if (cat === 'music') gsm.musicVolume = Math.max(0, gsm.musicVolume - 0.1);
          audio.setVolumes(gsm.masterVolume, gsm.sfxVolume, gsm.musicVolume);
          gsm.savePersistence();
          updateSettings();
        });
      });
      setDoc.getElementById('btn-theme-prev')?.addEventListener('click', () => {
        audio.playButtonClick();
        gsm.selectedTheme = (gsm.selectedTheme - 1 + THEMES.length) % THEMES.length;
        gsm.savePersistence();
        updateSettings();
      });
      setDoc.getElementById('btn-theme-next')?.addEventListener('click', () => {
        audio.playButtonClick();
        gsm.selectedTheme = (gsm.selectedTheme + 1) % THEMES.length;
        gsm.savePersistence();
        updateSettings();
      });
    } else { allReady = false; }

    // Help
    const helpDoc = getDoc('help');
    if (helpDoc) {
      helpDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('help'); showUI('title'); updateTitleLevel(); });
    } else { allReady = false; }

    // Profile
    const profDoc = getDoc('profile');
    if (profDoc) {
      profDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('profile'); showUI('title'); updateTitleLevel(); });
    } else { allReady = false; }

    // Ball skins
    const bsDoc = getDoc('ballskins');
    if (bsDoc) {
      bsDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('ballskins'); showUI('title'); updateTitleLevel(); });
      for (let i = 0; i < BALL_SKINS.length; i++) {
        bsDoc.getElementById(`ball-${i}`)?.addEventListener('click', () => {
          audio.playButtonClick();
          const skin = BALL_SKINS[i];
          if (profile.unlockedBallSkins.includes(skin.id)) {
            profile.selectedBallSkin = skin.id;
            saveProfile(profile);
            updateBallSkins();
          }
        });
      }
    } else { allReady = false; }

    // Paddle skins
    const psDoc = getDoc('paddleskins');
    if (psDoc) {
      psDoc.getElementById('btn-back')?.addEventListener('click', () => { audio.playButtonClick(); hideUI('paddleskins'); showUI('title'); updateTitleLevel(); updatePaddleSkin(); });
      for (let i = 0; i < PADDLE_SKINS.length; i++) {
        psDoc.getElementById(`paddle-${i}`)?.addEventListener('click', () => {
          audio.playButtonClick();
          const skin = PADDLE_SKINS[i];
          if (profile.unlockedPaddleSkins.includes(skin.id)) {
            profile.selectedPaddleSkin = skin.id;
            saveProfile(profile);
            updatePaddleSkins();
            updatePaddleSkin();
          }
        });
      }
    } else { allReady = false; }

    // Modifiers
    const modDoc = getDoc('modifiers');
    if (modDoc) {
      modDoc.getElementById('btn-mod-shrink')?.addEventListener('click', () => {
        audio.playButtonClick();
        toggleModifier(ChallengeModifier.SHRINKING_PADDLE);
        updateModifiers();
      });
      modDoc.getElementById('btn-mod-speed')?.addEventListener('click', () => {
        audio.playButtonClick();
        toggleModifier(ChallengeModifier.SPEED_SURGE);
        updateModifiers();
      });
      modDoc.getElementById('btn-mod-nopow')?.addEventListener('click', () => {
        audio.playButtonClick();
        toggleModifier(ChallengeModifier.NO_POWERUPS);
        updateModifiers();
      });
      modDoc.getElementById('btn-mod-start')?.addEventListener('click', () => {
        audio.playButtonClick();
        hideAllUI();
        gsm.resetGame();
        gsm.modesPlayed.add(gsm.mode);
        gsm.themesUsed.add(gsm.selectedTheme);
        if (gsm.themesUsed.size >= 5) checkAchievement('all_themes');
        if (gsm.themesUsed.size >= 8) checkAchievement('all_themes_used');
        gameStartTime = Date.now();
        startLevel();
      });
      modDoc.getElementById('btn-mod-back')?.addEventListener('click', () => {
        audio.playButtonClick();
        hideUI('modifiers');
        showUI('difficulty');
      });
    } else { allReady = false; }

    // Victory
    const vicDoc = getDoc('victory');
    if (vicDoc) {
      vicDoc.getElementById('btn-victory-title')?.addEventListener('click', () => {
        audio.playButtonClick(); hideAllUI(); gsm.state = 'title'; showUI('title'); updateTitleLevel();
      });
      vicDoc.getElementById('btn-victory-play')?.addEventListener('click', () => {
        audio.playButtonClick(); hideAllUI(); gsm.resetGame(); gameStartTime = Date.now(); startLevel();
      });
    } else { allReady = false; }

    // Tutorial
    const tutDoc = getDoc('tutorial');
    if (tutDoc) {
      tutDoc.getElementById('btn-tut-play')?.addEventListener('click', () => {
        audio.playButtonClick();
        checkAchievement('tutorial_complete');
        hideUI('tutorial');
        showUI('modeselect');
      });
      tutDoc.getElementById('btn-tut-back')?.addEventListener('click', () => {
        audio.playButtonClick();
        hideUI('tutorial');
        showUI('title');
        updateTitleLevel();
      });
    } else { allReady = false; }

    // Practice Select
    const pracDoc = getDoc('practiceselect');
    if (pracDoc) {
      for (let lv = 1; lv <= 48; lv++) {
        pracDoc.getElementById(`plv-${lv}`)?.addEventListener('click', () => {
          const maxLevel = profile.bestLevel || 1;
          if (lv > maxLevel) {
            showToast('Level locked!');
            return;
          }
          audio.playButtonClick();
          gsm.practiceLevel = lv;
          hideUI('practiceselect');
          gsm.activeModifiers.clear();
          gsm.resetGame();
          gsm.mode = 'practice' as any;
          gsm.modesPlayed.add('practice');
          gsm.savePersistence();
          gameStartTime = Date.now();
          startLevel();
        });
      }
      pracDoc.getElementById('btn-practice-back')?.addEventListener('click', () => {
        audio.playButtonClick();
        hideUI('practiceselect');
        showUI('modeselect');
      });
    } else { allReady = false; }

    if (allReady) {
      eventsWired = true;
    } else {
      setTimeout(tryWire, 200);
    }
  };

  tryWire();
}

// ─── UI Update Functions ───
function updateTitleLevel() {
  const doc = getDoc('title');
  setText(doc, 'title-level', `Level ${profile.level}`);
}

function updateHUD() {
  const doc = getDoc('hud');
  setText(doc, 'score-val', String(gsm.score));
  setText(doc, 'lives-val', String(gsm.lives));
  setText(doc, 'level-val', gsm.mode === 'survival' ? `W${gsm.survivalWave}` : String(gsm.level));
  setText(doc, 'wave-val', gsm.mode === 'survival' ? `Wave ${gsm.survivalWave}` : '');
  setText(doc, 'combo-val', gsm.combo > 1 ? `x${gsm.combo}` : '');
  if (gsm.mode === 'timeattack') {
    const elapsed = (Date.now() - gsm.levelStartTime) / 1000;
    const remaining = Math.max(0, 90 - elapsed);
    setText(doc, 'combo-val', `${Math.ceil(remaining)}s`);
  }
}

function updateCountdown() {
  const doc = getDoc('countdown');
  setText(doc, 'count-val', countdownVal > 0 ? String(countdownVal) : 'BREAK!');
}

function updateLevelComplete() {
  const doc = getDoc('levelcomplete');
  const levels = getLevels();
  const bossLevels = getBossLevels();
  let levelName: string;
  if (gsm.mode === 'daily') {
    levelName = 'Daily Challenge';
  } else if (bossLevels[gsm.level]) {
    levelName = bossLevels[gsm.level].name;
  } else {
    levelName = levels[(gsm.level - 1) % levels.length].name;
  }
  setText(doc, 'level-name', `${getZoneName(gsm.level)} — ${levelName}`);
  setText(doc, 'score-val', String(gsm.score));
  setText(doc, 'combo-val', `Best: x${gsm.maxCombo}`);
}

function updateGameOver(xpEarned = 0) {
  const doc = getDoc('gameover');
  setText(doc, 'title-text', gsm.lives <= 0 ? 'GAME OVER' : 'TIME UP!');
  setText(doc, 'score-val', String(gsm.score));
  setText(doc, 'level-val', `Level ${gsm.level}`);
  setText(doc, 'bricks-val', `${gsm.bricksDestroyed} bricks`);
  setText(doc, 'combo-val', `Best combo: x${gsm.maxCombo}`);
  setText(doc, 'xp-val', `+${xpEarned}`);
}

function updateLeaderboard() {
  const doc = getDoc('leaderboard');
  if (!doc) return;
  for (let i = 0; i < 10; i++) {
    const entry = gsm.leaderboard[i];
    setText(doc, `row-${i}`, entry
      ? `${i + 1}. ${entry.score} pts - Lv${entry.level} - ${entry.mode} - x${entry.combo} - ${entry.date}`
      : `${i + 1}. ---`);
  }
}

function updateAchievements() {
  const doc = getDoc('achievements');
  if (!doc) return;
  let unlocked = 0;
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i];
    const isUnlocked = gsm.achievements[a.id] || false;
    if (isUnlocked) unlocked++;
    setText(doc, `ach-${i}`, `${isUnlocked ? '[*]' : '[ ]'} ${a.name} - ${a.desc}`);
  }
  setText(doc, 'ach-counter', `${unlocked} / ${ACHIEVEMENTS.length}`);
}

function updateSettings() {
  const doc = getDoc('settings');
  setText(doc, 'master-val', `${Math.round(gsm.masterVolume * 100)}%`);
  setText(doc, 'sfx-val', `${Math.round(gsm.sfxVolume * 100)}%`);
  setText(doc, 'music-val', `${Math.round(gsm.musicVolume * 100)}%`);
  setText(doc, 'theme-val', THEMES[gsm.selectedTheme].name);
}

function updateProfile() {
  const doc = getDoc('profile');
  if (!doc) return;
  const progress = getXPProgressInLevel(profile.xp);
  setText(doc, 'player-level', String(profile.level));
  setText(doc, 'xp-text', profile.level >= 50 ? 'MAX LEVEL' : `${progress.current} / ${progress.needed} XP`);
  setText(doc, 'stat-games', String(profile.totalGames));
  setText(doc, 'stat-score', String(profile.totalScore));
  setText(doc, 'stat-best-score', String(profile.bestScore));
  setText(doc, 'stat-bricks', String(profile.totalBricks));
  setText(doc, 'stat-combo', `x${profile.bestCombo}`);
  setText(doc, 'stat-level', String(profile.bestLevel));
  const hours = Math.floor(profile.totalPlayTime / 3600);
  const mins = Math.floor((profile.totalPlayTime % 3600) / 60);
  setText(doc, 'stat-time', `${hours}h ${mins}m`);
  setText(doc, 'stat-perfect', String(profile.perfectLevels));
  setText(doc, 'stat-won', String(profile.gamesWon));
  setText(doc, 'stat-daily', String(profile.dailyChallengesCompleted));
  // Per-mode best scores
  const modes = ['classic', 'endless', 'timeattack', 'zen', 'daily'];
  const modeLabels = ['Classic', 'Endless', 'Time Atk', 'Zen', 'Daily'];
  let modeStr = '';
  for (let i = 0; i < modes.length; i++) {
    const best = profile.bestScoreByMode[modes[i]];
    if (best) modeStr += `${modeLabels[i]}: ${best.toLocaleString()} | `;
  }
  setText(doc, 'stat-modes', modeStr.slice(0, -3) || 'No scores yet');
}

function updateBallSkins() {
  const doc = getDoc('ballskins');
  if (!doc) return;
  for (let i = 0; i < BALL_SKINS.length; i++) {
    const skin = BALL_SKINS[i];
    const unlocked = profile.unlockedBallSkins.includes(skin.id);
    const equipped = profile.selectedBallSkin === skin.id;
    setText(doc, `ball-${i}-name`, skin.name);
    const unlock = UNLOCKS.find(u => u.id === skin.id);
    if (equipped) {
      setText(doc, `ball-${i}-status`, 'EQUIPPED');
    } else if (unlocked) {
      setText(doc, `ball-${i}-status`, 'SELECT');
    } else {
      setText(doc, `ball-${i}-status`, unlock ? `Lv ${unlock.requiredLevel}` : 'LOCKED');
    }
  }
}

function updatePaddleSkins() {
  const doc = getDoc('paddleskins');
  if (!doc) return;
  for (let i = 0; i < PADDLE_SKINS.length; i++) {
    const skin = PADDLE_SKINS[i];
    const unlocked = profile.unlockedPaddleSkins.includes(skin.id);
    const equipped = profile.selectedPaddleSkin === skin.id;
    setText(doc, `paddle-${i}-name`, skin.name);
    const unlock = UNLOCKS.find(u => u.id === skin.id);
    if (equipped) {
      setText(doc, `paddle-${i}-status`, 'EQUIPPED');
    } else if (unlocked) {
      setText(doc, `paddle-${i}-status`, 'SELECT');
    } else {
      setText(doc, `paddle-${i}-status`, unlock ? `Lv ${unlock.requiredLevel}` : 'LOCKED');
    }
  }
}

function updateLevelUp(newLevel: number, xpEarned: number, oldLevel: number) {
  const doc = getDoc('levelup');
  setText(doc, 'levelup-text', `Level ${newLevel}`);
  setText(doc, 'levelup-xp', `+${xpEarned} XP`);
  const newUnlocks = getAvailableUnlocks(newLevel).filter(u =>
    u.requiredLevel > oldLevel && u.requiredLevel <= newLevel
  );
  if (newUnlocks.length > 0) {
    setText(doc, 'levelup-unlock', `Unlocked: ${newUnlocks.map(u => u.name).join(', ')}`);
  } else {
    setText(doc, 'levelup-unlock', '');
  }
}

function updatePracticeSelect() {
  const doc = getDoc('practiceselect');
  if (!doc) return;
  const maxLevel = profile.bestLevel || 1;
  for (let lv = 1; lv <= 48; lv++) {
    const el = doc.getElementById(`plv-${lv}`);
    if (el && (el as any).text) {
      if (lv <= maxLevel) {
        (el as any).text.value = String(lv);
      } else {
        (el as any).text.value = '🔒';
      }
    }
  }
}

// ─── Modifier Helpers ───
function toggleModifier(mod: ChallengeModifier) {
  if (gsm.activeModifiers.has(mod)) {
    gsm.activeModifiers.delete(mod);
  } else {
    gsm.activeModifiers.add(mod);
  }
}

function updateModifiers() {
  const doc = getDoc('modifiers');
  if (!doc) return;
  const shrinkOn = gsm.activeModifiers.has(ChallengeModifier.SHRINKING_PADDLE);
  const speedOn = gsm.activeModifiers.has(ChallengeModifier.SPEED_SURGE);
  const nopowOn = gsm.activeModifiers.has(ChallengeModifier.NO_POWERUPS);
  setText(doc, 'mod-shrink-text', `${shrinkOn ? '[*]' : '[ ]'} Shrinking Paddle (+30% XP)`);
  setText(doc, 'mod-speed-text', `${speedOn ? '[*]' : '[ ]'} Speed Surge (+30% XP)`);
  setText(doc, 'mod-nopow-text', `${nopowOn ? '[*]' : '[ ]'} No Power-Ups (+40% XP)`);
  const mult = gsm.getModifierXPMultiplier();
  setText(doc, 'mod-xp-bonus', `XP Bonus: x${mult.toFixed(1)}`);
}

// ─── Toast ───
let toastTimeout: number | null = null;

function showToast(msg: string) {
  const doc = getDoc('toast');
  setText(doc, 'toast-text', msg);
  showUI('toast');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => hideUI('toast'), 2000);
}

// ─── Achievement Check ───
function checkAchievement(id: string) {
  if (gsm.unlockAchievement(id)) {
    const a = ACHIEVEMENTS.find(a => a.id === id);
    if (a) {
      showToast(`Achievement: ${a.name}!`);
      audio.playAchievement();
    }
  }
}

// ─── Start ───
main().catch(console.error);
