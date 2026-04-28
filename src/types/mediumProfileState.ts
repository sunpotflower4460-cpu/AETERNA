import type { DelayProfileState } from './delayProfileState.ts';
import type { EchoProfileState } from './echoProfileState.ts';
import type { ResistanceProfileState } from './resistanceProfileState.ts';

export interface MediumProfileState {
  timestamp: number;
  delay: DelayProfileState;
  echo: EchoProfileState;
  resistance: ResistanceProfileState;
  profileConfidence: number;
}
