// state.js — the whole simulation of one shift at the Sizzle Stall:
// orders arriving on the board, grill and chopping-board stations, two
// assembly plates, scoring, combo and the shift clock. No drawing here.

import {
  BURN_GRACE_SECONDS, BOARD_SLOTS, DISHES, GRILL_SLOTS,
  INGREDIENT_BY_ID, PLATE_COUNT, PREP_CHOP, PREP_DIRECT, PREP_GRILL, SHIFT_SECONDS,
} from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_SERVE = 1;
export const EVENT_MISS = 2;
export const EVENT_READY = 4;
export const EVENT_EXPIRE = 8;

/** Deterministic little RNG so screenshot scenes always stage the same rush. */
export function makeRng(seed) {
  let value = seed >>> 0 || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function emptyStationSlots(count) {
  return Array.from({ length: count }, () => ({ itemId: null, elapsed: 0, done: false, burnt: false }));
}

export function createGame(seed = 7) {
  return {
    screen: SCREEN_TITLE,
    rng: makeRng(seed),
    timeLeft: SHIFT_SECONDS,
    elapsedShift: 0,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    orders: [],
    nextOrderIn: 0,
    orderSerial: 0,
    plates: Array.from({ length: PLATE_COUNT }, () => []),
    activePlate: 0,
    grill: emptyStationSlots(GRILL_SLOTS),
    board: emptyStationSlots(BOARD_SLOTS),
    message: '',
    messageLeft: 0,
    flash: 0,
  };
}

export function startShift(game) {
  const fresh = createGame(1000 + Math.floor(Math.random() * 9000));
  Object.assign(game, fresh, { screen: SCREEN_PLAY });
  spawnOrder(game, true);
  spawnOrder(game, true);
  game.nextOrderIn = 6;
}

/** How generous a fresh order's timer is; it tightens as the shift wears on. */
function orderTimeLimit(game) {
  const rush = Math.min(1, game.elapsedShift / SHIFT_SECONDS);
  return 46 - rush * 16 + game.rng() * 6;
}

export function spawnOrder(game, instant = false) {
  if (game.orders.length >= 3) return null;
  const dish = DISHES[Math.floor(game.rng() * DISHES.length)];
  const limit = orderTimeLimit(game);
  const order = {
    serial: (game.orderSerial += 1),
    dishId: dish.id,
    timeLeft: instant ? limit : limit,
    timeLimit: limit,
  };
  game.orders.push(order);
  return order;
}

/** Send an ingredient from its bin: direct items land on the active plate, others claim a station slot. */
export function takeIngredient(game, ingredientId) {
  const ingredient = INGREDIENT_BY_ID[ingredientId];
  if (!ingredient || game.screen !== SCREEN_PLAY) return false;
  if (ingredient.prep === PREP_DIRECT) {
    game.plates[game.activePlate].push(ingredientId);
    return true;
  }
  const slots = ingredient.prep === PREP_GRILL ? game.grill : game.board;
  const free = slots.find((slot) => slot.itemId === null);
  if (!free) {
    game.message = ingredient.prep === PREP_GRILL ? 'Grill is full!' : 'Board is full!';
    game.messageLeft = 1.2;
    return false;
  }
  free.itemId = ingredientId;
  free.elapsed = 0;
  free.done = false;
  free.burnt = false;
  return true;
}

/** Move a finished station item onto the active plate. Burnt grill items go in the bin instead. */
export function collectStation(game, station, index) {
  const slots = station === 'grill' ? game.grill : game.board;
  const slot = slots[index];
  if (!slot || slot.itemId === null) return false;
  if (station === 'grill' && slot.burnt) {
    slot.itemId = null;
    game.message = 'Burnt! Binned it.';
    game.messageLeft = 1.2;
    return true;
  }
  if (!slot.done) return false;
  game.plates[game.activePlate].push(slot.itemId);
  slot.itemId = null;
  slot.elapsed = 0;
  slot.done = false;
  return true;
}

export function clearPlate(game) {
  game.plates[game.activePlate] = [];
}

export function switchPlate(game) {
  game.activePlate = (game.activePlate + 1) % PLATE_COUNT;
}

/** Exact multiset match between a plate's contents and a dish's recipe. */
export function plateMatchesDish(plate, dish) {
  if (plate.length !== dish.items.length) return false;
  const counts = new Map();
  for (const id of dish.items) counts.set(id, (counts.get(id) || 0) + 1);
  for (const id of plate) {
    const left = (counts.get(id) || 0) - 1;
    if (left < 0) return false;
    counts.set(id, left);
  }
  return true;
}

/** The order this plate can serve right now, or null. */
export function matchingOrder(game, plateIndex) {
  const plate = game.plates[plateIndex];
  if (plate.length === 0) return null;
  for (const order of game.orders) {
    const dish = DISHES.find((entry) => entry.id === order.dishId);
    if (dish && plateMatchesDish(plate, dish)) return order;
  }
  return null;
}

/**
 * Serve the active plate. A match pays the dish price plus a speed tip and
 * grows the combo; serving a plate that matches nothing costs the combo.
 */
export function serveActivePlate(game) {
  const order = matchingOrder(game, game.activePlate);
  if (!order) {
    if (game.plates[game.activePlate].length > 0) {
      game.combo = 0;
      game.message = 'No order wants that plate!';
      game.messageLeft = 1.4;
      return EVENT_MISS;
    }
    return 0;
  }
  const dish = DISHES.find((entry) => entry.id === order.dishId);
  const tip = Math.round((order.timeLeft / order.timeLimit) * 6);
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const comboBonus = Math.min(game.combo - 1, 8);
  const earned = dish.price + tip + comboBonus;
  game.score += earned;
  game.coins += earned;
  game.served += 1;
  game.plates[game.activePlate] = [];
  game.orders = game.orders.filter((entry) => entry !== order);
  game.message = `Served ${dish.name}! +${earned}`;
  game.messageLeft = 1.6;
  game.flash = 0.35;
  if (game.orders.length < 2) spawnOrder(game);
  return EVENT_SERVE;
}

/** Advance the whole kitchen by dt seconds; returns an event bitmask for sounds. */
export function updateGame(game, dt) {
  let events = 0;
  if (game.screen !== SCREEN_PLAY) return events;
  game.timeLeft -= dt;
  game.elapsedShift += dt;
  game.messageLeft = Math.max(0, game.messageLeft - dt);
  game.flash = Math.max(0, game.flash - dt);
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.screen = SCREEN_OVER;
    return events;
  }
  // Orders count down and walk out when their patience ends.
  for (const order of [...game.orders]) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      game.orders = game.orders.filter((entry) => entry !== order);
      game.combo = 0;
      game.missed += 1;
      game.message = 'Order walked out!';
      game.messageLeft = 1.4;
      events |= EVENT_EXPIRE;
    }
  }
  game.nextOrderIn -= dt;
  if (game.nextOrderIn <= 0) {
    spawnOrder(game);
    const rush = Math.min(1, game.elapsedShift / SHIFT_SECONDS);
    game.nextOrderIn = 11 - rush * 5 + game.rng() * 3;
  }
  // Stations cook and chop; the grill punishes anyone who forgets it.
  const runStation = (slots, canBurn) => {
    for (const slot of slots) {
      if (slot.itemId === null || slot.done) {
        if (canBurn && slot.itemId !== null && slot.done && !slot.burnt) {
          slot.elapsed += dt;
          if (slot.elapsed > BURN_GRACE_SECONDS) slot.burnt = true;
        }
        continue;
      }
      slot.elapsed += dt;
      if (slot.elapsed >= INGREDIENT_BY_ID[slot.itemId].seconds) {
        slot.done = true;
        slot.elapsed = 0;
        events |= EVENT_READY;
      }
    }
  };
  runStation(game.grill, true);
  runStation(game.board, false);
  return events;
}
