import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import {
  spawnAnimals, updateAnimals, checkHit, totalFoodFromKills,
  CANVAS_WIDTH, CANVAS_HEIGHT, HUNT_DURATION_MS, MAX_CARRY_LBS,
  type Animal,
} from '../systems/HuntingSystem';

const CROSSHAIR_SIZE = 20;
const GROUND_Y = CANVAS_HEIGHT - 60;

export class HuntingScreen extends Screen {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animals: Animal[] = [];
  private crosshairX = CANVAS_WIDTH / 2;
  private crosshairY = CANVAS_HEIGHT / 2;
  private bullets = 0;
  private timeRemaining = HUNT_DURATION_MS;
  private hunting = false;
  private kills: Animal[] = [];
  private cleanup: (() => void) | null = null;
  private keyState: Record<string, boolean> = {};

  enter(): void {
    this.renderIntro();
  }

  private renderIntro(): void {
    this.container.innerHTML = '';
    const screen = this.createScreen();

    Renderer.text(screen, 'GO HUNTING', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, `Ammunition: ${this.state.supplies.ammunition} boxes (${this.state.supplies.ammunition * 20} bullets)`);
    Renderer.text(screen, 'You can carry up to 200 lbs of food back.');
    Renderer.spacer(screen);
    Renderer.text(screen, 'CONTROLS:', 'dim');
    Renderer.text(screen, '  Arrow keys / WASD — move crosshair', 'dim');
    Renderer.text(screen, '  SPACE / click — fire', 'dim');
    Renderer.text(screen, '  You have 30 seconds', 'dim');
    Renderer.spacer(screen);

    if (this.state.supplies.ammunition === 0) {
      Renderer.text(screen, 'You have no ammunition!', 'bright');
      this.cleanup = Renderer.anyKey(screen, 'Press any key to return', () => {
        this.engine.transition('traveling');
      });
      return;
    }

    this.cleanup = Renderer.anyKey(screen, 'Press any key to start hunting', () => {
      this.startHunting();
    });
  }

  private startHunting(): void {
    this.container.innerHTML = '';
    const screen = this.createScreen();
    screen.style.padding = '8px';

    this.bullets = this.state.supplies.ammunition * 20;
    this.timeRemaining = HUNT_DURATION_MS;
    this.animals = spawnAnimals(6);
    this.kills = [];
    this.hunting = true;
    this.keyState = {};

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.style.display = 'flex';
    statusBar.style.justifyContent = 'space-between';
    statusBar.style.marginBottom = '4px';
    statusBar.style.fontSize = '9px';

    const bulletEl = document.createElement('span');
    bulletEl.id = 'hunt-bullets';
    bulletEl.textContent = `Bullets: ${this.bullets}`;

    const timerEl = document.createElement('span');
    timerEl.id = 'hunt-timer';
    timerEl.textContent = `Time: ${Math.ceil(this.timeRemaining / 1000)}s`;

    const foodEl = document.createElement('span');
    foodEl.id = 'hunt-food';
    foodEl.textContent = 'Food: 0 lbs';

    statusBar.appendChild(bulletEl);
    statusBar.appendChild(foodEl);
    statusBar.appendChild(timerEl);
    screen.appendChild(statusBar);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'hunting-canvas';
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.maxWidth = '100%';
    screen.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
      this.keyState[e.key] = true;
      if ((e.key === ' ' || e.key === 'Space') && this.hunting) {
        e.preventDefault();
        this.fire();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keyState[e.key] = false;
    };

    // Mouse
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      this.crosshairX = (e.clientX - rect.left) * scaleX;
      this.crosshairY = (e.clientY - rect.top) * scaleY;
    };
    const onClick = () => {
      if (this.hunting) this.fire();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    this.cleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    };
  }

  private fire(): void {
    if (this.bullets <= 0) return;
    this.bullets--;

    const hit = checkHit(this.animals, this.crosshairX, this.crosshairY);
    if (hit && hit.alive) {
      hit.alive = false;
      this.kills.push(hit);
    }

    const bulletEl = document.getElementById('hunt-bullets');
    if (bulletEl) bulletEl.textContent = `Bullets: ${this.bullets}`;
    const foodEl = document.getElementById('hunt-food');
    if (foodEl) foodEl.textContent = `Food: ${totalFoodFromKills(this.animals)} lbs`;

    if (this.bullets <= 0) {
      this.endHunt();
    }
  }

  private endHunt(): void {
    this.hunting = false;
    const food = totalFoodFromKills(this.animals);
    const container = this.container;
    this.cleanup?.();

    container.innerHTML = '';
    const screen = this.createScreen();

    Renderer.text(screen, 'HUNT RESULTS', 'bright');
    Renderer.divider(screen);

    if (this.kills.length === 0) {
      Renderer.text(screen, 'You didn\'t hit anything.');
    } else {
      Renderer.text(screen, 'You shot:');
      this.kills.forEach(k => Renderer.text(screen, `  ${k.name} — ${k.foodLbs} lbs`, 'dim'));
      Renderer.spacer(screen);
      if (totalFoodFromKills(this.animals) >= MAX_CARRY_LBS) {
        Renderer.text(screen, `You can only carry ${MAX_CARRY_LBS} lbs back.`, 'dim');
      }
      Renderer.text(screen, `Total food gained: ${food} lbs`, 'bright');
    }

    const boxesUsed = Math.ceil((this.state.supplies.ammunition * 20 - this.bullets) / 20);
    this.state.supplies.ammunition = Math.max(0, this.state.supplies.ammunition - Math.max(1, boxesUsed));
    this.state.supplies.food += food;

    Renderer.spacer(screen);
    this.cleanup = Renderer.anyKey(screen, 'Press any key to return to trail', () => {
      this.engine.transition('traveling');
    });
  }

  update(dt: number): void {
    if (!this.hunting || !this.ctx || !this.canvas) return;

    // Move crosshair with keys
    const speed = 300;
    const move = speed * (dt / 1000);
    if (this.keyState['ArrowLeft'] || this.keyState['a'] || this.keyState['A']) {
      this.crosshairX = Math.max(0, this.crosshairX - move);
    }
    if (this.keyState['ArrowRight'] || this.keyState['d'] || this.keyState['D']) {
      this.crosshairX = Math.min(CANVAS_WIDTH, this.crosshairX + move);
    }
    if (this.keyState['ArrowUp'] || this.keyState['w'] || this.keyState['W']) {
      this.crosshairY = Math.max(0, this.crosshairY - move);
    }
    if (this.keyState['ArrowDown'] || this.keyState['s'] || this.keyState['S']) {
      this.crosshairY = Math.min(CANVAS_HEIGHT, this.crosshairY + move);
    }

    // Update timer
    this.timeRemaining -= dt;
    const timerEl = document.getElementById('hunt-timer');
    if (timerEl) timerEl.textContent = `Time: ${Math.max(0, Math.ceil(this.timeRemaining / 1000))}s`;

    if (this.timeRemaining <= 0) {
      this.endHunt();
      return;
    }

    updateAnimals(this.animals, dt);
    this.draw();
  }

  private draw(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sky gradient
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Ground
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Grass line
    ctx.strokeStyle = '#2a6a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Draw animals
    ctx.font = '20px monospace';
    ctx.textBaseline = 'top';

    for (const animal of this.animals) {
      if (!animal.alive) continue;

      ctx.fillStyle = '#33ff33';
      ctx.fillText(animal.art, animal.x, animal.y);

      // Draw bounding box (subtle, for debugging feel)
      ctx.strokeStyle = '#1a5c1a';
      ctx.lineWidth = 1;
      ctx.strokeRect(animal.x, animal.y, animal.width, animal.height);
    }

    // Draw dead animals (X marker)
    ctx.fillStyle = '#cc3333';
    for (const animal of this.animals) {
      if (animal.alive) continue;
      ctx.fillText('X', animal.x + animal.width / 2 - 6, animal.y);
    }

    // Draw crosshair
    const cx = this.crosshairX;
    const cy = this.crosshairY;
    const hs = CROSSHAIR_SIZE;

    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 1.5;

    // Cross lines
    ctx.beginPath();
    ctx.moveTo(cx - hs, cy);
    ctx.lineTo(cx + hs, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - hs);
    ctx.lineTo(cx, cy + hs);
    ctx.stroke();

    // Circle
    ctx.beginPath();
    ctx.arc(cx, cy, hs * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  exit(): void {
    this.hunting = false;
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
