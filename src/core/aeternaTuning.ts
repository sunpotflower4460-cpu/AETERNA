export const TOUCH_TAP_MAX_FRAMES = 8;
export const TOUCH_HOLD_MIN_FRAMES = 20;
export const TOUCH_LOW_VELOCITY = 0.005;
export const TOUCH_STROKE_MIN_DIST = 0.05;
export const TOUCH_REPEAT_MIN_COUNT = 2;
export const TOUCH_REPEAT_GAP_THRESHOLD = 12;
export const TOUCH_REPEAT_RESET_FRAMES = 60;

export const REWRITE_TYPES = ['novelty', 'recurrence', 'persistence', 'directionality'] as const;
export const REWRITE_PATTERN_SOURCES = {
  novelty: 'tap',
  recurrence: 'repeat',
  persistence: 'hold',
  directionality: 'stroke',
} as const;
export const REWRITE_PRIOR_DECAY = 0.9994;
export const REWRITE_PRESSURE_DECAY = 0.965;
export const REWRITE_PLASTICITY_DECAY = 0.987;
export const REWRITE_LOAD_DECAY = 0.94;
export const REWRITE_PRIOR_LIMIT = 0.35;
export const REWRITE_CHANNEL_LIMIT = 0.28;
export const REWRITE_PRESSURE_LIMIT = 1.0;
export const REWRITE_PLASTICITY_LIMIT = 1.0;
export const REWRITE_COOLDOWN_FRAMES = 28;
export const REWRITE_MAX_GLOBAL_LOAD = 0.3;
export const REWRITE_MAX_EVENTS = 8;
export const REWRITE_TOUCH_GATE = 0.18;
export const REWRITE_SEED_GATE = 0.18;
export const REWRITE_TENSION_GATE = 0.08;
export const REWRITE_TRIGGER_SCORE = 0.14;
export const REWRITE_TRIGGER_PRESSURE = 0.03;
export const REWRITE_TRIGGER_PLASTICITY = 0.02;
export const REWRITE_DIRECTION_MIN_STRENGTH = 0.01;
export const REWRITE_WEIGHT_MIN = 0.25;
export const REWRITE_WEIGHT_MAX = 4.0;
export const REWRITE_PATTERN_BASE = 0.6;
export const REWRITE_PATTERN_SCALE = 0.4;
export const REWRITE_SEED_BASE = 0.55;
export const REWRITE_SEED_SCALE = 0.45;
export const REWRITE_TENSION_BASE = 0.6;
export const REWRITE_TENSION_SCALE = 0.4;
export const REWRITE_PRESSURE_GAIN = 0.18;
export const REWRITE_LOAD_DAMPING_FACTOR = 0.5;
export const REWRITE_PLASTICITY_GAIN = 0.10;
export const REWRITE_DIRECTION_NEIGHBOR_FALLOFF = 0.45;
export const REWRITE_DIRECTION_COUNTER_DAMP = 0.35;
export const REWRITE_DIRECTION_VERTICAL_STRENGTH = 0.55;
export const REWRITE_DIRECTION_VERTICAL_COUNTER_DAMP = 0.18;
export const REWRITE_NOVELTY_PREDICTION_FACTOR = 0.2;
export const REWRITE_RECURRENCE_TRACE_FACTOR = 0.25;
export const REWRITE_RECURRENCE_PROJECTION_DAMPING = 0.4;
export const REWRITE_PERSISTENCE_RESIDUE_FACTOR = 0.12;
export const REWRITE_DIRECTIONALITY_WEIGHT_FACTOR = 0.9;
export const REWRITE_POST_PRESSURE_FACTOR = 0.4;
export const REWRITE_POST_PLASTICITY_FACTOR = 0.5;
export const REWRITE_GLOBAL_LOAD_FACTOR = 1.8;

export const MODE_TRANSITION_COOLDOWN = 180;
export const MODE_HYSTERESIS = 0.06;
export const MODE_WAKE_THRESHOLD = 0.34;
export const MODE_SLEEP_THRESHOLD = 0.4;
export const MODE_DREAM_THRESHOLD = 0.42;
export const MODE_DRIVE_SMOOTHING = 0.08;
export const MODE_DREAM_REPLAY_LIMIT = 0.028;
export const MODE_DREAM_REPLAY_NODE_LIMIT = 6;
export const MODE_DREAM_REPLAY_GATE = 0.16;
export const MODE_EXTERNAL_QUIET_GATE = 0.035;
export const MODE_TRACE_HISTORY_LIMIT = 6;
export const MODE_QUIET_TIME_FRAMES = 240;
export const MODE_AROUSAL_NORM = 16;
export const MODE_PREDICTION_NORM = 3.5;
export const MODE_SIGMA_DRIFT_NORM = 4.0;
export const MODE_RESIDUE_NORM = 1.2;
export const MODE_TRACE_NORM = 0.45;
export const MODE_PRIOR_NORM = 8.0;
export const MODE_REWRITE_PRESSURE_NORM = 12.0;
export const MODE_RECENT_REWRITE_NORM = 0.2;
export const TOUCH_PROJ_BASE_GAIN = 0.08;
export const ORGANISM_HISTORY_LIMIT = 8;
export const ORGANISM_UPDATE_SMOOTHING = 0.08;
export const ACTION_PULSE_SMOOTHING = 0.18;
export const ACTION_PULSE_LIMIT = 0.22;
export const MODE_DYNAMICS = {
  sleep: {
    baselineGain: 0.88,
    touchSensitivity: 0.82,
    touchProjectionGain: 0.82,
    rewriteGain: 0.84,
    residueDecayOffset: -0.012,
    replayGain: 0.15,
  },
  wake: {
    baselineGain: 1.02,
    touchSensitivity: 1.0,
    touchProjectionGain: 1.04,
    rewriteGain: 1.0,
    residueDecayOffset: 0.0,
    replayGain: 0.25,
  },
  dream: {
    baselineGain: 0.95,
    touchSensitivity: 0.8,
    touchProjectionGain: 0.78,
    rewriteGain: 0.9,
    residueDecayOffset: 0.006,
    replayGain: 1.0,
  },
} as const;
