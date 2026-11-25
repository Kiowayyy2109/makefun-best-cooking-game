// shots.js — deterministic scenes behind ?shot=title|rush|ready|over, used to
// take the entry's screenshots. Each scene builds a real mid-shift state with
// the game's own rules: orders on the board with live timers, ingredients on
// the grill and board, one dish mid-assembly and one plate ready to serve.

import { createGame, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './state.js';

function stageOrder(game, dishId, serial, timeLeft, timeLimit) {
  game.orders.push({ serial, dishId, timeLeft, timeLimit });
  game.orderSerial = Math.max(game.orderSerial, serial);
}

export function stageShot(name) {
  const game = createGame(42);
  if (name === 'title') {
    game.screen = SCREEN_TITLE;
    stageCommonKitchen(game);
    return game;
  }
  if (name === 'over') {
    stageCommonKitchen(game);
    game.screen = SCREEN_OVER;
    game.score = 486;
    game.coins = 486;
    game.served = 31;
    game.missed = 4;
    game.bestCombo = 9;
    game.combo = 0;
    game.timeLeft = 0;
    return game;
  }
  game.screen = SCREEN_PLAY;
  stageCommonKitchen(game);
  if (name === 'ready') {
    // Plate 1 holds a finished Sunny Stack, flagged READY TO SERVE; plate 2 is
    // mid-assembly on an Eggfire Bowl with rice and sambal already stacked.
    game.plates[0] = ['bun', 'patty', 'cheese', 'lettuce'];
    game.plates[1] = ['rice', 'sambal'];
    game.activePlate = 1;
    game.score = 238;
    game.coins = 238;
    game.combo = 4;
    game.served = 15;
    game.timeLeft = 74;
    game.message = 'Sunny Stack is plated — serve it!';
    game.messageLeft = 30;
    return game;
  }
  // Default: the mid-rush scene.
  game.plates[0] = ['bun', 'patty'];
  game.plates[1] = ['rice'];
  game.activePlate = 0;
  game.score = 126;
  game.coins = 126;
  game.combo = 2;
  game.served = 8;
  game.timeLeft = 96;
  game.message = 'Grill the patty, chop the lettuce — order #12 is waiting!';
  game.messageLeft = 30;
  return game;
}

function stageCommonKitchen(game) {
  game.orders = [];
  stageOrder(game, 'sunny-stack', 12, 27, 40);
  stageOrder(game, 'eggfire-bowl', 13, 35, 44);
  stageOrder(game, 'garden-melt', 14, 9, 38);
  // Grill: a patty nearly done, an egg just on, one slot free.
  game.grill[0] = { itemId: 'patty', elapsed: 2.4, done: false, burnt: false };
  game.grill[1] = { itemId: 'egg', elapsed: 0.8, done: false, burnt: false };
  game.grill[2] = { itemId: null, elapsed: 0, done: false, burnt: false };
  // Board: lettuce chopped and ready, tomato mid-chop.
  game.board[0] = { itemId: 'lettuce', elapsed: 0, done: true, burnt: false };
  game.board[1] = { itemId: 'tomato', elapsed: 0.7, done: false, burnt: false };
}
