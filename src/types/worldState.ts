/**
 * World State Types
 *
 * Defines external world state that the organism perceives and interacts with.
 * This includes environmental parameters, sensory inputs, and global time.
 *
 * World state is EXTERNAL to the organism - it represents the environment
 * and input streams that the organism senses.
 */

/**
 * External touch input from world
 */
export interface WorldTouchInput {
  /** Touch ID */
  id: number;
  /** Normalized x position (0-1) */
  x: number;
  /** Normalized y position (0-1) */
  y: number;
  /** Touch pressure (0-1) */
  pressure: number;
}

/**
 * Environmental parameters
 */
export interface WorldEnvironment {
  /** Global simulation time (frames) */
  simTime: number;
  /** Delta time for physics (seconds) */
  dt: number;
  /** Window/viewport width (for coordinate mapping) */
  viewportWidth: number;
  /** Window/viewport height (for coordinate mapping) */
  viewportHeight: number;
}

/**
 * World state aggregates all external inputs and environment
 */
export interface WorldState {
  /** Environment parameters */
  environment: WorldEnvironment;
  /** Active touch inputs */
  activeTouches: Map<number, WorldTouchInput>;
  /** Sound level from microphone (0-1) */
  soundLevel?: number;
  /** Light level from camera (0-1) */
  lightLevel?: number;
  /** Motion from accelerometer (0-1) */
  motionLevel?: number;
  /** Time phase (for circadian-like cycles) */
  timePhase?: number;
}

/**
 * Create initial world state
 */
export function createInitialWorldState(): WorldState {
  return {
    environment: {
      simTime: 0,
      dt: 1 / 60,
      viewportWidth: 1920,
      viewportHeight: 1080,
    },
    activeTouches: new Map(),
    soundLevel: 0,
    lightLevel: 0.5,
    motionLevel: 0,
    timePhase: 0,
  };
}
