import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import type { PartyMember } from '../core/GameState';

const PARTY_SIZE = 5;

export class NamingScreen extends Screen {
  private cleanup: (() => void) | null = null;
  private currentMemberIndex = 0;
  private names: string[] = [];

  enter(): void {
    this.currentMemberIndex = 0;
    this.names = [];
    this.renderNaming();
  }

  private renderNaming(): void {
    this.container.innerHTML = '';
    const screen = this.createScreen();

    const isLeader = this.currentMemberIndex === 0;
    const memberLabel = isLeader
      ? 'your name (party leader)'
      : `name of person ${this.currentMemberIndex + 1}`;

    Renderer.text(screen, 'NAME YOUR PARTY', 'bright');
    Renderer.divider(screen);

    if (this.names.length > 0) {
      Renderer.text(screen, 'Party members so far:');
      this.names.forEach((name, i) => {
        Renderer.text(screen, `  ${i + 1}. ${name}`, 'dim');
      });
      Renderer.spacer(screen);
    }

    const prompt = document.createElement('p');
    prompt.textContent = `Enter ${memberLabel}:`;
    screen.appendChild(prompt);

    Renderer.spacer(screen);

    const skipNote = this.currentMemberIndex > 0
      ? '(Press ENTER with no name to skip)'
      : '';
    if (skipNote) {
      Renderer.text(screen, skipNote, 'dim');
    }

    this.cleanup = Renderer.input(screen, 'Type name and press ENTER', (value) => {
      const name = value || (this.currentMemberIndex > 0 ? '' : 'Traveler');
      this.names.push(name || `Person ${this.currentMemberIndex + 1}`);
      this.currentMemberIndex++;

      if (this.currentMemberIndex >= PARTY_SIZE) {
        this.buildParty();
      } else {
        this.renderNaming();
      }
    }, 20);
  }

  private buildParty(): void {
    this.state.party = this.names.map((name): PartyMember => ({
      name,
      alive: true,
      health: 100,
      ailments: [],
      daysIll: 0,
    }));
    this.engine.transition('month');
  }

  update(_dt: number): void {}

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
