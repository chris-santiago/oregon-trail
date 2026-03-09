export class TextAnimator {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private skipFlag = false;
  private skipHandler: (() => void) | null = null;

  /**
   * Animates text into an element character by character.
   * Returns a Promise that resolves when animation completes.
   * Pressing any key skips to end.
   */
  animate(el: HTMLElement, text: string, speedMs = 25): Promise<void> {
    return new Promise(resolve => {
      let index = 0;
      el.textContent = '';
      this.skipFlag = false;

      const finish = () => {
        if (this.timerId) {
          clearInterval(this.timerId);
          this.timerId = null;
        }
        el.textContent = text;
        if (this.skipHandler) {
          document.removeEventListener('keydown', this.skipHandler);
          this.skipHandler = null;
        }
        resolve();
      };

      this.skipHandler = () => {
        this.skipFlag = true;
        finish();
      };
      document.addEventListener('keydown', this.skipHandler, { once: true });

      this.timerId = setInterval(() => {
        if (this.skipFlag) {
          finish();
          return;
        }
        index++;
        el.textContent = text.slice(0, index);
        if (index >= text.length) {
          finish();
        }
      }, speedMs);
    });
  }

  cancel(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.skipHandler) {
      document.removeEventListener('keydown', this.skipHandler);
      this.skipHandler = null;
    }
  }
}
