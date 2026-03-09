import type { GameState } from '../core/GameState';
import { EVENTS, type GameEvent } from '../data/events';
import { weightedRandom, randomChance, clamp } from '../core/RandomTable';

export const EventSystem = {
  shouldTrigger(state: GameState): boolean {
    if (state.daysSinceLastEvent < 3) return false;

    let chance = 0.15;

    // Health modifiers
    const aliveMembers = state.party.filter(m => m.alive);
    const avgHealth = aliveMembers.length > 0
      ? aliveMembers.reduce((s, m) => s + m.health, 0) / aliveMembers.length
      : 0;

    if (avgHealth < 40) chance += 0.05;
    if (avgHealth < 20) chance += 0.05;

    // Weather
    const badWeather = ['rainy', 'snowy', 'very-cold', 'blizzard'];
    if (badWeather.includes(state.weather.condition)) chance += 0.05;
    if (state.weather.condition === 'blizzard') chance += 0.05;

    // Pace/rations
    if (state.rations === 'bare-bones') chance += 0.03;
    if (state.pace === 'grueling') chance += 0.03;

    // Boost chance if hasn't had event in a while
    if (state.daysSinceLastEvent > 7) chance += 0.10;
    if (state.daysSinceLastEvent > 14) chance += 0.10;

    return randomChance(clamp(chance, 0.05, 0.50));
  },

  pickEvent(state: GameState): GameEvent | null {
    const available = EVENTS.filter(e => !e.condition || e.condition(state));
    if (available.length === 0) return null;
    return weightedRandom(available.map(e => ({ item: e, weight: e.weight })));
  },
};
