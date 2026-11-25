// render.js — every pixel of Dapur Kilat: the kitchen, the order board, the
// grill and chopping board, the two assembly plates and the ingredient
// counter, all drawn with canvas shapes (no image assets).

import { DISH_BY_ID, INGREDIENTS, INGREDIENT_BY_ID, SHIFT_SECONDS } from './recipes.js';
import { SCREEN_OVER, SCREEN_TITLE, matchingOrder } from './state.js';

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

const INK = '#2d1a10';
const PAPER = '#fff6e8';
const WOOD = '#a5672f';
const WOOD_DARK = '#7c4a1e';

/** Clickable regions, shared by the drawing below and by input.js. */
export function computeHitAreas() {
  const areas = [];
  INGREDIENTS.forEach((ingredient, index) => {
    areas.push({ kind: 'bin', id: ingredient.id, x: 24 + index * 137, y: 524, w: 128, h: 112 });
  });
  for (let index = 0; index < 3; index += 1) {
    areas.push({ kind: 'grill', index, x: 366 + index * 148, y: 118, w: 132, h: 108 });
  }
  for (let index = 0; index < 2; index += 1) {
    areas.push({ kind: 'board', index, x: 852 + index * 196, y: 118, w: 180, h: 108 });
  }
  areas.push({ kind: 'plate', index: 0, x: 356, y: 268, w: 440, h: 198 });
  areas.push({ kind: 'plate', index: 1, x: 812, y: 268, w: 440, h: 198 });
  areas.push({ kind: 'serve', x: 690, y: 656, w: 176, h: 46 });
  areas.push({ kind: 'switch', x: 878, y: 656, w: 176, h: 46 });
  areas.push({ kind: 'trash', x: 1066, y: 656, w: 176, h: 46 });
  return areas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'left', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** One ingredient, drawn as its own little food shape centred on (cx, cy). */
export function drawIngredientShape(ctx, id, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = '#f2c063';
    ctx.beginPath(); ctx.arc(0, s * 0.18, s * 0.52, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99a35'; ctx.fillRect(-s * 0.52, s * 0.14, s * 1.04, s * 0.14);
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath(); ctx.ellipse(-s * 0.18, -s * 0.22, s * 0.06, s * 0.035, 0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.15, -s * 0.3, s * 0.06, s * 0.035, -0.4, 0, 7); ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = '#8a4b2a';
    roundRect(ctx, -s * 0.55, -s * 0.22, s * 1.1, s * 0.44, s * 0.2); ctx.fill();
    ctx.strokeStyle = '#5f3018'; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.05); ctx.lineTo(s * 0.3, -s * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.1); ctx.lineTo(s * 0.3, s * 0.1); ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffcf3f';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.3); ctx.lineTo(s * 0.5, -s * 0.3); ctx.lineTo(s * 0.34, s * 0.34); ctx.lineTo(-s * 0.34, s * 0.34);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0a81c';
    ctx.beginPath(); ctx.arc(-s * 0.16, 0, s * 0.09, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.2, s * 0.12, s * 0.07, 0, 7); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#69b84c';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.24, Math.sin(a) * s * 0.2, s * 0.26, s * 0.18, a, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#8fd06e';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, 7); ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e84c3d';
    ctx.beginPath(); ctx.arc(0, s * 0.06, s * 0.46, 0, 7); ctx.fill();
    ctx.fillStyle = '#3f7d2c';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42); ctx.lineTo(s * 0.12, -s * 0.2); ctx.lineTo(s * 0.3, -s * 0.26);
    ctx.lineTo(s * 0.16, -s * 0.08); ctx.lineTo(s * 0.3, s * 0.02); ctx.lineTo(0, -s * 0.1);
    ctx.lineTo(-s * 0.3, s * 0.02); ctx.lineTo(-s * 0.16, -s * 0.08); ctx.lineTo(-s * 0.3, -s * 0.26);
    ctx.lineTo(-s * 0.12, -s * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-s * 0.16, -s * 0.05, s * 0.1, s * 0.16, 0.5, 0, 7); ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fdf3d8';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.52, s * 0.38, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.arc(s * 0.05, 0, s * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath(); ctx.arc(0, -s * 0.05, s * 0.08, 0, 7); ctx.fill();
  } else if (id === 'rice') {
    ctx.fillStyle = '#f7f2e6';
    ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.48, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cfc4a8'; ctx.lineWidth = s * 0.04;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * s * 0.16, -s * 0.3 + Math.abs(i) * s * 0.06);
      ctx.lineTo(i * s * 0.16 + s * 0.07, -s * 0.16 + Math.abs(i) * s * 0.06); ctx.stroke();
    }
    ctx.fillStyle = '#b8433a'; ctx.fillRect(-s * 0.55, s * 0.08, s * 1.1, s * 0.3);
  } else if (id === 'chicken') {
    ctx.fillStyle = '#c97b3f';
    ctx.beginPath(); ctx.ellipse(-s * 0.05, -s * 0.05, s * 0.42, s * 0.3, -0.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#f3e2c7'; ctx.lineWidth = s * 0.11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * 0.22, s * 0.18); ctx.lineTo(s * 0.46, s * 0.4); ctx.stroke();
    ctx.fillStyle = '#f3e2c7';
    ctx.beginPath(); ctx.arc(s * 0.5, s * 0.44, s * 0.1, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.38, s * 0.52, s * 0.09, 0, 7); ctx.fill();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#c22f1d';
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, s * 0.3);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.25, -s * 0.12, -s * 0.2);
    ctx.quadraticCurveTo(0, -s * 0.5, s * 0.14, -s * 0.18);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.22, s * 0.45, s * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff7a4d';
    ctx.beginPath(); ctx.arc(-s * 0.12, s * 0.05, s * 0.07, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.18, s * 0.14, s * 0.055, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawKitchenBackdrop(ctx) {
  ctx.fillStyle = '#f3dfba';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#e8cfa0';
  for (let x = 0; x < VIEW_WIDTH; x += 64) for (let y = 64; y < 250; y += 46) {
    if ((x / 64 + y / 46) % 2 === 0) ctx.fillRect(x + 2, y + 2, 60, 42);
  }
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(0, 640, VIEW_WIDTH, 80);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 0; x < VIEW_WIDTH; x += 90) ctx.fillRect(x, 640, 3, 80);
  text(ctx, 'DAPUR KILAT · SIZZLE STALL', 173, 31, 19, '#7c4a1e', 'center');
}

function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(45,26,16,0.85)';
  ctx.fillRect(346, 8, 918, 44);
  text(ctx, `SCORE ${game.score}`, 366, 31, 20, '#ffffff');
  text(ctx, `COMBO x${game.combo}`, 560, 31, 20, game.combo >= 3 ? '#ffb03a' : '#ffffff');
  const urgent = game.timeLeft <= 20;
  const clock = `${Math.floor(game.timeLeft / 60)}:${String(Math.floor(game.timeLeft % 60)).padStart(2, '0')}`;
  text(ctx, `SHIFT TIMER ${clock}`, 800, 31, 22, urgent ? '#ff6b57' : '#8fd06e', 'center');
  text(ctx, `SERVED ${game.served}`, 1010, 31, 20, '#ffffff');
  text(ctx, `$ ${game.coins}`, 1210, 31, 20, '#ffd98a', 'right');
  ctx.fillStyle = urgent ? '#ff6b57' : '#69b84c';
  ctx.fillRect(346, 52, 918 * Math.max(0, game.timeLeft / SHIFT_SECONDS), 4);
}

function drawOrderCard(ctx, game, order, x, y, w) {
  const dish = DISH_BY_ID[order.dishId];
  const urgent = order.timeLeft <= 10;
  ctx.fillStyle = urgent ? '#ffe3dd' : PAPER;
  roundRect(ctx, x, y, w, 118, 10); ctx.fill();
  ctx.strokeStyle = urgent ? '#e84c3d' : '#c9a15f';
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, 118, 10); ctx.stroke();
  text(ctx, `#${order.serial} ${dish.name}`, x + 12, y + 20, 17, INK);
  text(ctx, `$${dish.price}`, x + w - 12, y + 20, 17, '#7c4a1e', 'right');
  dish.items.forEach((id, index) => {
    const cx = x + 30 + index * 50;
    drawIngredientShape(ctx, id, cx, y + 50, 30);
    const label = INGREDIENT_BY_ID[id].name.split(' ').pop();
    text(ctx, label, cx, y + 74, 9.5, '#6b4a2a', 'center', 600);
  });
  // Patience timer: bar plus big seconds so the rush reads at a glance.
  const frac = Math.max(0, order.timeLeft / order.timeLimit);
  ctx.fillStyle = '#e5d3ac';
  roundRect(ctx, x + 12, y + 90, w - 92, 14, 7); ctx.fill();
  ctx.fillStyle = frac > 0.45 ? '#69b84c' : frac > 0.2 ? '#f5a623' : '#e84c3d';
  roundRect(ctx, x + 12, y + 90, (w - 92) * frac, 14, 7); ctx.fill();
  text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 14, y + 98, 19, urgent ? '#e84c3d' : INK, 'right');
}

function drawOrderBoard(ctx, game) {
  ctx.fillStyle = '#5b3a1e';
  roundRect(ctx, 12, 68, 322, 442, 12); ctx.fill();
  ctx.fillStyle = '#6f4525';
  roundRect(ctx, 20, 76, 306, 426, 10); ctx.fill();
  text(ctx, 'ORDER BOARD', 173, 98, 21, '#ffd98a', 'center');
  if (game.orders.length === 0) {
    text(ctx, 'Waiting for customers…', 173, 280, 16, '#ffe9c4', 'center', 600);
  }
  game.orders.forEach((order, index) => {
    drawOrderCard(ctx, game, order, 28, 114 + index * 126, 290);
  });
  text(ctx, 'Serve before the timer bar empties!', 173, 492, 11.5, '#ffe9c4', 'center', 600);
}

function drawStationSlot(ctx, slot, x, y, w, h, stationName) {
  ctx.fillStyle = slot.itemId ? '#3a3f4a' : '#4a4f5a';
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  if (!slot.itemId) {
    text(ctx, 'empty', x + w / 2, y + h / 2, 14, '#9aa3b2', 'center', 600);
    return;
  }
  if (slot.burnt) {
    drawIngredientShape(ctx, slot.itemId, x + w / 2, y + h / 2 - 6, 52);
    ctx.fillStyle = 'rgba(10,10,10,0.55)';
    roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 8); ctx.fill();
    text(ctx, 'BURNT — click to bin', x + w / 2, y + h - 16, 12.5, '#ff8a75', 'center');
    return;
  }
  drawIngredientShape(ctx, slot.itemId, x + w / 2, y + h / 2 - 8, 56);
  const ingredient = INGREDIENT_BY_ID[slot.itemId];
  if (slot.done) {
    ctx.fillStyle = '#69b84c';
    roundRect(ctx, x + 10, y + h - 26, w - 20, 18, 9); ctx.fill();
    text(ctx, stationName === 'grill' ? 'READY — click!' : 'READY — click to plate', x + w / 2, y + h - 17, 11.5, '#ffffff', 'center');
  } else {
    const frac = Math.min(1, slot.elapsed / ingredient.seconds);
    ctx.fillStyle = '#22252c';
    roundRect(ctx, x + 10, y + h - 26, w - 20, 18, 9); ctx.fill();
    ctx.fillStyle = stationName === 'grill' ? '#ff7a4d' : '#8fd06e';
    roundRect(ctx, x + 10, y + h - 26, (w - 20) * frac, 18, 9); ctx.fill();
    text(ctx, stationName === 'grill' ? 'grilling…' : 'chopping…', x + w / 2, y + h - 17, 11.5, '#ffffff', 'center');
  }
}

function drawStations(ctx, game) {
  ctx.fillStyle = '#2f333d';
  roundRect(ctx, 346, 72, 470, 180, 12); ctx.fill();
  text(ctx, 'GRILL', 366, 94, 18, '#ffb03a');
  text(ctx, 'patty · egg · chicken cook here', 440, 94, 13, '#c8cfdb', 'left', 600);
  game.grill.forEach((slot, index) => drawStationSlot(ctx, slot, 366 + index * 148, 118, 132, 108, 'grill'));
  ctx.fillStyle = '#77512a';
  roundRect(ctx, 832, 72, 432, 180, 12); ctx.fill();
  text(ctx, 'CHOPPING BOARD', 852, 94, 18, '#ffe9c4');
  text(ctx, 'lettuce · tomato', 1062, 94, 13, '#ffe9c4', 'left', 600);
  game.board.forEach((slot, index) => drawStationSlot(ctx, slot, 852 + index * 196, 118, 180, 108, 'board'));
}

function drawPlateStack(ctx, game, plateIndex, cx, cy) {
  const plate = game.plates[plateIndex];
  const active = game.activePlate === plateIndex;
  const readyOrder = matchingOrder(game, plateIndex);
  ctx.fillStyle = active ? 'rgba(255,176,58,0.25)' : 'rgba(0,0,0,0.06)';
  roundRect(ctx, cx - 218, cy - 84, 436, 176, 14); ctx.fill();
  if (active) {
    ctx.strokeStyle = '#ffb03a'; ctx.lineWidth = 3;
    roundRect(ctx, cx - 218, cy - 84, 436, 176, 14); ctx.stroke();
  }
  text(ctx, `PLATE ${plateIndex + 1}${active ? ' · ACTIVE' : ''}`, cx - 200, cy - 64, 16, active ? '#8a5a00' : '#6b4a2a');
  // The plate itself, then the dish stacking up layer by layer.
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath(); ctx.ellipse(cx, cy + 42, 120, 30, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c9ccd4'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy + 42, 120, 30, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = '#eef0f4';
  ctx.beginPath(); ctx.ellipse(cx, cy + 42, 82, 19, 0, 0, 7); ctx.fill();
  plate.forEach((id, index) => {
    drawIngredientShape(ctx, id, cx, cy + 26 - index * 17, 62);
  });
  if (plate.length === 0) {
    text(ctx, 'empty plate', cx, cy + 6, 15, '#9a8a76', 'center', 600);
  }
  if (readyOrder) {
    ctx.fillStyle = '#3f7d2c';
    roundRect(ctx, cx - 150, cy + 58, 300, 26, 13); ctx.fill();
    text(ctx, `READY TO SERVE · order #${readyOrder.serial} — SPACE!`, cx, cy + 72, 13.5, '#ffffff', 'center');
  } else if (plate.length > 0) {
    text(ctx, `building… ${plate.length} ingredient${plate.length > 1 ? 's' : ''} stacked`, cx, cy + 72, 13.5, '#6b4a2a', 'center', 600);
  }
}

function drawPlates(ctx, game) {
  ctx.fillStyle = WOOD;
  roundRect(ctx, 346, 264, 918, 206, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, 354, 272, 902, 190, 10); ctx.fill();
  text(ctx, 'ASSEMBLY COUNTER — two plates: finish one while the next stacks', 366, 284, 15, '#ffe9c4');
  drawPlateStack(ctx, game, 0, 576, 378);
  drawPlateStack(ctx, game, 1, 1034, 378);
}

function drawCounter(ctx, game) {
  text(ctx, 'INGREDIENT COUNTER — click a bin or press its number key', 346, 510, 15, '#5b3a1e');
  const areas = computeHitAreas().filter((area) => area.kind === 'bin');
  INGREDIENTS.forEach((ingredient, index) => {
    const area = areas[index];
    ctx.fillStyle = '#fff6e8';
    roundRect(ctx, area.x, area.y, area.w, area.h, 10); ctx.fill();
    ctx.strokeStyle = '#c9a15f'; ctx.lineWidth = 2;
    roundRect(ctx, area.x, area.y, area.w, area.h, 10); ctx.stroke();
    drawIngredientShape(ctx, ingredient.id, area.x + area.w / 2, area.y + 40, 52);
    const short = ingredient.name.split(' ').pop();
    text(ctx, short, area.x + area.w / 2, area.y + 76, 13.5, INK, 'center');
    const prepLabel = ingredient.prep === 'direct' ? 'straight to plate' : ingredient.prep === 'grill' ? `grill ${ingredient.seconds}s` : `chop ${ingredient.seconds}s`;
    text(ctx, prepLabel, area.x + area.w / 2, area.y + 93, 10.5, '#8a6a45', 'center', 600);
    ctx.fillStyle = '#2d1a10';
    ctx.beginPath(); ctx.arc(area.x + 16, area.y + 16, 11, 0, 7); ctx.fill();
    text(ctx, ingredient.key, area.x + 16, area.y + 17, 12, '#ffd98a', 'center');
  });
  void game;
}

function drawButtons(ctx, game) {
  if (game.messageLeft > 0) {
    text(ctx, game.message, 24, 668, 19, game.flash > 0 ? '#3f7d2c' : '#b8433a');
  } else {
    text(ctx, 'Keys 1–9 take ingredients · Q switches plate · T trashes plate', 24, 668, 14.5, '#ffe9c4', 'left', 600);
  }
  const drawButton = (x, label, colour) => {
    ctx.fillStyle = colour;
    roundRect(ctx, x, 656, 176, 46, 10); ctx.fill();
    text(ctx, label, x + 88, 680, 16, '#ffffff', 'center');
  };
  drawButton(690, 'SERVE · SPACE', '#3f7d2c');
  drawButton(878, 'SWITCH · Q', '#7c4a1e');
  drawButton(1066, 'TRASH · T', '#8a3325');
}

function drawTitleScreen(ctx, game) {
  ctx.fillStyle = 'rgba(36,18,8,0.82)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  text(ctx, 'DAPUR KILAT', 640, 190, 74, '#ffd98a', 'center', 800);
  text(ctx, 'Sizzle Stall — a street-kitchen rush', 640, 248, 26, '#ffe9c4', 'center', 600);
  text(ctx, 'Orders land on the board with a patience timer. Take ingredients from the counter,', 640, 320, 19, '#ffffff', 'center', 600);
  text(ctx, 'grill the patty, egg and chicken, chop the lettuce and tomato, stack each dish', 640, 350, 19, '#ffffff', 'center', 600);
  text(ctx, 'on a plate and serve it before the bar empties. Two plates: plan your route!', 640, 380, 19, '#ffffff', 'center', 600);
  text(ctx, 'Mouse clicks or keys 1–9 · Q switch plate · SPACE serve · T trash plate', 640, 428, 17, '#ffb03a', 'center');
  ctx.fillStyle = '#3f7d2c';
  roundRect(ctx, 490, 470, 300, 58, 12); ctx.fill();
  text(ctx, 'OPEN THE STALL', 640, 500, 22, '#ffffff', 'center');
  void game;
}

function drawGameOverScreen(ctx, game) {
  ctx.fillStyle = 'rgba(36,18,8,0.85)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  text(ctx, 'SHIFT OVER!', 640, 210, 58, '#ffd98a', 'center', 800);
  text(ctx, `Final score  ${game.score}`, 640, 300, 30, '#ffffff', 'center');
  text(ctx, `Dishes served ${game.served} · orders lost ${game.missed} · best combo x${game.bestCombo}`, 640, 350, 20, '#ffe9c4', 'center', 600);
  ctx.fillStyle = '#3f7d2c';
  roundRect(ctx, 490, 410, 300, 58, 12); ctx.fill();
  text(ctx, 'NEXT SHIFT · ENTER', 640, 440, 21, '#ffffff', 'center');
}

/** Draw one full frame of the game for the given state. */
export function renderGame(ctx, game) {
  drawKitchenBackdrop(ctx);
  drawHud(ctx, game);
  drawOrderBoard(ctx, game);
  drawStations(ctx, game);
  drawPlates(ctx, game);
  drawCounter(ctx, game);
  drawButtons(ctx, game);
  if (game.screen === SCREEN_TITLE) drawTitleScreen(ctx, game);
  if (game.screen === SCREEN_OVER) drawGameOverScreen(ctx, game);
}
