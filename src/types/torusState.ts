export interface TorusStatePacket {
  timestamp: number;
  arousal: number;
  sigma: number;
  phi_proxy: number;
  cluster_ratio: number;
  tension: number;
  touch_active: boolean;
  touch_location: [number, number] | null;
  engine_state: 'WHITE' | 'BLACK' | 'NEUTRAL';
  touch_pattern?: 'tap' | 'repeat' | 'hold' | 'stroke' | null;
  touch_pattern_scores?: { tap: number; repeat: number; hold: number; stroke: number };
  mode_state?: 'sleep' | 'wake' | 'dream';
  wake_drive?: number;
  sleep_pressure?: number;
  dream_pressure?: number;
  energy?: number;
  stability?: number;
  overload?: number;
  action_state?: 'idle' | 'orient' | 'withdraw' | 'settle';
  orienting_drive?: number;
  rest_drive?: number;
}

export interface SignalFeedback {
  inject_region?: { i: number; j: number; strength: number };
  modulate_damping?: number;
  highlight_hubs?: string[];
}

export interface AeternaNetworkLike {
  numNodes: number;
}
