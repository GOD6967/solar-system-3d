import { SolarSystemApp } from '../core/SolarSystemApp.ts';
import { AudioEngine } from '../core/AudioEngine.ts';

interface TourStop {
  bodyId: string;
  title: string;
  narrative: string;
  cameraDistance?: number;
}

interface Tour {
  id: string;
  name: string;
  description: string;
  badge: string;
  stops: TourStop[];
}

export const TOURS_DATA: Tour[] = [
  {
    id: 'rocky-worlds',
    name: 'Inner Rocky Worlds',
    description: 'Explore the terrestrial planets forged in the fiery crucible near our Sun.',
    badge: 'Terrestrial Planets',
    stops: [
      {
        bodyId: 'sun',
        title: 'The Great Furnace',
        narrative: 'Our journey begins at the Sun—a roaring nuclear dynamo fusing 600 million tons of hydrogen every second, anchoring our planetary system with its immense gravitational grip.',
        cameraDistance: 65
      },
      {
        bodyId: 'mercury',
        title: 'Mercury: Sun-Scorched Messenger',
        narrative: 'The smallest planet and closest neighbor to the Sun. With no atmosphere to trap heat, its surface swings violently between 430°C in the day and -180°C at night.',
        cameraDistance: 14
      },
      {
        bodyId: 'venus',
        title: 'Venus: Earth\'s Hellish Twin',
        narrative: 'Shrouded under suffocating sulfuric acid clouds, Venus suffers from a runaway greenhouse effect. Its surface is 465°C—hot enough to melt lead—under crushing pressure 92 times that of Earth.',
        cameraDistance: 20
      },
      {
        bodyId: 'earth',
        title: 'Earth: The Blue Oasis',
        narrative: 'The cosmic jewel of life. Dynamic plate tectonics, a liquid water ocean covering 71% of its surface, and a protective magnetic shield create the only known sanctuary for conscious life.',
        cameraDistance: 22
      },
      {
        bodyId: 'mars',
        title: 'Mars: The Rust-Red Frontier',
        narrative: 'Home to the colossal Olympus Mons volcano and Valles Marineris canyon. Millions of years ago, liquid water rivers flowed across its iron-oxide plains, leaving clues in its polar ice.',
        cameraDistance: 16
      }
    ]
  },
  {
    id: 'giant-worlds',
    name: 'The Gas & Ice Giants',
    description: 'Voyage to the four colossal gas and ice worlds dominating outer space.',
    badge: 'Giant Planets',
    stops: [
      {
        bodyId: 'jupiter',
        title: 'Jupiter: King of the Planets',
        narrative: 'With 2.5 times the mass of all other planets combined, Jupiter commands 95 moons and houses the Great Red Spot—a colossal storm bigger than Earth that has raged for centuries.',
        cameraDistance: 55
      },
      {
        bodyId: 'saturn',
        title: 'Saturn: The Lord of the Rings',
        narrative: 'A majestic sphere surrounded by billions of sparkling water-ice fragments spanning 280,000 km, yet just 20 meters thick. Saturn is so light it would float in water.',
        cameraDistance: 50
      },
      {
        bodyId: 'uranus',
        title: 'Uranus: The Tilted Ice Giant',
        narrative: 'Knocked completely onto its side by an ancient cataclysmic impact, Uranus rolls around the Sun with an axial tilt of 97.8°, freezing in temperatures as low as -224°C.',
        cameraDistance: 35
      },
      {
        bodyId: 'neptune',
        title: 'Neptune: Supersonic Ocean of Winds',
        narrative: 'The windiest world in the Solar System, where atmospheric storms whip through vivid azure methane skies at supersonic speeds exceeding 2,100 km/h.',
        cameraDistance: 35
      }
    ]
  },
  {
    id: 'ocean-worlds',
    name: 'Ocean Worlds: Search for Life',
    description: 'Investigate the hidden liquid oceans beneath frozen moon shells.',
    badge: 'Astrobiology',
    stops: [
      {
        bodyId: 'europa',
        title: 'Europa: Subsurface Salty Ocean',
        narrative: 'Beneath Europa\'s crisscrossing ice shell lies a vast liquid ocean containing twice the water of all Earth\'s oceans combined, warmed by tidal hydrothermal vents.',
        cameraDistance: 8
      },
      {
        bodyId: 'enceladus',
        title: 'Enceladus: Cryovolcanic Geysers',
        narrative: 'Saturn\'s dazzling icy moon erupts towering geysers of water vapor, salts, and organic molecules directly into space from south polar tiger stripe fissures.',
        cameraDistance: 8
      },
      {
        bodyId: 'titan',
        title: 'Titan: World of Methane Seas',
        narrative: 'The only moon with a dense nitrogen atmosphere. It features clouds, rain, rivers, and tranquil lakes—not of water, but of liquid methane and ethane at -179°C.',
        cameraDistance: 12
      }
    ]
  },
  {
    id: 'deep-frontier',
    name: 'Wanderers of the Deep: Comets & Kuiper Belt',
    description: 'Travel to the icy outer realms of Pluto, Halley, and interstellar visitors.',
    badge: 'Deep Space',
    stops: [
      {
        bodyId: 'pluto',
        title: 'Pluto: Beating Heart of the Kuiper Belt',
        narrative: 'A captivating world of nitrogen ice mountains and the vast heart-shaped glacier Sputnik Planitia, dancing in a gravitational mutual lock with its giant moon Charon.',
        cameraDistance: 10
      },
      {
        bodyId: 'halley',
        title: '1P/Halley: The Timeless Traveler',
        narrative: 'The most legendary periodic comet, plunging from deep beyond Neptune into the inner solar system every 75–76 years, casting brilliant dust trails across Earth\'s night sky.',
        cameraDistance: 12
      },
      {
        bodyId: 'oumuamua',
        title: '1I/\'Oumuamua: The Interstellar Messenger',
        narrative: 'The first detected voyager from another star system, tumbling through our Solar System on an unbound hyperbolic escape trajectory back into deep interstellar space.',
        cameraDistance: 10
      }
    ]
  }
];

export class TourGuide {
  private app: SolarSystemApp;
  private tourModal: HTMLElement;
  private hudCard: HTMLElement;

  private activeTour: Tour | null = null;
  private currentStopIndex = 0;

  constructor(app: SolarSystemApp) {
    this.app = app;

    // Tour selection modal
    this.tourModal = document.createElement('div');
    this.tourModal.className =
      'fixed inset-0 z-50 bg-black/85 backdrop-blur-xl hidden items-center justify-center p-4 transition-all duration-300';
    document.body.appendChild(this.tourModal);

    // Active tour bottom HUD card
    this.hudCard = document.createElement('div');
    this.hudCard.className =
      'fixed bottom-28 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-1.5rem)] max-w-lg glass-solid !border-accent/30 rounded-3xl p-5 sm:p-6 text-white font-sans hidden transition-all duration-300';
    document.body.appendChild(this.hudCard);

    this.renderTourSelectionModal();
  }

  public openTourSelection() {
    AudioEngine.playClick();
    this.tourModal.classList.remove('hidden');
    this.tourModal.classList.add('flex');
  }

  public closeTourSelection() {
    this.tourModal.classList.remove('flex');
    this.tourModal.classList.add('hidden');
  }

  private renderTourSelectionModal() {
    this.tourModal.innerHTML = `
      <div class="glass-solid rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <span class="text-xs uppercase font-mono tracking-widest text-cyan-400">Cinematic Experiences</span>
            <h2 class="text-2xl font-bold text-white">Guided Solar System Expeditions</h2>
          </div>
          <button id="close-tours-btn" class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          ${TOURS_DATA.map(tour => `
            <div data-tour-id="${tour.id}" class="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-500/40 transition cursor-pointer group">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">${tour.badge}</span>
                <span class="text-xs font-mono text-gray-400">${tour.stops.length} Stops</span>
              </div>
              <h3 class="text-lg font-bold text-white group-hover:text-cyan-300 transition">${tour.name}</h3>
              <p class="text-xs text-gray-300 mt-1 leading-relaxed">${tour.description}</p>
              <div class="mt-3 flex items-center text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition">
                Start Expedition →
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.tourModal.querySelector('#close-tours-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      this.closeTourSelection();
    });

    this.tourModal.addEventListener('click', e => {
      if (e.target === this.tourModal) this.closeTourSelection();
    });

    this.tourModal.querySelectorAll('[data-tour-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tourId = (btn as HTMLElement).dataset.tourId!;
        const tour = TOURS_DATA.find(t => t.id === tourId);
        if (tour) {
          this.startTour(tour);
        }
      });
    });
  }

  public startTour(tour: Tour) {
    AudioEngine.playClick();
    this.closeTourSelection();
    this.activeTour = tour;
    this.currentStopIndex = 0;
    this.hudCard.classList.remove('hidden');
    this.goToStop(0);
  }

  public endTour() {
    AudioEngine.playClick();
    this.activeTour = null;
    this.hudCard.classList.add('hidden');
    this.app.cameraDirector.resetToSolarSystemOverview();
  }

  private goToStop(index: number) {
    if (!this.activeTour || index < 0 || index >= this.activeTour.stops.length) return;
    this.currentStopIndex = index;
    const stop = this.activeTour.stops[index];

    // Fly camera
    const mesh = this.app.bodyMeshes.get(stop.bodyId);
    if (mesh) {
      this.app.cameraDirector.flyToBody(mesh, stop.cameraDistance);
    }

    // Render HUD card
    this.renderHudCard(stop);
  }

  private renderHudCard(stop: TourStop) {
    if (!this.activeTour) return;

    this.hudCard.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
          ${this.activeTour.name} • Stop ${this.currentStopIndex + 1} of ${this.activeTour.stops.length}
        </span>
        <button id="exit-tour-btn" class="text-xs font-mono text-gray-400 hover:text-rose-400 transition">
          Exit Tour ✕
        </button>
      </div>

      <h3 class="text-xl font-bold text-white mb-2">${stop.title}</h3>
      <p class="text-xs text-gray-300 leading-relaxed mb-4">${stop.narrative}</p>

      <div class="flex items-center justify-between pt-2 border-t border-white/10">
        <button id="prev-stop-btn" class="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white transition disabled:opacity-30 disabled:cursor-not-allowed" ${this.currentStopIndex === 0 ? 'disabled' : ''}>
          ← Previous
        </button>

        <div class="flex gap-1.5">
          ${this.activeTour.stops.map((_, i) => `
            <span class="w-2 h-2 rounded-full ${i === this.currentStopIndex ? 'bg-cyan-400 scale-125' : 'bg-white/20'} transition"></span>
          `).join('')}
        </div>

        <button id="next-stop-btn" class="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-mono text-white font-semibold transition">
          ${this.currentStopIndex === this.activeTour.stops.length - 1 ? 'Finish Tour ✓' : 'Next Stop →'}
        </button>
      </div>
    `;

    this.hudCard.querySelector('#exit-tour-btn')?.addEventListener('click', () => this.endTour());

    this.hudCard.querySelector('#prev-stop-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      this.goToStop(this.currentStopIndex - 1);
    });

    this.hudCard.querySelector('#next-stop-btn')?.addEventListener('click', () => {
      AudioEngine.playClick();
      if (this.currentStopIndex === this.activeTour!.stops.length - 1) {
        this.endTour();
      } else {
        this.goToStop(this.currentStopIndex + 1);
      }
    });
  }
}
