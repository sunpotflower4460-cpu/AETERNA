import { PHI, SCHUMANN_RES } from '../constants/aeternaConstants.js';

export class PhysicalDisk {
    constructor() {
        this.omega_t = 8.33; this.omega_p = 0.0; this.R = PHI; this.r_disk = 1.0;
        this.theta_t = 0.0; this.theta_p = 0.0; this.ratioRr = PHI; this.phaseRatio = 0.0;
        this.isErgodic = false; this.torusFormed = false; this.schumannLock = false;
    }
    update(dt) {
        this.theta_t += this.omega_t * dt * Math.PI * 2; this.theta_p += this.omega_p * dt * Math.PI * 2;
        this.ratioRr = this.R / this.r_disk;
        this.torusFormed = (this.omega_t > 0.01) && (this.omega_p > 0.01);
        this.phaseRatio = this.torusFormed ? this.omega_p / this.omega_t : 0;
        this.isErgodic = this.torusFormed && this._irrationalScore(this.phaseRatio) > 0.7;
        this.schumannLock = Math.abs(this.omega_t - SCHUMANN_RES) < 0.5;
    }
    _irrationalScore(x) {
        if (x <= 0) return 0; let a = x, score = 0;
        for (let i = 0; i < 10; i++) {
            const frac = a - Math.floor(a); if (frac < 1e-6) { score = i/10; break; }
            score += Math.min(Math.floor(1.0/frac), 10)/100; a = 1.0/frac;
        }
        return Math.min(score, 1.0);
    }
    getInjectionIdx(segments) {
        if (!this.torusFormed) return -1;
        const i = Math.floor(((this.theta_t % (Math.PI*2))/(Math.PI*2))*segments);
        const j = Math.floor(((this.theta_p % (Math.PI*2))/(Math.PI*2))*segments);
        return i * segments + j;
    }
    getConsciousnessPrerequisites() {
        return { A: this.isErgodic, B: Math.abs(this.ratioRr - PHI) < 0.05, C: false, D: false };
    }
}
