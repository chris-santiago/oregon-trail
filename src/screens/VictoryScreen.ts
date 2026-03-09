import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { ScoringSystem } from '../systems/ScoringSystem';
import { SaveManager } from '../core/SaveManager';

const VICTORY_ART = `
     *   .  .   *    .   *
  .    Oregon!    .    *
  *  Willamette  *   .
   .   Valley  .   *   .
     *   .  .   *    .   *`;

export class VictoryScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const screen = this.createScreen();
    const score = ScoringSystem.calculate(this.state);
    const survivors = this.state.party.filter(m => m.alive);

    Renderer.pre(screen, VICTORY_ART, 'bright');
    Renderer.text(screen, 'YOU HAVE REACHED OREGON!', 'bright');
    Renderer.divider(screen);

    Renderer.text(screen, `Date: ${this.state.date.month}/${this.state.date.day}/${this.state.date.year}`);
    Renderer.text(screen, `Days on the trail: ${this.state.currentDay}`);
    Renderer.spacer(screen);

    if (survivors.length > 0) {
      Renderer.text(screen, `Survivors (${survivors.length} of ${this.state.party.length}):`);
      survivors.forEach(m => Renderer.text(screen, `  ${m.name}`, 'dim'));
      Renderer.spacer(screen);
    }

    // Score breakdown
    Renderer.text(screen, 'FINAL SCORE:', 'bright');

    const table = document.createElement('table');
    table.className = 'score-table';

    const rows = [
      ['Party health', `${score.healthPoints} pts`],
      ['Survival bonus', `${score.survivalPoints} pts`],
      ['Supplies remaining', `${score.supplyPoints} pts`],
      ['Subtotal', `${score.total} pts`],
      [`Profession multiplier (${this.state.profession})`, `x${score.multiplier}`],
      ['FINAL SCORE', `${score.finalScore} pts`],
    ];

    rows.forEach(([label, value]) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.textContent = label;
      td1.className = 'dim';
      const td2 = document.createElement('td');
      td2.textContent = value;
      tr.appendChild(td1);
      tr.appendChild(td2);
      table.appendChild(tr);
    });

    screen.appendChild(table);
    Renderer.spacer(screen);
    Renderer.text(screen, `Ranking: ${score.ranking.toUpperCase()}`, 'bright');
    Renderer.spacer(screen);

    SaveManager.deleteSave();

    this.cleanup = Renderer.anyKey(screen, 'Press any key to play again', () => {
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
  }
}
