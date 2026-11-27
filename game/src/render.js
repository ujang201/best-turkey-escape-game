// Gobble Run — everything the player sees: the autumn farm, the barn, the
// kitchen, the turkey, the farmer, the obstacles, the HUD and the screens.
// All art is drawn in code (no image files): flat autumn colours, a turkey
// with a fanned tail, a farmer in overalls with a pitchfork.
import { GROUND_Y, LANES, STAGES, TURKEY, VIEW } from './config.js';
import { KIND_BALE, KIND_CORN, KIND_FEATHER, KIND_FENCE, KIND_KNIFE, KIND_OVEN, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, world) {
  const stage = STAGES[world.stage];
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(0.62, stage.skyBottom);
  g.addColorStop(0.62, stage.groundTop);
  g.addColorStop(1, stage.ground);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Sun.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(820, 74, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
  ctx.beginPath();
  ctx.arc(820, 74, 52, 0, Math.PI * 2);
  ctx.fill();
  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 250, 240, 0.85)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 280 + world.distance * 12 - world.time * 6) % 1150 + 1150) % 1150 - 90;
    const cy = 46 + i * 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, cy + 6, 38, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBackdrop(ctx, world) {
  const stage = world.stage;
  const off = world.distance * 30;
  ctx.save();
  if (stage === 0) {
    // Rolling hills, a fence line and autumn trees.
    ctx.fillStyle = '#6f8f3e';
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 260 - off * 0.4) % 1200 + 1200) % 1200 - 120;
      ctx.beginPath();
      ctx.ellipse(x, 356, 190, 52, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5d7a33';
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 330 - off * 0.6) % 1250 + 1250) % 1250 - 100;
      ctx.fillRect(x, 300, 10, 56);
      ctx.fillStyle = '#c2571f';
      ctx.beginPath();
      ctx.arc(x + 5, 288, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e07840';
      ctx.beginPath();
      ctx.arc(x - 16, 296, 18, 0, Math.PI * 2);
      ctx.arc(x + 24, 296, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d7a33';
    }
  } else if (stage === 1) {
    // Barn wall, beams and hanging hay.
    ctx.fillStyle = '#7a3b26';
    ctx.fillRect(0, 96, VIEW.width, 262);
    ctx.fillStyle = '#8a4630';
    for (let x = -((off * 0.5) % 120); x < VIEW.width; x += 120) {
      ctx.fillRect(x, 96, 10, 262);
    }
    ctx.fillStyle = '#5d2b1c';
    ctx.fillRect(0, 96, VIEW.width, 14);
    ctx.fillRect(0, 210, VIEW.width, 10);
    ctx.fillStyle = '#d9a441';
    for (let i = 0; i < 4; i += 1) {
      const x = ((i * 300 - off * 0.3) % 1150 + 1150) % 1150 - 80;
      ctx.beginPath();
      ctx.ellipse(x, 150, 46, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Kitchen: tiled wall, a window, hanging pans.
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(0, 60, VIEW.width, 298);
    ctx.strokeStyle = 'rgba(120, 90, 60, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 60; y < 358; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < VIEW.width; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, 358);
      ctx.stroke();
    }
    ctx.fillStyle = '#bcd8e8';
    roundRect(ctx, 700, 96, 170, 130, 10);
    ctx.fill();
    ctx.fillStyle = '#f7b733';
    ctx.beginPath();
    ctx.arc(760, 140, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5a3a';
    ctx.lineWidth = 6;
    ctx.strokeRect(700, 96, 170, 130);
    ctx.fillStyle = '#4a4a4a';
    for (let i = 0; i < 3; i += 1) {
      const x = 120 + i * 90;
      ctx.beginPath();
      ctx.arc(x, 120, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2f2f2f';
      ctx.fillRect(x - 3, 96, 6, 22);
      ctx.fillStyle = '#4a4a4a';
    }
  }
  ctx.restore();
  // Ground with scrolling tufts.
  ctx.fillStyle = STAGES[stage].groundTop;
  ctx.fillRect(0, 358, VIEW.width, 182);
  ctx.fillStyle = STAGES[stage].ground;
  ctx.fillRect(0, 372, VIEW.width, 168);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 24; i += 1) {
    const x = ((i * 97 - off) % 1050 + 1050) % 1050 - 45;
    const y = 392 + ((i * 53) % 130);
    ctx.fillRect(x, y, 26, 5);
  }
}

function drawTurkey(ctx, x, feetY, phase, invuln, time) {
  ctx.save();
  ctx.translate(x, feetY);
  if (invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
  const bob = Math.sin(phase * 2) * 2;
  const legSwing = Math.sin(phase) * 9;
  // Legs.
  ctx.strokeStyle = '#e07840';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -16 + bob);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -16 + bob);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Fanned tail feathers.
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate((i * 0.42) - 0.15);
    ctx.fillStyle = i % 2 === 0 ? '#8d5a2b' : '#a06a35';
    ctx.beginPath();
    ctx.ellipse(-26, -34, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d3a1a';
    ctx.beginPath();
    ctx.ellipse(-26, -52, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(0, -30 + bob, 26, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath();
  ctx.ellipse(2, -26 + bob, 18, 14, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath();
  ctx.ellipse(-2, -28 + bob + Math.sin(phase * 2) * 2, 13, 9, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Head, beak, wattle, eye.
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath();
  ctx.arc(22, -52 + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e07840';
  ctx.beginPath();
  ctx.moveTo(32, -54 + bob);
  ctx.lineTo(44, -50 + bob);
  ctx.lineTo(32, -47 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c62828';
  ctx.beginPath();
  ctx.ellipse(30, -42 + bob, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(25, -55 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFarmer(ctx, x, feetY, phase, gap) {
  // The farmer runs in from the left; the smaller the gap, the closer he is.
  const visible = Math.max(0, 1 - gap / 320);
  if (visible <= 0.02) return;
  const fx = x - gap * 0.9;
  ctx.save();
  ctx.globalAlpha = 0.35 + visible * 0.65;
  ctx.translate(fx, feetY);
  const swing = Math.sin(phase * 1.4) * 8;
  // Legs (blue overalls).
  ctx.strokeStyle = '#2e4a7a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-4, -34);
  ctx.lineTo(-4 + swing, 0);
  ctx.moveTo(6, -34);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#3a5a8c';
  roundRect(ctx, -14, -66, 30, 36, 8);
  ctx.fill();
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(-14, -58, 30, 8);
  // Head and straw hat.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(4, -76, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(4, -84, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-6, -98, 20, 14);
  // Angry eyes.
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(6, -80, 3, 3);
  ctx.fillRect(12, -80, 3, 3);
  // Pitchfork.
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(18, -30);
  ctx.lineTo(30, -84);
  ctx.stroke();
  ctx.strokeStyle = '#b0b8c0';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(30 + i * 6, -84);
    ctx.lineTo(30 + i * 6, -98);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBale(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.arc(0, -23, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a67c2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -23, 17, 0, Math.PI * 2);
  ctx.arc(0, -23, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFence(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(-23, -54, 6, 54);
  ctx.fillRect(17, -54, 6, 54);
  ctx.fillRect(-26, -48, 52, 7);
  ctx.fillRect(-26, -28, 52, 7);
  ctx.restore();
}

function drawKnife(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y + 27);
  ctx.rotate(item.spin);
  ctx.fillStyle = '#cfd8dc';
  ctx.beginPath();
  ctx.moveTo(-5, -26);
  ctx.lineTo(5, -26);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#37474f';
  ctx.fillRect(-6, -34, 12, 10);
  ctx.restore();
}

function drawOven(ctx, item, time) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = '#616161';
  roundRect(ctx, -36, -92, 72, 92, 6);
  ctx.fill();
  ctx.fillStyle = '#37474f';
  roundRect(ctx, -28, -84, 56, 40, 4);
  ctx.fill();
  const flicker = 0.6 + (Math.sin(time * 9 + item.x * 0.13) * 0.5 + 0.5) * 0.4;
  ctx.fillStyle = `rgba(255, ${Math.floor(120 + flicker * 60)}, 40, 0.9)`;
  roundRect(ctx, -20, -76, 40, 24, 3);
  ctx.fill();
  ctx.fillStyle = '#212121';
  ctx.fillRect(-30, -36, 60, 8);
  ctx.fillStyle = '#ff5722';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', 0, -58);
  ctx.restore();
}

function drawCorn(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = '#fdd835';
  ctx.beginPath();
  ctx.ellipse(0, -16, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7cb342';
  ctx.beginPath();
  ctx.ellipse(-8, -6, 5, 12, 0.5, 0, Math.PI * 2);
  ctx.ellipse(8, -6, 5, 12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFeather(ctx, item, time) {
  ctx.save();
  ctx.translate(item.x, item.y + Math.sin(time * 3 + item.x) * 4);
  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.ellipse(0, -16, 10, 18, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8f00';
  ctx.beginPath();
  ctx.ellipse(0, -26, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawItems(ctx, world, time) {
  for (const item of world.items) {
    if (!item.active) continue;
    if (item.kind === KIND_BALE) drawBale(ctx, item);
    else if (item.kind === KIND_FENCE) drawFence(ctx, item);
    else if (item.kind === KIND_KNIFE) drawKnife(ctx, item);
    else if (item.kind === KIND_OVEN) drawOven(ctx, item, time);
    else if (item.kind === KIND_CORN) drawCorn(ctx, item);
    else if (item.kind === KIND_FEATHER) drawFeather(ctx, item, time);
  }
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
  roundRect(ctx, 12, 12, 520, 54, 10);
  ctx.fill();
  ctx.fillStyle = '#fff3e0';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${Math.floor(world.score)}`, 26, 36);
  ctx.font = '16px sans-serif';
  ctx.fillText(`${Math.floor(world.distance)} m  ·  ${STAGES[world.stage].name}`, 26, 58);
  // Lives as feathers.
  for (let i = 0; i < world.lives; i += 1) {
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.ellipse(440 + i * 26, 30, 7, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Farmer proximity bar.
  ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
  roundRect(ctx, VIEW.width - 232, 12, 220, 54, 10);
  ctx.fill();
  ctx.fillStyle = '#ffccbc';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', VIEW.width - 220, 32);
  const closeness = 1 - world.farmerGap / 300;
  ctx.fillStyle = closeness > 0.66 ? '#e53935' : closeness > 0.33 ? '#fb8c00' : '#7cb342';
  roundRect(ctx, VIEW.width - 220, 40, 196 * closeness, 12, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, VIEW.width - 220, 40, 196, 12, 6);
  ctx.stroke();
  if (world.shield > 0) {
    ctx.fillStyle = '#fff176';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('SHIELD!', 26, 92);
  }
  if (world.banner > 0) {
    ctx.fillStyle = 'rgba(20, 16, 10, 0.6)';
    roundRect(ctx, 280, 84, 400, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.bannerText, 480, 114);
  }
  ctx.restore();
}

function overlay(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 12, 6, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 480, 190);
  ctx.fillStyle = '#fff3e0';
  ctx.font = '20px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 480, 240 + i * 32));
  ctx.restore();
}

function drawConfetti(ctx, world, dt) {
  for (const c of world.confetti) {
    c.y += c.vy * dt;
    c.x += Math.sin(c.sway + c.y / 40) * 0.8;
    if (c.y > VIEW.height + 10) c.y = -10;
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, 8, 5);
  }
}

export function draw(ctx, world, dt) {
  ctx.save();
  if (world.shake > 0) {
    // Deterministic shake: same world time, same offset, so screenshots
    // of the same staged world are byte-identical.
    const sx = Math.sin(world.time * 91.7) * world.shake * 11;
    const sy = Math.cos(world.time * 113.3) * world.shake * 11;
    ctx.translate(sx, sy);
  }
  drawSky(ctx, world);
  drawBackdrop(ctx, world);
  drawItems(ctx, world, world.time);
  drawFarmer(ctx, TURKEY.x, LANES[world.lane], world.runPhase, world.farmerGap);
  drawTurkey(ctx, TURKEY.x, LANES[world.lane] + world.y, world.runPhase, world.invuln, world.time);

  if (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSED) {
    drawHud(ctx, world);
  }
  if (world.screen === SCREEN_TITLE) {
    overlay(ctx, 'GOBBLE RUN', [
      'The Great Turkey Escape — Thanksgiving is coming.',
      'Outrun the farmer, dodge the oven and the carving knives.',
      'Up / Down or W / S: switch lanes   ·   Space: jump',
      'Grab corn for points, feathers for a second chance.',
      '',
      'Press SPACE or click to run!',
    ], '#ffb300');
  } else if (world.screen === SCREEN_CAUGHT) {
    overlay(ctx, 'CAUGHT!', [
      'The farmer got you — Thanksgiving dinner it is.',
      `Score ${Math.floor(world.score)}  ·  ${Math.floor(world.distance)} m  ·  Best ${world.best}`,
      '',
      'Press SPACE or click to try again!',
    ], '#e53935');
  } else if (world.screen === SCREEN_ESCAPED) {
    drawConfetti(ctx, world, dt);
    overlay(ctx, 'ESCAPED!', [
      'You outran the farmer, the oven and every knife —',
      'no Thanksgiving dinner for you this year!',
      `Score ${Math.floor(world.score)}  ·  Best ${world.best}`,
      '',
      'Press SPACE or click to run again!',
    ], '#7cb342');
  } else if (world.screen === SCREEN_PAUSED) {
    overlay(ctx, 'PAUSED', ['Press P to keep running.'], '#fff3e0');
  }
  ctx.restore();
}
