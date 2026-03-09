import { GameEngine } from './core/GameEngine';

const container = document.getElementById('game');
if (!container) throw new Error('No #game element found');

const engine = new GameEngine(container);
engine.start();
