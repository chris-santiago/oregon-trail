export const Renderer = {
  clear(container: HTMLElement): void {
    container.innerHTML = '';
  },

  text(container: HTMLElement, text: string, className?: string): HTMLParagraphElement {
    const p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    container.appendChild(p);
    return p;
  },

  pre(container: HTMLElement, text: string, className?: string): HTMLPreElement {
    const pre = document.createElement('pre');
    if (className) pre.className = className;
    pre.textContent = text;
    container.appendChild(pre);
    return pre;
  },

  divider(container: HTMLElement): void {
    const hr = document.createElement('hr');
    hr.className = 'divider';
    container.appendChild(hr);
  },

  spacer(container: HTMLElement): void {
    const p = document.createElement('p');
    p.innerHTML = '&nbsp;';
    container.appendChild(p);
  },

  /**
   * Creates a keyboard-navigable menu.
   * Returns a cleanup function.
   */
  menu(
    container: HTMLElement,
    options: string[],
    onSelect: (index: number) => void,
    initialIndex = 0
  ): () => void {
    const ul = document.createElement('ul');
    ul.className = 'menu';

    let selected = initialIndex;

    const items = options.map((label, i) => {
      const li = document.createElement('li');
      li.textContent = label;
      if (i === selected) li.classList.add('selected');
      li.addEventListener('click', () => {
        selected = i;
        refresh();
        onSelect(i);
      });
      ul.appendChild(li);
      return li;
    });

    function refresh() {
      items.forEach((li, i) => {
        li.classList.toggle('selected', i === selected);
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        selected = (selected - 1 + options.length) % options.length;
        refresh();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        selected = (selected + 1) % options.length;
        refresh();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(selected);
      } else {
        // Number key shortcuts
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= options.length) {
          selected = num - 1;
          refresh();
          onSelect(selected);
        }
      }
    }

    container.appendChild(ul);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  },

  /**
   * Creates a text input field.
   */
  input(
    container: HTMLElement,
    placeholder: string,
    onSubmit: (value: string) => void,
    maxLength = 20
  ): () => void {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.placeholder = placeholder;
    input.maxLength = maxLength;
    input.autocomplete = 'off';
    container.appendChild(input);

    // Focus immediately and also after a tick in case of render timing
    input.focus();
    setTimeout(() => input.focus(), 30);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation(); // Don't let Enter bubble to document listeners
        onSubmit(input.value.trim());
      }
    }

    // Listen on document too so keypresses work even if focus is lost
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.target === input) return; // handled by input listener above
      if (!document.body.contains(input)) {
        document.removeEventListener('keydown', onDocKeyDown);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(input.value.trim());
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Forward printable characters to the input if it's not focused
        if (document.activeElement !== input) {
          input.focus();
          input.value += e.key;
          e.preventDefault();
        }
      }
    }

    input.addEventListener('keydown', onKeyDown);
    document.addEventListener('keydown', onDocKeyDown);

    return () => {
      input.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  },

  /**
   * Creates an "any key to continue" handler.
   */
  anyKey(container: HTMLElement, label: string, onContinue: () => void): () => void {
    const p = document.createElement('p');
    p.className = 'dim';
    p.innerHTML = `${label} <span class="blink">_</span>`;
    container.appendChild(p);

    let active = false;

    function onKeyDown(e: KeyboardEvent) {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      cleanup();
      onContinue();
    }

    // Prevent the keypress that triggered the current screen transition
    // from immediately dismissing this prompt
    const timerId = setTimeout(() => {
      active = true;
      document.addEventListener('keydown', onKeyDown);
    }, 120);

    function cleanup() {
      clearTimeout(timerId);
      if (active) {
        document.removeEventListener('keydown', onKeyDown);
        active = false;
      }
    }

    return cleanup;
  },

  healthBar(health: number, width = 10): string {
    const filled = Math.round((health / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  },
};
