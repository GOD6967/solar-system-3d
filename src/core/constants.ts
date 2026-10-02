/**
 * Sun point-light intensity (candela) per scale mode.
 * The light uses decay = 1, so illuminance at distance d is intensity / d.
 * True-scale distances are 2x larger, so intensity is doubled to keep Earth equally lit.
 */
export const SUN_INTENSITY_EXPLORER = 330;
export const SUN_INTENSITY_TRUE = 660;

export const AU_TRUE_SCALE_UNITS = 180;

/** Mutable runtime state shared by body meshes and the app (current sun light intensity). */
export const SunLightState = {
  intensity: SUN_INTENSITY_EXPLORER
};
