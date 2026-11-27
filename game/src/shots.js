// Gobble Run — the screenshot scenes behind ?shot=title|play|escaped|caught.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot, so the frame is what a
// real game looks like and the same seed always gives the same frame.
import { LANES, STEP, TURKEY } from './config.js';
import { EVENT_CAUGHT, EVENT_ESCAPED, KIND_KNIFE, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE, createWorld, reset, step } from './world.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 24;
const LIMIT_SECONDS = 600;
const JUMP_WINDOW = 150;

/**
 * The autopilot's move for this step. `skill` is how far ahead it looks:
 * the play and escaped scenes look well ahead and survive; the caught
 * scene barely looks ahead and never jumps, so it stumbles until the
 * farmer catches it, the way a hurried player does.
 *
 * Threats are judged the way the collisions work: a bale or fence in a
 * lane threatens that lane on the ground (jumpable); an oven threatens
 * its lane outright; a falling knife threatens whichever lane its blade
 * will be crossing when it reaches the turkey's x, so the pilot works
 * out where the blade will be, not which lane it was spawned in.
 */
function threatInLane(world, lane, horizonPx) {
  let nearest = Infinity;
  let nearestKind = null;
  for (const item of world.items) {
    if (!item.active) continue;
    const dx = item.x - TURKEY.x;
    // An item counts until its right edge has passed the turkey's left
    // edge: a wide bale 43 px behind the turkey's nose still overlaps it,
    // so a fixed -40 px cut-off would call a lane clear that is not.
    if (item.x + item.width < TURKEY.x || dx > horizonPx) continue;
    if (item.kind === 'corn' || item.kind === 'feather') continue;
    if (item.kind === KIND_KNIFE) {
      // Where the blade will be when it reaches the turkey's x, checked
      // against the turkey's box where it is right now (its current jump
      // height included): a knife that would miss a grounded turkey can
      // still catch one mid-jump, and the pilot must know that.
      const tCross = dx / world.speed;
      const yAt = item.y + item.vy * tCross;
      const top = LANES[lane] + world.y - TURKEY.height;
      const bottom = LANES[lane] + world.y;
      if (yAt + 54 > top && yAt < bottom && dx < nearest) {
        nearest = dx;
        nearestKind = item.kind;
      }
      continue;
    }
    if (item.lane !== lane) continue;
    if (dx < nearest) {
      nearest = dx;
      nearestKind = item.kind;
    }
  }
  return { dx: nearest, kind: nearestKind };
}

/**
 * Would jumping right now carry the turkey into a falling knife? The jump
 * follows y(t) = -640 t + 950 t^2, so the pilot can work out exactly where
 * the turkey will be when each blade reaches its x, and refuse the jump.
 */
function jumpWouldHitKnife(world, lane, horizonPx) {
  for (const item of world.items) {
    if (!item.active || item.kind !== KIND_KNIFE) continue;
    const dx = item.x - TURKEY.x;
    if (item.x + item.width < TURKEY.x || dx > horizonPx) continue;
    const tCross = dx / world.speed;
    const ty = -640 * tCross + 950 * tCross * tCross;
    if (ty >= 0) continue; // landed again by the time the blade arrives
    const yAt = item.y + item.vy * tCross;
    const top = LANES[lane] + ty - TURKEY.height;
    const bottom = LANES[lane] + ty;
    if (yAt + 54 > top && yAt < bottom) return true;
  }
  return false;
}

function autopilot(world, skill) {
  const here = threatInLane(world, world.lane, skill);
  let jump = false;
  let lane = 0;
  if (here.dx !== Infinity) {
    // A hazard is coming in our lane. Jump it if it is a low ground
    // obstacle close enough and no knife waits above the jump arc;
    // otherwise step into the adjacent lane whose nearest threat is
    // furthest away — a lane the pilot can actually reach this step,
    // not a distant safe lane two steps away.
    if ((here.kind === 'bale' || here.kind === 'fence') && here.dx < JUMP_WINDOW && world.onGround
      && !jumpWouldHitKnife(world, world.lane, skill)) {
      jump = true;
    } else {
      let bestLane = world.lane;
      let bestDx = here.dx;
      for (const l of [world.lane - 1, world.lane + 1]) {
        if (l < 0 || l > 2) continue;
        const t = threatInLane(world, l, skill);
        if (t.dx > bestDx) {
          bestDx = t.dx;
          bestLane = l;
        }
      }
      lane = bestLane > world.lane ? 1 : bestLane < world.lane ? -1 : 0;
    }
  }
  // Chase corn only when the step into the next lane is clear too: the
  // pilot must not step through a lane a hazard is already crossing.
  if (!jump && lane === 0) {
    let corn = null;
    for (const item of world.items) {
      if (!item.active || item.kind !== 'corn') continue;
      const dx = item.x - TURKEY.x;
      if (dx > 0 && dx < 320 && (corn === null || dx < corn.x - TURKEY.x)) corn = item;
    }
    if (corn && threatInLane(world, corn.lane, skill).dx === Infinity) {
      const stepLane = corn.lane > world.lane ? world.lane + 1 : corn.lane < world.lane ? world.lane - 1 : world.lane;
      if (stepLane !== world.lane && threatInLane(world, stepLane, 220).dx === Infinity) {
        lane = stepLane > world.lane ? 1 : -1;
      }
    }
  }
  return { lane, jump };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any other name stages the title.
 */
export function stageShot(name, world) {
  reset(world);
  if (name !== 'play' && name !== 'escaped' && name !== 'caught') {
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) {
      world.time += STEP;
      world.runPhase += STEP * 4;
    }
    world.shake = 0;
    return { screen: SCREEN_TITLE };
  }
  world.screen = SCREEN_PLAY;
  const skill = name === 'caught' ? 40 : 300;
  for (let i = 0; i < LIMIT_SECONDS / STEP; i += 1) {
    const move = name === 'caught' ? { lane: 0, jump: false } : autopilot(world, skill);
    const events = step(world, STEP, move);
    if (name === 'play' && world.time >= PLAY_SECONDS) break;
    if (events & EVENT_CAUGHT) break;
    if (events & EVENT_ESCAPED) break;
  }
  world.shake = 0;
  world.banner = 0;
  if (world.screen === SCREEN_CAUGHT) return { screen: SCREEN_CAUGHT };
  if (world.screen === SCREEN_ESCAPED) return { screen: SCREEN_ESCAPED };
  return { screen: SCREEN_PLAY };
}

export { createWorld };
