export interface InternalLayer {
  name: string;
  depth: string;
  description: string;
  composition: string;
}

export interface MoonInfo {
  id: string;
  name: string;
  wikipediaTitle: string;
  diameterKm: number;
  orbitDistanceKm: number;
  orbitalPeriodDays: number;
  discoveredYear: number | string;
  discoverer: string;
  has3DModel?: boolean;
  color?: string;
  brief: string;
}

export interface CelestialBodyData {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'dwarf-planet' | 'moon' | 'asteroid' | 'comet';
  parentBodyId?: string;
  wikipediaTitle: string;
  tagline: string;
  color: string;
  emissiveColor?: string;
  glowColor?: string;
  
  // Visual rendering properties
  radiusKm: number;
  explorerRadius: number; // Scaled for Explorer Mode
  semiMajorAxisAU: number; // Orbital distance in AU
  explorerOrbitRadius: number; // Scaled for Explorer Mode
  orbitalPeriodDays: number; // Keplerian period
  rotationPeriodHours: number; // Spin rate (negative for retrograde)
  axialTiltDeg: number; // Degrees
  eccentricity: number; // 0 to 1
  orbitalInclinationDeg: number;

  // Visual features
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereScale?: number;
  hasClouds?: boolean;
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  ringColor?: string;

  // Real astronomical data
  massKg: string;
  densityGcm3: number;
  surfaceGravityMs2: number;
  escapeVelocityKms: number;
  meanTempC: number;
  atmosphereComposition: string[];
  moonsCount: number;
  discovery: {
    year: number | string;
    discoverer: string;
  };

  // Curated educational facts
  quickFacts: string[];
  internalStructure?: InternalLayer[];
  majorMoons?: MoonInfo[];
  allMoonsCatalog?: { name: string; diameterKm: number; year: string | number }[];
}

export const SUN_DATA: CelestialBodyData = {
  id: 'sun',
  name: 'The Sun',
  type: 'star',
  wikipediaTitle: 'Sun',
  tagline: 'The glowing yellow dwarf star at the heart of our Solar System',
  color: '#ffbb44',
  emissiveColor: '#ff7700',
  glowColor: '#ff9900',
  radiusKm: 696340,
  explorerRadius: 28,
  semiMajorAxisAU: 0,
  explorerOrbitRadius: 0,
  orbitalPeriodDays: 0,
  rotationPeriodHours: 609.12, // ~25.4 days at equator
  axialTiltDeg: 7.25,
  eccentricity: 0,
  orbitalInclinationDeg: 0,
  hasAtmosphere: true,
  atmosphereColor: '#ffaa22',
  atmosphereScale: 1.15,
  massKg: '1.989 × 10³⁰ kg (333,000 Earths)',
  densityGcm3: 1.41,
  surfaceGravityMs2: 274.0,
  escapeVelocityKms: 617.5,
  meanTempC: 5505, // 5778 K
  atmosphereComposition: ['73.46% Hydrogen', '24.85% Helium', '0.77% Oxygen', '0.29% Carbon', '0.16% Iron'],
  moonsCount: 0,
  discovery: {
    year: 'Known since antiquity',
    discoverer: 'Prehistoric humans'
  },
  quickFacts: [
    'Contains 99.86% of all mass in the entire Solar System.',
    'About 1.3 million Earths could fit inside the Sun.',
    'Core temperature reaches 15.7 million °C, fusing 600 million tons of hydrogen into helium every second.',
    'Light takes approximately 8 minutes and 20 seconds to travel from the Sun to Earth.',
    'Generates a powerful magnetic field that powers the solar wind and causes space weather throughout the Solar System.'
  ],
  internalStructure: [
    { name: 'Core', depth: '0 – 0.25 R☉', description: 'Extreme nuclear fusion engine burning hydrogen into helium at 15.7 million K.', composition: 'Dense plasma of ionized hydrogen and helium' },
    { name: 'Radiative Zone', depth: '0.25 – 0.70 R☉', description: 'Photons take 100,000+ years to bounce outwards through intense radiation diffusion.', composition: 'Dense ionized gas' },
    { name: 'Convective Zone', depth: '0.70 – 1.00 R☉', description: 'Vast thermal boiling columns carry heat upward toward the surface.', composition: 'Convective plasma cells' },
    { name: 'Photosphere', depth: '500 km thick', description: 'The visible glowing surface displaying sunspots and granules.', composition: 'Ionized gas at ~5,500°C' },
    { name: 'Corona', depth: 'Extends millions of km', description: 'Extremely hot, tenuous outer atmosphere reaching 1 to 3 million °C.', composition: 'Superheated coronal plasma' }
  ]
};

export const PLANETS_DATA: CelestialBodyData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Mercury_(planet)',
    tagline: 'The smallest planet and closest neighbor to the Sun',
    color: '#a39f99',
    radiusKm: 2439.7,
    explorerRadius: 3.2,
    semiMajorAxisAU: 0.387,
    explorerOrbitRadius: 45,
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6, // 58.65 days
    axialTiltDeg: 0.034,
    eccentricity: 0.2056,
    orbitalInclinationDeg: 7.0,
    massKg: '3.301 × 10²³ kg (0.055 Earths)',
    densityGcm3: 5.43,
    surfaceGravityMs2: 3.7,
    escapeVelocityKms: 4.25,
    meanTempC: 167, // -180°C to 430°C
    atmosphereComposition: ['Trace: 42% Oxygen', '29% Sodium', '22% Hydrogen', '6% Helium'],
    moonsCount: 0,
    discovery: { year: 'Known since antiquity', discoverer: 'Babylonian / Sumerian astronomers' },
    quickFacts: [
      'Has the highest orbital speed of any planet, racing at 47 km/s (105,000 mph).',
      'Experiences extreme temperature swings: 430°C during the day and -180°C at night.',
      'A year is just 88 Earth days, but one solar day lasts 176 Earth days due to 3:2 spin-orbit resonance.',
      'Possesses a massive iron core that makes up roughly 85% of the planet\'s total radius.',
      'Radar observations discovered water ice hidden inside permanently shadowed polar craters.'
    ],
    internalStructure: [
      { name: 'Solid Metallic Core', depth: 'Center to 2,000 km', description: 'Enormous iron-nickel core making up ~85% of planetary radius.', composition: 'Iron, nickel, sulfur' },
      { name: 'Silicate Mantle', depth: '400 km thick', description: 'Rocky layer compressed by intense gravity.', composition: 'Silicates, pyroxene, olivine' },
      { name: 'Rocky Crust', depth: '35 km thick', description: 'Densely cratered surface scarred by Caloris Basin impact and wrinkle ridges.', composition: 'Basaltic silicates' }
    ]
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Venus',
    tagline: 'Earth\'s volcanic, scorching twin shrouded in sulfuric clouds',
    color: '#e4b678',
    radiusKm: 6051.8,
    explorerRadius: 5.8,
    semiMajorAxisAU: 0.723,
    explorerOrbitRadius: 65,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5, // 243 days retrograde
    axialTiltDeg: 177.3,
    eccentricity: 0.0067,
    orbitalInclinationDeg: 3.39,
    hasAtmosphere: true,
    atmosphereColor: '#ffdd99',
    atmosphereScale: 1.08,
    massKg: '4.867 × 10²⁴ kg (0.815 Earths)',
    densityGcm3: 5.24,
    surfaceGravityMs2: 8.87,
    escapeVelocityKms: 10.36,
    meanTempC: 464,
    atmosphereComposition: ['96.5% Carbon Dioxide', '3.5% Nitrogen', '0.015% Sulfur Dioxide'],
    moonsCount: 0,
    discovery: { year: 'Known since antiquity', discoverer: 'Ancient stargazers' },
    quickFacts: [
      'The hottest planet in the Solar System, hotter than Mercury, due to a runaway greenhouse effect.',
      'Rotates backwards (retrograde) compared to most planets; the Sun rises in the west and sets in the east.',
      'Surface atmospheric pressure is 92 times greater than Earth\'s—equivalent to being 900 meters underwater.',
      'Clouds are composed of concentrated sulfuric acid droplets reflecting 75% of sunlight.',
      'A single Venusian day (243 Earth days) is longer than its entire year (225 Earth days).'
    ],
    internalStructure: [
      { name: 'Metallic Core', depth: 'Center to ~3,200 km', description: 'Likely partially molten iron-nickel core.', composition: 'Iron, nickel' },
      { name: 'Rocky Mantle', depth: '~2,800 km thick', description: 'Vigorously convecting silicate mantle feeding thousands of volcanoes.', composition: 'Silicate rocks' },
      { name: 'Basaltic Crust', depth: '20 – 50 km thick', description: 'Volcanically resurfaced plains, lava channels, and coronae.', composition: 'Silicates and basalt' }
    ]
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Earth',
    tagline: 'Our vibrant blue marble, oasis of liquid water and thriving life',
    color: '#2277bb',
    radiusKm: 6371.0,
    explorerRadius: 6.0,
    semiMajorAxisAU: 1.0,
    explorerOrbitRadius: 90,
    orbitalPeriodDays: 365.256,
    rotationPeriodHours: 23.934,
    axialTiltDeg: 23.44,
    eccentricity: 0.0167,
    orbitalInclinationDeg: 0.0,
    hasAtmosphere: true,
    atmosphereColor: '#4ba3e3',
    atmosphereScale: 1.06,
    hasClouds: true,
    massKg: '5.972 × 10²⁴ kg (1.000 Earth)',
    densityGcm3: 5.51,
    surfaceGravityMs2: 9.807,
    escapeVelocityKms: 11.19,
    meanTempC: 15,
    atmosphereComposition: ['78.08% Nitrogen', '20.95% Oxygen', '0.93% Argon', '0.04% Carbon Dioxide'],
    moonsCount: 1,
    discovery: { year: 'Origin of Humanity', discoverer: 'Homo sapiens' },
    quickFacts: [
      'The only known celestial body in the universe known to harbor active life.',
      'Liquid water covers 70.8% of the surface, creating weather systems and life-sustaining oceans.',
      'Protected by a dynamic magnetosphere generated by the convection of its liquid iron outer core.',
      'Tectonic plates continuously recycle the crust, regulating carbon dioxide and climate over geological time.',
      'Possesses a disproportionately large natural satellite (the Moon) that stabilizes Earth\'s axial tilt.'
    ],
    internalStructure: [
      { name: 'Inner Core', depth: '5,150 – 6,371 km', description: 'Solid metallic sphere under 3.6 million atmospheres pressure at 5,400°C.', composition: 'Crystalline Iron & Nickel' },
      { name: 'Outer Core', depth: '2,890 – 5,150 km', description: 'Convecting liquid iron-nickel alloy generating Earth\'s protective magnetic shield.', composition: 'Molten Iron, Nickel, Sulfur' },
      { name: 'Mantle', depth: '30 – 2,890 km', description: 'Viscous silicate rock layer undergoing slow convection driving plate tectonics.', composition: 'Peridotite, Olivine, Pyroxene' },
      { name: 'Crust', depth: '5 – 70 km', description: 'Thin solid outer rocky shell divided into oceanic (thin, basalt) and continental (granitic) plates.', composition: 'Aluminosilicates, quartz, basalt' }
    ],
    majorMoons: [
      {
        id: 'moon',
        name: 'The Moon (Luna)',
        wikipediaTitle: 'Moon',
        diameterKm: 3474.8,
        orbitDistanceKm: 384400,
        orbitalPeriodDays: 27.32,
        discoveredYear: 'Prehistoric',
        discoverer: 'Known since antiquity',
        has3DModel: true,
        color: '#c0beba',
        brief: 'Earth\'s only natural satellite, tidally locked and covered in ancient impact craters and basaltic maria.'
      }
    ]
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Mars',
    tagline: 'The Red Planet, home to towering volcanoes and ancient dried riverbeds',
    color: '#c24b22',
    radiusKm: 3389.5,
    explorerRadius: 4.2,
    semiMajorAxisAU: 1.524,
    explorerOrbitRadius: 118,
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.623,
    axialTiltDeg: 25.19,
    eccentricity: 0.0934,
    orbitalInclinationDeg: 1.85,
    hasAtmosphere: true,
    atmosphereColor: '#d68364',
    atmosphereScale: 1.04,
    massKg: '6.417 × 10²³ kg (0.107 Earths)',
    densityGcm3: 3.93,
    surfaceGravityMs2: 3.72,
    escapeVelocityKms: 5.03,
    meanTempC: -63,
    atmosphereComposition: ['95.32% Carbon Dioxide', '2.6% Nitrogen', '1.9% Argon', '0.13% Oxygen'],
    moonsCount: 2,
    discovery: { year: 'Known since antiquity', discoverer: 'Ancient Egyptian & Babylonian astronomers' },
    quickFacts: [
      'Hosts Olympus Mons, the largest volcano in the Solar System, 21.9 km (72,000 ft) high—nearly 3x Mount Everest.',
      'Features Valles Marineris, a canyon system 4,000 km long and 7 km deep, stretching across an entire continent.',
      'Surface rust (iron(III) oxide) gives the planet its iconic reddish hue.',
      'Abundant evidence of ancient flowing liquid water: river valleys, deltas, and subglacial lake candidates.',
      'Has two small, potato-shaped captured asteroid moons: Phobos and Deimos.'
    ],
    internalStructure: [
      { name: 'Metallic Core', depth: 'Center to ~1,830 km', description: 'Liquid iron-nickel-sulfur core identified by NASA InSight seismometer.', composition: 'Iron, nickel, sulfur, light elements' },
      { name: 'Silicate Mantle', depth: '~1,500 km thick', description: 'Stationary mantle without plate tectonics, allowing massive volcanic growth.', composition: 'Silicates, olivine, pyroxene' },
      { name: 'Rocky Crust', depth: '24 – 72 km thick', description: 'Rich in iron oxide dust, basaltic lava flows, and polar ice caps of water & CO2.', composition: 'Basalt, iron-rich dust, sulfates' }
    ],
    majorMoons: [
      {
        id: 'phobos',
        name: 'Phobos',
        wikipediaTitle: 'Phobos_(moon)',
        diameterKm: 22.2,
        orbitDistanceKm: 9377,
        orbitalPeriodDays: 0.319,
        discoveredYear: 1877,
        discoverer: 'Asaph Hall',
        has3DModel: true,
        color: '#7f7871',
        brief: 'The innermost moon of Mars; orbits so close that it rises in the west and sets in the east twice every Martian day.'
      },
      {
        id: 'deimos',
        name: 'Deimos',
        wikipediaTitle: 'Deimos_(moon)',
        diameterKm: 12.4,
        orbitDistanceKm: 23460,
        orbitalPeriodDays: 1.263,
        discoveredYear: 1877,
        discoverer: 'Asaph Hall',
        has3DModel: true,
        color: '#8b847b',
        brief: 'Outer moon of Mars with a smooth regolith blanket filling its craters.'
      }
    ]
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Jupiter',
    tagline: 'King of the planets, massive gas giant with swirling storms and 95 moons',
    color: '#cfa878',
    radiusKm: 69911,
    explorerRadius: 16.5,
    semiMajorAxisAU: 5.204,
    explorerOrbitRadius: 165,
    orbitalPeriodDays: 4332.59, // 11.86 years
    rotationPeriodHours: 9.925,
    axialTiltDeg: 3.13,
    eccentricity: 0.0485,
    orbitalInclinationDeg: 1.30,
    hasAtmosphere: true,
    atmosphereColor: '#d6b88b',
    atmosphereScale: 1.05,
    massKg: '1.898 × 10²⁷ kg (317.8 Earths)',
    densityGcm3: 1.33,
    surfaceGravityMs2: 24.79,
    escapeVelocityKms: 59.5,
    meanTempC: -110,
    atmosphereComposition: ['89.8% Hydrogen', '10.2% Helium', '0.3% Methane', '0.026% Ammonia'],
    moonsCount: 95,
    discovery: { year: 'Known since antiquity', discoverer: 'Ancient astronomers; Moons by Galileo in 1610' },
    quickFacts: [
      'Mass is 2.5 times greater than all other planets in the Solar System combined.',
      'The Great Red Spot is a persistent anticyclonic storm larger than Earth, raging for at least 350+ years.',
      'Has the shortest day of all planets: completing a full axial rotation in just under 10 hours.',
      'Generates a ferocious magnetic field 20,000 times stronger than Earth\'s, creating intense radiation belts.',
      'Acts as a cosmic vacuum cleaner, using its immense gravity to sweep up or deflect comets and asteroids.'
    ],
    internalStructure: [
      { name: 'Diffuse Heavy Element Core', depth: 'Center to ~15,000 km', description: 'Dilute fuzzy core mixed with metallic hydrogen at tens of millions of bars.', composition: 'Rock, metal, dissolved ices' },
      { name: 'Liquid Metallic Hydrogen', depth: '~40,000 km thick', description: 'Immense pressure forces hydrogen into an electrically conducting liquid metal, generating the dynamo.', composition: 'Metallic liquid hydrogen & helium' },
      { name: 'Molecular Liquid Hydrogen', depth: '~20,000 km thick', description: 'Dense supercritical molecular fluid smoothly transitioning from gas to liquid.', composition: 'Liquid H₂ and He' },
      { name: 'Gaseous Atmosphere', depth: '~1,000 km thick', description: 'Banded belts and zones of ammonia, ammonium hydrosulfide, and water clouds.', composition: 'Hydrogen, Helium, Ammonia ice' }
    ],
    majorMoons: [
      {
        id: 'io',
        name: 'Io',
        wikipediaTitle: 'Io_(moon)',
        diameterKm: 3643.2,
        orbitDistanceKm: 421700,
        orbitalPeriodDays: 1.769,
        discoveredYear: 1610,
        discoverer: 'Galileo Galilei',
        has3DModel: true,
        color: '#f0c030',
        brief: 'The most volcanically active body in the Solar System, featuring 400+ active volcanoes and sulfur lava fountains.'
      },
      {
        id: 'europa',
        name: 'Europa',
        wikipediaTitle: 'Europa_(moon)',
        diameterKm: 3121.6,
        orbitDistanceKm: 671034,
        orbitalPeriodDays: 3.551,
        discoveredYear: 1610,
        discoverer: 'Galileo Galilei',
        has3DModel: true,
        color: '#e3dcd1',
        brief: 'Encased in a smooth, fractured ice shell over a global subsurface salt-water ocean containing twice Earth\'s water.'
      },
      {
        id: 'ganymede',
        name: 'Ganymede',
        wikipediaTitle: 'Ganymede_(moon)',
        diameterKm: 5268.2,
        orbitDistanceKm: 1070412,
        orbitalPeriodDays: 7.155,
        discoveredYear: 1610,
        discoverer: 'Galileo Galilei',
        has3DModel: true,
        color: '#958c82',
        brief: 'The largest moon in the Solar System (bigger than Mercury and Pluto), and the only moon with its own magnetic field.'
      },
      {
        id: 'callisto',
        name: 'Callisto',
        wikipediaTitle: 'Callisto_(moon)',
        diameterKm: 4820.6,
        orbitDistanceKm: 1882709,
        orbitalPeriodDays: 16.689,
        discoveredYear: 1610,
        discoverer: 'Galileo Galilei',
        has3DModel: true,
        color: '#6e655d',
        brief: 'Ancient, heavily cratered ice-and-rock world with the giant multiring basin Valhalla.'
      }
    ],
    allMoonsCatalog: [
      { name: 'Io', diameterKm: 3643, year: 1610 },
      { name: 'Europa', diameterKm: 3122, year: 1610 },
      { name: 'Ganymede', diameterKm: 5268, year: 1610 },
      { name: 'Callisto', diameterKm: 4821, year: 1610 },
      { name: 'Amalthea', diameterKm: 167, year: 1892 },
      { name: 'Himalia', diameterKm: 170, year: 1904 },
      { name: 'Thebe', diameterKm: 98, year: 1979 },
      { name: 'Metis', diameterKm: 43, year: 1979 },
      { name: 'Adrastea', diameterKm: 16, year: 1979 },
      { name: 'Elara', diameterKm: 86, year: 1905 },
      { name: 'Pasiphae', diameterKm: 60, year: 1908 },
      { name: 'Carme', diameterKm: 46, year: 1938 },
      { name: 'Lysithea', diameterKm: 36, year: 1938 },
      { name: 'Sinope', diameterKm: 38, year: 1914 },
      { name: 'Ananke', diameterKm: 28, year: 1951 },
      { name: 'Leda', diameterKm: 20, year: 1974 },
      { name: 'Callirrhoe', diameterKm: 9, year: 1999 },
      { name: 'Themisto', diameterKm: 8, year: 1975 },
      { name: 'Megaclite', diameterKm: 5, year: 2000 },
      { name: 'Taygete', diameterKm: 5, year: 2000 },
      { name: 'Chaldene', diameterKm: 4, year: 2000 },
      { name: 'Harpalyke', diameterKm: 4, year: 2000 },
      { name: 'Kalyke', diameterKm: 5, year: 2000 },
      { name: 'Iocaste', diameterKm: 5, year: 2000 },
      { name: 'Erinome', diameterKm: 3, year: 2000 },
      { name: 'Isonoe', diameterKm: 4, year: 2000 },
      { name: 'Praxidike', diameterKm: 7, year: 2000 },
      { name: 'Autonoe', diameterKm: 4, year: 2001 },
      { name: 'Thyone', diameterKm: 4, year: 2001 },
      { name: 'Hermippe', diameterKm: 4, year: 2001 },
      { name: 'Aitne', diameterKm: 3, year: 2001 },
      { name: 'Eurydome', diameterKm: 3, year: 2001 },
      { name: 'Euanthe', diameterKm: 3, year: 2001 },
      { name: 'Euporie', diameterKm: 2, year: 2001 },
      { name: 'Orthosie', diameterKm: 2, year: 2001 },
      { name: 'Sponde', diameterKm: 2, year: 2001 },
      { name: 'Kale', diameterKm: 2, year: 2001 },
      { name: 'Pasithee', diameterKm: 2, year: 2001 },
      { name: 'Hegemone', diameterKm: 3, year: 2003 },
      { name: 'Mneme', diameterKm: 2, year: 2003 },
      { name: 'Aoede', diameterKm: 4, year: 2003 },
      { name: 'Thelxinoe', diameterKm: 2, year: 2003 },
      { name: 'Arche', diameterKm: 3, year: 2002 },
      { name: 'Kallichore', diameterKm: 2, year: 2003 },
      { name: 'Helike', diameterKm: 4, year: 2003 },
      { name: 'Carpo', diameterKm: 3, year: 2003 },
      { name: 'Eukelade', diameterKm: 4, year: 2003 },
      { name: 'Cyllene', diameterKm: 2, year: 2003 },
      { name: 'Kore', diameterKm: 2, year: 2003 },
      { name: 'Herse', diameterKm: 2, year: 2003 },
      { name: 'Dia', diameterKm: 4, year: 2000 },
      { name: 'Valetudo', diameterKm: 1, year: 2016 },
      { name: 'Pandia', diameterKm: 3, year: 2017 },
      { name: 'Ersa', diameterKm: 3, year: 2018 }
    ]
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Saturn',
    tagline: 'The ringed jewel of the solar system, surrounded by 146 moons',
    color: '#e2ca9b',
    radiusKm: 58232,
    explorerRadius: 13.8,
    semiMajorAxisAU: 9.537,
    explorerOrbitRadius: 215,
    orbitalPeriodDays: 10759.22, // 29.45 years
    rotationPeriodHours: 10.656,
    axialTiltDeg: 26.73,
    eccentricity: 0.0542,
    orbitalInclinationDeg: 2.49,
    hasAtmosphere: true,
    atmosphereColor: '#e0c896',
    atmosphereScale: 1.05,
    hasRings: true,
    ringInnerRadius: 17.0,
    ringOuterRadius: 32.0,
    ringColor: '#d6c49e',
    massKg: '5.683 × 10²⁶ kg (95.16 Earths)',
    densityGcm3: 0.687, // Less dense than water!
    surfaceGravityMs2: 10.44,
    escapeVelocityKms: 35.5,
    meanTempC: -140,
    atmosphereComposition: ['96.3% Hydrogen', '3.25% Helium', '0.45% Methane', '0.01% Ammonia'],
    moonsCount: 146,
    discovery: { year: 'Known since antiquity', discoverer: 'Ancient observers; Rings identified by Huygens in 1655' },
    quickFacts: [
      'The least dense planet in the Solar System (0.69 g/cm³)—it would literally float in a giant bathtub of water.',
      'Saturn\'s spectacular rings span up to 282,000 km across, yet are on average only 10 to 30 meters thick!',
      'Rings are made of billions of chunks of 99% pure water ice, ranging from tiny dust grains to house-sized boulders.',
      'Hosts a bizarre, persistent hexagonal jet stream storm at its north pole spanning 30,000 km across.',
      'Surrounded by 146 officially recognized moons, the most of any planet in the Solar System.'
    ],
    internalStructure: [
      { name: 'Rocky & Icy Core', depth: 'Center to ~10,000 km', description: 'Dense core of iron, nickel, silicates, and high-pressure ice.', composition: 'Iron-silicate rock & water ice' },
      { name: 'Liquid Metallic Hydrogen', depth: '~15,000 km thick', description: 'Liquid metallic hydrogen layer creating Saturn\'s magnetic field.', composition: 'Conducting metallic hydrogen' },
      { name: 'Liquid Molecular Hydrogen', depth: '~30,000 km thick', description: 'Vast fluid reservoir with raining liquid helium droplets.', composition: 'Molecular hydrogen & helium' },
      { name: 'Upper Atmosphere', depth: '~1,000 km thick', description: 'Golden hazy clouds of ammonia and ammonium hydrosulfide ice crystals.', composition: 'Hydrogen, Helium, Ammonia haze' }
    ],
    majorMoons: [
      {
        id: 'titan',
        name: 'Titan',
        wikipediaTitle: 'Titan_(moon)',
        diameterKm: 5149.5,
        orbitDistanceKm: 1221870,
        orbitalPeriodDays: 15.945,
        discoveredYear: 1655,
        discoverer: 'Christiaan Huygens',
        has3DModel: true,
        color: '#e6a84e',
        brief: 'The only moon with a dense atmosphere and stable surface liquids (lakes and seas of liquid methane and ethane).'
      },
      {
        id: 'enceladus',
        name: 'Enceladus',
        wikipediaTitle: 'Enceladus',
        diameterKm: 504.2,
        orbitDistanceKm: 238040,
        orbitalPeriodDays: 1.37,
        discoveredYear: 1789,
        discoverer: 'William Herschel',
        has3DModel: true,
        color: '#f0f3f6',
        brief: 'Icy moon erupting cryovolcanic geysers of salt water and organic compounds from its subsurface global ocean into space.'
      },
      {
        id: 'mimas',
        name: 'Mimas',
        wikipediaTitle: 'Mimas_(moon)',
        diameterKm: 396.4,
        orbitDistanceKm: 185520,
        orbitalPeriodDays: 0.942,
        discoveredYear: 1789,
        discoverer: 'William Herschel',
        has3DModel: true,
        color: '#b0ada7',
        brief: 'Known as the "Death Star" moon due to its colossal 130 km wide Herschel Crater, covering 1/3 of its diameter.'
      },
      {
        id: 'iapetus',
        name: 'Iapetus',
        wikipediaTitle: 'Iapetus_(moon)',
        diameterKm: 1469.0,
        orbitDistanceKm: 3561300,
        orbitalPeriodDays: 79.33,
        discoveredYear: 1671,
        discoverer: 'Giovanni Domenico Cassini',
        has3DModel: true,
        color: '#554d42',
        brief: 'The "Yin-Yang" moon: one hemisphere is coal black (Cassini Regio) and the other is brilliant white snow.'
      },
      {
        id: 'rhea',
        name: 'Rhea',
        wikipediaTitle: 'Rhea_(moon)',
        diameterKm: 1527.6,
        orbitDistanceKm: 527108,
        orbitalPeriodDays: 4.518,
        discoveredYear: 1672,
        discoverer: 'Giovanni Domenico Cassini',
        has3DModel: true,
        color: '#bfbcb6',
        brief: 'Saturn\'s second-largest moon, heavily cratered and composed primarily of water ice with a tenuous oxygen exosphere.'
      }
    ],
    allMoonsCatalog: [
      { name: 'Mimas', diameterKm: 396, year: 1789 },
      { name: 'Enceladus', diameterKm: 504, year: 1789 },
      { name: 'Tethys', diameterKm: 1062, year: 1684 },
      { name: 'Dione', diameterKm: 1123, year: 1684 },
      { name: 'Rhea', diameterKm: 1528, year: 1672 },
      { name: 'Titan', diameterKm: 5150, year: 1655 },
      { name: 'Hyperion', diameterKm: 270, year: 1848 },
      { name: 'Iapetus', diameterKm: 1469, year: 1671 },
      { name: 'Phoebe', diameterKm: 213, year: 1899 },
      { name: 'Janus', diameterKm: 179, year: 1966 },
      { name: 'Epimetheus', diameterKm: 116, year: 1978 },
      { name: 'Helene', diameterKm: 35, year: 1980 },
      { name: 'Telesto', diameterKm: 25, year: 1980 },
      { name: 'Calypso', diameterKm: 21, year: 1980 },
      { name: 'Atlas', diameterKm: 30, year: 1980 },
      { name: 'Prometheus', diameterKm: 86, year: 1980 },
      { name: 'Pandora', diameterKm: 81, year: 1980 },
      { name: 'Pan', diameterKm: 28, year: 1990 },
      { name: 'Ymir', diameterKm: 18, year: 2000 },
      { name: 'Paaliaq', diameterKm: 22, year: 2000 },
      { name: 'Siarnaq', diameterKm: 40, year: 2000 },
      { name: 'Tarvos', diameterKm: 15, year: 2000 },
      { name: 'Kiviuq', diameterKm: 16, year: 2000 },
      { name: 'Ijiraq', diameterKm: 12, year: 2000 },
      { name: 'Thrymr', diameterKm: 7, year: 2000 },
      { name: 'Skathi', diameterKm: 8, year: 2000 },
      { name: 'Mundilfari', diameterKm: 7, year: 2000 },
      { name: 'Erriapus', diameterKm: 10, year: 2000 },
      { name: 'Albiorix', diameterKm: 32, year: 2000 },
      { name: 'Bebhionn', diameterKm: 6, year: 2004 },
      { name: 'Daphnis', diameterKm: 8, year: 2005 },
      { name: 'Aegir', diameterKm: 6, year: 2004 }
    ]
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Uranus',
    tagline: 'The tilted ice giant rolling on its side through the solar system',
    color: '#82d3e5',
    radiusKm: 25362,
    explorerRadius: 9.8,
    semiMajorAxisAU: 19.191,
    explorerOrbitRadius: 265,
    orbitalPeriodDays: 30685.4, // 84 years
    rotationPeriodHours: -17.24, // Retrograde
    axialTiltDeg: 97.77, // On its side!
    eccentricity: 0.0472,
    orbitalInclinationDeg: 0.77,
    hasAtmosphere: true,
    atmosphereColor: '#7fe2e8',
    atmosphereScale: 1.05,
    hasRings: true,
    ringInnerRadius: 12.0,
    ringOuterRadius: 18.0,
    ringColor: '#5c7f8a',
    massKg: '8.681 × 10²⁵ kg (14.54 Earths)',
    densityGcm3: 1.27,
    surfaceGravityMs2: 8.69,
    escapeVelocityKms: 21.3,
    meanTempC: -197, // Coldest planetary atmosphere (-224°C record)
    atmosphereComposition: ['82.5% Hydrogen', '15.2% Helium', '2.3% Methane'],
    moonsCount: 28,
    discovery: { year: 1781, discoverer: 'William Herschel' },
    quickFacts: [
      'Rotates completely on its side with an axial tilt of 97.8°, likely caused by a massive protoplanetary collision.',
      'Experiences extreme 42-year periods of continuous sunlight followed by 42 years of continuous darkness at its poles.',
      'Has the coldest planetary atmosphere in the Solar System, dipping down to -224°C (-371°F).',
      'Methane in the upper atmosphere absorbs red light and reflects blue and green, giving Uranus its cyan aquamarine tint.',
      'Features 13 known narrow, dark, charcoal-colored rings discovered in 1977.'
    ],
    internalStructure: [
      { name: 'Rocky Core', depth: 'Center to ~5,000 km', description: 'Small silicate-iron-nickel core with low heat flow.', composition: 'Iron, nickel, silicate rock' },
      { name: 'Icy Slush Mantle', depth: '~10,000 km thick', description: 'Superheated, high-density supercritical fluid of water, ammonia, and methane ices.', composition: 'Water, ammonia, methane ices' },
      { name: 'Hydrogen-Helium Envelope', depth: '~10,000 km thick', description: 'Deep gaseous envelope merging into the icy mantle without a solid boundary.', composition: 'Hydrogen, Helium, Methane gas' }
    ],
    majorMoons: [
      {
        id: 'miranda',
        name: 'Miranda',
        wikipediaTitle: 'Miranda_(moon)',
        diameterKm: 471.6,
        orbitDistanceKm: 129390,
        orbitalPeriodDays: 1.413,
        discoveredYear: 1948,
        discoverer: 'Gerard Kuiper',
        has3DModel: true,
        color: '#a8a29b',
        brief: 'Features the most extreme fractured jigsaw topography, including Verona Rupes—the tallest cliff in the Solar System (20 km high).'
      },
      {
        id: 'titania',
        name: 'Titania',
        wikipediaTitle: 'Titania_(moon)',
        diameterKm: 1577.8,
        orbitDistanceKm: 435910,
        orbitalPeriodDays: 8.706,
        discoveredYear: 1787,
        discoverer: 'William Herschel',
        has3DModel: true,
        color: '#b5aca1',
        brief: 'The largest moon of Uranus, crisscrossed by massive fault scarps and canyon valleys (Belinda and Messina Chasmata).'
      },
      {
        id: 'oberon',
        name: 'Oberon',
        wikipediaTitle: 'Oberon_(moon)',
        diameterKm: 1522.8,
        orbitDistanceKm: 583520,
        orbitalPeriodDays: 13.46,
        discoveredYear: 1787,
        discoverer: 'William Herschel',
        has3DModel: true,
        color: '#988c80',
        brief: 'The outermost major moon of Uranus, heavily cratered with mysterious dark patches floor-coating its largest impact basins.'
      }
    ],
    allMoonsCatalog: [
      { name: 'Miranda', diameterKm: 472, year: 1948 },
      { name: 'Ariel', diameterKm: 1158, year: 1851 },
      { name: 'Umbriel', diameterKm: 1169, year: 1851 },
      { name: 'Titania', diameterKm: 1578, year: 1787 },
      { name: 'Oberon', diameterKm: 1523, year: 1787 },
      { name: 'Puck', diameterKm: 162, year: 1985 },
      { name: 'Portia', diameterKm: 135, year: 1986 },
      { name: 'Juliet', diameterKm: 94, year: 1986 },
      { name: 'Belinda', diameterKm: 90, year: 1986 },
      { name: 'Cressida', diameterKm: 80, year: 1986 },
      { name: 'Rosalind', diameterKm: 72, year: 1986 },
      { name: 'Desdemona', diameterKm: 64, year: 1986 },
      { name: 'Bianca', diameterKm: 51, year: 1986 },
      { name: 'Cordelia', diameterKm: 40, year: 1986 },
      { name: 'Ophelia', diameterKm: 43, year: 1986 },
      { name: 'Caliban', diameterKm: 72, year: 1997 },
      { name: 'Sycorax', diameterKm: 150, year: 1997 },
      { name: 'Prospero', diameterKm: 50, year: 1999 },
      { name: 'Setebos', diameterKm: 48, year: 1999 },
      { name: 'Stephano', diameterKm: 32, year: 1999 },
      { name: 'Trinculo', diameterKm: 18, year: 2001 },
      { name: 'Ferdinand', diameterKm: 21, year: 2001 },
      { name: 'Margaret', diameterKm: 20, year: 2003 },
      { name: 'Francisco', diameterKm: 22, year: 2001 },
      { name: 'Perdita', diameterKm: 30, year: 1999 },
      { name: 'Mab', diameterKm: 25, year: 2003 },
      { name: 'Cupid', diameterKm: 18, year: 2003 }
    ]
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Neptune',
    tagline: 'The vibrant deep azure world of supersonic winds and icy storms',
    color: '#3864d4',
    radiusKm: 24622,
    explorerRadius: 9.6,
    semiMajorAxisAU: 30.07,
    explorerOrbitRadius: 310,
    orbitalPeriodDays: 60190.0, // 164.8 years
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    eccentricity: 0.0086,
    orbitalInclinationDeg: 1.77,
    hasAtmosphere: true,
    atmosphereColor: '#4c7df7',
    atmosphereScale: 1.05,
    hasRings: true,
    ringInnerRadius: 12.0,
    ringOuterRadius: 15.0,
    ringColor: '#2b448a',
    massKg: '1.024 × 10²⁶ kg (17.15 Earths)',
    densityGcm3: 1.64,
    surfaceGravityMs2: 11.15,
    escapeVelocityKms: 23.5,
    meanTempC: -201,
    atmosphereComposition: ['80% Hydrogen', '19% Helium', '1.5% Methane'],
    moonsCount: 16,
    discovery: { year: 1846, discoverer: 'Johann Galle & Urbain Le Verrier (mathematical prediction)' },
    quickFacts: [
      'The only planet whose existence was predicted mathematically by Le Verrier before it was ever seen through a telescope.',
      'Home to the most violent winds in the Solar System, reaching supersonic speeds of 2,100 km/h (1,300 mph).',
      'Takes almost 165 Earth years to orbit the Sun once; completed its first orbit since discovery only in 2011.',
      'Hosts the giant retrograde moon Triton, an icy captured Kuiper Belt object with active nitrogen geysers.',
      'Deep blue color is caused by atmospheric methane absorbing red wavelengths, plus an unknown atmospheric chromophore.'
    ],
    internalStructure: [
      { name: 'Rocky Core', depth: 'Center to ~7,000 km', description: 'Dense core of molten rock and iron with ~1.2 Earth masses.', composition: 'Iron, nickel, silicates' },
      { name: 'Superionic Water Mantle', depth: '~10,000 km thick', description: 'Exotic hot fluid mantle under millions of atmospheres where water molecules break into superionic ice.', composition: 'Superionic water, ammonia, methane' },
      { name: 'Upper Atmosphere', depth: '~7,000 km thick', description: 'Vibrant banded storms, high-altitude white methane cirrus clouds (Scooter), and dark spots.', composition: 'Hydrogen, Helium, Methane' }
    ],
    majorMoons: [
      {
        id: 'triton',
        name: 'Triton',
        wikipediaTitle: 'Triton_(moon)',
        diameterKm: 2706.8,
        orbitDistanceKm: 354759,
        orbitalPeriodDays: -5.877, // Retrograde!
        discoveredYear: 1846,
        discoverer: 'William Lassell',
        has3DModel: true,
        color: '#b2c0b8',
        brief: 'Massive captured Kuiper Belt object orbiting backwards, with cryogenic nitrogen geysers and melon-like cantaloupe terrain.'
      },
      {
        id: 'proteus',
        name: 'Proteus',
        wikipediaTitle: 'Proteus_(moon)',
        diameterKm: 420.0,
        orbitDistanceKm: 117646,
        orbitalPeriodDays: 1.122,
        discoveredYear: 1989,
        discoverer: 'Voyager 2 science team',
        has3DModel: true,
        color: '#65605b',
        brief: 'The largest irregularly shaped (non-spherical) body orbiting Neptune, densely cratered with no signs of geological modification.'
      }
    ],
    allMoonsCatalog: [
      { name: 'Triton', diameterKm: 2707, year: 1846 },
      { name: 'Proteus', diameterKm: 420, year: 1989 },
      { name: 'Nereid', diameterKm: 340, year: 1949 },
      { name: 'Larissa', diameterKm: 194, year: 1981 },
      { name: 'Galatea', diameterKm: 174, year: 1989 },
      { name: 'Despina', diameterKm: 150, year: 1989 },
      { name: 'Thalassa', diameterKm: 82, year: 1989 },
      { name: 'Naiad', diameterKm: 66, year: 1989 },
      { name: 'Halimede', diameterKm: 62, year: 2002 },
      { name: 'Neso', diameterKm: 60, year: 2002 },
      { name: 'Sao', diameterKm: 44, year: 2002 },
      { name: 'Laomedeia', diameterKm: 42, year: 2002 },
      { name: 'Psamathe', diameterKm: 38, year: 2003 },
      { name: 'Hippocamp', diameterKm: 18, year: 2013 }
    ]
  }
];

export const DWARF_PLANETS_DATA: CelestialBodyData[] = [
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'dwarf-planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Pluto',
    tagline: 'Beloved ruler of the Kuiper Belt with a beating nitrogen heart',
    color: '#d6a67f',
    radiusKm: 1188.3,
    explorerRadius: 2.2,
    semiMajorAxisAU: 39.48,
    explorerOrbitRadius: 360,
    orbitalPeriodDays: 90560.0, // 247.9 years
    rotationPeriodHours: -153.29, // 6.38 days retrograde
    axialTiltDeg: 122.53,
    eccentricity: 0.2488,
    orbitalInclinationDeg: 17.16,
    hasAtmosphere: true,
    atmosphereColor: '#6da0d8',
    atmosphereScale: 1.06,
    massKg: '1.303 × 10²² kg (0.002 Earths)',
    densityGcm3: 1.86,
    surfaceGravityMs2: 0.62,
    escapeVelocityKms: 1.21,
    meanTempC: -229,
    atmosphereComposition: ['99% Nitrogen', '0.5% Methane', '0.25% Carbon Monoxide'],
    moonsCount: 5,
    discovery: { year: 1930, discoverer: 'Clyde Tombaugh' },
    quickFacts: [
      'Features Tombaugh Regio, a magnificent heart-shaped glacier of convective nitrogen and carbon monoxide ice.',
      'Orbits in a binary gravitational dance with its oversized moon Charon; the barycenter lies outside Pluto itself.',
      'Mountains made of rock-hard water ice reach 3,500 meters (11,000 ft) into the nitrogen sky.',
      'Atmosphere expands when closer to the Sun and freezes into snow as it moves toward aphelion.',
      'Reclassified as a dwarf planet by the International Astronomical Union in August 2006.'
    ],
    majorMoons: [
      {
        id: 'charon',
        name: 'Charon',
        wikipediaTitle: 'Charon_(moon)',
        diameterKm: 1212.0,
        orbitDistanceKm: 19570,
        orbitalPeriodDays: 6.387,
        discoveredYear: 1978,
        discoverer: 'James Christy',
        has3DModel: true,
        color: '#9e9185',
        brief: 'Pluto\'s giant binary companion with a red north polar cap (Mordor Macula) stained by organic tholins.'
      }
    ]
  },
  {
    id: 'ceres',
    name: 'Ceres',
    type: 'dwarf-planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Ceres_(dwarf_planet)',
    tagline: 'The largest asteroid and sole dwarf planet inside Neptune\'s orbit',
    color: '#87837d',
    radiusKm: 473.0,
    explorerRadius: 1.6,
    semiMajorAxisAU: 2.767,
    explorerOrbitRadius: 140,
    orbitalPeriodDays: 1682.0, // 4.6 years
    rotationPeriodHours: 9.074,
    axialTiltDeg: 4.0,
    eccentricity: 0.0758,
    orbitalInclinationDeg: 10.59,
    massKg: '9.39 × 10²⁰ kg (0.00015 Earths)',
    densityGcm3: 2.16,
    surfaceGravityMs2: 0.28,
    escapeVelocityKms: 0.51,
    meanTempC: -106,
    atmosphereComposition: ['Transient water vapor from cryovolcanic sublimation'],
    moonsCount: 0,
    discovery: { year: 1801, discoverer: 'Giuseppe Piazzi' },
    quickFacts: [
      'Accounts for approximately 35% of the total mass of the entire Main Asteroid Belt.',
      'Features Occator Crater with brilliant white sodium carbonate salt deposits left behind by briny cryovolcanism.',
      'Contains substantial subterranean water ice—possibly more fresh water volume than Earth.',
      'Visited and orbited in detail by NASA\'s Dawn spacecraft from 2015 to 2018.'
    ]
  },
  {
    id: 'haumea',
    name: 'Haumea',
    type: 'dwarf-planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Haumea',
    tagline: 'The fastest-spinning major body in the Solar System, shaped like an ellipsoid football',
    color: '#a8bac7',
    radiusKm: 780, // 2322 x 1704 x 1024 km
    explorerRadius: 1.8,
    semiMajorAxisAU: 43.22,
    explorerOrbitRadius: 390,
    orbitalPeriodDays: 103774, // 284 years
    rotationPeriodHours: 3.915, // Extremely fast!
    axialTiltDeg: 126.0,
    eccentricity: 0.1912,
    orbitalInclinationDeg: 28.19,
    hasRings: true,
    ringInnerRadius: 2.2,
    ringOuterRadius: 2.8,
    ringColor: '#6f8b9e',
    massKg: '4.006 × 10²¹ kg',
    densityGcm3: 1.88,
    surfaceGravityMs2: 0.40,
    escapeVelocityKms: 0.84,
    meanTempC: -241,
    atmosphereComposition: ['None detected'],
    moonsCount: 2,
    discovery: { year: 2004, discoverer: 'Mike Brown / Ortiz et al.' },
    quickFacts: [
      'Rotates once every 3.9 hours, stretched by centripetal forces into a triaxial ellipsoid (American football shape).',
      'The only trans-Neptunian object known to possess its own ring system (discovered in 2017).',
      'Covered in highly reflective crystalline water ice and a mysterious dark red surface spot.'
    ]
  },
  {
    id: 'makemake',
    name: 'Makemake',
    type: 'dwarf-planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Makemake',
    tagline: 'Brilliant frozen world of the classical Kuiper Belt',
    color: '#cb7d55',
    radiusKm: 715,
    explorerRadius: 1.7,
    semiMajorAxisAU: 45.79,
    explorerOrbitRadius: 415,
    orbitalPeriodDays: 112897, // 309 years
    rotationPeriodHours: 22.83,
    axialTiltDeg: 29.0,
    eccentricity: 0.1558,
    orbitalInclinationDeg: 28.96,
    massKg: '3.1 × 10²¹ kg',
    densityGcm3: 1.7,
    surfaceGravityMs2: 0.5,
    escapeVelocityKms: 0.8,
    meanTempC: -243,
    atmosphereComposition: ['Transient nitrogen & methane near perihelion'],
    moonsCount: 1,
    discovery: { year: 2005, discoverer: 'Mike Brown, Chad Trujillo, David Rabinowitz' },
    quickFacts: [
      'Second brightest Kuiper Belt object seen from Earth after Pluto.',
      'Surface is coated in frozen methane, ethane, and tholins giving it a distinct reddish-brown tone.',
      'Named after Makemake, the creator god of humanity in Rapa Nui (Easter Island) mythology.'
    ]
  },
  {
    id: 'eris',
    name: 'Eris',
    type: 'dwarf-planet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Eris_(dwarf_planet)',
    tagline: 'Massive scattered disc world whose discovery prompted the redefinition of planet',
    color: '#e0dedb',
    radiusKm: 1163,
    explorerRadius: 2.1,
    semiMajorAxisAU: 67.78,
    explorerOrbitRadius: 450,
    orbitalPeriodDays: 203830, // 558 years
    rotationPeriodHours: 25.9,
    axialTiltDeg: 44.0,
    eccentricity: 0.4407,
    orbitalInclinationDeg: 44.04,
    massKg: '1.66 × 10²² kg (27% more massive than Pluto)',
    densityGcm3: 2.52,
    surfaceGravityMs2: 0.82,
    escapeVelocityKms: 1.38,
    meanTempC: -243,
    atmosphereComposition: ['Frozen methane/nitrogen ice coating'],
    moonsCount: 1,
    discovery: { year: 2005, discoverer: 'Mike Brown, Chad Trujillo, David Rabinowitz' },
    quickFacts: [
      '27% more massive than Pluto; its discovery directly prompted the IAU to create the official definition of a planet in 2006.',
      'One of the most reflective bodies in the Solar System, reflecting 96% of incoming sunlight (albedo 0.96).',
      'Orbits on a steep 44° inclination, traveling out to nearly 100 AU at its farthest distance from the Sun.'
    ]
  }
];

export const SMALL_BODIES_DATA: CelestialBodyData[] = [
  {
    id: 'halley',
    name: 'Halley\'s Comet (1P/Halley)',
    type: 'comet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Halley%27s_Comet',
    tagline: 'The most famous periodic comet, returning every 75–76 years',
    color: '#8de8fe',
    radiusKm: 5.5,
    explorerRadius: 1.5,
    semiMajorAxisAU: 17.83,
    explorerOrbitRadius: 250,
    orbitalPeriodDays: 27500, // 75.3 years
    rotationPeriodHours: 52.8,
    axialTiltDeg: 18.0,
    eccentricity: 0.967,
    orbitalInclinationDeg: 162.26, // Retrograde!
    massKg: '2.2 × 10¹⁴ kg',
    densityGcm3: 0.6,
    surfaceGravityMs2: 0.002,
    escapeVelocityKms: 0.003,
    meanTempC: -100,
    atmosphereComposition: ['Water vapor coma', 'Carbon monoxide', 'Methane', 'Cyanogen'],
    moonsCount: 0,
    discovery: { year: 1705, discoverer: 'Edmond Halley (predicted periodicity)' },
    quickFacts: [
      'The only known short-period comet clearly visible to the naked eye that can appear twice in a single human lifetime.',
      'Responsible for two annual meteor showers on Earth: the Eta Aquariids in May and the Orionids in October.',
      'Giotto spacecraft in 1986 revealed its nucleus to be an ultra-dark peanut of dirty ice and organic dust reflecting only 4% of light.'
    ]
  },
  {
    id: 'neowise',
    name: 'Comet NEOWISE (C/2020 F3)',
    type: 'comet',
    parentBodyId: 'sun',
    wikipediaTitle: 'Comet_NEOWISE',
    tagline: 'The brilliant naked-eye comet of 2020 with spectacular twin tails',
    color: '#a3f3ff',
    radiusKm: 2.5,
    explorerRadius: 1.3,
    semiMajorAxisAU: 360,
    explorerOrbitRadius: 380,
    orbitalPeriodDays: 2470000, // ~6,766 years
    rotationPeriodHours: 7.58,
    axialTiltDeg: 20.0,
    eccentricity: 0.9992,
    orbitalInclinationDeg: 128.94,
    massKg: '1.2 × 10¹³ kg',
    densityGcm3: 0.5,
    surfaceGravityMs2: 0.001,
    escapeVelocityKms: 0.002,
    meanTempC: -120,
    atmosphereComposition: ['Water vapor', 'Carbon monoxide', 'Sodium vapor tail'],
    moonsCount: 0,
    discovery: { year: 2020, discoverer: 'NEOWISE Space Telescope' },
    quickFacts: [
      'Delighted stargazers worldwide in July 2020 as the brightest comet visible from the Northern Hemisphere since Hale-Bopp in 1997.',
      'Developed a bright split tail: a glowing white-golden dust tail and a vibrant blue ion tail spanning millions of kilometers.',
      'Its next return to the inner Solar System will not occur until around the year 8786 AD.'
    ]
  },
  {
    id: 'oumuamua',
    name: '1I/\'Oumuamua',
    type: 'asteroid',
    parentBodyId: 'sun',
    wikipediaTitle: '%27Oumuamua',
    tagline: 'The first interstellar visitor ever discovered passing through our Solar System',
    color: '#b0654b',
    radiusKm: 0.2, // ~400 x 40 meters
    explorerRadius: 1.2,
    semiMajorAxisAU: 1.27,
    explorerOrbitRadius: 125,
    orbitalPeriodDays: 999999, // Hyperbolic trajectory
    rotationPeriodHours: 8.1,
    axialTiltDeg: 35.0,
    eccentricity: 1.20, // Hyperbolic unbound!
    orbitalInclinationDeg: 122.68,
    massKg: '~4 × 10⁷ kg',
    densityGcm3: 2.0,
    surfaceGravityMs2: 0.0001,
    escapeVelocityKms: 0.0002,
    meanTempC: -150,
    atmosphereComposition: ['No detectable coma or outgassing'],
    moonsCount: 0,
    discovery: { year: 2017, discoverer: 'Robert Weryk (Pan-STARRS 1)' },
    quickFacts: [
      'The very first interstellar object confirmed to enter our Solar System from deep interstellar space.',
      'Exhibited an astonishing cigar or pancake shape with an aspect ratio of 10:1—unlike any native asteroid.',
      'Demonstrated non-gravitational acceleration as it left the Sun, fueling scientific debate about outgassing vs solar radiation pressure.'
    ]
  },
  {
    id: 'vesta',
    name: '4 Vesta',
    type: 'asteroid',
    parentBodyId: 'sun',
    wikipediaTitle: '4_Vesta',
    tagline: 'The second-most massive asteroid with a colossal south pole mountain',
    color: '#9c9288',
    radiusKm: 262.7,
    explorerRadius: 1.5,
    semiMajorAxisAU: 2.362,
    explorerOrbitRadius: 135,
    orbitalPeriodDays: 1325.7, // 3.63 years
    rotationPeriodHours: 5.342,
    axialTiltDeg: 29.0,
    eccentricity: 0.0887,
    orbitalInclinationDeg: 7.14,
    massKg: '2.59 × 10²⁰ kg (9% of asteroid belt)',
    densityGcm3: 3.46,
    surfaceGravityMs2: 0.25,
    escapeVelocityKms: 0.36,
    meanTempC: -88,
    atmosphereComposition: ['None'],
    moonsCount: 0,
    discovery: { year: 1807, discoverer: 'Heinrich Wilhelm Olbers' },
    quickFacts: [
      'The brightest asteroid visible from Earth, occasionally visible to the unaided naked eye in dark skies.',
      'Home to Rheasilvia peak at its south pole: a 22 km (14 mi) mountain rising higher than Olympus Mons relative to its terrain.',
      'A differentiated rocky protoplanet with a metallic iron-nickel core and basaltic crust—source of HED meteorites found on Earth.'
    ]
  }
];

export const ALL_CELESTIAL_BODIES: CelestialBodyData[] = [
  SUN_DATA,
  ...PLANETS_DATA,
  ...DWARF_PLANETS_DATA,
  ...SMALL_BODIES_DATA
];

export const METEOR_SHOWERS_INFO = [
  {
    name: 'Perseids',
    peakDate: 'August 12–13',
    hourlyRate: '100 meteors/hr',
    parentBody: 'Comet 109P/Swift-Tuttle',
    speedKms: 59,
    description: 'Renowned for fast, bright meteors that frequently leave persistent glowing ionized trains across the summer sky.'
  },
  {
    name: 'Geminids',
    peakDate: 'December 13–14',
    hourlyRate: '120–150 meteors/hr',
    parentBody: 'Asteroid 3200 Phaethon',
    speedKms: 35,
    description: 'One of the most prolific and dependable annual showers, producing multicolored, intensely glowing fireballs.'
  },
  {
    name: 'Leonids',
    peakDate: 'November 17–18',
    hourlyRate: '15–20 meteors/hr (historically thousands)',
    parentBody: 'Comet 55P/Tempel-Tuttle',
    speedKms: 71,
    description: 'The fastest meteors of any major shower, famous for historic meteor storms occurring roughly every 33 years.'
  },
  {
    name: 'Quadrantids',
    peakDate: 'January 3–4',
    hourlyRate: '80–120 meteors/hr',
    parentBody: 'Asteroid 2003 EH1',
    speedKms: 41,
    description: 'Known for a razor-sharp peak lasting only a few hours, producing bright fireballs in freezing northern nights.'
  }
];

export const METEOR_PHYSICS_EXPLANATION = {
  meteoroid: 'A chunk of rock, metal, or ice traveling through space, ranging in size from tiny dust grains up to 1 meter wide.',
  meteor: 'The streak of light ("shooting star") produced when a meteoroid enters Earth\'s atmosphere at 11 to 72 km/s and vaporizes due to ram-pressure heating and air compression.',
  meteorite: 'A fragment of a meteoroid or asteroid that survives atmospheric entry and impacts Earth\'s surface.'
};
