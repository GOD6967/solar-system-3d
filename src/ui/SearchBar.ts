import { ALL_CELESTIAL_BODIES, CelestialBodyData } from '../data/celestialBodies.ts';
import { AudioEngine } from '../core/AudioEngine.ts';

interface SearchItem {
  id: string;
  name: string;
  type: string;
  subtitle: string;
  color: string;
}

export class SearchBar {
  private modal: HTMLElement;
  private input: HTMLInputElement;
  private resultsContainer: HTMLElement;
  private onSelectCallback: (id: string) => void;
  private items: SearchItem[] = [];

  constructor(onSelect: (id: string) => void) {
    this.onSelectCallback = onSelect;
    this.buildIndex();

    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-start justify-center pt-20 px-4 transition-all duration-200';
    this.modal.innerHTML = `
      <div class="glass-solid rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        <!-- Input header -->
        <div class="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            id="search-palette-input"
            placeholder="Search planets, moons, asteroids, comets... (e.g., Europa, Titan, Mars)"
            class="w-full bg-transparent text-white placeholder-gray-400 text-base focus:outline-none"
            autocomplete="off"
            spellcheck="false"
          />
          <kbd class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-gray-300 border border-white/10">ESC</kbd>
        </div>

        <!-- Results list -->
        <div id="search-results-list" class="p-2 overflow-y-auto space-y-1 divide-y divide-white/5"></div>

        <!-- Footer -->
        <div class="p-3 bg-black/40 border-t border-white/10 text-xs text-gray-400 flex justify-between font-mono">
          <span>Navigate with click • Press ESC to close</span>
          <span>${this.items.length} celestial objects indexed</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    this.input = this.modal.querySelector('#search-palette-input')!;
    this.resultsContainer = this.modal.querySelector('#search-results-list')!;

    this.setupListeners();
  }

  private buildIndex() {
    ALL_CELESTIAL_BODIES.forEach(b => {
      this.items.push({
        id: b.id,
        name: b.name,
        type: b.type,
        subtitle: b.tagline,
        color: b.color
      });

      // Index major moons
      if (b.majorMoons) {
        b.majorMoons.forEach(m => {
          this.items.push({
            id: m.id,
            name: m.name,
            type: 'moon',
            subtitle: `Moon of ${b.name} • ${m.brief}`,
            color: m.color || '#a0a0a0'
          });
        });
      }
    });
  }

  private setupListeners() {
    // Open with / or Ctrl+K
    window.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        this.open();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.open();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    // Close on background click
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Filter results on input
    this.input.addEventListener('input', () => {
      this.renderResults(this.input.value.trim());
    });
  }

  public open() {
    AudioEngine.playClick();
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.input.value = '';
    this.renderResults('');
    setTimeout(() => this.input.focus(), 50);
  }

  public close() {
    this.modal.classList.remove('flex');
    this.modal.classList.add('hidden');
  }

  private renderResults(query: string) {
    const q = query.toLowerCase();
    const matched = q
      ? this.items.filter(item => item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q))
      : this.items.slice(0, 10);

    if (matched.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="py-8 text-center text-gray-400 text-sm">
          No celestial bodies found for "${query}"
        </div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = matched.map(item => `
      <button data-search-id="${item.id}" class="w-full text-left p-3 rounded-xl hover:bg-white/10 transition flex items-center justify-between group">
        <div class="flex items-center gap-3">
          <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background-color: ${item.color}"></span>
          <div>
            <div class="font-semibold text-sm text-white group-hover:text-cyan-300 transition flex items-center gap-2">
              ${item.name}
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-400">${item.type}</span>
            </div>
            <div class="text-xs text-gray-400 line-clamp-1">${item.subtitle}</div>
          </div>
        </div>
        <span class="text-xs font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition">Fly to →</span>
      </button>
    `).join('');

    this.resultsContainer.querySelectorAll('[data-search-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.searchId!;
        AudioEngine.playClick();
        this.close();
        this.onSelectCallback(id);
      });
    });
  }
}
