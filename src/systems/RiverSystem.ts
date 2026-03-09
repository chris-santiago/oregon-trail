import type { GameState } from '../core/GameState';
import { randomChance, randomInt, clamp } from '../core/RandomTable';
import { advanceDate } from '../core/GameState';

export type CrossingMethod = 'ford' | 'caulk' | 'ferry' | 'wait';

export interface CrossingResult {
  success: boolean;
  method: CrossingMethod;
  foodLost: number;
  moneySpent: number;
  daysWaited: number;
  deaths: string[];
  message: string;
}

export const RiverSystem = {
  getDepthDescription(difficulty: number): string {
    const depths: Record<number, string> = {
      1: '2 feet',
      2: '3.5 feet',
      3: '5 feet',
      4: '6.5 feet',
      5: '8 feet',
    };
    return depths[difficulty] ?? '5 feet';
  },

  getFerryPrice(difficulty: number): number {
    return difficulty * 5;
  },

  attempt(state: GameState, method: CrossingMethod, difficulty: number): CrossingResult {
    const result: CrossingResult = {
      success: true,
      method,
      foodLost: 0,
      moneySpent: 0,
      daysWaited: 0,
      deaths: [],
      message: '',
    };

    const badWeather = ['rainy', 'snowy', 'blizzard'].includes(state.weather.condition);

    if (method === 'wait') {
      result.daysWaited = randomInt(1, 3);
      result.message = `You waited ${result.daysWaited} day${result.daysWaited > 1 ? 's' : ''} for the river to lower.`;
      return result;
    }

    if (method === 'ferry') {
      const cost = RiverSystem.getFerryPrice(difficulty);
      result.moneySpent = Math.min(cost, state.supplies.money);
      if (state.supplies.money < cost) {
        // Can't afford ferry — forced to ford
        result.message = 'You could not afford the ferry. You had to ford the river.';
        return RiverSystem.attempt(state, 'ford', difficulty);
      }

      // Ferry is mostly safe, tiny chance of accident at high difficulty
      const failChance = difficulty >= 4 ? 0.05 : 0.01;
      if (randomChance(failChance + (badWeather ? 0.05 : 0))) {
        const foodLost = randomInt(10, 30);
        result.success = false;
        result.foodLost = Math.min(foodLost, state.supplies.food);
        result.message = `The ferry capsized in the rough current! You lost ${result.foodLost} lbs of food.`;
      } else {
        result.message = `You safely crossed by ferry for $${cost}.`;
      }
      return result;
    }

    // Ford or Caulk
    let failChance = method === 'ford'
      ? difficulty * 0.15
      : difficulty * 0.10;

    if (badWeather) failChance += 0.10;
    if (method === 'ford' && difficulty >= 4) failChance += 0.15;
    failChance = clamp(failChance, 0, 0.85);

    if (randomChance(failChance)) {
      result.success = false;
      result.foodLost = randomInt(10, 50);
      result.foodLost = Math.min(result.foodLost, state.supplies.food);

      // Chance of drowning a party member
      const alive = state.party.filter(m => m.alive);
      if (alive.length > 0 && randomChance(0.12)) {
        const victim = alive[Math.floor(Math.random() * alive.length)];
        result.deaths.push(victim.name);
        victim.alive = false;
        victim.health = 0;
      }

      if (method === 'ford') {
        result.message = `The wagon was swept off course! You lost ${result.foodLost} lbs of food${result.deaths.length ? ` and ${result.deaths[0]} drowned` : ''}.`;
      } else {
        result.message = `The wagon leaked badly while floating! You lost ${result.foodLost} lbs of food${result.deaths.length ? ` and ${result.deaths[0]} drowned` : ''}.`;
      }
    } else {
      result.message = method === 'ford'
        ? 'You successfully forded the river.'
        : 'You caulked the wagon and floated safely across.';
    }

    return result;
  },

  applyResult(state: GameState, result: CrossingResult): void {
    state.supplies.food = Math.max(0, state.supplies.food - result.foodLost);
    state.supplies.money = Math.max(0, state.supplies.money - result.moneySpent);

    if (result.daysWaited > 0) {
      state.currentDay += result.daysWaited;
      for (let i = 0; i < result.daysWaited; i++) {
        state.date = advanceDate(state.date);
      }
    }
  },
};
