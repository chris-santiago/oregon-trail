import type { Weather, WeatherCondition } from '../core/GameState';
import { weightedRandom, randomInt, clamp } from '../core/RandomTable';

// Base temperatures by month (Fahrenheit)
const MONTH_BASE_TEMPS: Record<number, number> = {
  1: 25, 2: 30, 3: 40, 4: 52, 5: 63,
  6: 74, 7: 82, 8: 79, 9: 66, 10: 52,
  11: 38, 12: 27,
};

type ConditionWeight = { item: WeatherCondition; weight: number };

function getConditionWeights(temp: number, mile: number): ConditionWeight[] {
  const inMountains = mile >= 800 && mile <= 1100;

  if (temp >= 80) {
    return [
      { item: 'clear' as WeatherCondition,     weight: 35 },
      { item: 'hot' as WeatherCondition,       weight: 40 },
      { item: 'rainy' as WeatherCondition,     weight: 25 },
    ];
  } else if (temp >= 60) {
    return ([
      { item: 'clear' as WeatherCondition,     weight: 50 },
      { item: 'rainy' as WeatherCondition,     weight: 30 },
      { item: 'hot' as WeatherCondition,       weight: 10 },
      { item: 'snowy' as WeatherCondition,     weight: inMountains ? 10 : 0 },
    ] as ConditionWeight[]).filter(x => x.weight > 0);
  } else if (temp >= 35) {
    return [
      { item: 'clear',     weight: 40 },
      { item: 'rainy',     weight: 35 },
      { item: 'very-cold', weight: 10 },
      { item: 'snowy',     weight: 15 },
    ];
  } else if (temp >= 15) {
    return [
      { item: 'clear',     weight: 20 },
      { item: 'very-cold', weight: 30 },
      { item: 'snowy',     weight: 35 },
      { item: 'blizzard',  weight: 15 },
    ];
  } else {
    return [
      { item: 'very-cold', weight: 30 },
      { item: 'blizzard',  weight: 40 },
      { item: 'snowy',     weight: 30 },
    ];
  }
}

// Altitude modifier (higher in mountains)
function getAltitudePenalty(mile: number): number {
  if (mile >= 880 && mile <= 1000) return 25; // South Pass area
  if (mile >= 800 && mile <= 1100) return 15; // Mountains
  if (mile >= 1650 && mile <= 1750) return 15; // Blue Mountains
  return 0;
}

export const WeatherSystem = {
  generate(month: number, mile: number): Weather {
    const baseTemp = MONTH_BASE_TEMPS[month] ?? 55;
    const variance = randomInt(-15, 15);
    const altitudePenalty = getAltitudePenalty(mile);
    const temperature = clamp(baseTemp + variance - altitudePenalty, -10, 105);

    const weights = getConditionWeights(temperature, mile);
    const condition = weightedRandom(weights);

    return { condition, temperature };
  },

  getWeatherPenalty(condition: WeatherCondition): number {
    switch (condition) {
      case 'clear':     return 0;
      case 'hot':       return -2;
      case 'rainy':     return -3;
      case 'very-cold': return -5;
      case 'snowy':     return -6;
      case 'blizzard':  return -12;
    }
  },

  describeWeather(weather: Weather): string {
    const tempStr = `${weather.temperature}°F`;
    switch (weather.condition) {
      case 'clear':     return `Clear, ${tempStr}`;
      case 'hot':       return `Hot & Sunny, ${tempStr}`;
      case 'rainy':     return `Rainy, ${tempStr}`;
      case 'very-cold': return `Very Cold, ${tempStr}`;
      case 'snowy':     return `Snowing, ${tempStr}`;
      case 'blizzard':  return `Blizzard! ${tempStr}`;
    }
  },

  getHealthPenalty(condition: WeatherCondition): number {
    switch (condition) {
      case 'blizzard':  return -3;
      case 'very-cold': return -2;
      case 'snowy':     return -1;
      case 'hot':       return -1;
      default:          return 0;
    }
  },
};
