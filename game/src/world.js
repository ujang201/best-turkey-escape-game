// Gobble Run — the world: a turkey sprinting from the farmyard to the
// kitchen, three lanes wide, with the farmer closing in behind it.
// Pure logic, no drawing and no clock: step() advances a fixed timestep,
// the renderer draws whatever the state holds, and the seeded RNG makes
// every run from the same seed play out the same way.
import {
  ESCAPE_DISTANCE,
  FARMER_CATCH_GAP,
  FARMER_REGEN,
  FARMER_START_GAP,
  FARMER_STUMBLE_COST,
  GRAVITY,
  GROUND_Y,
  JUMP_VY,
  LANES,
  SCORE,
  STAGES,
  START_LIVES,
  STEP,
  TURKEY,
} from './config.js';
import { chance, makeRng, pick, range } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_STUMBLE = 1;
export const EVENT_CORN = 2;
export const EVENT_FEATHER = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_STAGE = 32;
export const EVENT_JUMP = 64;
export const EVENT_LANE = 128;

export const KIND_BALE = 'bale';
export const KIND_FENCE = 'fence';
export const KIND_KNIFE = 'knife';
export const KIND_OVEN = 'oven';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_PAUSED = 'paused';

function stageIndex(distance) {
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance < STAGES[i].until) return i;
  }
  return STAGES.length - 1;
}

export function createWorld(seed) {
  const world = {
    seed,
    rng: makeRng(seed),
    screen: SCREEN_TITLE,
    time: 0,
    distance: 0,
    score: 0,
    lives: START_LIVES,
    stage: 0,
    speed: 260,
    farmerGap: FARMER_START_GAP,
    invuln: 0,
    shield: 0,
    banner: 0,
    bannerText: '',
    shake: 0,
    lane: 1,
    y: 0,
    vy: 0,
    onGround: true,
    runPhase: 0,
    items: [],
    spawnIn: 1.2,
    featherIn: 42,
    confetti: [],
    best: 0,
  };
  reset(world);
  return world;
}

export function reset(world) {
  world.rng = makeRng(world.seed);
  world.time = 0;
  world.distance = 0;
  world.score = 0;
  world.lives = START_LIVES;
  world.stage = 0;
  world.speed = 260;
  world.farmerGap = FARMER_START_GAP;
  world.invuln = 0;
  world.shield = 0;
  world.banner = 0;
  world.bannerText = '';
  world.shake = 0;
  world.lane = 1;
  world.y = 0;
  world.vy = 0;
  world.onGround = true;
  world.runPhase = 0;
  world.items = [];
  world.spawnIn = 1.2;
  world.featherIn = 42;
  world.confetti = [];
  // A few corn kernels ahead so the first seconds already teach collecting.
  world.items.push(makeItem(world, KIND_CORN, 0, 520, 0));
  world.items.push(makeItem(world, KIND_CORN, 0, 580, 0));
  world.items.push(makeItem(world, KIND_CORN, 1, 700, 0));
}

function makeItem(world, kind, lane, x, y) {
  const base = { kind, lane, x, y, active: true, vy: 0, spin: 0, width: 40, height: 40 };
  if (kind === KIND_BALE) {
    base.width = 52;
    base.height = 46;
    base.y = LANES[lane];
  } else if (kind === KIND_FENCE) {
    base.width = 46;
    base.height = 54;
    base.y = LANES[lane];
  } else if (kind === KIND_KNIFE) {
    base.width = 26;
    base.height = 54;
    base.vy = 400;
    base.y = -60;
    base.spin = range(world.rng, -0.9, 0.9);
  } else if (kind === KIND_OVEN) {
    base.width = 72;
    base.height = 92;
    base.y = LANES[lane];
  } else if (kind === KIND_CORN) {
    base.width = 30;
    base.height = 34;
    base.y = LANES[lane] - 18;
  } else if (kind === KIND_FEATHER) {
    base.width = 34;
    base.height = 40;
    base.y = LANES[lane] - 30;
  }
  return base;
}

function spawnWave(world) {
  const rng = world.rng;
  const stage = world.stage;
  const kinds = [KIND_BALE, KIND_FENCE, KIND_KNIFE];
  if (stage >= 2) kinds.push(KIND_OVEN, KIND_OVEN);
  if (stage >= 1) kinds.push(KIND_KNIFE);
  const lane = Math.floor(rng() * 3);
  const x = 1000 + range(rng, 0, 120);
  world.items.push(makeItem(world, pick(rng, kinds), lane, x, 0));
  // A second obstacle in another lane keeps the player choosing, never
  // blocking all three lanes at once.
  if (chance(rng, 0.22)) {
    const other = (lane + 1 + Math.floor(rng() * 2)) % 3;
    world.items.push(makeItem(world, pick(rng, kinds), other, x + range(rng, 60, 160), 0));
  }
  // Corn trails: three kernels in a row, in a lane that is free for now.
  if (chance(rng, 0.45)) {
    const cornLane = Math.floor(rng() * 3);
    for (let i = 0; i < 3; i += 1) {
      world.items.push(makeItem(world, KIND_CORN, cornLane, x + 180 + i * 48, 0));
    }
  }
}

function turkeyBox(world) {
  return {
    x: TURKEY.x - TURKEY.width / 2 + 6,
    y: LANES[world.lane] + world.y - TURKEY.height + 6,
    width: TURKEY.width - 12,
    height: TURKEY.height - 6,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function itemBox(item) {
  if (item.kind === KIND_KNIFE) {
    return { x: item.x - item.width / 2, y: item.y, width: item.width, height: item.height };
  }
  return { x: item.x - item.width / 2, y: item.y - item.height, width: item.width, height: item.height };
}

function stumble(world) {
  if (world.invuln > 0 || world.shield > 0) return EVENT_NONE;
  world.lives -= 1;
  world.farmerGap -= FARMER_STUMBLE_COST;
  world.invuln = 1.5;
  world.shake = 0.35;
  if (world.lives <= 0 || world.farmerGap <= FARMER_CATCH_GAP) {
    world.screen = SCREEN_CAUGHT;
    return EVENT_STUMBLE | EVENT_CAUGHT;
  }
  return EVENT_STUMBLE;
}

/**
 * Advance the world one fixed step. `move` is { lane: -1|0|1, jump: bool }.
 * Returns a bitmask of EVENT_* for sounds and banners.
 */
export function step(world, dt, move) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  world.time += dt;

  // Speed and distance: faster the further the turkey has run.
  world.speed = Math.min(520, 260 + world.distance * 0.11);
  world.distance += (world.speed * dt) / 28;
  world.score += (world.speed * dt * SCORE.perMetre) / 28;
  world.runPhase += dt * (world.speed / 60);

  // Stage changes come with a banner and a bonus.
  const stage = stageIndex(world.distance);
  if (stage !== world.stage) {
    world.stage = stage;
    world.banner = 2.5;
    world.bannerText = `Stage ${stage + 1}: ${STAGES[stage].name}`;
    world.score += SCORE.stageBonus;
    events |= EVENT_STAGE;
  }
  if (world.banner > 0) world.banner -= dt;
  if (world.shake > 0) world.shake -= dt;

  // The farmer gains whenever the turkey stumbles, and loses ground
  // whenever the turkey runs clean.
  world.farmerGap = Math.min(FARMER_START_GAP, world.farmerGap + FARMER_REGEN * dt);
  if (world.invuln > 0) world.invuln -= dt;
  if (world.shield > 0) world.shield -= dt;

  // Lane changes and jumping.
  if (move.lane !== 0) {
    const next = Math.min(2, Math.max(0, world.lane + move.lane));
    if (next !== world.lane) {
      world.lane = next;
      events |= EVENT_LANE;
    }
  }
  if (move.jump && world.onGround) {
    world.vy = JUMP_VY;
    world.onGround = false;
    events |= EVENT_JUMP;
  }
  if (!world.onGround) {
    world.vy += GRAVITY * dt;
    world.y += world.vy * dt;
    if (world.y >= 0) {
      world.y = 0;
      world.vy = 0;
      world.onGround = true;
    }
  }

  // Spawning.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnWave(world);
    world.spawnIn = Math.max(0.62, 1.15 - world.distance / 2500) * range(world.rng, 0.85, 1.2);
  }
  world.featherIn -= dt;
  if (world.featherIn <= 0) {
    world.items.push(makeItem(world, KIND_FEATHER, Math.floor(world.rng() * 3), 1020, 0));
    world.featherIn = range(world.rng, 38, 55);
  }

  // Move everything left, drop the knives, and resolve collisions.
  const box = turkeyBox(world);
  const scroll = world.speed * dt;
  for (let i = world.items.length - 1; i >= 0; i -= 1) {
    const item = world.items[i];
    if (!item.active) continue;
    item.x -= scroll;
    if (item.kind === KIND_KNIFE) {
      item.y += item.vy * dt;
      item.spin += dt * 2;
    }
    if (item.x < -90 || item.y > GROUND_Y + 40) {
      item.active = false;
      continue;
    }
    if (item.lane !== world.lane && item.kind !== KIND_KNIFE) continue;
    if (item.kind === KIND_KNIFE) {
      // A falling knife threatens any lane it crosses: the turkey dodges
      // it by being somewhere else — another lane, or mid-jump — when the
      // blade passes the turkey's x. Plain box overlap decides it.
      const knifeBox = { x: item.x - 13, y: item.y, width: 26, height: 54 };
      if (overlaps(box, knifeBox)) {
        item.active = false;
        events |= stumble(world);
      }
      continue;
    }
    if (overlaps(box, itemBox(item))) {
      if (item.kind === KIND_CORN) {
        item.active = false;
        world.score += SCORE.corn;
        events |= EVENT_CORN;
      } else if (item.kind === KIND_FEATHER) {
        item.active = false;
        if (world.lives < START_LIVES) world.lives += 1;
        else world.score += SCORE.feather;
        world.shield = 3;
        events |= EVENT_FEATHER;
      } else if (item.kind === KIND_BALE || item.kind === KIND_FENCE) {
        // Jumpable only while the turkey is high enough above the ground.
        if (world.y < -34) continue;
        item.active = false;
        events |= stumble(world);
      } else if (item.kind === KIND_OVEN) {
        item.active = false;
        events |= stumble(world);
      }
    }
  }
  world.items = world.items.filter((item) => item.active);

  // Escape: the turkey outran Thanksgiving.
  if (world.distance >= ESCAPE_DISTANCE) {
    world.screen = SCREEN_ESCAPED;
    world.best = Math.max(world.best, Math.floor(world.score));
    for (let i = 0; i < 90; i += 1) {
      world.confetti.push({
        x: range(world.rng, 0, 960),
        y: range(world.rng, -540, 0),
        vy: range(world.rng, 40, 130),
        sway: range(world.rng, 0, 6.28),
        color: pick(world.rng, ['#f7b733', '#c62828', '#7a9a4d', '#fff3e0', '#e07840']),
      });
    }
    return events | EVENT_ESCAPED;
  }
  if (world.screen === SCREEN_CAUGHT) {
    world.best = Math.max(world.best, Math.floor(world.score));
  }
  return events;
}

export { STEP };
