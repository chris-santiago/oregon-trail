import type { GameState } from '../core/GameState';
import { advanceDate, getAliveCount } from '../core/GameState';
import { randomInt, clamp } from '../core/RandomTable';
import { WeatherSystem } from './WeatherSystem';
import { LANDMARKS, TOTAL_TRAIL_MILES } from '../data/landmarks';

const PACE_MULTIPLIER: Record<string, number> = {
  steady:     1.0,
  strenuous:  1.3,
  grueling:   1.6,
};

const RATIONS_FOOD: Record<string, number> = {
  filling:     3,
  meager:      2,
  'bare-bones': 1,
};

export interface DayResult {
  milestraveled: number;
  foodConsumed: number;
  starvation: boolean;
  reachedLandmarkIndex: number | null;
  newDate: ReturnType<typeof advanceDate>;
}

export const TravelSystem = {
  calculateDailyMiles(state: GameState): number {
    const base = 12 + (state.supplies.oxen * 2);
    const paceMult = PACE_MULTIPLIER[state.pace] ?? 1.0;
    const weatherPenalty = WeatherSystem.getWeatherPenalty(state.weather.condition);
    const variance = randomInt(-2, 3);
    return clamp(Math.floor(base * paceMult + weatherPenalty + variance), 0, 40);
  },

  calculateFoodConsumed(state: GameState): number {
    const alive = getAliveCount(state.party);
    const foodPerPerson = RATIONS_FOOD[state.rations] ?? 3;
    return alive * foodPerPerson;
  },

  /**
   * Advance the game by one day of travel.
   * Returns the result — does NOT mutate state (caller mutates).
   */
  tickDay(state: GameState): DayResult {
    const milesThisDay = state.supplies.oxen === 0 ? 0 : TravelSystem.calculateDailyMiles(state);
    const foodConsumed = TravelSystem.calculateFoodConsumed(state);
    const starvation = foodConsumed > state.supplies.food;
    const newMile = Math.min(state.currentMile + milesThisDay, TOTAL_TRAIL_MILES);

    // Check if we crossed a landmark
    let reachedLandmarkIndex: number | null = null;
    const next = LANDMARKS[state.nextLandmarkIndex];
    if (next && newMile >= next.mile) {
      reachedLandmarkIndex = state.nextLandmarkIndex;
    }

    return {
      milestraveled: milesThisDay,
      foodConsumed: Math.min(foodConsumed, state.supplies.food),
      starvation,
      reachedLandmarkIndex,
      newDate: advanceDate(state.date),
    };
  },

  applyDayResult(state: GameState, result: DayResult): void {
    state.currentMile = Math.min(state.currentMile + result.milestraveled, TOTAL_TRAIL_MILES);
    state.supplies.food = Math.max(0, state.supplies.food - result.foodConsumed);
    state.date = result.newDate;
    state.currentDay++;
    state.daysSinceLastEvent++;

    // Generate new weather
    state.weather = WeatherSystem.generate(state.date.month, state.currentMile);

    if (result.reachedLandmarkIndex !== null) {
      state.nextLandmarkIndex = result.reachedLandmarkIndex + 1;
    }
  },

  isComplete(state: GameState): boolean {
    return state.currentMile >= TOTAL_TRAIL_MILES;
  },

  milesRemaining(state: GameState): number {
    return Math.max(0, TOTAL_TRAIL_MILES - state.currentMile);
  },

  nextLandmarkDistance(state: GameState): { name: string; miles: number } | null {
    const next = LANDMARKS[state.nextLandmarkIndex];
    if (!next) return null;
    return {
      name: next.name,
      miles: Math.max(0, next.mile - state.currentMile),
    };
  },
};
