import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { STORE_ITEMS, type StoreItemId } from '../data/store-prices';
import type { GamePhase } from '../core/GameState';

interface StoreState {
  step: 'intro' | 'menu' | StoreItemId | 'confirm';
  returnPhase: GamePhase;
  fromLandmark: boolean;
}

export class StoreScreen extends Screen {
  private cleanup: (() => void) | null = null;
  private storeState: StoreState = {
    step: 'intro',
    returnPhase: 'traveling',
    fromLandmark: false,
  };

  enter(): void {
    const fromLandmark = this.engine.context['fromLandmark'] === true;
    this.storeState = {
      step: fromLandmark ? 'menu' : 'intro',
      returnPhase: (this.engine.context['returnPhase'] as GamePhase) ?? 'traveling',
      fromLandmark,
    };
    this.render();
  }

  private render(): void {
    // Cleanup first (removes event listeners) before clearing DOM
    const prevCleanup = this.cleanup;
    this.cleanup = null;
    prevCleanup?.();
    this.container.innerHTML = '';
    const screen = this.createScreen();

    switch (this.storeState.step) {
      case 'intro':
        this.renderIntro(screen);
        break;
      case 'menu':
        this.renderMenu(screen);
        break;
      case 'confirm':
        this.renderConfirm(screen);
        break;
      default:
        this.renderBuyItem(screen, this.storeState.step as StoreItemId);
        break;
    }
  }

  private renderIntro(screen: HTMLElement): void {
    Renderer.text(screen, 'MATT\'S GENERAL STORE', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, '"Howdy! You\'re heading to Oregon! Let me help you get outfitted for the journey."');
    Renderer.spacer(screen);
    Renderer.text(screen, `You have $${this.state.supplies.money.toFixed(0)} to spend.`);
    Renderer.spacer(screen);
    Renderer.text(screen, 'Remember: you need at least 1 yoke of oxen!', 'dim');
    Renderer.spacer(screen);

    this.cleanup = Renderer.anyKey(screen, 'Press any key to enter the store', () => {
      this.storeState.step = 'menu';
      this.render();
    });
  }

  private renderMenu(screen: HTMLElement): void {
    Renderer.text(screen, 'GENERAL STORE', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, `Money remaining: $${this.state.supplies.money.toFixed(0)}`, 'bright');
    Renderer.spacer(screen);

    // Current supplies summary
    const inv = this.state.supplies;
    const lines = [
      `Oxen: ${inv.oxen} yoke`,
      `Food: ${inv.food} lbs`,
      `Clothing: ${inv.clothing} sets`,
      `Ammunition: ${inv.ammunition} boxes`,
      `Spare Parts: ${inv.spareParts}`,
    ];
    lines.forEach(l => Renderer.text(screen, '  ' + l, 'dim'));
    Renderer.spacer(screen);

    const options = [
      'Buy oxen  ($40/yoke)',
      'Buy food  ($0.20/lb)',
      'Buy clothing  ($10/set)',
      'Buy ammunition  ($2/box)',
      'Buy spare parts  ($10/part)',
      'Leave store',
    ];

    const ids: (StoreItemId | 'leave')[] = ['oxen', 'food', 'clothing', 'ammunition', 'spareParts', 'leave'];

    this.cleanup = Renderer.menu(screen, options, (i) => {
      const id = ids[i];
      if (id === 'leave') {
        if (this.state.supplies.oxen === 0) {
          this.showMessage(screen, 'You need at least 1 yoke of oxen to travel!');
          return;
        }
        this.engine.transition(this.storeState.returnPhase);
      } else {
        this.storeState.step = id;
        this.render();
      }
    });
  }

  private renderBuyItem(screen: HTMLElement, itemId: StoreItemId): void {
    const item = STORE_ITEMS[itemId];
    Renderer.text(screen, `BUY ${item.name.toUpperCase()}`, 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, item.description, 'dim');
    Renderer.spacer(screen);
    Renderer.text(screen, `Price: $${item.pricePerUnit.toFixed(2)} per ${item.unit}`);
    Renderer.text(screen, `Money remaining: $${this.state.supplies.money.toFixed(0)}`);

    const currentQty = (this.state.supplies as unknown as Record<string, number>)[itemId] ?? 0;
    if (currentQty > 0) {
      Renderer.text(screen, `You currently have: ${currentQty}`, 'dim');
    }

    Renderer.spacer(screen);
    Renderer.text(screen, 'How many do you want to buy? (0 to go back)');

    const maxAffordable = Math.floor(this.state.supplies.money / item.pricePerUnit);
    const maxAllowed = item.maxBuy ?? 9999;
    const maxBuy = Math.min(maxAffordable, maxAllowed);
    Renderer.text(screen, `(Max: ${maxBuy})`, 'dim');
    Renderer.spacer(screen);

    this.cleanup = Renderer.input(screen, 'Enter quantity', (value) => {
      const qty = parseInt(value) || 0;
      if (qty === 0) {
        this.storeState.step = 'menu';
        this.render();
        return;
      }
      if (qty < 0 || qty > maxBuy) {
        this.showMessage(screen, `Please enter a number between 0 and ${maxBuy}.`);
        return;
      }
      if (itemId === 'oxen' && item.minBuy && qty < item.minBuy && this.state.supplies.oxen === 0) {
        this.showMessage(screen, `You need at least ${item.minBuy} yoke of oxen!`);
        return;
      }
      const cost = qty * item.pricePerUnit;
      (this.state.supplies as unknown as Record<string, number>)[itemId] += qty;
      this.state.supplies.money -= cost;
      this.storeState.step = 'menu';
      this.render();
    }, 6);
  }

  private renderConfirm(screen: HTMLElement): void {
    Renderer.text(screen, 'LEAVING THE STORE', 'bright');
    Renderer.divider(screen);
    const inv = this.state.supplies;
    Renderer.text(screen, 'Your supplies:');
    Renderer.text(screen, `  Oxen: ${inv.oxen} yoke`, 'dim');
    Renderer.text(screen, `  Food: ${inv.food} lbs`, 'dim');
    Renderer.text(screen, `  Clothing: ${inv.clothing} sets`, 'dim');
    Renderer.text(screen, `  Ammunition: ${inv.ammunition} boxes`, 'dim');
    Renderer.text(screen, `  Spare Parts: ${inv.spareParts}`, 'dim');
    Renderer.text(screen, `  Money: $${inv.money.toFixed(0)}`, 'dim');
    Renderer.spacer(screen);

    this.cleanup = Renderer.anyKey(screen, 'Press any key to continue', () => {
      this.engine.transition(this.storeState.returnPhase);
    });
  }

  private showMessage(screen: HTMLElement, msg: string): void {
    // Find existing message or add one
    const existing = screen.querySelector('.store-msg');
    if (existing) {
      existing.textContent = msg;
    } else {
      const p = document.createElement('p');
      p.className = 'store-msg bright';
      p.textContent = msg;
      screen.appendChild(p);
    }
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
