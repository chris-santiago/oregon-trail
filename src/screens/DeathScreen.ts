import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { SaveManager } from '../core/SaveManager';
import type { Tombstone } from '../core/GameState';

const TOMBSTONE_ART = `
      _________
     |         |
     |  R.I.P. |
     |         |
     |         |
     |         |
   __|_________|__
  /               \\`;

export class DeathScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const screen = this.createScreen();
    const leader = this.state.party[0];
    const leaderName = leader?.name ?? 'The Traveler';
    const deathCause = (this.engine.context['deathCause'] as string) ?? 'Your party has perished on the trail.';

    Renderer.pre(screen, TOMBSTONE_ART, 'dim');
    Renderer.spacer(screen);
    Renderer.text(screen, deathCause, 'bright');
    Renderer.spacer(screen);

    // Show dead party
    const dead = this.state.party.filter(m => !m.alive);
    if (dead.length > 0) {
      Renderer.text(screen, 'The following did not survive:', 'dim');
      dead.forEach(m => Renderer.text(screen, `  ${m.name}`, 'dim'));
    }

    Renderer.spacer(screen);
    Renderer.text(screen, `You made it ${this.state.currentMile} miles on the Oregon Trail.`);
    Renderer.spacer(screen);
    Renderer.text(screen, 'Enter an epitaph for the tombstone:');
    Renderer.text(screen, '(Leave blank for a default message)', 'dim');
    Renderer.spacer(screen);

    this.cleanup = Renderer.input(screen, 'e.g. "Gone too soon"', (epitaph) => {
      const finalEpitaph = epitaph || `Died ${this.state.currentMile} miles from home.`;
      this.saveTombstone(leaderName, finalEpitaph);
      SaveManager.deleteSave();
      this.showFinal(screen, leaderName, finalEpitaph);
    }, 40);
  }

  private saveTombstone(leaderName: string, epitaph: string): void {
    const tombstone: Tombstone = {
      mile: this.state.currentMile,
      leaderName,
      epitaph,
      date: this.state.date,
    };
    const existing = SaveManager.loadTombstones();
    existing.push(tombstone);
    // Keep only last 20 tombstones
    const trimmed = existing.slice(-20);
    SaveManager.saveTombstones(trimmed);
    this.state.tombstones = trimmed;
  }

  private showFinal(screen: HTMLElement, name: string, epitaph: string): void {
    this.cleanup?.();
    screen.innerHTML = '';

    Renderer.pre(screen, TOMBSTONE_ART, 'dim');
    Renderer.spacer(screen);

    const tombEl = document.createElement('pre');
    tombEl.className = 'tombstone';
    tombEl.textContent = `Here lies ${name}.\n\n"${epitaph}"`;
    screen.appendChild(tombEl);

    Renderer.spacer(screen);
    Renderer.text(screen, 'Your tombstone will mark the trail for future travelers.', 'dim');
    Renderer.spacer(screen);

    this.cleanup = Renderer.anyKey(screen, 'Press any key to start over', () => {
      this.engine.newGame();
      this.engine.transition('title');
    });
  }

  update(_dt: number): void {}

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.engine.context = {};
  }
}
