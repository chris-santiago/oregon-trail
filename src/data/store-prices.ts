export interface StoreItem {
  name: string;
  unit: string;
  pricePerUnit: number;
  description: string;
  minBuy?: number;
  maxBuy?: number;
}

export const STORE_ITEMS: Record<string, StoreItem> = {
  oxen: {
    name: 'Oxen',
    unit: 'yoke (pair)',
    pricePerUnit: 40,
    description: 'You need at least 1 yoke of oxen to pull your wagon. More oxen means faster travel.',
    minBuy: 1,
    maxBuy: 5,
  },
  food: {
    name: 'Food',
    unit: 'pound',
    pricePerUnit: 0.20,
    description: 'You will need food for the entire journey. Each person eats 3 lbs/day on filling rations.',
    maxBuy: 2000,
  },
  clothing: {
    name: 'Clothing',
    unit: 'set',
    pricePerUnit: 10,
    description: 'Warm clothing is essential for mountain crossings and cold weather.',
    maxBuy: 20,
  },
  ammunition: {
    name: 'Ammunition',
    unit: 'box (20 bullets)',
    pricePerUnit: 2,
    description: 'Used for hunting and protection. Each box contains 20 bullets.',
    maxBuy: 100,
  },
  spareParts: {
    name: 'Spare Parts',
    unit: 'part',
    pricePerUnit: 10,
    description: 'Wagon wheels, axles, and tongues break frequently. Carry spares or be stranded.',
    maxBuy: 10,
  },
};

export type StoreItemId = 'oxen' | 'food' | 'clothing' | 'ammunition' | 'spareParts';
