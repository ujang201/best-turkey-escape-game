// Gobble Run — shared constants: one place for every number the world,
// the renderer and the screenshot staging agree on.
export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 478;
export const LANES = [398, 438, 478];
export const TURKEY = { x: 220, width: 56, height: 64 };
export const JUMP_VY = -640;
export const GRAVITY = 1900;
export const STEP = 1 / 60;
export const ESCAPE_DISTANCE = 1400;
export const START_LIVES = 3;
export const FARMER_START_GAP = 300;
export const FARMER_STUMBLE_COST = 95;
export const FARMER_REGEN = 14;
export const FARMER_CATCH_GAP = 40;

export const STAGES = [
  {
    name: 'The Farmyard',
    until: 400,
    skyTop: '#f7b733',
    skyBottom: '#fbd38d',
    ground: '#8a6d3b',
    groundTop: '#a67c52',
    accent: '#7a9a4d',
  },
  {
    name: 'The Barn',
    until: 900,
    skyTop: '#e07840',
    skyBottom: '#f2b880',
    ground: '#6e4a2f',
    groundTop: '#8a5a35',
    accent: '#b8452c',
  },
  {
    name: 'The Kitchen',
    until: 1400,
    skyTop: '#d95f4b',
    skyBottom: '#f6c177',
    ground: '#5d4037',
    groundTop: '#795548',
    accent: '#c62828',
  },
];

export const SCORE = {
  corn: 100,
  feather: 250,
  stageBonus: 200,
  perMetre: 2,
};
