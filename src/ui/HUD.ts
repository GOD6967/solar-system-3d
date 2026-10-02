import { SolarSystemApp } from '../core/SolarSystemApp.ts';
import { AudioEngine } from '../core/AudioEngine.ts';
import { SearchBar } from './SearchBar.ts';
import { ComparisonModal } from './ComparisonModal.ts';
import { TourGuide } from './TourGuide.ts';
import { MeteorsModal } from './MeteorsModal.ts';
import { SidebarInspector } from './SidebarInspector.ts';
import { CelestialBodyData } from '../data/celestialBodies.ts';
import { icon } from './icons.ts';

/** Quick-jump navigation; the number is the keyboard shortcut. */
const QUICK_BODIES = [
  { id: 'sun', name: 'Sun', col: '#ffb347', key: '0' },
  { id: 'mercury', name: 'Mercury', col: '#a39f99', key: '1' },
  { id: 'venus', name: 'Venus', col: '#e4b678', key: '2' },
  { id: 'earth', name: 'Earth', col: '#3b82d6', key: '3' },
  { id: 'mars', name: 'Mars', col: '#c8522a', key: '4' },
  { id: 'jupiter', name: 'Jupiter', col: '#cfa878', key: '5' },
  { id: 'saturn', name: 'Saturn', col: '#e2ca9b', key: '6' },
  { id: 'uranus', name: 'Uranus', col: '#82d3e5', key: '7' },
  { id: 'neptune', name: 'Neptune', col: '#3864d4', key: '8' },
  { id: 'pluto', name: 'Pluto', col: '#d6a67f', key: '9' }
];

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Space'], label: 'Pause / resume time' },
  { keys: ['0', '–', '9'], label: 'Fly to Sun, Mercury … Pluto' },
  { keys: ['/', 'Ctrl K'], label: 'Search all objects' },
  { keys: ['O'], label: 'Toggle orbit lines' },
  { keys: ['L'], label: 'Toggle name labels' },
  { keys: ['S'], label: 'Toggle explorer / true scale' },
  { keys: ['H'], label: 'Return to full overview' },
  { keys: ['Esc'], label: 'Close panels' },
  { keys: ['?'], label: 'Show this help' }
];

export class HUD {
  private container: HTMLElement;
  private app: SolarSystemApp;
  private sidebar: SidebarInspector;
  private searchBar: SearchBar;
  private comparisonModal: ComparisonModal;
  private tourGuide: TourGuide;
  private meteorsModal: MeteorsModal;
  private hoverTooltip!: HTMLElement;
  private helpModal!: HTMLElement;

  private orbitsVisible = true;
  private labelsVisible = true;

  constructor(container: HTMLElement, app: SolarSystemApp, sidebar: SidebarInspector) {
    this.container = container;
    this.app = app;
    this.sidebar = sidebar;

    this.searchBar = new SearchBar(id => this.app.selectBody(id));
    this.comparisonModal = new ComparisonModal();
    this.tourGuide = new TourGuide(app);
    this.meteorsModal = new MeteorsModal();

    this.render();
    this.setupHoverTooltip();
    this.setupKeyboardShortcuts();
  }

  private render() {
    this.container.innerHTML = `
      <!-- Top Navigation Bar -->
      <header class="fixed top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex items-start justify-between gap-3 pointer-events-none">
        <!-- Logo & Title -->
        <div class="pointer-events-auto glass flex items-center gap-3 px-3.5 py-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background: radial-gradient(circle at 35% 35%, #fff3c4, #ffb347 45%, #e0560d); box-shadow: 0 0 18px rgba(255,150,40,0.55);"></div>
          <div class="leading-tight">
            <h1 class="font-display text-sm font-semibold tracking-[0.2em] text-white uppercase">Cosmos 3D</h1>
            <p class="hidden sm:block text-[10px] text-slate-400 tracking-wide">Interactive Solar System</p>
          </div>
        </div>

        <!-- Right controls -->
        <div class="pointer-events-auto relative flex items-start gap-2">
          <button id="search-btn" class="glass btn !rounded-2xl !px-3 !py-2.5" title="Search all objects ( / or Ctrl+K )">
            <span class="text-accent">${icon('search', 15)}</span>
            <span class="hidden sm:inline">Search</span>
            <kbd class="hidden sm:inline">/</kbd>
          </button>

          <button id="menu-btn" class="glass btn btn-icon !rounded-2xl !p-2.5 lg:hidden" aria-label="Menu" aria-expanded="false">
            ${icon('menu', 18)}
          </button>

          <div id="tools-panel" class="glass hidden lg:flex absolute lg:static top-full right-0 mt-2 lg:mt-0 flex-col lg:flex-row items-stretch lg:items-center gap-1 p-1.5 min-w-[210px] lg:min-w-0">
            <button id="tours-btn" class="btn btn-accent" title="Start a guided expedition">
              ${icon('route', 14)}<span>Tours</span>
            </button>
            <button id="compare-btn" class="btn" title="Compare two planets side-by-side">
              ${icon('columns', 14)}<span>Compare</span>
            </button>
            <button id="meteors-btn" class="btn" title="Learn about meteors, meteorites, and showers">
              ${icon('zap', 14)}<span>Meteors</span>
            </button>

            <span class="hidden lg:block w-px h-5 bg-white/10 mx-1"></span>

            <button id="scale-mode-btn" class="btn" title="Toggle Explorer / True scale (S)">
              ${icon('ruler', 14)}<span id="scale-mode-label">Explorer scale</span>
            </button>
            <button id="orbits-toggle-btn" class="btn" title="Toggle orbit lines (O)">
              ${icon('orbit', 14)}<span class="lg:hidden">Orbit lines</span>
            </button>
            <button id="labels-toggle-btn" class="btn" title="Toggle name labels (L)">
              ${icon('tag', 14)}<span class="lg:hidden">Labels</span>
            </button>
            <button id="audio-toggle-btn" class="btn" title="Toggle ambient audio">
              <span id="audio-icon">${icon('volumeX', 14)}</span><span class="lg:hidden">Ambient audio</span>
            </button>
            <button id="overview-btn" class="btn" title="Reset view to full Solar System (H)">
              ${icon('home', 14)}<span class="lg:hidden">Overview</span>
            </button>
            <button id="help-btn" class="btn" title="Keyboard shortcuts (?)">
              ${icon('keyboard', 14)}<span class="lg:hidden">Shortcuts</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Quick Planet Navigation dock (tablet and desktop) -->
      <nav class="glass fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-0.5 p-1 max-h-[70vh] overflow-y-auto" aria-label="Jump to a planet">
        ${QUICK_BODIES.map(
          p => `
          <button data-quick-body="${p.id}" class="btn !px-2.5 !py-1.5 !justify-start" title="${p.name} (${p.key})">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${p.col}; box-shadow: 0 0 8px ${p.col}88"></span>
            <span class="flex-1 text-left">${p.name}</span>
            <kbd class="!text-[9px] opacity-60">${p.key}</kbd>
          </button>`
        ).join('')}
      </nav>

      <!-- Hover Cursor Tooltip -->
      <div id="hover-tooltip" class="fixed pointer-events-none z-40 glass !rounded-xl px-3 py-1.5 text-xs text-white opacity-0 transition-opacity duration-150 -translate-x-1/2 -translate-y-12 whitespace-nowrap">
        <span id="tooltip-name" class="font-display font-semibold text-accent-soft"></span>
        <span id="tooltip-meta" class="text-slate-400 ml-1 text-[10px] tracking-wider"></span>
      </div>

      <!-- Keyboard shortcuts -->
      <div id="help-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <div class="glass-solid rounded-2xl w-full max-w-md p-5 fade-up">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-lg font-semibold">Keyboard shortcuts</h2>
            <button id="help-close-btn" class="btn btn-icon" aria-label="Close">${icon('x', 16)}</button>
          </div>
          <ul class="space-y-2">
            ${SHORTCUTS.map(
              s => `
              <li class="flex items-center justify-between gap-4 text-sm">
                <span class="text-slate-300">${s.label}</span>
                <span class="flex items-center gap-1 shrink-0">${s.keys.map(k => `<kbd>${k}</kbd>`).join('')}</span>
              </li>`
            ).join('')}
          </ul>
          <p class="mt-4 text-xs text-slate-500">Drag to orbit, scroll to zoom, right-drag to pan. Click any body to inspect it.</p>
        </div>
      </div>
    `;

    this.hoverTooltip = this.container.querySelector('#hover-tooltip')!;
    this.helpModal = this.container.querySelector('#help-modal')!;
    this.setupListeners();
  }

  // -------------------------------------------------------------------------
  // Actions (shared by buttons and keyboard shortcuts)
  // -------------------------------------------------------------------------

  private toggleScaleMode() {
    AudioEngine.playClick();
    const newMode = this.app.scaleMode === 'explorer' ? 'true' : 'explorer';
    this.app.setScaleMode(newMode);

    const label = this.container.querySelector('#scale-mode-label')!;
    const btn = this.container.querySelector('#scale-mode-btn')!;
    label.textContent = newMode === 'explorer' ? 'Explorer scale' : 'True scale';
    btn.classList.toggle('btn-accent', newMode === 'true');
  }

  private toggleOrbits() {
    AudioEngine.playClick();
    this.orbitsVisible = !this.orbitsVisible;
    this.app.setOrbitVisibility(this.orbitsVisible);
    this.container.querySelector('#orbits-toggle-btn')!.classList.toggle('btn-off', !this.orbitsVisible);
  }

  private toggleLabels() {
    AudioEngine.playClick();
    this.labelsVisible = !this.labelsVisible;
    this.app.setLabelsVisible(this.labelsVisible);
    this.container.querySelector('#labels-toggle-btn')!.classList.toggle('btn-off', !this.labelsVisible);
  }

  private toggleAudio() {
    const isMuted = AudioEngine.toggleMute();
    const iconHolder = this.container.querySelector('#audio-icon')!;
    iconHolder.innerHTML = icon(isMuted ? 'volumeX' : 'volume', 14);
    this.container.querySelector('#audio-toggle-btn')!.classList.toggle('btn-accent', !isMuted);
  }

  private goToOverview() {
    AudioEngine.playClick();
    this.app.clearSelection();
    this.sidebar.close();
    this.app.cameraDirector.resetToSolarSystemOverview();
  }

  private setHelpOpen(open: boolean) {
    this.helpModal.classList.toggle('hidden', !open);
    this.helpModal.classList.toggle('flex', open);
  }

  private setMenuOpen(open: boolean) {
    const panel = this.container.querySelector('#tools-panel')!;
    panel.classList.toggle('!flex', open);
    this.container.querySelector('#menu-btn')!.setAttribute('aria-expanded', String(open));
  }

  private setupListeners() {
    // Quick planet navigation
    this.container.querySelectorAll('[data-quick-body]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.app.selectBody((btn as HTMLElement).dataset.quickBody!);
      });
    });

    const on = (selector: string, handler: () => void) =>
      this.container.querySelector(selector)?.addEventListener('click', () => {
        handler();
        // Close the mobile dropdown after picking an action
        this.setMenuOpen(false);
      });

    this.container.querySelector('#search-btn')?.addEventListener('click', () => this.searchBar.open());
    this.container.querySelector('#menu-btn')?.addEventListener('click', () => {
      const open = this.container.querySelector('#menu-btn')!.getAttribute('aria-expanded') !== 'true';
      this.setMenuOpen(open);
    });

    on('#tours-btn', () => this.tourGuide.openTourSelection());
    on('#compare-btn', () => this.comparisonModal.open());
    on('#meteors-btn', () => this.meteorsModal.open());
    on('#scale-mode-btn', () => this.toggleScaleMode());
    on('#orbits-toggle-btn', () => this.toggleOrbits());
    on('#labels-toggle-btn', () => this.toggleLabels());
    on('#audio-toggle-btn', () => this.toggleAudio());
    on('#overview-btn', () => this.goToOverview());
    on('#help-btn', () => this.setHelpOpen(true));

    this.container.querySelector('#help-close-btn')?.addEventListener('click', () => this.setHelpOpen(false));
    this.helpModal.addEventListener('click', e => {
      if (e.target === this.helpModal) this.setHelpOpen(false);
    });
  }

  private setupKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const quick = QUICK_BODIES.find(b => b.key === e.key);
      if (quick) {
        this.app.selectBody(quick.id);
        return;
      }

      switch (e.key) {
        case 'o':
        case 'O':
          this.toggleOrbits();
          break;
        case 'l':
        case 'L':
          this.toggleLabels();
          break;
        case 's':
        case 'S':
          this.toggleScaleMode();
          break;
        case 'h':
        case 'H':
          this.goToOverview();
          break;
        case '?':
          this.setHelpOpen(this.helpModal.classList.contains('hidden'));
          break;
        case 'Escape':
          if (!this.helpModal.classList.contains('hidden')) {
            this.setHelpOpen(false);
          } else {
            this.sidebar.close();
            this.setMenuOpen(false);
          }
          break;
      }
    });
  }

  private setupHoverTooltip() {
    this.app.onBodyHovered = (body: CelestialBodyData | null, x: number, y: number) => {
      if (body) {
        this.hoverTooltip.style.left = `${x}px`;
        this.hoverTooltip.style.top = `${y}px`;
        this.hoverTooltip.querySelector('#tooltip-name')!.textContent = body.name;
        this.hoverTooltip.querySelector('#tooltip-meta')!.textContent = body.type.replace('-', ' ').toUpperCase();
        this.hoverTooltip.style.opacity = '1';
      } else {
        this.hoverTooltip.style.opacity = '0';
      }
    };
  }

  public getSearchBar(): SearchBar {
    return this.searchBar;
  }
}
