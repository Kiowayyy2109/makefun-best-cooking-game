// input.js — mouse and keyboard control: bins, stations, plates and buttons.
// Clicks are resolved against the same hit areas render.js draws.

import { INGREDIENTS } from './recipes.js';
import { computeHitAreas } from './render.js';
import {
  SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE,
  clearPlate, collectStation, serveActivePlate, startShift, switchPlate, takeIngredient,
} from './state.js';
import { playBell, playChop, playPlace, playReady, playServe, playMiss } from './audio.js';

export function soundForEvents(game, events, wasPlaying) {
  if (!events) return;
  if (events & 1) playServe(game.combo);
  if (events & 2) playMiss();
  if (events & 4) playReady();
  if (events & 8) playMiss();
  void wasPlaying;
}

function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function attachInput(canvas, game, onServeEvents) {
  const areas = computeHitAreas();

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(canvas, event.clientX, event.clientY);
    if (game.screen === SCREEN_TITLE || game.screen === SCREEN_OVER) {
      startShift(game);
      playBell();
      return;
    }
    if (game.screen !== SCREEN_PLAY) return;
    const hit = areas.find((area) => point.x >= area.x && point.x <= area.x + area.w && point.y >= area.y && point.y <= area.y + area.h);
    if (!hit) return;
    if (hit.kind === 'bin') {
      const ingredient = INGREDIENTS.find((entry) => entry.id === hit.id);
      if (takeIngredient(game, hit.id)) {
        if (ingredient.prep === 'chop') playChop(); else playPlace();
      }
    } else if (hit.kind === 'grill') {
      if (collectStation(game, 'grill', hit.index)) playPlace();
    } else if (hit.kind === 'board') {
      if (collectStation(game, 'board', hit.index)) playPlace();
    } else if (hit.kind === 'plate') {
      game.activePlate = hit.index;
    } else if (hit.kind === 'serve') {
      onServeEvents(serveActivePlate(game));
    } else if (hit.kind === 'switch') {
      switchPlate(game);
    } else if (hit.kind === 'trash') {
      clearPlate(game);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (game.screen !== SCREEN_PLAY) {
      if (key === 'enter' || key === ' ') {
        startShift(game);
        playBell();
      }
      return;
    }
    const ingredient = INGREDIENTS.find((entry) => entry.key === key);
    if (ingredient) {
      if (takeIngredient(game, ingredient.id)) {
        if (ingredient.prep === 'chop') playChop(); else playPlace();
      }
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      onServeEvents(serveActivePlate(game));
    } else if (key === 'q') {
      switchPlate(game);
    } else if (key === 't') {
      clearPlate(game);
    }
  });
}
