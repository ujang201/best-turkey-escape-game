// Gobble Run — the game loop: a fixed timestep, the screen state machine,
// input events, sounds, and the ?shot= staging used for screenshots.
// The game is a turkey sprinting from the farmyard to the kitchen, chased
// by the farmer: switch lanes, jump the bales and fences, dodge the falling
// carving knives and the ovens, grab corn and feathers, and reach 1400 m.
import { STEP, VIEW } from './config.js';
import { Input } from './input.js';
import { play, toggleMute, unlockAudio } from './audio.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_CAUGHT,
  EVENT_CORN,
  EVENT_ESCAPED,
  EVENT_FEATHER,
  EVENT_JUMP,
  EVENT_STAGE,
  EVENT_STUMBLE,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createWorld,
  reset,
  step,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1) || 1;
const shot = params.get('shot');
const world = createWorld(seed);
const input = new Input(canvas);
let screenBeforePause = SCREEN_PLAY;
let last = performance.now();
let acc = 0;

function setScreen(next) {
  world.screen = next;
  if (next === SCREEN_TITLE) status.textContent = 'Gobble Run: title screen. Press Space to run.';
  else if (next === SCREEN_PLAY) status.textContent = 'Gobble Run: playing. Score, distance and lives in the HUD.';
  else if (next === SCREEN_CAUGHT) status.textContent = `Caught! Score ${Math.floor(world.score)}. Press Space to try again.`;
  else if (next === SCREEN_ESCAPED) status.textContent = `Escaped! Score ${Math.floor(world.score)}. Press Space to run again.`;
}

function startRun() {
  reset(world);
  setScreen(SCREEN_PLAY);
  play('click');
}

function handleEvents(events) {
  for (const event of events) {
    if (event === 'mute') {
      toggleMute();
      continue;
    }
    if (event === 'pause') {
      if (world.screen === SCREEN_PLAY) {
        screenBeforePause = SCREEN_PLAY;
        setScreen(SCREEN_PAUSED);
      } else if (world.screen === SCREEN_PAUSED) {
        setScreen(screenBeforePause);
      }
      continue;
    }
    if (world.screen === SCREEN_TITLE || world.screen === SCREEN_CAUGHT || world.screen === SCREEN_ESCAPED) {
      if (event === 'start' || event === 'jump' || event === 'tap') {
        unlockAudio();
        startRun();
      }
      continue;
    }
    if (world.screen !== SCREEN_PLAY) continue;
    if (event === 'up' || event === 'down' || event === 'jump' || event === 'tap') {
      unlockAudio();
    }
  }
}

function collectMove(events) {
  let lane = 0;
  let jump = false;
  for (const event of events) {
    if (event === 'up') lane -= 1;
    else if (event === 'down') lane += 1;
    else if (event === 'jump' || event === 'tap') jump = true;
  }
  return { lane: Math.max(-1, Math.min(1, lane)), jump };
}

function handleWorldEvents(events) {
  if (events & EVENT_JUMP) play('jump');
  if (events & EVENT_CORN) play('corn');
  if (events & EVENT_FEATHER) play('feather');
  if (events & EVENT_STUMBLE) play('stumble');
  if (events & EVENT_STAGE) play('stage');
  if (events & EVENT_ESCAPED) play('escaped');
  if (events & EVENT_CAUGHT) play('caught');
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  const events = input.drain();
  handleEvents(events);
  if (world.screen === SCREEN_PLAY) {
    const move = collectMove(events);
    while (acc >= STEP) {
      const worldEvents = step(world, STEP, move);
      handleWorldEvents(worldEvents);
      move.lane = 0;
      move.jump = false;
      acc -= STEP;
    }
  } else {
    acc = 0;
    if (world.screen === SCREEN_TITLE) {
      world.time += dt;
      world.runPhase += dt * 4;
    }
    if (world.screen === SCREEN_ESCAPED) world.time += dt;
  }
  draw(ctx, world, dt);
  requestAnimationFrame(frame);
}

fitCanvas();
window.addEventListener('resize', fitCanvas);
setScreen(SCREEN_TITLE);

if (shot) {
  // Screenshot mode: stage the scene synchronously from a fresh world so
  // the captured frame is exactly the staged game, then draw it once and
  // stop — the loop would keep the world (and its clouds and confetti)
  // moving with wall-clock time, and the frame would no longer be the
  // staged one, or the same twice.
  const staged = stageShot(shot, world);
  setScreen(staged.screen);
  draw(ctx, world, 0);
  document.title = `ready:${shot}`;
} else {
  requestAnimationFrame(frame);
}
