import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { TextAnimator } from '../ui/TextAnimator';
import type { GameEvent } from '../data/events';
import { applyEventOutcome } from '../data/events';
import { HealthSystem } from '../systems/HealthSystem';

export class EventScreen extends Screen {
  private cleanup: (() => void) | null = null;
  private animator = new TextAnimator();

  enter(): void {
    const event = this.engine.context['event'] as GameEvent | undefined;
    if (!event) {
      this.engine.transition('traveling');
      return;
    }

    this.render(event);
  }

  private async render(event: GameEvent): Promise<void> {
    this.container.innerHTML = '';
    const screen = this.createScreen();

    Renderer.text(screen, '! EVENT !', 'bright');
    Renderer.divider(screen);

    const textEl = document.createElement('p');
    screen.appendChild(textEl);

    const eventText = event.text(this.state);
    await this.animator.animate(textEl, eventText, 30);

    Renderer.spacer(screen);

    // Apply effect
    const outcome = event.effect(this.state);
    const outcomeMessages = applyEventOutcome(this.state, outcome);

    // Show outcome messages
    for (const msg of outcomeMessages) {
      Renderer.text(screen, msg, 'dim');
    }

    Renderer.spacer(screen);

    // Check if all died
    if (HealthSystem.allDead(this.state)) {
      this.cleanup = Renderer.anyKey(screen, 'Press any key to continue', () => {
        this.engine.transition('death');
      });
      return;
    }

    this.cleanup = Renderer.anyKey(screen, 'Press any key to continue', () => {
      this.engine.transition('traveling');
    });
  }

  update(_dt: number): void {}

  exit(): void {
    this.animator.cancel();
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.engine.context['event'] = undefined;
  }
}
