import { CelestialBodyData } from '../data/celestialBodies.ts';
import { wikipediaService, WikipediaSummary } from '../services/wikipediaService.ts';
import { AudioEngine } from '../core/AudioEngine.ts';
import { icon } from './icons.ts';

const CLOSED_CLASSES = ['translate-y-full', 'sm:translate-y-0', 'sm:translate-x-full'];
const OPEN_CLASSES = ['translate-y-0', 'sm:translate-x-0'];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class SidebarInspector {
  private container: HTMLElement;
  private currentBody: CelestialBodyData | null = null;
  private onSelectBodyCallback: (id: string) => void;
  private onCloseCallback?: () => void;

  constructor(container: HTMLElement, onSelectBody: (id: string) => void, onClose?: () => void) {
    this.container = container;
    this.onSelectBodyCallback = onSelectBody;
    this.onCloseCallback = onClose;
    this.renderEmpty();
  }

  public openBody(body: CelestialBodyData) {
    this.currentBody = body;
    this.container.classList.remove(...CLOSED_CLASSES);
    this.container.classList.add(...OPEN_CLASSES);
    this.container.scrollTop = 0;

    this.renderLoading(body);

    // Fetch live Wikipedia summary asynchronously
    wikipediaService.getSummary(body.wikipediaTitle).then(wikiSummary => {
      // Check if body is still the currently selected one
      if (this.currentBody?.id === body.id) {
        this.renderContent(body, wikiSummary);
      }
    });
  }

  public close() {
    const wasOpen = this.currentBody !== null;
    this.container.classList.remove(...OPEN_CLASSES);
    this.container.classList.add(...CLOSED_CLASSES);
    this.currentBody = null;
    if (wasOpen) this.onCloseCallback?.();
  }

  private renderEmpty() {
    this.container.className = [
      'glass-solid fixed z-40 text-white overflow-y-auto flex flex-col',
      'transition-transform duration-300 ease-out',
      // Mobile: bottom sheet. Desktop: right-hand panel.
      'inset-x-0 bottom-0 h-[78vh] rounded-t-3xl',
      'sm:inset-x-auto sm:top-0 sm:right-0 sm:h-full sm:w-[460px] sm:rounded-none sm:rounded-l-3xl',
      ...CLOSED_CLASSES
    ].join(' ');
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  private renderHeader(body: CelestialBodyData): string {
    const color = escapeHtml(body.color);
    return `
      <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 sticky top-0 z-20 bg-space-950/90 backdrop-blur-md">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 rounded-full shrink-0" style="background: radial-gradient(circle at 32% 30%, #ffffffcc, ${color} 42%, #000 130%); box-shadow: 0 0 22px ${color}55;"></div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="eyebrow">${escapeHtml(body.type.replace('-', ' '))}</span>
              ${body.parentBodyId ? `<span class="text-[10px] text-slate-500 truncate">· orbits ${escapeHtml(body.parentBodyId)}</span>` : ''}
            </div>
            <h2 class="font-display text-2xl font-semibold tracking-tight text-white truncate">${escapeHtml(body.name)}</h2>
          </div>
        </div>
        <button id="close-inspector-btn" class="btn btn-icon shrink-0" aria-label="Close panel">${icon('x', 18)}</button>
      </div>
    `;
  }

  private renderLoading(body: CelestialBodyData) {
    this.container.innerHTML = `
      ${this.renderHeader(body)}

      <div class="p-5 space-y-6">
        <p class="text-sm italic text-accent-soft/90">${escapeHtml(body.tagline)}</p>

        <!-- Skeleton loader -->
        <div class="space-y-3">
          <div class="skeleton h-48 w-full"></div>
          <div class="skeleton h-3.5 w-3/4"></div>
          <div class="skeleton h-3.5 w-full"></div>
          <div class="skeleton h-3.5 w-5/6"></div>
        </div>

        ${this.renderQuickStats(body)}
      </div>
    `;

    this.attachCloseHandler();
  }

  private renderContent(body: CelestialBodyData, wiki: WikipediaSummary | null) {
    const photoUrl = wiki?.originalImageUrl || wiki?.thumbnailUrl;
    const wikiExtract = wiki?.extract
      ? escapeHtml(wiki.extract)
      : 'Wikipedia details are unavailable right now. The curated facts below are built into the app.';
    const wikiUrl = wiki?.desktopUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(body.wikipediaTitle)}`;

    this.container.innerHTML = `
      ${this.renderHeader(body)}

      <div class="p-5 space-y-6 flex-1 fade-up">
        <p class="text-sm italic text-accent-soft/90">${escapeHtml(body.tagline)}</p>

        <!-- Wikipedia hero image and live summary -->
        <div class="stat-card !p-3 space-y-3">
          ${
            photoUrl
              ? `
            <div class="relative w-full h-52 rounded-xl overflow-hidden bg-black/40">
              <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(body.name)}" class="w-full h-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
              <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-300">Wikimedia Commons</div>
            </div>`
              : ''
          }

          <div class="flex items-center justify-between pt-1">
            <span class="eyebrow !text-slate-400">Wikipedia overview</span>
            <a href="${escapeHtml(wikiUrl)}" target="_blank" rel="noopener noreferrer" class="text-xs text-accent hover:text-accent-soft flex items-center gap-1.5">
              Read more ${icon('externalLink', 12)}
            </a>
          </div>

          <p class="text-sm text-slate-200 leading-relaxed">${wikiExtract}</p>
        </div>

        ${this.renderQuickStats(body)}

        <!-- Quick facts -->
        ${
          body.quickFacts && body.quickFacts.length > 0
            ? `
          <section class="space-y-2">
            <h3 class="eyebrow !text-slate-400">Key discoveries and curiosities</h3>
            <ul class="space-y-2 text-sm text-slate-300">
              ${body.quickFacts
                .map(
                  fact => `
                <li class="flex items-start gap-2.5 stat-card">
                  <span class="text-accent mt-0.5 shrink-0">${icon('sparkle', 14)}</span>
                  <span>${escapeHtml(fact)}</span>
                </li>`
                )
                .join('')}
            </ul>
          </section>`
            : ''
        }

        <!-- Internal structure -->
        ${
          body.internalStructure && body.internalStructure.length > 0
            ? `
          <section class="space-y-2">
            <h3 class="eyebrow !text-slate-400">Internal structure</h3>
            <div class="space-y-2">
              ${body.internalStructure
                .map(
                  (layer, index) => `
                <div class="stat-card hover:!border-accent/40 transition">
                  <div class="flex justify-between items-center mb-1 gap-3">
                    <span class="font-display font-semibold text-sm text-accent-soft">${index + 1}. ${escapeHtml(layer.name)}</span>
                    <span class="text-xs font-mono text-slate-400 shrink-0">${escapeHtml(layer.depth)}</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(layer.description)}</p>
                  <div class="mt-1 text-[11px] font-mono text-accent-soft/70">Composition: ${escapeHtml(layer.composition)}</div>
                </div>`
                )
                .join('')}
            </div>
          </section>`
            : ''
        }

        ${this.renderMoonsSection(body)}

        <!-- Atmosphere -->
        ${
          body.atmosphereComposition && body.atmosphereComposition.length > 0
            ? `
          <section class="space-y-2">
            <h3 class="eyebrow !text-slate-400">Atmosphere composition</h3>
            <div class="flex flex-wrap gap-1.5">
              ${body.atmosphereComposition
                .map(
                  comp => `
                <span class="px-2.5 py-1 rounded-full text-xs font-mono bg-accent/10 text-accent-soft border border-accent/25">${escapeHtml(comp)}</span>`
                )
                .join('')}
            </div>
          </section>`
            : ''
        }
      </div>
    `;

    this.attachCloseHandler();

    // Moon click handlers
    this.container.querySelectorAll('[data-moon-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const moonId = (btn as HTMLElement).dataset.moonId!;
        AudioEngine.playClick();
        this.onSelectBodyCallback(moonId);
      });
    });
  }

  private attachCloseHandler() {
    this.container.querySelector('#close-inspector-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      this.close();
    });
  }

  private renderQuickStats(body: CelestialBodyData): string {
    const period = body.orbitalPeriodDays;
    const periodText =
      period === 0
        ? '—'
        : Math.abs(period) > 365
          ? `${(Math.abs(period) / 365.25).toFixed(1)} Earth yrs`
          : `${Math.abs(period)} Earth days`;

    const highlights = [
      { label: 'Mean radius', value: `${body.radiusKm.toLocaleString()}`, unit: 'km' },
      { label: 'Surface gravity', value: `${body.surfaceGravityMs2}`, unit: 'm/s²' },
      { label: 'Mean temperature', value: `${body.meanTempC.toLocaleString()}`, unit: '°C' },
      { label: 'Orbital period', value: periodText, unit: '' }
    ];

    const stats = [
      { label: 'Mass', value: body.massKg },
      { label: 'Escape velocity', value: `${body.escapeVelocityKms} km/s` },
      {
        label: 'Day length / spin',
        value: `${Math.abs(body.rotationPeriodHours)} hrs${body.rotationPeriodHours < 0 ? ' (retrograde)' : ''}`
      },
      {
        label: 'Distance from Sun',
        value:
          body.semiMajorAxisAU > 0
            ? `${body.semiMajorAxisAU} AU (${(body.semiMajorAxisAU * 149.6).toFixed(1)}M km)`
            : '0 AU (center)'
      },
      { label: 'Known moons', value: `${body.moonsCount}` },
      { label: 'Axial tilt', value: `${body.axialTiltDeg}°` },
      { label: 'Discovery', value: `${body.discovery.year} (${body.discovery.discoverer})` }
    ];

    return `
      <section class="space-y-2">
        <h3 class="eyebrow !text-slate-400">Physical and orbital metrics</h3>
        <div class="grid grid-cols-2 gap-2">
          ${highlights
            .map(
              s => `
            <div class="stat-card">
              <span class="block text-[11px] text-slate-400">${s.label}</span>
              <span class="block font-display text-lg font-semibold text-white leading-tight mt-0.5">
                ${escapeHtml(s.value)}${s.unit ? `<span class="text-xs font-sans font-normal text-slate-400 ml-1">${s.unit}</span>` : ''}
              </span>
            </div>`
            )
            .join('')}
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${stats
            .map(
              s => `
            <div class="stat-card">
              <span class="block text-[11px] text-slate-400">${s.label}</span>
              <span class="block text-xs font-medium text-slate-100 mt-0.5 break-words" title="${escapeHtml(String(s.value))}">${escapeHtml(String(s.value))}</span>
            </div>`
            )
            .join('')}
        </div>
      </section>
    `;
  }

  private renderMoonsSection(body: CelestialBodyData): string {
    if (!body.majorMoons || body.majorMoons.length === 0) return '';

    return `
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="eyebrow !text-slate-400">Major moons (${body.majorMoons.length})</h3>
          <span class="text-xs text-accent">${body.moonsCount} cataloged</span>
        </div>
        <div class="grid grid-cols-1 gap-2">
          ${body.majorMoons
            .map(
              moon => `
            <button data-moon-id="${escapeHtml(moon.id)}" class="w-full text-left p-3 rounded-xl bg-white/[0.04] hover:bg-accent/10 border border-white/10 hover:border-accent/40 transition flex items-center justify-between gap-3 group">
              <div class="space-y-1 min-w-0">
                <div class="font-display font-semibold text-sm text-white group-hover:text-accent-soft transition flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${escapeHtml(moon.color || '#a0a0a0')}"></span>
                  ${escapeHtml(moon.name)}
                  <span class="text-[10px] text-slate-400 font-sans font-normal">${moon.diameterKm.toLocaleString()} km</span>
                </div>
                <p class="text-xs text-slate-400 line-clamp-1">${escapeHtml(moon.brief)}</p>
              </div>
              <span class="text-accent group-hover:translate-x-1 transition shrink-0">${icon('arrowRight', 16)}</span>
            </button>`
            )
            .join('')}
        </div>

        ${
          body.allMoonsCatalog && body.allMoonsCatalog.length > body.majorMoons.length
            ? `
          <details class="text-xs text-slate-400 stat-card">
            <summary class="cursor-pointer hover:text-white">View all ${body.allMoonsCatalog.length} cataloged moons of ${escapeHtml(body.name)}</summary>
            <div class="mt-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-1 pt-2 border-t border-white/5 text-[11px]">
              ${body.allMoonsCatalog
                .map(
                  m => `
                <div class="truncate text-slate-300" title="${escapeHtml(m.name)} (${m.diameterKm} km, ${m.year})">
                  • <span class="text-white">${escapeHtml(m.name)}</span> (${m.diameterKm} km)
                </div>`
                )
                .join('')}
            </div>
          </details>`
            : ''
        }
      </section>
    `;
  }
}
