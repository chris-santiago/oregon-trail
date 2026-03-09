export type Profession = 'banker' | 'carpenter' | 'farmer';
export type Pace = 'steady' | 'strenuous' | 'grueling';
export type Rations = 'filling' | 'meager' | 'bare-bones';

export type Ailment =
  | 'typhoid'
  | 'cholera'
  | 'dysentery'
  | 'measles'
  | 'snakebite'
  | 'broken-arm'
  | 'broken-leg'
  | 'exhaustion'
  | 'fever';

export type WeatherCondition =
  | 'clear'
  | 'rainy'
  | 'snowy'
  | 'hot'
  | 'very-cold'
  | 'blizzard';

export type LandmarkType = 'fort' | 'river' | 'landmark' | 'destination';

export interface Landmark {
  name: string;
  mile: number;
  type: LandmarkType;
  hasStore: boolean;
  riverDifficulty?: number;
  description: string;
}

export type GamePhase =
  | 'title'
  | 'profession'
  | 'naming'
  | 'month'
  | 'store'
  | 'traveling'
  | 'event'
  | 'hunting'
  | 'river-crossing'
  | 'landmark'
  | 'status'
  | 'death'
  | 'victory';

export interface PartyMember {
  name: string;
  alive: boolean;
  health: number;    // 0–100
  ailments: Ailment[];
  daysIll: number;
}

export interface Supplies {
  oxen: number;
  food: number;          // pounds
  clothing: number;      // sets
  ammunition: number;    // boxes (20 bullets each)
  spareParts: number;    // spare parts count
  money: number;         // dollars
}

export interface Weather {
  condition: WeatherCondition;
  temperature: number;   // Fahrenheit
}

export interface GameDate {
  month: number;   // 1-12
  day: number;     // 1-30
  year: number;    // 1848
}

export interface Tombstone {
  mile: number;
  leaderName: string;
  epitaph: string;
  date: GameDate;
}

export interface PendingEvent {
  type: 'river' | 'landmark' | 'random-event';
  landmarkIndex?: number;
  eventId?: string;
}

export interface GameState {
  phase: GamePhase;
  profession: Profession;
  party: PartyMember[];
  supplies: Supplies;
  pace: Pace;
  rations: Rations;

  // Travel
  currentMile: number;
  currentDay: number;
  date: GameDate;
  startMonth: number;

  // Weather
  weather: Weather;

  // Trail
  nextLandmarkIndex: number;
  visitedLandmarks: string[];
  pendingEvent: PendingEvent | null;

  // Days since last event (avoid event spam)
  daysSinceLastEvent: number;

  // Tombstones (persisted separately but loaded in)
  tombstones: Tombstone[];

  saveVersion: number;
}

export function createInitialState(): GameState {
  return {
    phase: 'title',
    profession: 'farmer',
    party: [],
    supplies: {
      oxen: 0,
      food: 0,
      clothing: 0,
      ammunition: 0,
      spareParts: 0,
      money: 0,
    },
    pace: 'steady',
    rations: 'filling',
    currentMile: 0,
    currentDay: 0,
    date: { month: 3, day: 1, year: 1848 },
    startMonth: 3,
    weather: { condition: 'clear', temperature: 60 },
    nextLandmarkIndex: 0,
    visitedLandmarks: [],
    pendingEvent: null,
    daysSinceLastEvent: 0,
    tombstones: [],
    saveVersion: 1,
  };
}

export function getPartyHealthStatus(party: PartyMember[]): string {
  const alive = party.filter(m => m.alive);
  if (alive.length === 0) return 'dead';
  const avg = alive.reduce((sum, m) => sum + m.health, 0) / alive.length;
  if (avg >= 71) return 'Good';
  if (avg >= 41) return 'Fair';
  if (avg >= 16) return 'Poor';
  return 'Very Poor';
}

export function getAliveCount(party: PartyMember[]): number {
  return party.filter(m => m.alive).length;
}

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function formatDate(date: GameDate): string {
  return `${MONTH_NAMES[date.month]} ${date.day}, ${date.year}`;
}

export function advanceDate(date: GameDate): GameDate {
  let { month, day, year } = date;
  day++;
  if (day > DAYS_IN_MONTH[month]) {
    day = 1;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return { month, day, year };
}
