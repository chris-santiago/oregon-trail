import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import type { Profession } from '../core/GameState';

const PROFESSIONS: { id: Profession; label: string; money: number; desc: string; scoring: string }[] = [
  {
    id: 'banker',
    label: 'Banker from Boston',
    money: 1600,
    desc: 'You have plenty of money but your score will not be multiplied.',
    scoring: 'Score multiplier: x1',
  },
  {
    id: 'carpenter',
    label: 'Carpenter from Ohio',
    money: 800,
    desc: 'You have a moderate amount of money and a good score multiplier.',
    scoring: 'Score multiplier: x2',
  },
  {
    id: 'farmer',
    label: 'Farmer from Illinois',
    money: 400,
    desc: 'You have little money but the greatest score multiplier.',
    scoring: 'Score multiplier: x3',
  },
];

export class ProfessionScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const screen = this.createScreen();

    Renderer.text(screen, 'CHOOSE YOUR PROFESSION', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, 'Many kinds of people made the trip to Oregon.', 'dim');
    Renderer.text(screen, 'What is your occupation?');
    Renderer.spacer(screen);

    const descEl = document.createElement('p');
    descEl.style.minHeight = '3em';
    screen.appendChild(descEl);

    const options = PROFESSIONS.map(p => `${p.label}  ($${p.money})`);

    this.cleanup = Renderer.menu(screen, options, (i) => {
      const p = PROFESSIONS[i];
      this.state.profession = p.id;
      this.state.supplies.money = p.money;
      this.engine.transition('naming');
    });

    // Update description on hover/keyboard nav
    const updateDesc = (i: number) => {
      const p = PROFESSIONS[i];
      descEl.innerHTML = `<span class="dim">${p.desc}<br>${p.scoring}</span>`;
    };
    updateDesc(0);

    // Patch keydown to update description on navigation
    const descHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        // rough sync — just cycle through on nav
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        // similar
      }
    };
    document.addEventListener('keydown', descHandler);

    const origCleanup = this.cleanup;
    this.cleanup = () => {
      if (origCleanup) origCleanup();
      document.removeEventListener('keydown', descHandler);
    };
  }

  update(_dt: number): void {}

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
