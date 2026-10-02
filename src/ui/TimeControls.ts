import { SolarSystemApp } from '../core/SolarSystemApp.ts';
import { AudioEngine } from '../core/AudioEngine.ts';
import { icon } from './icons.ts';

export class TimeControls {
  private container: HTMLElement;
  private app: SolarSystemApp;
  private dateDisplay!: HTMLElement;
  private yearDisplay!: HTMLElement;
  private dateInput!: HTMLInputElement;
  private playPauseBtn!: HTMLButtonElement;
  private reverseBtn!: HTMLButtonElement;

  private speed = 1;
  private reversed = false;

  private speeds = [
    { label: '1×', val: 1 },
    { label: '10×', val: 10 },
    { label: '100×', val: 100 },
    { label: '1000×', val: 1000 }
  ];

  constructor(container: HTMLElement, app: SolarSystemApp) {
    this.container = container;
    this.app = app;
    this.render();
    this.startClockTicker();
  }

  private render() {
    this.container.className =
      'glass fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-1.5rem)] sm:w-auto max-w-[calc(100vw-1.5rem)] px-3 py-2.5 sm:px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-white';

    this.container.innerHTML = `
      <!-- Simulation date (click to pick a date) -->
      <label class="relative flex items-center gap-2.5 pr-3 sm:border-r border-white/10 cursor-pointer group" title="Jump to any date">
        <span class="text-accent">${icon('calendar', 18)}</span>
        <span class="text-left leading-tight">
          <span class="block eyebrow !text-[9px] !text-slate-400">Simulated date</span>
          <span class="flex items-baseline gap-1.5">
            <span id="sim-date-display" class="font-display text-base font-semibold tracking-wide text-white group-hover:text-accent-soft transition-colors">01 Oct</span>
            <span id="sim-year-display" class="font-display text-sm text-slate-400">2026</span>
          </span>
        </span>
        <input id="sim-date-input" type="date" aria-label="Simulation date" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </label>

      <!-- Transport -->
      <div class="flex items-center gap-1.5">
        <button id="reverse-btn" class="btn btn-icon" title="Reverse time flow" aria-label="Reverse time">
          ${icon('rewind', 15)}
        </button>
        <button id="play-pause-btn" class="btn btn-active btn-icon !rounded-xl !p-2.5" title="Play / Pause (Space)" aria-label="Play or pause">
          <span id="play-icon" class="hidden">${icon('play', 16)}</span>
          <span id="pause-icon">${icon('pause', 16)}</span>
        </button>
      </div>

      <!-- Speed presets -->
      <div class="flex items-center gap-0.5 bg-black/30 p-1 rounded-xl border border-white/5" role="group" aria-label="Simulation speed">
        ${this.speeds
          .map(
            s => `
          <button data-speed="${s.val}" class="speed-btn btn !px-2.5 !py-1 font-mono ${s.val === 1 ? 'btn-active' : ''}">${s.label}</button>`
          )
          .join('')}
      </div>

      <div class="hidden sm:block text-[10px] font-mono text-slate-500 w-[74px] leading-tight" id="speed-caption">1 day / sec</div>

      <!-- Reset to today -->
      <button id="reset-date-btn" class="btn btn-accent" title="Jump back to today">
        ${icon('refresh', 13)}<span>Now</span>
      </button>
    `;

    this.dateDisplay = this.container.querySelector('#sim-date-display')!;
    this.yearDisplay = this.container.querySelector('#sim-year-display')!;
    this.dateInput = this.container.querySelector('#sim-date-input')!;
    this.playPauseBtn = this.container.querySelector('#play-pause-btn')!;
    this.reverseBtn = this.container.querySelector('#reverse-btn')!;

    this.setupListeners();
  }

  private applySpeed() {
    this.app.setTimeSpeedMultiplier(this.reversed ? -this.speed : this.speed);

    const caption = this.container.querySelector('#speed-caption');
    if (caption) {
      const perSec = this.speed;
      const text =
        perSec >= 365 ? `${(perSec / 365.25).toFixed(1)} yr / sec` : `${perSec} day${perSec === 1 ? '' : 's'} / sec`;
      caption.textContent = (this.reversed ? '− ' : '') + text;
    }
  }

  private togglePlayback() {
    AudioEngine.playClick();
    const paused = this.app.togglePause();
    this.updatePlayPauseUI(paused);
  }

  private setupListeners() {
    this.playPauseBtn.addEventListener('click', () => this.togglePlayback());

    window.addEventListener('keydown', e => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (e.code !== 'Space' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      // Prevent a focused button from also being "clicked" by the Space key
      (document.activeElement as HTMLElement | null)?.blur?.();
      this.togglePlayback();
    });

    this.reverseBtn.addEventListener('click', () => {
      AudioEngine.playClick();
      this.reversed = !this.reversed;
      this.reverseBtn.classList.toggle('btn-accent', this.reversed);
      this.applySpeed();
    });

    this.container.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioEngine.playClick();
        this.speed = parseFloat((btn as HTMLElement).dataset.speed!);
        this.applySpeed();

        this.container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('btn-active'));
        btn.classList.add('btn-active');
      });
    });

    this.dateInput.addEventListener('change', () => {
      if (!this.dateInput.value) return;
      const [y, m, d] = this.dateInput.value.split('-').map(Number);
      if (!y || !m || !d) return;
      AudioEngine.playClick();
      this.app.setSimulationDate(new Date(y, m - 1, d, 12, 0, 0));
    });

    this.container.querySelector('#reset-date-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      this.app.setSimulationDate(new Date());
    });
  }

  private updatePlayPauseUI(isPaused: boolean) {
    this.container.querySelector('#play-icon')!.classList.toggle('hidden', !isPaused);
    this.container.querySelector('#pause-icon')!.classList.toggle('hidden', isPaused);
    this.playPauseBtn.classList.toggle('btn-active', !isPaused);
    this.playPauseBtn.classList.toggle('btn-accent', isPaused);
  }

  private startClockTicker() {
    const tick = () => {
      const d = this.app.simulationDate;
      this.dateDisplay.textContent = d
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        .toUpperCase();
      this.yearDisplay.textContent = String(d.getFullYear());

      if (document.activeElement !== this.dateInput) {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = String(d.getFullYear()).padStart(4, '0');
        this.dateInput.value = `${yyyy}-${mm}-${dd}`;
      }
    };
    tick();
    setInterval(tick, 100);
  }
}
