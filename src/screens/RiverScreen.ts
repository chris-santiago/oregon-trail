import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { LANDMARKS } from '../data/landmarks';
import { RiverSystem, type CrossingMethod } from '../systems/RiverSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { advanceDate } from '../core/GameState';

export class RiverScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const landmarkIndex = this.engine.context['landmarkIndex'] as number;
    const landmark = LANDMARKS[landmarkIndex];
    const difficulty = landmark.riverDifficulty ?? 2;

    this.renderCrossing(landmark.name, difficulty);
  }

  private renderCrossing(name: string, difficulty: number): void {
    const prev = this.cleanup; this.cleanup = null; prev?.();
    this.container.innerHTML = '';
    const screen = this.createScreen();

    Renderer.pre(screen, `
  ~  ~  ~  ~  ~  ~  ~  ~  ~
 ~ ~ ~ ~ RIVER ~ ~ ~ ~ ~ ~ ~
  ~  ~  ~  ~  ~  ~  ~  ~  ~`, 'bright');

    Renderer.text(screen, name.toUpperCase(), 'bright');
    Renderer.divider(screen);

    const depth = RiverSystem.getDepthDescription(difficulty);
    const ferryPrice = RiverSystem.getFerryPrice(difficulty);

    Renderer.text(screen, `The river is ${depth} deep and 600 feet across.`);
    Renderer.text(screen, `Weather: ${this.state.weather.condition}`, 'dim');
    Renderer.spacer(screen);
    Renderer.text(screen, 'How do you wish to cross?');
    Renderer.spacer(screen);

    const options = [
      'Ford the river',
      'Caulk the wagon and float',
      `Take a ferry  ($${ferryPrice})`,
      'Wait for the river to lower',
    ];

    this.cleanup = Renderer.menu(screen, options, (i) => {
      const methods: CrossingMethod[] = ['ford', 'caulk', 'ferry', 'wait'];
      this.attemptCrossing(methods[i], difficulty);
    });
  }

  private attemptCrossing(method: CrossingMethod, difficulty: number): void {
    const result = RiverSystem.attempt(this.state, method, difficulty);
    RiverSystem.applyResult(this.state, result);

    // Apply day advances for waiting
    if (result.daysWaited > 0) {
      for (let i = 0; i < result.daysWaited; i++) {
        this.state.date = advanceDate(this.state.date);
        this.state.currentDay++;
      }
      // Lower difficulty by 1 per day waited
      const newDifficulty = Math.max(1, difficulty - result.daysWaited);
      this.renderCrossing(
        LANDMARKS[this.engine.context['landmarkIndex'] as number].name,
        newDifficulty
      );
      return;
    }

    const prev = this.cleanup; this.cleanup = null; prev?.();
    this.container.innerHTML = '';
    const screen = this.createScreen();

    Renderer.text(screen, 'CROSSING RESULT', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, result.message);

    if (result.deaths.length > 0) {
      Renderer.spacer(screen);
      result.deaths.forEach(name => {
        Renderer.text(screen, `${name} has drowned.`, 'bright');
      });
    }

    if (!result.success) {
      Renderer.spacer(screen);
      Renderer.text(screen, `Food lost: ${result.foodLost} lbs`, 'dim');
    }

    Renderer.spacer(screen);

    if (HealthSystem.allDead(this.state)) {
      this.cleanup = Renderer.anyKey(screen, 'Press any key to continue', () => {
        this.engine.transition('death');
      });
      return;
    }

    this.cleanup = Renderer.anyKey(screen, 'Press any key to continue', () => {
      // Move past this landmark
      this.state.nextLandmarkIndex = (this.engine.context['landmarkIndex'] as number) + 1;
      this.engine.transition('traveling');
    });
  }

  update(_dt: number): void {}

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
