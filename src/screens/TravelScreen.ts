import { Screen } from './Screen';
import { Renderer } from '../ui/Renderer';
import { TravelSystem } from '../systems/TravelSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { EventSystem } from '../systems/EventSystem';
import { formatDate, getPartyHealthStatus, advanceDate } from '../core/GameState';
import { WeatherSystem } from '../systems/WeatherSystem';
import { ART } from '../ui/PixelArt';

const PACE_LABELS: Record<string, string> = {
  steady: 'Steady',
  strenuous: 'Strenuous',
  grueling: 'Grueling',
};

const RATIONS_LABELS: Record<string, string> = {
  filling: 'Filling',
  meager: 'Meager',
  'bare-bones': 'Bare Bones',
};

export class TravelScreen extends Screen {
  private cleanup: (() => void) | null = null;
  private wagonFrame = 0;
  private wagonTimer = 0;
  private messages: string[] = [];

  enter(): void {
    this.messages = [];
    this.render();
  }

  private render(): void {
    const prevCleanup = this.cleanup;
    this.cleanup = null;
    prevCleanup?.();
    this.container.innerHTML = '';
    const screen = this.createScreen();

    // Wagon animation frame
    const wagonArt = ART.wagon[this.wagonFrame % ART.wagon.length];

    Renderer.pre(screen, wagonArt, 'dim');
    Renderer.divider(screen);

    // HUD
    const hud = document.createElement('div');
    hud.className = 'hud';

    const nextLandmark = TravelSystem.nextLandmarkDistance(this.state);
    const nextStr = nextLandmark
      ? `${nextLandmark.name.split(',')[0]} (${nextLandmark.miles} mi)`
      : 'Oregon!';

    const rows = [
      ['Date:', formatDate(this.state.date)],
      ['Weather:', WeatherSystem.describeWeather(this.state.weather)],
      ['Miles traveled:', `${this.state.currentMile} of 2040`],
      ['Next landmark:', nextStr],
      ['Health:', getPartyHealthStatus(this.state.party)],
      ['Pace:', PACE_LABELS[this.state.pace]],
      ['Food:', `${this.state.supplies.food} lbs`],
      ['Rations:', RATIONS_LABELS[this.state.rations]],
    ];

    rows.forEach(([label, value]) => {
      const labelEl = document.createElement('span');
      labelEl.className = 'hud-label';
      labelEl.textContent = label;
      hud.appendChild(labelEl);

      const valueEl = document.createElement('span');
      valueEl.className = 'hud-value';
      valueEl.textContent = value;
      hud.appendChild(valueEl);
    });

    screen.appendChild(hud);
    Renderer.divider(screen);

    // Recent messages
    if (this.messages.length > 0) {
      this.messages.slice(-3).forEach(msg => {
        Renderer.text(screen, msg, 'dim');
      });
      Renderer.spacer(screen);
    }

    // Tombstones nearby
    const nearbyTombstone = this.state.tombstones.find(
      t => Math.abs(t.mile - this.state.currentMile) < 10
    );
    if (nearbyTombstone) {
      Renderer.text(screen, `[Tombstone] Here lies ${nearbyTombstone.leaderName}. "${nearbyTombstone.epitaph}"`, 'dim');
      Renderer.spacer(screen);
    }

    // Main menu
    const options = [
      'Continue on trail',
      'Check supplies / status',
      'Change pace',
      'Change rations',
      'Stop to rest',
      'Attempt to trade',
      'Hunt for food',
      'Save & quit',
    ];

    this.cleanup = Renderer.menu(screen, options, (i) => {
      switch (i) {
        case 0: this.advanceTrail(); break;
        case 1: this.engine.transition('status'); break;
        case 2: this.changePace(screen); break;
        case 3: this.changeRations(screen); break;
        case 4: this.rest(); break;
        case 5: this.trade(); break;
        case 6: this.hunt(); break;
        case 7: this.saveAndQuit(); break;
      }
    });
  }

  private advanceTrail(): void {
    if (this.state.supplies.oxen === 0) {
      this.messages.push('You have no oxen! You cannot continue without them.');
      this.render();
      return;
    }

    // Simulate travel days (up to 7 days between stops)
    const daysToTravel = 7;
    const allMessages: string[] = [];

    for (let d = 0; d < daysToTravel; d++) {
      const result = TravelSystem.tickDay(this.state);
      TravelSystem.applyDayResult(this.state, result);

      // Health tick
      const healthMessages = HealthSystem.tickDay(this.state);
      allMessages.push(...healthMessages);

      // Check starvation
      if (result.starvation) {
        allMessages.push('You ran out of food!');
      }

      // Check death
      if (HealthSystem.allDead(this.state)) {
        this.engine.context['deathCause'] = 'Your entire party has perished.';
        this.engine.transition('death');
        return;
      }

      // Check landmark
      if (result.reachedLandmarkIndex !== null) {
        this.engine.context['landmarkIndex'] = result.reachedLandmarkIndex;
        this.messages = allMessages;
        this.engine.transition('landmark');
        return;
      }

      // Check destination
      if (TravelSystem.isComplete(this.state)) {
        this.engine.transition('victory');
        return;
      }

      // Check random event
      if (EventSystem.shouldTrigger(this.state)) {
        const event = EventSystem.pickEvent(this.state);
        if (event) {
          this.state.daysSinceLastEvent = 0;
          this.engine.context['event'] = event;
          this.messages = allMessages;
          this.engine.transition('event');
          return;
        }
      }
    }

    this.messages = allMessages.slice(-5);
    this.render();
  }

  private rest(): void {
    // Rest for 1 day
    const healthMessages = HealthSystem.tickDay(this.state, true);
    this.state.date = advanceDate(this.state.date);
    this.state.currentDay++;
    this.state.daysSinceLastEvent++;

    // Consume food
    const foodConsumed = TravelSystem.calculateFoodConsumed(this.state);
    this.state.supplies.food = Math.max(0, this.state.supplies.food - foodConsumed);

    this.messages = ['You rested for a day.', ...healthMessages];
    this.render();
  }

  private trade(): void {
    if (this.state.supplies.food < 50) {
      this.messages = ['You have nothing suitable to trade.'];
      this.render();
      return;
    }
    // Simple random trade outcome
    const amount = Math.floor(Math.random() * 20) + 5;
    const foodLost = Math.floor(Math.random() * 30) + 20;
    if (this.state.supplies.food >= foodLost) {
      this.state.supplies.money += amount;
      this.state.supplies.food -= foodLost;
      this.messages = [`You traded ${foodLost} lbs of food for $${amount}.`];
    } else {
      this.messages = ['No one wanted to trade with you today.'];
    }
    this.render();
  }

  private hunt(): void {
    this.engine.context['returnToTravel'] = true;
    this.engine.transition('hunting');
  }

  private saveAndQuit(): void {
    this.engine.save();
    this.engine.transition('title');
  }

  private changePace(_screen: HTMLElement): void {
    const prev = this.cleanup; this.cleanup = null; prev?.();
    this.container.innerHTML = '';
    const s = this.createScreen();

    Renderer.text(s, 'CHANGE PACE', 'bright');
    Renderer.divider(s);
    Renderer.text(s, 'Current pace: ' + PACE_LABELS[this.state.pace]);
    Renderer.spacer(s);
    Renderer.text(s, 'Steady    — safest, 12+ miles/day', 'dim');
    Renderer.text(s, 'Strenuous — faster, more wear on party', 'dim');
    Renderer.text(s, 'Grueling  — fastest, high health risk', 'dim');
    Renderer.spacer(s);

    this.cleanup = Renderer.menu(s, ['Steady', 'Strenuous', 'Grueling', 'Cancel'], (i) => {
      if (i === 0) this.state.pace = 'steady';
      else if (i === 1) this.state.pace = 'strenuous';
      else if (i === 2) this.state.pace = 'grueling';
      this.render();
    });
  }

  private changeRations(_screen: HTMLElement): void {
    const prev = this.cleanup; this.cleanup = null; prev?.();
    this.container.innerHTML = '';
    const s = this.createScreen();

    Renderer.text(s, 'CHANGE RATIONS', 'bright');
    Renderer.divider(s);
    Renderer.text(s, 'Current rations: ' + RATIONS_LABELS[this.state.rations]);
    Renderer.spacer(s);
    Renderer.text(s, 'Filling   — 3 lbs/person/day, best health', 'dim');
    Renderer.text(s, 'Meager    — 2 lbs/person/day', 'dim');
    Renderer.text(s, 'Bare Bones — 1 lb/person/day, health loss', 'dim');
    Renderer.spacer(s);

    this.cleanup = Renderer.menu(s, ['Filling', 'Meager', 'Bare Bones', 'Cancel'], (i) => {
      if (i === 0) this.state.rations = 'filling';
      else if (i === 1) this.state.rations = 'meager';
      else if (i === 2) this.state.rations = 'bare-bones';
      this.render();
    });
  }

  update(dt: number): void {
    // Animate wagon
    this.wagonTimer += dt;
    if (this.wagonTimer > 600) {
      this.wagonTimer = 0;
      this.wagonFrame++;
    }
  }

  exit(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
