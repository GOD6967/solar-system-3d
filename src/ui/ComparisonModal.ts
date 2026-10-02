import { ALL_CELESTIAL_BODIES, CelestialBodyData } from '../data/celestialBodies.ts';
import { AudioEngine } from '../core/AudioEngine.ts';

export class ComparisonModal {
  private modal: HTMLElement;
  private bodyA: CelestialBodyData = ALL_CELESTIAL_BODIES.find(b => b.id === 'earth')!;
  private bodyB: CelestialBodyData = ALL_CELESTIAL_BODIES.find(b => b.id === 'jupiter')!;

  constructor() {
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 z-50 bg-black/85 backdrop-blur-xl hidden items-center justify-center p-4 transition-all duration-300';
    document.body.appendChild(this.modal);
  }

  public open(initialBodyId?: string) {
    AudioEngine.playClick();
    if (initialBodyId) {
      const found = ALL_CELESTIAL_BODIES.find(b => b.id === initialBodyId);
      if (found) this.bodyA = found;
    }
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.render();
  }

  public close() {
    this.modal.classList.remove('flex');
    this.modal.classList.add('hidden');
  }

  private render() {
    const radiusRatio = (this.bodyA.radiusKm / this.bodyB.radiusKm).toFixed(2);
    const maxRadius = Math.max(this.bodyA.radiusKm, this.bodyB.radiusKm);

    // Scale display balls in pixels (max 180px)
    const sizeA = Math.max(16, (this.bodyA.radiusKm / maxRadius) * 180);
    const sizeB = Math.max(16, (this.bodyB.radiusKm / maxRadius) * 180);

    this.modal.innerHTML = `
      <div class="glass-solid rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <span class="text-xs uppercase font-mono tracking-widest text-cyan-400">Astronomical Analysis</span>
            <h2 class="text-2xl font-bold text-white">Celestial Body Comparison</h2>
          </div>
          <button id="close-comparison-btn" class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Body Selectors -->
        <div class="grid grid-cols-2 gap-4 p-6 border-b border-white/10 bg-white/[0.01]">
          <div>
            <label class="block text-xs font-mono text-gray-400 mb-1">Body A</label>
            <select id="select-body-a" class="w-full bg-space-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-cyan-500">
              ${ALL_CELESTIAL_BODIES.map(b => `
                <option value="${b.id}" ${b.id === this.bodyA.id ? 'selected' : ''}>${b.name} (${b.type})</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-mono text-gray-400 mb-1">Body B</label>
            <select id="select-body-b" class="w-full bg-space-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-cyan-500">
              ${ALL_CELESTIAL_BODIES.map(b => `
                <option value="${b.id}" ${b.id === this.bodyB.id ? 'selected' : ''}>${b.name} (${b.type})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Visual Relative Size Arena -->
        <div class="p-8 bg-black/60 flex items-center justify-around border-b border-white/10 min-h-[220px]">
          <!-- Sphere A -->
          <div class="flex flex-col items-center gap-3">
            <div class="rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center font-bold text-xs" style="width: ${sizeA}px; height: ${sizeA}px; background: radial-gradient(circle at 35% 35%, #fff 0%, ${this.bodyA.color} 50%, #000 100%);">
              <span class="bg-black/60 px-2 py-0.5 rounded text-[11px] font-mono text-white">${this.bodyA.name}</span>
            </div>
            <span class="text-xs text-gray-400 font-mono">${this.bodyA.radiusKm.toLocaleString()} km</span>
          </div>

          <!-- Ratio badge -->
          <div class="px-4 py-2 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-center font-mono">
            <div class="text-[10px] text-cyan-300 uppercase">Radius Ratio</div>
            <div class="text-lg font-bold text-white">${radiusRatio}×</div>
          </div>

          <!-- Sphere B -->
          <div class="flex flex-col items-center gap-3">
            <div class="rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center font-bold text-xs" style="width: ${sizeB}px; height: ${sizeB}px; background: radial-gradient(circle at 35% 35%, #fff 0%, ${this.bodyB.color} 50%, #000 100%);">
              <span class="bg-black/60 px-2 py-0.5 rounded text-[11px] font-mono text-white">${this.bodyB.name}</span>
            </div>
            <span class="text-xs text-gray-400 font-mono">${this.bodyB.radiusKm.toLocaleString()} km</span>
          </div>
        </div>

        <!-- Side-by-Side Metrics Table -->
        <div class="p-6 overflow-y-auto space-y-3 flex-1 font-mono text-xs">
          ${this.renderComparisonRow('Type / Classification', this.bodyA.type.toUpperCase(), this.bodyB.type.toUpperCase())}
          ${this.renderComparisonRow('Mean Radius', `${this.bodyA.radiusKm.toLocaleString()} km`, `${this.bodyB.radiusKm.toLocaleString()} km`)}
          ${this.renderComparisonRow('Mass', this.bodyA.massKg, this.bodyB.massKg)}
          ${this.renderComparisonRow('Surface Gravity', `${this.bodyA.surfaceGravityMs2} m/s²`, `${this.bodyB.surfaceGravityMs2} m/s²`)}
          ${this.renderComparisonRow('Escape Velocity', `${this.bodyA.escapeVelocityKms} km/s`, `${this.bodyB.escapeVelocityKms} km/s`)}
          ${this.renderComparisonRow('Mean Surface Temp', `${this.bodyA.meanTempC} °C`, `${this.bodyB.meanTempC} °C`)}
          ${this.renderComparisonRow('Orbital Period', `${this.bodyA.orbitalPeriodDays} Earth days`, `${this.bodyB.orbitalPeriodDays} Earth days`)}
          ${this.renderComparisonRow('Rotation Period (Day)', `${Math.abs(this.bodyA.rotationPeriodHours)} hrs`, `${Math.abs(this.bodyB.rotationPeriodHours)} hrs`)}
          ${this.renderComparisonRow('Axial Tilt', `${this.bodyA.axialTiltDeg}°`, `${this.bodyB.axialTiltDeg}°`)}
          ${this.renderComparisonRow('Moons Count', `${this.bodyA.moonsCount} moons`, `${this.bodyB.moonsCount} moons`)}
        </div>
      </div>
    `;

    this.setupModalEvents();
  }

  private renderComparisonRow(label: string, valA: string, valB: string): string {
    return `
      <div class="grid grid-cols-3 gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 items-center">
        <span class="text-cyan-300 font-semibold truncate">${valA}</span>
        <span class="text-center text-gray-400 text-[11px] uppercase">${label}</span>
        <span class="text-right text-purple-300 font-semibold truncate">${valB}</span>
      </div>
    `;
  }

  private setupModalEvents() {
    this.modal.querySelector('#close-comparison-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      this.close();
    });

    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.close();
    });

    const selectA = this.modal.querySelector('#select-body-a') as HTMLSelectElement;
    const selectB = this.modal.querySelector('#select-body-b') as HTMLSelectElement;

    selectA?.addEventListener('change', () => {
      AudioEngine.playClick();
      const found = ALL_CELESTIAL_BODIES.find(b => b.id === selectA.value);
      if (found) {
        this.bodyA = found;
        this.render();
      }
    });

    selectB?.addEventListener('change', () => {
      AudioEngine.playClick();
      const found = ALL_CELESTIAL_BODIES.find(b => b.id === selectB.value);
      if (found) {
        this.bodyB = found;
        this.render();
      }
    });
  }
}
