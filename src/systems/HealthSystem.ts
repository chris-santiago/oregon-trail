import type { GameState, Ailment } from '../core/GameState';
import { clamp, randomChance } from '../core/RandomTable';
import { WeatherSystem } from './WeatherSystem';
import { getAliveCount } from '../core/GameState';

const AILMENT_DRAIN: Record<Ailment, number> = {
  typhoid:      -8,
  cholera:      -12,
  dysentery:    -6,
  measles:      -5,
  snakebite:    -10,
  'broken-arm': -3,
  'broken-leg': -4,
  exhaustion:   -5,
  fever:        -6,
};

const AILMENT_RECOVERY_CHANCE: Record<Ailment, number> = {
  typhoid:      0.04,
  cholera:      0.03,
  dysentery:    0.07,
  measles:      0.06,
  snakebite:    0.05,
  'broken-arm': 0.04,
  'broken-leg': 0.03,
  exhaustion:   0.12,
  fever:        0.10,
};

export const HealthSystem = {
  tickDay(state: GameState, resting = false): string[] {
    const messages: string[] = [];
    const alive = state.party.filter(m => m.alive);
    const aliveCount = alive.length;

    for (const member of alive) {
      let delta = 0;

      // Rations
      if (state.supplies.food > 0) {
        if (state.rations === 'filling') delta += 2;
        else if (state.rations === 'meager') delta -= 1;
        else if (state.rations === 'bare-bones') delta -= 3;
      } else {
        delta -= 8; // starvation
        messages.push(`${member.name} is starving!`);
      }

      // Pace
      if (state.pace === 'strenuous') delta -= 1;
      if (state.pace === 'grueling') delta -= 3;

      // Resting bonus
      if (resting) delta += 5;

      // Weather
      const weatherDrain = WeatherSystem.getHealthPenalty(state.weather.condition);
      if (weatherDrain < 0) {
        // Cold weather: extra penalty if not enough clothing
        if (state.weather.condition === 'very-cold' || state.weather.condition === 'blizzard') {
          if (state.supplies.clothing < aliveCount) {
            delta -= 3; // exposed to cold
          }
        }
        delta += weatherDrain;
      }

      // Ailments
      const recoveredAilments: Ailment[] = [];
      for (const ailment of member.ailments) {
        delta += AILMENT_DRAIN[ailment];
        const recoveryChance = AILMENT_RECOVERY_CHANCE[ailment] * (resting ? 2 : 1);
        if (randomChance(recoveryChance)) {
          recoveredAilments.push(ailment);
          messages.push(`${member.name} has recovered from ${ailment}.`);
        }
      }
      member.ailments = member.ailments.filter(a => !recoveredAilments.includes(a));
      member.daysIll = member.ailments.length > 0 ? member.daysIll + 1 : 0;

      member.health = clamp(member.health + delta, 0, 100);

      if (member.health <= 0) {
        member.alive = false;
        member.health = 0;
        messages.push(`${member.name} has died.`);
      }
    }

    return messages;
  },

  getAliveCount,

  allDead(state: GameState): boolean {
    return state.party.every(m => !m.alive);
  },

  leaderDead(state: GameState): boolean {
    return !state.party[0]?.alive;
  },
};
