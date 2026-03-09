import type { GameEngine } from '../core/GameEngine';
import type { GameState } from '../core/GameState';

export abstract class Screen {
  constructor(
    protected engine: GameEngine,
    protected state: GameState,
    protected container: HTMLElement
  ) {}

  abstract enter(): void;
  abstract update(dt: number): void;
  abstract exit(): void;

  protected createScreen(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'screen';
    this.container.appendChild(div);
    return div;
  }
}
