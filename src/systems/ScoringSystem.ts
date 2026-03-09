import type { GameState } from '../core/GameState';
import { getAliveCount } from '../core/GameState';

const PROFESSION_MULTIPLIER = {
  banker:    1,
  carpenter: 2,
  farmer:    3,
};

const RANKINGS = [
  { threshold: 5000, label: 'Legend of the Trail' },
  { threshold: 2500, label: 'Trailblazer' },
  { threshold: 1000, label: 'Adventurer' },
  { threshold: 0,    label: 'Settler' },
];

export interface ScoreBreakdown {
  healthPoints: number;
  survivalPoints: number;
  supplyPoints: number;
  total: number;
  multiplier: number;
  finalScore: number;
  ranking: string;
}

export const ScoringSystem = {
  calculate(state: GameState): ScoreBreakdown {
    const alive = state.party.filter(m => m.alive);
    const avgHealth = alive.length > 0
      ? alive.reduce((s, m) => s + m.health, 0) / alive.length
      : 0;

    const healthPoints  = Math.floor(avgHealth * 2);
    const survivalPoints = getAliveCount(state.party) * 100;
    const supplyPoints = Math.floor(
      state.supplies.food / 4 +
      state.supplies.clothing * 2 +
      state.supplies.ammunition * 2 +
      state.supplies.spareParts * 5 +
      state.supplies.money / 5
    );

    const total = healthPoints + survivalPoints + supplyPoints;
    const multiplier = PROFESSION_MULTIPLIER[state.profession];
    const finalScore = total * multiplier;

    const ranking = RANKINGS.find(r => finalScore >= r.threshold)?.label ?? 'Settler';

    return {
      healthPoints,
      survivalPoints,
      supplyPoints,
      total,
      multiplier,
      finalScore,
      ranking,
    };
  },
};
