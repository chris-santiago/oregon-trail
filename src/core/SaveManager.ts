import type { GameState, Tombstone } from './GameState';
import { LANDMARKS } from '../data/landmarks';
import { EVENTS } from '../data/events';

const SAVE_KEY = 'oregon-trail-save';
const TOMBSTONE_KEY = 'oregon-trail-tombstones';
const SAVE_VERSION = 1;

const VALID_PHASES = new Set([
  'title', 'profession', 'naming', 'month', 'store',
  'traveling', 'event', 'hunting', 'river-crossing',
  'landmark', 'status', 'death', 'victory',
]);
const VALID_PROFESSIONS = new Set(['banker', 'carpenter', 'farmer']);
const VALID_PACES = new Set(['steady', 'strenuous', 'grueling']);
const VALID_RATIONS = new Set(['filling', 'meager', 'bare-bones']);
const VALID_AILMENTS = new Set([
  'typhoid', 'cholera', 'dysentery', 'measles', 'snakebite',
  'broken-arm', 'broken-leg', 'exhaustion', 'fever',
]);
const VALID_WEATHER_CONDITIONS = new Set([
  'clear', 'rainy', 'snowy', 'hot', 'very-cold', 'blizzard',
]);
const VALID_PENDING_EVENT_TYPES = new Set(['river', 'landmark', 'random-event']);
const VALID_EVENT_IDS = new Set(EVENTS.map(e => e.id));
const VALID_LANDMARK_NAMES = new Set(LANDMARKS.map(l => l.name));

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function isValidDate(d: unknown): boolean {
  if (typeof d !== 'object' || d === null) return false;
  const { month, day, year } = d as Record<string, unknown>;
  return (
    isFiniteNumber(month) && month >= 1 && month <= 12 &&
    isFiniteNumber(day)   && day   >= 1 && day   <= 31 &&
    isFiniteNumber(year)  && year  >= 1848
  );
}

function isValidPartyMember(m: unknown): boolean {
  if (typeof m !== 'object' || m === null) return false;
  const mem = m as Record<string, unknown>;
  return (
    typeof mem.name === 'string' &&
    typeof mem.alive === 'boolean' &&
    isFiniteNumber(mem.health) && (mem.health as number) >= 0 && (mem.health as number) <= 100 &&
    Array.isArray(mem.ailments) && mem.ailments.every((a: unknown) => typeof a === 'string' && VALID_AILMENTS.has(a)) &&
    isFiniteNumber(mem.daysIll) && (mem.daysIll as number) >= 0
  );
}

function isValidGameState(data: unknown): data is GameState {
  if (typeof data !== 'object' || data === null) return false;
  const s = data as Record<string, unknown>;

  if (!VALID_PHASES.has(s.phase as string)) return false;
  if (!VALID_PROFESSIONS.has(s.profession as string)) return false;
  if (!VALID_PACES.has(s.pace as string)) return false;
  if (!VALID_RATIONS.has(s.rations as string)) return false;

  if (!Array.isArray(s.party) || !s.party.every(isValidPartyMember)) return false;

  if (typeof s.supplies !== 'object' || s.supplies === null) return false;
  const sup = s.supplies as Record<string, unknown>;
  for (const key of ['oxen', 'food', 'clothing', 'ammunition', 'spareParts', 'money']) {
    if (!isFiniteNumber(sup[key]) || (sup[key] as number) < 0) return false;
  }

  if (!isFiniteNumber(s.currentMile) || (s.currentMile as number) < 0 || (s.currentMile as number) > 2100) return false;
  if (!isFiniteNumber(s.currentDay) || (s.currentDay as number) < 0) return false;
  if (!isFiniteNumber(s.nextLandmarkIndex) || (s.nextLandmarkIndex as number) < 0) return false;
  if (!isFiniteNumber(s.daysSinceLastEvent) || (s.daysSinceLastEvent as number) < 0) return false;
  if (!isFiniteNumber(s.startMonth) || (s.startMonth as number) < 1 || (s.startMonth as number) > 12) return false;

  if (!isValidDate(s.date)) return false;

  if (typeof s.weather !== 'object' || s.weather === null) return false;
  const w = s.weather as Record<string, unknown>;
  if (!VALID_WEATHER_CONDITIONS.has(w.condition as string)) return false;
  if (!isFiniteNumber(w.temperature)) return false;

  if (!Array.isArray(s.visitedLandmarks) || !s.visitedLandmarks.every((v: unknown) => typeof v === 'string' && VALID_LANDMARK_NAMES.has(v))) return false;

  if (s.pendingEvent !== null && s.pendingEvent !== undefined) {
    if (typeof s.pendingEvent !== 'object') return false;
    const pe = s.pendingEvent as Record<string, unknown>;
    if (!VALID_PENDING_EVENT_TYPES.has(pe.type as string)) return false;
    if (pe.landmarkIndex !== undefined) {
      if (!isFiniteNumber(pe.landmarkIndex) || (pe.landmarkIndex as number) < 0 || (pe.landmarkIndex as number) >= LANDMARKS.length) return false;
    }
    if (pe.eventId !== undefined) {
      if (typeof pe.eventId !== 'string' || !VALID_EVENT_IDS.has(pe.eventId)) return false;
    }
  }

  if (!Array.isArray(s.tombstones) || !s.tombstones.every(isValidTombstone)) return false;

  return true;
}

function isValidTombstone(t: unknown): t is Tombstone {
  if (typeof t !== 'object' || t === null) return false;
  const tomb = t as Record<string, unknown>;
  return (
    isFiniteNumber(tomb.mile) && (tomb.mile as number) >= 0 &&
    typeof tomb.leaderName === 'string' &&
    typeof tomb.epitaph === 'string' &&
    isValidDate(tomb.date)
  );
}

export const SaveManager = {
  save(state: GameState): void {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, data);
    } catch {
      // localStorage may be unavailable
    }
  },

  load(): GameState | null {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;
      const parsed: unknown = JSON.parse(data);
      if (!isValidGameState(parsed)) return null;
      if (parsed.saveVersion !== SAVE_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  },

  deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  },

  saveTombstones(tombstones: Tombstone[]): void {
    try {
      localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
    } catch {
      // ignore
    }
  },

  loadTombstones(): Tombstone[] {
    try {
      const data = localStorage.getItem(TOMBSTONE_KEY);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTombstone);
    } catch {
      return [];
    }
  },
};
