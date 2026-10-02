import { METEOR_SHOWERS_INFO, METEOR_PHYSICS_EXPLANATION } from '../data/celestialBodies.ts';
import { AudioEngine } from '../core/AudioEngine.ts';

export class MeteorsModal {
  private modal: HTMLElement;

  constructor() {
    this.modal = document.createElement('div');
    this.modal.className =
      'fixed inset-0 z-50 bg-black/85 backdrop-blur-xl hidden items-center justify-center p-4 transition-all duration-300';
    document.body.appendChild(this.modal);
    this.render();
  }

  public open() {
    AudioEngine.playClick();
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
  }

  public close() {
    this.modal.classList.remove('flex');
    this.modal.classList.add('hidden');
  }

  private render() {
    this.modal.innerHTML = `
      <div class="glass-solid rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white">
        <!-- Header -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <span class="text-xs uppercase font-mono tracking-widest text-cyan-400">Deep Space Dynamics</span>
            <h2 class="text-2xl font-bold">Meteors, Asteroids & Shooting Stars</h2>
          </div>
          <button id="close-meteors-btn" class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          <!-- 3-stage physics definition -->
          <div class="space-y-3">
            <h3 class="text-xs uppercase font-mono tracking-widest text-gray-400">The 3 Stages of a Meteor</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <span class="text-xs uppercase font-mono text-cyan-400 font-bold">1. Meteoroid</span>
                <div class="text-xs text-gray-300">${METEOR_PHYSICS_EXPLANATION.meteoroid}</div>
              </div>
              <div class="bg-cyan-950/40 p-4 rounded-2xl border border-cyan-500/30 space-y-1">
                <span class="text-xs uppercase font-mono text-amber-300 font-bold">2. Meteor</span>
                <div class="text-xs text-gray-300">${METEOR_PHYSICS_EXPLANATION.meteor}</div>
              </div>
              <div class="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <span class="text-xs uppercase font-mono text-emerald-400 font-bold">3. Meteorite</span>
                <div class="text-xs text-gray-300">${METEOR_PHYSICS_EXPLANATION.meteorite}</div>
              </div>
            </div>
          </div>

          <!-- Major Annual Meteor Showers Table -->
          <div class="space-y-3">
            <h3 class="text-xs uppercase font-mono tracking-widest text-gray-400">Major Annual Earth Meteor Showers</h3>
            <div class="space-y-3">
              ${METEOR_SHOWERS_INFO.map(s => `
                <div class="bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-base text-cyan-300">${s.name}</span>
                    <span class="text-xs font-mono text-amber-400 font-semibold">${s.peakDate}</span>
                  </div>
                  <p class="text-xs text-gray-300 leading-relaxed">${s.description}</p>
                  <div class="flex flex-wrap gap-2 text-[11px] font-mono text-gray-400 pt-1 border-t border-white/5">
                    <span>Parent: <strong class="text-white">${s.parentBody}</strong></span>
                    <span>•</span>
                    <span>Rate: <strong class="text-cyan-400">${s.hourlyRate}</strong></span>
                    <span>•</span>
                    <span>Velocity: <strong class="text-emerald-400">${s.speedKms} km/s</strong></span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Historic Impact Events -->
          <div class="space-y-2">
            <h3 class="text-xs uppercase font-mono tracking-widest text-gray-400">Famous Historical Impact Events</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-white/5 rounded-xl border border-white/5">
                <div class="font-bold text-white mb-1">Tunguska Event (1908)</div>
                <p class="text-gray-300">A ~50m stony asteroid exploded over Siberia with 12 megatons of energy, flattening 80 million trees across 2,150 km².</p>
              </div>
              <div class="p-3 bg-white/5 rounded-xl border border-white/5">
                <div class="font-bold text-white mb-1">Chelyabinsk Superbolide (2013)</div>
                <p class="text-gray-300">A 20m meteor entered Earth's atmosphere over Russia at 19 km/s, producing a flash 30x brighter than the Sun and a shockwave that injured 1,500 people.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.modal.querySelector('#close-meteors-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      this.close();
    });

    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.close();
    });
  }
}
