import type { GameState, GamePhase } from './GameState';
import { createInitialState } from './GameState';
import { SaveManager } from './SaveManager';
import type { Screen } from '../screens/Screen';

// Lazy imports for all screens to avoid circular deps at module load
async function loadScreen(phase: GamePhase, engine: GameEngine, state: GameState, container: HTMLElement): Promise<Screen> {
  switch (phase) {
    case 'title': {
      const { TitleScreen } = await import('../screens/TitleScreen');
      return new TitleScreen(engine, state, container);
    }
    case 'profession': {
      const { ProfessionScreen } = await import('../screens/ProfessionScreen');
      return new ProfessionScreen(engine, state, container);
    }
    case 'naming': {
      const { NamingScreen } = await import('../screens/NamingScreen');
      return new NamingScreen(engine, state, container);
    }
    case 'month': {
      const { MonthScreen } = await import('../screens/MonthScreen');
      return new MonthScreen(engine, state, container);
    }
    case 'store': {
      const { StoreScreen } = await import('../screens/StoreScreen');
      return new StoreScreen(engine, state, container);
    }
    case 'traveling': {
      const { TravelScreen } = await import('../screens/TravelScreen');
      return new TravelScreen(engine, state, container);
    }
    case 'event': {
      const { EventScreen } = await import('../screens/EventScreen');
      return new EventScreen(engine, state, container);
    }
    case 'hunting': {
      const { HuntingScreen } = await import('../screens/HuntingScreen');
      return new HuntingScreen(engine, state, container);
    }
    case 'river-crossing': {
      const { RiverScreen } = await import('../screens/RiverScreen');
      return new RiverScreen(engine, state, container);
    }
    case 'landmark': {
      const { LandmarkScreen } = await import('../screens/LandmarkScreen');
      return new LandmarkScreen(engine, state, container);
    }
    case 'status': {
      const { StatusScreen } = await import('../screens/StatusScreen');
      return new StatusScreen(engine, state, container);
    }
    case 'death': {
      const { DeathScreen } = await import('../screens/DeathScreen');
      return new DeathScreen(engine, state, container);
    }
    case 'victory': {
      const { VictoryScreen } = await import('../screens/VictoryScreen');
      return new VictoryScreen(engine, state, container);
    }
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

export class GameEngine {
  state: GameState;
  private activeScreen: Screen | null = null;
  private lastTime = 0;
  private container: HTMLElement;

  // Used to pass contextual data between screens (e.g. pending event)
  context: Record<string, unknown> = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = createInitialState();
    this.state.tombstones = SaveManager.loadTombstones();
  }

  async start(): Promise<void> {
    const saved = SaveManager.load();
    if (saved) {
      // Keep tombstones from persistent storage, merge
      const tombstones = SaveManager.loadTombstones();
      this.state = { ...saved, tombstones };
      // Always start at title to let user choose continue
      this.state.phase = 'title';
    }
    await this.transition('title');
    this.loop(0);
  }

  async transition(phase: GamePhase): Promise<void> {
    if (this.activeScreen) {
      this.activeScreen.exit();
    }

    // Clear container
    this.container.innerHTML = '';
    this.state.phase = phase;

    // Auto-save on meaningful transitions
    if (phase !== 'title' && phase !== 'death' && phase !== 'victory') {
      SaveManager.save(this.state);
    }

    this.activeScreen = await loadScreen(phase, this, this.state, this.container);
    this.activeScreen.enter();
  }

  private loop = (time: number): void => {
    const dt = Math.min(time - this.lastTime, 100); // cap at 100ms
    this.lastTime = time;

    if (this.activeScreen) {
      this.activeScreen.update(dt);
    }

    requestAnimationFrame(this.loop);
  };

  save(): void {
    SaveManager.save(this.state);
  }

  newGame(): void {
    this.state = createInitialState();
    this.state.tombstones = SaveManager.loadTombstones();
    SaveManager.deleteSave();
  }

  hasSave(): boolean {
    return SaveManager.hasSave();
  }
}
