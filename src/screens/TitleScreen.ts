import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';

const TITLE_ART = `
 _____ _   _ _____
|_   _| | | | ____|
  | | | |_| |  _|
  | | |  _  | |___
  |_| |_| |_|_____|

  ___  ____  _____ ____   ___  _   _
 / _ \\|  _ \\| ____/ ___| / _ \\| \\ | |
| | | | |_) |  _|| |  _ | | | |  \\| |
| |_| |  _ <| |__| |_| || |_| | |\\  |
 \\___/|_| \\_\\_____\\____|  \\___/|_| \\_|

 _____  ____      _    ___ _
|_   _||  _ \\    / \\  |_ _| |
  | |  | |_) |  / _ \\  | || |
  | |  |  _ <  / ___ \\ | || |___
  |_|  |_| \\_\\/_/   \\_\\___|_____|`;

export class TitleScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const screen = this.createScreen();
    screen.style.justifyContent = 'center';
    screen.style.alignItems = 'center';
    screen.style.textAlign = 'center';

    Renderer.pre(screen, TITLE_ART, 'title');

    const sub = document.createElement('p');
    sub.className = 'dim';
    sub.style.marginTop = '12px';
    sub.style.fontSize = '9px';
    sub.textContent = '© 1971 Minnesota Educational Computing Consortium';
    screen.appendChild(sub);

    Renderer.divider(screen);
    Renderer.spacer(screen);

    const options = this.engine.hasSave()
      ? ['Travel the trail', 'Continue saved journey', 'About the trail']
      : ['Travel the trail', 'About the trail'];

    this.cleanup = Renderer.menu(screen, options, (i) => {
      if (this.engine.hasSave()) {
        if (i === 0) {
          this.engine.newGame();
          this.engine.transition('profession');
        } else if (i === 1) {
          // Load saved game
          this.engine.transition(this.engine.state.phase === 'title' ? 'traveling' : this.engine.state.phase);
        } else {
          this.showAbout(screen);
        }
      } else {
        if (i === 0) {
          this.engine.newGame();
          this.engine.transition('profession');
        } else {
          this.showAbout(screen);
        }
      }
    });
  }

  private showAbout(screen: HTMLElement): void {
    screen.innerHTML = '';

    Renderer.text(screen, 'ABOUT THE OREGON TRAIL', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, 'The year is 1848. You and your family are leaving your home in Independence, Missouri to travel the Oregon Trail to the Willamette Valley.');
    Renderer.text(screen, 'The trail is nearly 2,000 miles long. You will face rivers, mountains, illness, and harsh weather on this 5-month journey.');
    Renderer.text(screen, 'Your choices determine whether your family survives to reach Oregon.');
    Renderer.spacer(screen);
    Renderer.text(screen, 'Use arrow keys or number keys to navigate menus.', 'dim');
    Renderer.text(screen, 'Press ENTER to confirm selections.', 'dim');
    Renderer.spacer(screen);

    const back = Renderer.anyKey(screen, 'Press any key to return', () => {
      this.exit();
      this.enter();
    });
    this.cleanup = back;
  }

  update(_dt: number): void {}

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
