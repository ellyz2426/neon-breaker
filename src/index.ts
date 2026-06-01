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
  THEMES, ACHIEVEMENTS, getLevels, LevelData,
  FIELD_WIDTH, FIELD_HEIGHT, FIELD_Y_OFFSET, FIELD_Z,
  PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, PADDLE_Y, PADDLE_Z,
  BALL_RADIUS, BALL_SPEED, BRICK_W, BRICK_H, BRICK_D,
} from './types.js';
import { AudioManager } from './audio.js';

// ─── Globals ───
let world: World;
const gsm = new GameStateManager();
const audio = new AudioManager();
const activeBalls: BallObj[] = [];
const activeBricks: BrickObj[] = [];
const activePowerUps: PowerUpObj[] = [];
const particles: ParticleObj[] = [];
const laserBeams: LaserObj[] = [];

let paddleMesh: Mesh;
let paddleGlow: Mesh;
let shieldMesh: Mesh | null = null;
let hasShield = false;
let hasMagnet = false;
let magnetBall: BallObj | null = null;
let hasLaser = false;
let laserTimer = 0;
let hasFireball = false;
let fireballTimer = 0;
let wideTimer = 0;
let slowTimer = 0;
let paddleWidthMult = 1;
let countdownVal = 0;
let countdownTimer = 0;
let levelCompleteTimer = 0;

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

// ─── Init ───
async function main() {
  const container = document.getElementById('app') as HTMLDivElement;
  world = await World.create(container, {
    xr: { offer: 'once' as const },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: false,
      locomotion: false,
      physics: false,
      spatialUI: true,
    },
  });

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
  // Left wall
  const lw = new Mesh(new BoxGeometry(0.02, FIELD_HEIGHT, 0.05), wallMat);
  lw.position.set(-FIELD_WIDTH / 2 - 0.01, FIELD_Y_OFFSET, FIELD_Z);
  world.scene.add(lw);
  // Right wall
  const rw = new Mesh(new BoxGeometry(0.02, FIELD_HEIGHT, 0.05), wallMat);
  rw.position.set(FIELD_WIDTH / 2 + 0.01, FIELD_Y_OFFSET, FIELD_Z);
  world.scene.add(rw);
  // Top wall
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
  const theme = THEMES[gsm.selectedTheme];
  const paddleGeo = new BoxGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH);
  const paddleMat = new MeshStandardMaterial({
    color: new Color(theme.paddle),
    emissive: new Color(theme.paddle),
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2,
  });
  paddleMesh = new Mesh(paddleGeo, paddleMat);
  paddleMesh.position.set(0, PADDLE_Y, PADDLE_Z);
  world.scene.add(paddleMesh);

  // Paddle edges
  const edgeMat = new LineBasicMaterial({ color: new Color(theme.accent), transparent: true, opacity: 0.8 });
  const edges = new LineSegments(new EdgesGeometry(paddleGeo), edgeMat);
  paddleMesh.add(edges);

  // Paddle glow
  const glowGeo = new SphereGeometry(0.08, 8, 6);
  const glowMat = new MeshBasicMaterial({
    color: new Color(theme.glow), transparent: true, opacity: 0.2,
    blending: AdditiveBlending,
  });
  paddleGlow = new Mesh(glowGeo, glowMat);
  paddleGlow.scale.set(2.5, 1, 1);
  paddleMesh.add(paddleGlow);
}

// ─── Ball ───
function createBall(x: number, y: number, vx: number, vy: number): BallObj {
  const theme = THEMES[gsm.selectedTheme];
  const ballGeo = new SphereGeometry(BALL_RADIUS, 12, 8);
  const ballMat = new MeshStandardMaterial({
    color: new Color(theme.ball),
    emissive: new Color(theme.ball),
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.2,
  });
  const mesh = new Mesh(ballGeo, ballMat);
  mesh.position.set(x, y, PADDLE_Z);
  world.scene.add(mesh);

  // Ball glow
  const glowGeo = new SphereGeometry(BALL_RADIUS * 2.5, 6, 4);
  const glowMat = new MeshBasicMaterial({
    color: new Color(theme.glow), transparent: true, opacity: 0.25,
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
  // Clear existing
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

      const edgeMat = new LineBasicMaterial({
        color: new Color(color), transparent: true, opacity: 0.9,
      });
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
    }
  }
}

// ─── Power-ups ───
function spawnPowerUp(x: number, y: number) {
  const theme = THEMES[gsm.selectedTheme];
  const type = Math.floor(Math.random() * 7) as PowerUpType;
  const colors = ['#00ffff', '#00ff88', '#ff4444', '#4488ff', '#ffaa00', '#88ff00', '#ff8800'];
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
  audio.playPowerUp();
  showToast(getPowerUpName(pu.type) + '!');

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
      break;
    case PowerUpType.LASER:
      hasLaser = true;
      laserTimer = 10;
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
        if (b.active) {
          b.vx *= 0.7;
          b.vy *= 0.7;
        }
      });
      break;
    case PowerUpType.FIREBALL:
      hasFireball = true;
      fireballTimer = 8;
      activeBalls.forEach(b => {
        if (b.active) {
          (b.mesh.material as MeshStandardMaterial).emissive.set('#ff4400');
          (b.mesh.material as MeshStandardMaterial).emissiveIntensity = 1.2;
        }
      });
      break;
  }

  if (gsm.powerupsCollected >= 5) checkAchievement('powerup_5');
}

function getPowerUpName(type: PowerUpType): string {
  const names = ['MULTI-BALL', 'WIDE PADDLE', 'LASER', 'SHIELD', 'MAGNET', 'SLOW-MO', 'FIREBALL'];
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
  const theme = THEMES[gsm.selectedTheme];
  const geo = new BoxGeometry(0.01, 0.15, 0.01);
  const mat = new MeshBasicMaterial({
    color: new Color('#ff4444'),
    blending: AdditiveBlending,
  });
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
  const r = BALL_RADIUS;

  for (const brick of activeBricks) {
    if (!brick.active) continue;

    const hw = BRICK_W / 2;
    const hh = BRICK_H / 2;
    const dx = bx - brick.x;
    const dy = by - brick.y;

    if (Math.abs(dx) < hw + r && Math.abs(dy) < hh + r) {
      // Hit!
      if (!hasFireball || brick.type === BrickType.INDESTRUCTIBLE) {
        // Reflect ball
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
    // Flash the brick
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

  // Particles
  const colors: Record<number, string> = {
    [BrickType.NORMAL]: THEMES[gsm.selectedTheme].brick1,
    [BrickType.TOUGH]: THEMES[gsm.selectedTheme].brick2,
    [BrickType.ARMORED]: THEMES[gsm.selectedTheme].brick3,
    [BrickType.EXPLOSIVE]: '#ff4400',
    [BrickType.GOLDEN]: '#ffd700',
  };
  spawnParticles(brick.x, brick.y, colors[brick.type] || '#ffffff', 8);

  // Special brick behaviors
  if (brick.type === BrickType.EXPLOSIVE) {
    audio.playExplosion();
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
    if (chainCount >= 3) checkAchievement('explosive');
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

  // Achievement checks
  if (gsm.bricksDestroyed === 1) checkAchievement('first_break');
  if (gsm.combo >= 5) checkAchievement('combo_5');
  if (gsm.combo >= 10) checkAchievement('combo_10');
  if (gsm.combo >= 25) checkAchievement('combo_25');
  if (gsm.score >= 10000) checkAchievement('score_10k');
  if (gsm.score >= 50000) checkAchievement('score_50k');
  if (gsm.score >= 100000) checkAchievement('score_100k');

  updateHUD();

  // Check level complete
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

  // Input
  updatePaddleFromInput();

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
      activeBalls.forEach(b => {
        if (b.active) {
          const theme = THEMES[gsm.selectedTheme];
          (b.mesh.material as MeshStandardMaterial).emissive.set(theme.ball);
          (b.mesh.material as MeshStandardMaterial).emissiveIntensity = 0.8;
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

  // Laser firing
  if (hasLaser) {
    laserTimer -= 0; // just track; fire on click/trigger
  }

  // Update balls
  const speedMult = slowTimer > 0 ? 1 : 1;
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
      // Reflect with angle based on hit position
      const hitPos = (ball.mesh.position.x - paddleX) / pw; // -1 to 1
      const angle = hitPos * (Math.PI / 3) + Math.PI / 2; // 60-120 degrees
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.abs(Math.sin(angle) * speed);
      ball.mesh.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS;
      gsm.combo = 0; // Reset combo on paddle hit
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

    // Ball lost (below paddle)
    if (ball.mesh.position.y < PADDLE_Y - 0.3) {
      ball.active = false;
      ball.mesh.visible = false;
      ball.glow.visible = false;
      gsm.ballsLost++;
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

    // Brick collisions
    checkBallBrickCollision(ball, dt);

    // Ball trail
    if (ball.active && ball.trail.length < 20) {
      const trailGeo = new SphereGeometry(BALL_RADIUS * 0.5, 4, 4);
      const theme = THEMES[gsm.selectedTheme];
      const trailColor = hasFireball ? '#ff4400' : theme.glow;
      const trailMat = new MeshBasicMaterial({
        color: new Color(trailColor), transparent: true, opacity: 0.3,
        blending: AdditiveBlending,
      });
      const trailMesh = new Mesh(trailGeo, trailMat);
      trailMesh.position.copy(ball.mesh.position);
      world.scene.add(trailMesh);
      ball.trail.push(trailMesh);
    }
    // Fade trail
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
    // Bob
    pu.mesh.position.x = pu.x + Math.sin(performance.now() * 0.003) * 0.02;

    // Paddle collision
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

    // Fell off screen
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

    // Brick collision
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

    // Off screen
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
    p.vy -= 1.5 * dt; // gravity
    const mat = p.mesh.material as MeshBasicMaterial;
    mat.opacity = (p.life / p.maxLife) * 0.8;
    if (p.life <= 0) {
      p.active = false;
      world.scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }

  // Time attack mode check
  if (gsm.mode === 'timeattack') {
    const elapsed = (Date.now() - gsm.levelStartTime) / 1000;
    if (elapsed >= 90) {
      onGameOver();
    }
  }

  // Endurance achievement
  if ((Date.now() - gsm.sessionStartTime) / 60000 >= 20) {
    checkAchievement('endurance');
  }

  updateHUD();
}

// ─── Level Management ───
function startLevel() {
  // Clear balls
  activeBalls.forEach(b => {
    b.active = false;
    b.mesh.visible = false;
    b.glow.visible = false;
    b.trail.forEach(t => world.scene.remove(t));
  });
  activeBalls.length = 0;

  // Clear powerups
  activePowerUps.forEach(pu => {
    pu.active = false;
    pu.mesh.visible = false;
  });
  activePowerUps.length = 0;

  // Clear lasers
  laserBeams.forEach(l => {
    l.active = false;
    l.mesh.visible = false;
  });
  laserBeams.length = 0;

  // Reset power-up states
  hasLaser = false;
  hasFireball = false;
  hasMagnet = false;
  magnetBall = null;
  slowTimer = 0;
  fireballTimer = 0;
  laserTimer = 0;
  wideTimer = 0;
  paddleWidthMult = 1;
  updatePaddleScale();

  const levels = getLevels();
  const levelIdx = ((gsm.level - 1) % levels.length);
  const levelData = levels[levelIdx];

  spawnLevel(levelData);

  hideUI('levelcomplete');
  showUI('hud');

  // Start countdown
  gsm.state = 'countdown';
  countdownVal = 3;
  countdownTimer = 1;
  showUI('countdown');
  updateCountdown();
  audio.playCountdownTick();
}

function onLevelComplete() {
  gsm.state = 'levelcomplete';
  levelCompleteTimer = 2.5;
  audio.playLevelComplete();

  const elapsed = (Date.now() - gsm.levelStartTime) / 1000;
  if (elapsed < 30) checkAchievement('speed_clear');
  if (gsm.ballsLost === 0) checkAchievement('no_miss');

  if (gsm.level >= 5) checkAchievement('level_5');
  if (gsm.level >= 10) checkAchievement('level_10');

  showUI('levelcomplete');
  updateLevelComplete();
}

function onGameOver() {
  gsm.state = 'gameover';
  audio.playGameOver();
  gsm.addToLeaderboard();
  showUI('gameover');
  updateGameOver();
}

// ─── Input ───
let mouseX = 0;
let laserCooldown = 0;

function setupInputListeners() {
  // Browser mouse
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
  });
}

function updatePaddleFromInput() {
  // Browser: mouse
  const halfField = FIELD_WIDTH / 2 - PADDLE_WIDTH * paddleWidthMult / 2;
  let targetX = mouseX;

  // XR: right controller
  try {
    const xr = (world.input as any).xr;
    if (xr) {
      const rightGrip = (world as any).playerSpaceEntities?.gripSpaces?.get?.('right');
      if (rightGrip?.object3D) {
        targetX = rightGrip.object3D.position.x;
      }
    }
  } catch { /* no XR */ }

  // Keyboard
  if (world.input.keyboard.getKeyPressed('KeyA') || world.input.keyboard.getKeyPressed('ArrowLeft')) {
    targetX = paddleMesh.position.x - 2.5 * 0.016;
  }
  if (world.input.keyboard.getKeyPressed('KeyD') || world.input.keyboard.getKeyPressed('ArrowRight')) {
    targetX = paddleMesh.position.x + 2.5 * 0.016;
  }

  // Clamp
  targetX = Math.max(-halfField, Math.min(halfField, targetX));
  paddleMesh.position.x += (targetX - paddleMesh.position.x) * 0.2;

  // XR trigger for laser/magnet release
  try {
    const xr = (world.input as any).xr;
    if (xr) {
      // Trigger press
    }
  } catch { /* */ }

  // Laser cooldown
  if (laserCooldown > 0) laserCooldown -= 0.016;
}

// ─── UI Setup ───
function setupUI() {
  const panels: { name: string; config: string; maxW: number; maxH: number; mode: 'world' | 'hud' | 'screen'; pos?: [number, number, number]; offset?: [number, number, number] }[] = [
    { name: 'title', config: '/ui/title.json', maxW: 0.9, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'modeselect', config: '/ui/modeselect.json', maxW: 0.9, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'difficulty', config: '/ui/difficulty.json', maxW: 0.7, maxH: 0.5, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'hud', config: '/ui/hud.json', maxW: 0.35, maxH: 0.12, mode: 'hud', offset: [0, 0.22, -0.5] },
    { name: 'pause', config: '/ui/pause.json', maxW: 0.6, maxH: 0.5, mode: 'world', pos: [0, 1.5, -1.8] },
    { name: 'gameover', config: '/ui/gameover.json', maxW: 0.8, maxH: 0.6, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'levelcomplete', config: '/ui/levelcomplete.json', maxW: 0.6, maxH: 0.4, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'leaderboard', config: '/ui/leaderboard.json', maxW: 0.8, maxH: 0.7, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'achievements', config: '/ui/achievements.json', maxW: 0.9, maxH: 0.8, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'settings', config: '/ui/settings.json', maxW: 0.8, maxH: 0.6, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'help', config: '/ui/help.json', maxW: 0.9, maxH: 0.8, mode: 'world', pos: [0, 1.5, -2] },
    { name: 'toast', config: '/ui/toast.json', maxW: 0.3, maxH: 0.06, mode: 'hud', offset: [0, -0.08, -0.5] },
    { name: 'countdown', config: '/ui/countdown.json', maxW: 0.25, maxH: 0.15, mode: 'hud', offset: [0, 0, -0.5] },
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

  // Show title on start
  setTimeout(() => {
    showUI('title');
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
      const btnPlay = titleDoc.getElementById('btn-play');
      btnPlay?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('modeselect'); });
      const btnLb = titleDoc.getElementById('btn-leaderboard');
      btnLb?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('leaderboard'); updateLeaderboard(); });
      const btnAch = titleDoc.getElementById('btn-achievements');
      btnAch?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('achievements'); updateAchievements(); });
      const btnSet = titleDoc.getElementById('btn-settings');
      btnSet?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('settings'); updateSettings(); });
      const btnHelp = titleDoc.getElementById('btn-help');
      btnHelp?.addEventListener('click', () => { audio.playButtonClick(); hideUI('title'); showUI('help'); });
    } else { allReady = false; }

    // Mode select
    const modeDoc = getDoc('modeselect');
    if (modeDoc) {
      const modes: { id: string; mode: GameStateManager['mode'] }[] = [
        { id: 'btn-classic', mode: 'classic' },
        { id: 'btn-endless', mode: 'endless' },
        { id: 'btn-timeattack', mode: 'timeattack' },
        { id: 'btn-zen', mode: 'zen' },
      ];
      for (const m of modes) {
        const btn = modeDoc.getElementById(m.id);
        btn?.addEventListener('click', () => {
          audio.playButtonClick();
          gsm.mode = m.mode;
          hideUI('modeselect');
          showUI('difficulty');
        });
      }
      const btnBack = modeDoc.getElementById('btn-back');
      btnBack?.addEventListener('click', () => { audio.playButtonClick(); hideUI('modeselect'); showUI('title'); });
    } else { allReady = false; }

    // Difficulty
    const diffDoc = getDoc('difficulty');
    if (diffDoc) {
      const diffs: { id: string; diff: GameStateManager['difficulty'] }[] = [
        { id: 'btn-easy', diff: 'easy' },
        { id: 'btn-medium', diff: 'medium' },
        { id: 'btn-hard', diff: 'hard' },
      ];
      for (const d of diffs) {
        const btn = diffDoc.getElementById(d.id);
        btn?.addEventListener('click', () => {
          audio.playButtonClick();
          gsm.difficulty = d.diff;
          hideAllUI();
          gsm.resetGame();
          gsm.themesUsed.add(gsm.selectedTheme);
          if (gsm.themesUsed.size >= 5) checkAchievement('all_themes');
          startLevel();
        });
      }
      const btnBack = diffDoc.getElementById('btn-back');
      btnBack?.addEventListener('click', () => { audio.playButtonClick(); hideUI('difficulty'); showUI('modeselect'); });
    } else { allReady = false; }

    // Pause
    const pauseDoc = getDoc('pause');
    if (pauseDoc) {
      const btnResume = pauseDoc.getElementById('btn-resume');
      btnResume?.addEventListener('click', () => { audio.playButtonClick(); gsm.state = 'playing'; hideUI('pause'); });
      const btnQuit = pauseDoc.getElementById('btn-quit');
      btnQuit?.addEventListener('click', () => { audio.playButtonClick(); hideAllUI(); gsm.state = 'title'; showUI('title'); });
    } else { allReady = false; }

    // Game over
    const goDoc = getDoc('gameover');
    if (goDoc) {
      const btnRematch = goDoc.getElementById('btn-rematch');
      btnRematch?.addEventListener('click', () => { audio.playButtonClick(); hideAllUI(); gsm.resetGame(); startLevel(); });
      const btnTitle = goDoc.getElementById('btn-title');
      btnTitle?.addEventListener('click', () => { audio.playButtonClick(); hideAllUI(); gsm.state = 'title'; showUI('title'); });
    } else { allReady = false; }

    // Leaderboard
    const lbDoc = getDoc('leaderboard');
    if (lbDoc) {
      const btnBack = lbDoc.getElementById('btn-back');
      btnBack?.addEventListener('click', () => { audio.playButtonClick(); hideUI('leaderboard'); showUI('title'); });
    } else { allReady = false; }

    // Achievements
    const achDoc = getDoc('achievements');
    if (achDoc) {
      const btnBack = achDoc.getElementById('btn-back');
      btnBack?.addEventListener('click', () => { audio.playButtonClick(); hideUI('achievements'); showUI('title'); });
    } else { allReady = false; }

    // Settings
    const setDoc = getDoc('settings');
    if (setDoc) {
      const btnBack = setDoc.getElementById('btn-back');
      btnBack?.addEventListener('click', () => { audio.playButtonClick(); hideUI('settings'); showUI('title'); });
      // Volume controls
      ['master', 'sfx', 'music'].forEach(cat => {
        const up = setDoc.getElementById(`btn-${cat}-up`);
        const down = setDoc.getElementById(`btn-${cat}-down`);
        up?.addEventListener('click', () => {
          audio.playButtonClick();
          if (cat === 'master') gsm.masterVolume = Math.min(1, gsm.masterVolume + 0.1);
          if (cat === 'sfx') gsm.sfxVolume = Math.min(1, gsm.sfxVolume + 0.1);
          if (cat === 'music') gsm.musicVolume = Math.min(1, gsm.musicVolume + 0.1);
          audio.setVolumes(gsm.masterVolume, gsm.sfxVolume, gsm.musicVolume);
          gsm.savePersistence();
          updateSettings();
        });
        down?.addEventListener('click', () => {
          audio.playButtonClick();
          if (cat === 'master') gsm.masterVolume = Math.max(0, gsm.masterVolume - 0.1);
          if (cat === 'sfx') gsm.sfxVolume = Math.max(0, gsm.sfxVolume - 0.1);
          if (cat === 'music') gsm.musicVolume = Math.max(0, gsm.musicVolume - 0.1);
          audio.setVolumes(gsm.masterVolume, gsm.sfxVolume, gsm.musicVolume);
          gsm.savePersistence();
          updateSettings();
        });
      });
      // Theme
      const themePrev = setDoc.getElementById('btn-theme-prev');
      const themeNext = setDoc.getElementById('btn-theme-next');
      themePrev?.addEventListener('click', () => {
        audio.playButtonClick();
        gsm.selectedTheme = (gsm.selectedTheme - 1 + THEMES.length) % THEMES.length;
        gsm.savePersistence();
        updateSettings();
      });
      themeNext?.addEventListener('click', () => {
        audio.playButtonClick();
        gsm.selectedTheme = (gsm.selectedTheme + 1) % THEMES.length;
        gsm.savePersistence();
        updateSettings();
      });
    } else { allReady = false; }

    // Help
    const helpDoc = getDoc('help');
    if (helpDoc) {
      const btnBack = helpDoc.getElementById('btn-back');
      btnBack?.addEventListener('click', () => { audio.playButtonClick(); hideUI('help'); showUI('title'); });
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
function updateHUD() {
  const doc = getDoc('hud');
  setText(doc, 'score-val', String(gsm.score));
  setText(doc, 'lives-val', String(gsm.lives));
  setText(doc, 'level-val', String(gsm.level));
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
  setText(doc, 'level-name', getLevels()[(gsm.level - 1) % getLevels().length].name);
  setText(doc, 'score-val', String(gsm.score));
  setText(doc, 'combo-val', `Best: x${gsm.maxCombo}`);
}

function updateGameOver() {
  const doc = getDoc('gameover');
  setText(doc, 'title-text', gsm.lives <= 0 ? 'GAME OVER' : 'TIME UP!');
  setText(doc, 'score-val', String(gsm.score));
  setText(doc, 'level-val', `Level ${gsm.level}`);
  setText(doc, 'bricks-val', `${gsm.bricksDestroyed} bricks`);
  setText(doc, 'combo-val', `Best combo: x${gsm.maxCombo}`);
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
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i];
    const unlocked = gsm.achievements[a.id] || false;
    setText(doc, `ach-${i}`, `${unlocked ? '[*]' : '[ ]'} ${a.name} - ${a.desc}`);
  }
}

function updateSettings() {
  const doc = getDoc('settings');
  setText(doc, 'master-val', `${Math.round(gsm.masterVolume * 100)}%`);
  setText(doc, 'sfx-val', `${Math.round(gsm.sfxVolume * 100)}%`);
  setText(doc, 'music-val', `${Math.round(gsm.musicVolume * 100)}%`);
  setText(doc, 'theme-val', THEMES[gsm.selectedTheme].name);
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
