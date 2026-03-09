export interface Animal {
  id: string;
  name: string;
  foodLbs: number;
  width: number;
  height: number;
  speed: number;     // pixels per second
  art: string;
  x: number;
  y: number;
  direction: 1 | -1;
  alive: boolean;
}

export const ANIMAL_TYPES = [
  { id: 'bison',    name: 'Bison',    foodLbs: 100, width: 48, height: 24, speed: 40,  art: 'B' },
  { id: 'deer',     name: 'Deer',     foodLbs: 50,  width: 32, height: 22, speed: 70,  art: 'D' },
  { id: 'bear',     name: 'Bear',     foodLbs: 75,  width: 36, height: 26, speed: 55,  art: '@' },
  { id: 'rabbit',   name: 'Rabbit',   foodLbs: 2,   width: 16, height: 14, speed: 110, art: 'r' },
  { id: 'squirrel', name: 'Squirrel', foodLbs: 1,   width: 12, height: 12, speed: 130, art: 's' },
];

export const MAX_CARRY_LBS = 200;
export const HUNT_DURATION_MS = 30000;
export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 400;

export function spawnAnimals(count = 5): Animal[] {
  const animals: Animal[] = [];
  const types = [...ANIMAL_TYPES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    animals.push({
      ...type,
      x: Math.random() * (CANVAS_WIDTH - type.width),
      y: 60 + Math.random() * (CANVAS_HEIGHT - 120 - type.height),
      direction: Math.random() > 0.5 ? 1 : -1,
      alive: true,
    });
  }
  return animals;
}

export function updateAnimals(animals: Animal[], dt: number): void {
  for (const animal of animals) {
    if (!animal.alive) continue;
    animal.x += animal.speed * animal.direction * (dt / 1000);
    if (animal.x < 0) {
      animal.x = 0;
      animal.direction = 1;
    } else if (animal.x + animal.width > CANVAS_WIDTH) {
      animal.x = CANVAS_WIDTH - animal.width;
      animal.direction = -1;
    }
  }
}

export function checkHit(
  animals: Animal[],
  crosshairX: number,
  crosshairY: number
): Animal | null {
  for (const animal of animals) {
    if (!animal.alive) continue;
    if (
      crosshairX >= animal.x &&
      crosshairX <= animal.x + animal.width &&
      crosshairY >= animal.y &&
      crosshairY <= animal.y + animal.height
    ) {
      return animal;
    }
  }
  return null;
}

export function totalFoodFromKills(animals: Animal[]): number {
  return Math.min(
    MAX_CARRY_LBS,
    animals.filter(a => !a.alive).reduce((sum, a) => sum + a.foodLbs, 0)
  );
}
