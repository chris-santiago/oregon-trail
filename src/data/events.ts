import type { GameState, Ailment } from '../core/GameState';
import { advanceDate, getAliveCount } from '../core/GameState';
import { randomInt, randomChance, pickRandom, clamp } from '../core/RandomTable';

export interface EventOutcome {
  message: string;
  foodChange?: number;
  moneyChange?: number;
  oxenChange?: number;
  clothingChange?: number;
  ammoChange?: number;
  partsChange?: number;
  healthChange?: number;        // applied to one random member
  healthChangeAll?: number;     // applied to all alive members
  ailment?: Ailment;            // added to a random member
  memberDeath?: boolean;        // kills a random member
  daysLost?: number;
  noEventNextDays?: number;
}

export interface GameEvent {
  id: string;
  text: (state: GameState) => string;
  weight: number;
  condition?: (state: GameState) => boolean;
  effect: (state: GameState) => EventOutcome;
}

function randomMemberName(state: GameState): string {
  const alive = state.party.filter(m => m.alive);
  return alive.length > 0 ? pickRandom(alive).name : 'a party member';
}

export const EVENTS: GameEvent[] = [
  // ─── ILLNESS ───
  {
    id: 'typhoid',
    text: (s) => `${randomMemberName(s)} has typhoid fever.`,
    weight: 8,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} is gravely ill.`, ailment: 'typhoid', healthChange: -20 };
    },
  },
  {
    id: 'cholera',
    text: (s) => `${randomMemberName(s)} has cholera!`,
    weight: 6,
    condition: (s) => getAliveCount(s.party) > 1,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} is very sick. Cholera spreads fast.`, ailment: 'cholera', healthChange: -30 };
    },
  },
  {
    id: 'dysentery',
    text: (s) => `${randomMemberName(s)} has dysentery.`,
    weight: 12,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} has dysentery and cannot keep food down.`, ailment: 'dysentery', healthChange: -15 };
    },
  },
  {
    id: 'measles',
    text: (s) => `${randomMemberName(s)} has measles.`,
    weight: 7,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} has measles. Rest is the only cure.`, ailment: 'measles', healthChange: -10 };
    },
  },
  {
    id: 'fever',
    text: (s) => `${randomMemberName(s)} has a fever.`,
    weight: 15,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} has developed a high fever.`, ailment: 'fever', healthChange: -10 };
    },
  },
  {
    id: 'exhaustion',
    text: (s) => `${randomMemberName(s)} is suffering from exhaustion.`,
    weight: 10,
    condition: (s) => s.pace !== 'steady' && getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} collapses from exhaustion. The pace must slow.`, ailment: 'exhaustion', healthChange: -15 };
    },
  },
  {
    id: 'snakebite',
    text: (s) => `${randomMemberName(s)} was bitten by a snake!`,
    weight: 5,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} was bitten by a rattlesnake. The venom is spreading.`, ailment: 'snakebite', healthChange: -25 };
    },
  },
  {
    id: 'broken-arm',
    text: (s) => `${randomMemberName(s)} has a broken arm.`,
    weight: 4,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return { message: `${name} fell and broke an arm. Movement is difficult.`, ailment: 'broken-arm', healthChange: -10 };
    },
  },

  // ─── BROKEN PARTS ───
  {
    id: 'broken-wheel',
    text: () => 'A wagon wheel broke!',
    weight: 10,
    effect: (s) => {
      if (s.supplies.spareParts > 0) {
        return { message: 'You used a spare part to fix the wheel.', partsChange: -1 };
      }
      return { message: 'You have no spare parts! It took 3 days to find materials and repair the wheel.', daysLost: 3 };
    },
  },
  {
    id: 'broken-axle',
    text: () => 'The wagon axle broke!',
    weight: 7,
    effect: (s) => {
      if (s.supplies.spareParts > 0) {
        return { message: 'You used a spare part to replace the axle.', partsChange: -1 };
      }
      return { message: 'No spare parts. You lost 4 days making repairs.', daysLost: 4 };
    },
  },
  {
    id: 'broken-tongue',
    text: () => 'The wagon tongue broke!',
    weight: 6,
    effect: (s) => {
      if (s.supplies.spareParts > 0) {
        return { message: 'You replaced the wagon tongue with a spare part.', partsChange: -1 };
      }
      return { message: 'No spare parts! You spent 2 days fashioning a new tongue from timber.', daysLost: 2 };
    },
  },

  // ─── THEFT / BAD LUCK ───
  {
    id: 'food-theft',
    text: () => 'Thieves stole food from your wagon!',
    weight: 6,
    condition: (s) => s.supplies.food > 50,
    effect: (s) => {
      const lost = randomInt(20, Math.min(80, Math.floor(s.supplies.food * 0.3)));
      return { message: `You lost ${lost} pounds of food to thieves.`, foodChange: -lost };
    },
  },
  {
    id: 'oxen-wander',
    text: () => 'One of your oxen wandered off!',
    weight: 5,
    condition: (s) => s.supplies.oxen > 1,
    effect: () => ({
      message: 'You searched for hours but the ox was gone. You lost 1 yoke of oxen.',
      oxenChange: -1,
      daysLost: 1,
    }),
  },
  {
    id: 'wagon-fire',
    text: () => 'Fire in the wagon!',
    weight: 3,
    condition: (s) => s.supplies.food > 30,
    effect: (s) => {
      const foodLost = randomInt(20, Math.min(100, s.supplies.food));
      return {
        message: `A fire destroyed ${foodLost} pounds of food and some supplies.`,
        foodChange: -foodLost,
        clothingChange: -randomInt(1, Math.min(2, s.supplies.clothing)),
      };
    },
  },
  {
    id: 'bad-water',
    text: () => 'The water supply is contaminated!',
    weight: 9,
    condition: (s) => getAliveCount(s.party) > 0,
    effect: (s) => {
      const name = randomMemberName(s);
      return {
        message: `The water tastes foul. ${name} and others feel ill.`,
        healthChangeAll: -5,
        ailment: randomChance(0.4) ? 'dysentery' : undefined,
      };
    },
  },
  {
    id: 'heavy-rain',
    text: () => 'Heavy rains slow your progress.',
    weight: 8,
    effect: () => ({
      message: 'Torrential rains turn the trail to mud. You barely moved today.',
      daysLost: randomInt(1, 2),
    }),
  },
  {
    id: 'lost-trail',
    text: () => 'You lost your way on the trail!',
    weight: 5,
    effect: () => ({
      message: `You wandered off the trail and lost ${randomInt(1, 3)} days finding the route again.`,
      daysLost: randomInt(1, 3),
    }),
  },
  {
    id: 'hail-storm',
    text: () => 'A violent hail storm strikes!',
    weight: 4,
    effect: () => ({
      message: 'Golf ball-sized hail damages your wagon and injures your animals. You lost a day.',
      daysLost: 1,
      healthChangeAll: -5,
    }),
  },

  // ─── GOOD FORTUNE ───
  {
    id: 'wild-fruit',
    text: () => 'You find wild berries and fruit!',
    weight: 8,
    effect: () => ({
      message: `You gathered ${randomInt(15, 35)} pounds of wild fruit and berries.`,
      foodChange: randomInt(15, 35),
    }),
  },
  {
    id: 'abandoned-wagon',
    text: () => 'You find an abandoned wagon!',
    weight: 4,
    effect: (s) => {
      const foodGain = randomInt(20, 80);
      const partsGain = randomChance(0.5) && s.supplies.spareParts < 10 ? 1 : 0;
      const clothingGain = randomChance(0.4) ? randomInt(1, 2) : 0;
      return {
        message: `The wagon was left by a less fortunate emigrant. You salvaged ${foodGain} lbs of food${partsGain ? ', 1 spare part' : ''}${clothingGain ? `, ${clothingGain} sets of clothing` : ''}.`,
        foodChange: foodGain,
        partsChange: partsGain,
        clothingChange: clothingGain,
      };
    },
  },
  {
    id: 'good-weather',
    text: () => 'Beautiful weather and easy trail!',
    weight: 10,
    effect: () => ({
      message: 'Clear skies and firm ground make for excellent travel today. Everyone\'s spirits are high.',
      healthChangeAll: randomInt(3, 8),
      noEventNextDays: 2,
    }),
  },
  {
    id: 'helpful-native',
    text: () => 'Friendly Native Americans show you a shortcut!',
    weight: 5,
    effect: () => ({
      message: `A group of Shoshone showed you a shortcut. You saved ${randomInt(1, 3)} days of travel.`,
      daysLost: -randomInt(1, 3),
      healthChangeAll: 5,
    }),
  },
  {
    id: 'trade-offer',
    text: () => 'A fellow emigrant offers to trade.',
    weight: 6,
    condition: (s) => s.supplies.food > 100,
    effect: (s) => {
      const foodGiven = randomInt(30, 60);
      const moneyGained = randomInt(5, 20);
      if (s.supplies.food > foodGiven) {
        return {
          message: `You traded ${foodGiven} lbs of food for $${moneyGained}.`,
          foodChange: -foodGiven,
          moneyChange: moneyGained,
        };
      }
      return { message: 'You had nothing suitable to trade.' };
    },
  },
  {
    id: 'find-money',
    text: () => 'You find money on the trail!',
    weight: 3,
    effect: () => {
      const amount = randomInt(5, 30);
      return {
        message: `You found $${amount} in an abandoned saddlebag.`,
        moneyChange: amount,
      };
    },
  },
  {
    id: 'morale-boost',
    text: () => 'The scenery lifts everyone\'s spirits.',
    weight: 6,
    effect: () => ({
      message: 'A stunning sunset over the plains fills everyone with hope and renewed energy.',
      healthChangeAll: randomInt(5, 10),
    }),
  },
];

export function applyEventOutcome(state: GameState, outcome: EventOutcome): string[] {
  const messages: string[] = [outcome.message];

  if (outcome.foodChange) {
    state.supplies.food = clamp(state.supplies.food + outcome.foodChange, 0, 9999);
  }
  if (outcome.moneyChange) {
    state.supplies.money = Math.max(0, state.supplies.money + outcome.moneyChange);
  }
  if (outcome.oxenChange) {
    state.supplies.oxen = clamp(state.supplies.oxen + outcome.oxenChange, 0, 10);
    if (state.supplies.oxen === 0) {
      messages.push('You have no oxen! You cannot continue.');
    }
  }
  if (outcome.clothingChange) {
    state.supplies.clothing = Math.max(0, state.supplies.clothing + outcome.clothingChange);
  }
  if (outcome.ammoChange) {
    state.supplies.ammunition = Math.max(0, state.supplies.ammunition + outcome.ammoChange);
  }
  if (outcome.partsChange) {
    state.supplies.spareParts = Math.max(0, state.supplies.spareParts + outcome.partsChange);
  }
  if (outcome.daysLost) {
    const days = outcome.daysLost;
    state.currentDay += days;
    for (let i = 0; i < Math.abs(days); i++) {
      state.date = advanceDate(state.date);
    }
  }
  if (outcome.healthChange !== undefined) {
    const alive = state.party.filter(m => m.alive);
    if (alive.length > 0) {
      const target = alive[Math.floor(Math.random() * alive.length)];
      target.health = clamp(target.health + outcome.healthChange, 0, 100);
      if (target.health <= 0) {
        target.alive = false;
        target.health = 0;
        messages.push(`${target.name} has died.`);
      }
    }
  }
  if (outcome.healthChangeAll !== undefined) {
    state.party.filter(m => m.alive).forEach(m => {
      m.health = clamp(m.health + (outcome.healthChangeAll ?? 0), 0, 100);
    });
  }
  if (outcome.ailment) {
    const alive = state.party.filter(m => m.alive);
    if (alive.length > 0) {
      const target = alive[Math.floor(Math.random() * alive.length)];
      if (!target.ailments.includes(outcome.ailment)) {
        target.ailments.push(outcome.ailment);
      }
    }
  }
  if (outcome.memberDeath) {
    const alive = state.party.filter(m => m.alive);
    if (alive.length > 0) {
      const target = alive[Math.floor(Math.random() * alive.length)];
      target.alive = false;
      target.health = 0;
      messages.push(`${target.name} has died.`);
    }
  }
  if (outcome.noEventNextDays) {
    state.daysSinceLastEvent = 0;
  }

  return messages;
}
