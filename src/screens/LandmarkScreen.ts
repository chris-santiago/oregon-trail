import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { LANDMARKS } from '../data/landmarks';
import { TextAnimator } from '../ui/TextAnimator';
import { advanceDate } from '../core/GameState';
import { HealthSystem } from '../systems/HealthSystem';

export class LandmarkScreen extends Screen {
  private cleanup: (() => void) | null = null;
  private animator = new TextAnimator();

  enter(): void {
    const landmarkIndex = this.engine.context['landmarkIndex'] as number;
    const landmark = LANDMARKS[landmarkIndex];

    if (!landmark) {
      this.engine.transition('traveling');
      return;
    }

    // Mark as visited
    if (!this.state.visitedLandmarks.includes(landmark.name)) {
      this.state.visitedLandmarks.push(landmark.name);
    }

    // Update next landmark index
    this.state.nextLandmarkIndex = landmarkIndex + 1;

    // Check destination
    if (landmark.type === 'destination') {
      this.engine.transition('victory');
      return;
    }

    // River landmarks go to river crossing
    if (landmark.type === 'river') {
      this.renderLandmark(landmarkIndex, false);
      return;
    }

    this.renderLandmark(landmarkIndex, landmark.hasStore);
  }

  private async renderLandmark(landmarkIndex: number, hasStore: boolean): Promise<void> {
    this.container.innerHTML = '';
    this.cleanup?.();
    const screen = this.createScreen();

    const landmark = LANDMARKS[landmarkIndex];

    // Art based on type
    const art = landmark.type === 'fort'
      ? `    | | | | | | |
   _|_|_|_|_|_|_|_
  |               |
  |  ${landmark.name.split(',')[0].padEnd(12)} |
  |_______________|`
      : `       /\\     /\\
      /  \\   /  \\
     / *  \\ / *  \\
    /______X______\\`;

    Renderer.pre(screen, art, 'dim');
    Renderer.text(screen, landmark.name.toUpperCase(), 'bright');
    Renderer.divider(screen);

    const descEl = document.createElement('p');
    screen.appendChild(descEl);
    await this.animator.animate(descEl, landmark.description, 20);

    Renderer.spacer(screen);

    // Supplies info
    if (this.state.supplies.food < 50) {
      Renderer.text(screen, 'Warning: You are running low on food!', 'bright');
    }

    const options: string[] = [];
    if (landmark.type === 'river') {
      options.push('Attempt river crossing');
    } else {
      if (hasStore) options.push('Visit the trading post');
      options.push('Look around and rest (1 day)');
      options.push('Continue on trail');
    }

    this.cleanup = Renderer.menu(screen, options, (i) => {
      if (landmark.type === 'river') {
        this.engine.context['landmarkIndex'] = landmarkIndex;
        this.engine.transition('river-crossing');
        return;
      }

      let optIdx = i;
      if (hasStore && optIdx === 0) {
        this.engine.context['fromLandmark'] = true;
        this.engine.context['returnPhase'] = 'traveling';
        this.engine.transition('store');
        return;
      }
      if (hasStore) optIdx--;

      if (optIdx === 0) {
        // Rest
        this.state.currentDay++;
        this.state.date = advanceDate(this.state.date);
        HealthSystem.tickDay(this.state, true);
        this.engine.transition('traveling');
      } else {
        this.engine.transition('traveling');
      }
    });
  }

  update(_dt: number): void {}

  exit(): void {
    this.animator.cancel();
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
