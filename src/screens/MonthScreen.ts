import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';

const MONTHS = [
  { month: 3, name: 'March',  advice: 'Good choice! Early departure gives you the best chance to cross the mountains before snow.' },
  { month: 4, name: 'April',  advice: 'A solid choice. The grass will be growing and rivers more manageable.' },
  { month: 5, name: 'May',    advice: 'Many emigrants leave in May. You should make it, but it will be close.' },
  { month: 6, name: 'June',   advice: 'Risky. You may hit mountain snows in October. Travel fast.' },
  { month: 7, name: 'July',   advice: 'Very risky! Late departure — you will almost certainly face early mountain snows.' },
];

export class MonthScreen extends Screen {
  private cleanup: (() => void) | null = null;

  enter(): void {
    const screen = this.createScreen();

    Renderer.text(screen, 'CHOOSE DEPARTURE MONTH', 'bright');
    Renderer.divider(screen);
    Renderer.text(screen, 'You will leave from Independence, Missouri.', 'dim');
    Renderer.text(screen, 'Which month do you wish to start?');
    Renderer.spacer(screen);

    const adviceEl = document.createElement('p');
    adviceEl.className = 'dim';
    adviceEl.style.minHeight = '2.5em';
    screen.appendChild(adviceEl);

    Renderer.spacer(screen);

    let selectedIdx = 0;

    const updateAdvice = (i: number) => {
      adviceEl.textContent = MONTHS[i].advice;
    };
    updateAdvice(0);

    // Override menu to also update advice panel
    const ul = document.createElement('ul');
    ul.className = 'menu';

    MONTHS.forEach((m, i) => {
      const li = document.createElement('li');
      li.textContent = m.name;
      if (i === 0) li.classList.add('selected');
      li.addEventListener('click', () => {
        selectedIdx = i;
        refresh();
        select(i);
      });
      li.addEventListener('mouseenter', () => {
        updateAdvice(i);
      });
      ul.appendChild(li);
    });

    const items = Array.from(ul.children) as HTMLElement[];

    const refresh = () => {
      items.forEach((li, i) => {
        li.classList.toggle('selected', i === selectedIdx);
      });
    };

    const select = (i: number) => {
      const choice = MONTHS[i];
      this.state.date = { month: choice.month, day: 1, year: 1848 };
      this.state.startMonth = choice.month;
      this.engine.transition('store');
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        selectedIdx = (selectedIdx - 1 + MONTHS.length) % MONTHS.length;
        refresh();
        updateAdvice(selectedIdx);
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        selectedIdx = (selectedIdx + 1) % MONTHS.length;
        refresh();
        updateAdvice(selectedIdx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        select(selectedIdx);
      } else {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= MONTHS.length) {
          selectedIdx = num - 1;
          refresh();
          updateAdvice(selectedIdx);
          select(selectedIdx);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    screen.appendChild(ul);

    this.cleanup = () => document.removeEventListener('keydown', onKey);
  }

  update(_dt: number): void {}

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
