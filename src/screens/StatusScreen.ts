import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { formatDate } from '../core/GameState';

export class StatusScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const screen = this.createScreen();
    const s = this.state;
    const inv = s.supplies;

    Renderer.text(screen, 'SUPPLIES & PARTY STATUS', 'bright');
    Renderer.divider(screen);

    // Date / Trail
    Renderer.text(screen, `Date: ${formatDate(s.date)}`);
    Renderer.text(screen, `Miles traveled: ${s.currentMile} of 2040`);
    Renderer.text(screen, `Weather: ${s.weather.condition}  (${s.weather.temperature}°F)`);
    Renderer.spacer(screen);

    // Supplies
    Renderer.text(screen, 'SUPPLIES:', 'bright');
    Renderer.text(screen, `  Oxen:         ${inv.oxen} yoke`);
    Renderer.text(screen, `  Food:         ${inv.food} lbs`);
    Renderer.text(screen, `  Clothing:     ${inv.clothing} sets`);
    Renderer.text(screen, `  Ammunition:   ${inv.ammunition} boxes (${inv.ammunition * 20} bullets)`);
    Renderer.text(screen, `  Spare Parts:  ${inv.spareParts}`);
    Renderer.text(screen, `  Money:        $${inv.money.toFixed(0)}`);
    Renderer.spacer(screen);

    // Party
    Renderer.text(screen, 'PARTY:', 'bright');
    s.party.forEach((member, i) => {
      const statusStr = member.alive
        ? `${Renderer.healthBar(member.health)} ${member.health}%`
        : '[DECEASED]';
      const ailmentStr = member.ailments.length > 0
        ? `  (${member.ailments.join(', ')})`
        : '';
      const role = i === 0 ? ' (leader)' : '';
      Renderer.text(screen, `  ${member.name}${role}: ${statusStr}${ailmentStr}`, member.alive ? undefined : 'dim');
    });

    Renderer.spacer(screen);
    this.cleanup = Renderer.anyKey(screen, 'Press any key to return', () => {
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
