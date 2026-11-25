// main.js — bootstrap: wire the canvas, input and the frame loop together.
// With ?shot=<scene> the game stages one deterministic screenshot scene and
// holds it (timers frozen) so a headless browser can capture a real frame.

import { createGame, updateGame, EVENT_READY } from './state.js';
import { renderGame } from './render.js';
import { attachInput, soundForEvents } from './input.js';
import { stageShot } from './shots.js';
import { playReady } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const game = shotName ? stageShot(shotName) : createGame(7);

attachInput(canvas, game, (events) => soundForEvents(game, events, true));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotName) {
    const events = updateGame(game, dt);
    if (events & EVENT_READY) playReady();
    if (events & 1) soundForEvents(game, 1, true);
    if (events & 8) soundForEvents(game, 8, true);
  }
  renderGame(ctx, game);
  status.textContent = `Score ${game.score}. Combo ${game.combo}. ${game.orders.length} orders waiting.`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
