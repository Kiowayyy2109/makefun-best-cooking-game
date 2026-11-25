// recipes.js — the menu of Dapur Kilat: ingredient definitions and dish recipes.
// Every name, colour and combination here is original to this game.

/** How an ingredient reaches the plate: straight from its bin, off the grill, or off the chopping board. */
export const PREP_DIRECT = 'direct';
export const PREP_GRILL = 'grill';
export const PREP_CHOP = 'chop';

/**
 * The eight bins on the counter. `key` is the keyboard shortcut, `prep` the
 * station the ingredient must pass through, `seconds` the station time.
 */
export const INGREDIENTS = [
  { id: 'bun',     name: 'Cloud Bun',      key: '1', prep: PREP_DIRECT, seconds: 0,   body: '#f2c063', trim: '#d99a35' },
  { id: 'patty',   name: 'Ember Patty',    key: '2', prep: PREP_GRILL,  seconds: 3.0, body: '#8a4b2a', trim: '#5f3018' },
  { id: 'cheese',  name: 'Golden Cheese',  key: '3', prep: PREP_DIRECT, seconds: 0,   body: '#ffcf3f', trim: '#e0a81c' },
  { id: 'lettuce', name: 'Garden Lettuce', key: '4', prep: PREP_CHOP,   seconds: 1.4, body: '#69b84c', trim: '#3f7d2c' },
  { id: 'tomato',  name: 'Ruby Tomato',    key: '5', prep: PREP_CHOP,   seconds: 1.4, body: '#e84c3d', trim: '#b02a1e' },
  { id: 'egg',     name: 'Sunny Egg',      key: '6', prep: PREP_GRILL,  seconds: 2.2, body: '#fdf3d8', trim: '#f5a623' },
  { id: 'rice',    name: 'Steamed Rice',   key: '7', prep: PREP_DIRECT, seconds: 0,   body: '#f7f2e6', trim: '#cfc4a8' },
  { id: 'chicken', name: 'Char Chicken',   key: '8', prep: PREP_GRILL,  seconds: 3.6, body: '#c97b3f', trim: '#8f4f1f' },
  { id: 'sambal',  name: 'Volcano Sambal', key: '9', prep: PREP_DIRECT, seconds: 0,   body: '#c22f1d', trim: '#7e1a0e' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

/** A dish is a named stack: the plate must hold exactly these prepared ingredients. */
export const DISHES = [
  { id: 'sunny-stack',  name: 'Sunny Stack',      price: 14, items: ['bun', 'patty', 'cheese', 'lettuce'] },
  { id: 'garden-melt',  name: 'Garden Melt',      price: 11, items: ['bun', 'cheese', 'tomato', 'lettuce'] },
  { id: 'eggfire-bowl', name: 'Eggfire Bowl',     price: 15, items: ['rice', 'egg', 'sambal', 'chicken'] },
  { id: 'orchard-plate', name: 'Orchard Plate',   price: 12, items: ['rice', 'chicken', 'tomato'] },
  { id: 'twin-ember',   name: 'Twin Ember Melt',  price: 13, items: ['bun', 'patty', 'cheese', 'egg'] },
  { id: 'volcano-rice', name: 'Volcano Rice',     price: 10, items: ['rice', 'sambal', 'egg'] },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((dish) => [dish.id, dish]));

/** Two plates side by side: finish one dish while the next is already stacking. */
export const PLATE_COUNT = 2;
/** Grill slots and chopping-board slots the player juggles at once. */
export const GRILL_SLOTS = 3;
export const BOARD_SLOTS = 2;
/** How long a cooked item can sit on the grill before it burns. */
export const BURN_GRACE_SECONDS = 4;
/** A full shift, in seconds, shown on the big kitchen clock. */
export const SHIFT_SECONDS = 150;
