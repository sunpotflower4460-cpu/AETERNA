import { state } from '../organism/state.js';
import { TENSION_90S_FRAMES } from '../constants/aeternaConstants.js';

export class GuidePanel {
    constructor(network) {
        this.network = network; this.history = []; this.lastEventTime = { whiteEngine: 0, heartbeat: 0, tension: 0, eye: 0, sigma: 0 };
        this.whiteFrameCount = 0; this.lastHeartbeatPulse = 0;
        this.lastRewriteEventId = 0;
        this.lastModeState = null;
        this.lastActionState = null;
        this.historyEl = document.getElementById('guide-history'); this.latestEl = document.getElementById('guide-latest'); this.providerEl = document.getElementById('guide-provider');
        this.apiProvider = 'none'; this.apiKey = '';
    }
    updateConfig(provider, key) { this.apiProvider = provider; this.apiKey = key; if(this.providerEl) this.providerEl.innerText = `PROVIDER: ${provider.toUpperCase()}`; }
    update(dynamicsInfo, engineState) {
        const simTime = this.network.simTime; const COOLDOWN = 300; let ev = null;
        if (engineState === 'WHITE') { this.whiteFrameCount++; if (this.whiteFrameCount >= 3 && (simTime - this.lastEventTime.whiteEngine > COOLDOWN)) { ev = { type: 'white', text: "統合傾向が上昇。局所誤差が全体秩序へ吸収されています。" }; this.lastEventTime.whiteEngine = simTime; } } else { this.whiteFrameCount = 0; }
        if (this.network.heartbeatActive) this.lastHeartbeatPulse = simTime;
        if (this.lastHeartbeatPulse && (simTime - this.lastHeartbeatPulse <= 60) && dynamicsInfo.sigmaDisplay > 1.02 && (simTime - this.lastEventTime.heartbeat > COOLDOWN)) { ev = { type: 'heartbeat', text: "同期パルスがアバランシュを誘発。臨界伝播が発生しています。" }; this.lastEventTime.heartbeat = simTime; }
        if (state.tensionDuration >= TENSION_90S_FRAMES && state.tensionLoad > 0.3 && (simTime - this.lastEventTime.tension > COOLDOWN)) { ev = { type: 'tension', text: "内部緊張が相転移点に到達。抑圧された予測誤差を解放します。" }; this.lastEventTime.tension = simTime; }
        
        let eyeActive = false;
        for(let i=0; i<this.network.numNodes; i++) {
            if(this.network.isEyeNode[i] === 1 && this.network.predictionHistory[i] > this.network.AUTO_ERROR_THRESHOLD) { eyeActive = true; break; }
        }
        if (eyeActive && (simTime - this.lastEventTime.eye > COOLDOWN)) { ev = { type: 'eye', text: "自己観測ハブが活性化。内部状態の再帰参照が増加しています。" }; this.lastEventTime.eye = simTime; }
        
        if ((dynamicsInfo.sigmaDisplay < 0.95 || dynamicsInfo.sigmaDisplay > 1.05) && (simTime - this.lastEventTime.sigma > COOLDOWN)) { ev = { type: 'sigma', text: "臨界範囲を外れました。ホメオスタシスが修正を開始します。" }; this.lastEventTime.sigma = simTime; }
        if (ev) this.handleEvent(ev, dynamicsInfo, engineState);

        const rewriteEvent = dynamicsInfo.lastRewriteEvent;
        if (rewriteEvent && rewriteEvent.id !== this.lastRewriteEventId) {
            this.lastRewriteEventId = rewriteEvent.id;
            this.addLog(
                `rewrite=${rewriteEvent.rewriteType} node=${rewriteEvent.node} Δ=${rewriteEvent.deltaMagnitude.toFixed(4)} load=${(dynamicsInfo.globalRewriteLoad || 0).toFixed(2)}`,
                'REWRITE',
            );
        }

        if (dynamicsInfo.modeState && dynamicsInfo.modeState !== this.lastModeState) {
            this.lastModeState = dynamicsInfo.modeState;
            this.addLog(
                `mode=${dynamicsInfo.modeState} wake=${(dynamicsInfo.wakeDrive || 0).toFixed(2)} sleep=${(dynamicsInfo.sleepPressure || 0).toFixed(2)} dream=${(dynamicsInfo.dreamPressure || 0).toFixed(2)} replay=${dynamicsInfo.dreamReplayActive ? 'on' : 'off'}`,
                'MODE',
            );
        }
        if (dynamicsInfo.actionState && dynamicsInfo.actionState !== this.lastActionState) {
            this.lastActionState = dynamicsInfo.actionState;
            this.addLog(
                `action=${dynamicsInfo.actionState} pulse=${(dynamicsInfo.actionPulseLevel || 0).toFixed(2)} energy=${(dynamicsInfo.energy || 0).toFixed(2)} stability=${(dynamicsInfo.stability || 0).toFixed(2)} overload=${(dynamicsInfo.overload || 0).toFixed(2)}`,
                'ORGANISM',
            );
        }
    }
    async handleEvent(event, dynamicsInfo, engineState) {
        const baseText = `[σ=${dynamicsInfo.sigmaDisplay.toFixed(2)}] ${event.text}`;
        this.addLog(baseText, 'LOCAL');
        if (this.apiProvider !== 'none' && this.apiKey) {
            const prompt = `System state: Sigma=${dynamicsInfo.sigmaDisplay.toFixed(3)}, Phi Proxy=${dynamicsInfo.phiApprox.toFixed(4)}, Engine=${engineState}. Event: ${baseText}. Rephrase naturally in Japanese as an observing guide. Limit 60 chars.`;
            try {
                let resText = "";
                if (this.apiProvider.startsWith('gemini')) {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.apiProvider}:generateContent?key=${this.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
                    resText = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text;
                } else if (this.apiProvider === 'openai') {
                    const res = await fetch(`https://api.openai.com/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` }, body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }] }) });
                    resText = (await res.json()).choices?.[0]?.message?.content;
                }
                if (resText) this.addLog(resText.trim().replace(/\n/g, ' '), this.apiProvider.toUpperCase());
            } catch (e) { console.error(e); }
        }
    }
    addLog(text, source) {
        const item = `<span class="text-white/40">[${source}]</span> <span class="text-white/80">${text}</span>`;
        this.history.unshift(item); if (this.history.length > 5) this.history.pop();
        if(this.latestEl) { this.latestEl.innerHTML = item; this.latestEl.classList.remove('fade-in'); void this.latestEl.offsetWidth; this.latestEl.classList.add('fade-in'); }
        if(this.historyEl) { this.historyEl.innerHTML = this.history.slice(1).map(t => `<li>${t}</li>`).join(''); }
    }
    updateFromBridge(bridgeResult, packet) {
        const decision = bridgeResult?.decision;
        const utterance = bridgeResult?.utterance;
        if (!decision) return;
        const stance = decision.stance ?? '—';
        const intent = decision.replyIntent ?? '—';

        // PR8-B: build touch pattern debug string
        let touchInfo = '';
        if (packet.touch_pattern || packet.touch_pattern_scores) {
            const pat = packet.touch_pattern ?? 'none';
            const sc = packet.touch_pattern_scores;
            const scStr = sc
                ? `tap ${sc.tap.toFixed(2)} / rep ${sc.repeat.toFixed(2)} / hold ${sc.hold.toFixed(2)} / str ${sc.stroke.toFixed(2)}`
                : '';
            const seeds = bridgeResult?.touchSeeds?.protoMeaningSeeds ?? [];
            touchInfo = ` | pattern=${pat}${scStr ? ' [' + scStr + ']' : ''}${seeds.length ? ' seeds=' + seeds.join(',') : ''}`;
        }

        const modeInfo = packet.mode_state
            ? ` mode=${packet.mode_state} wake=${(packet.wake_drive || 0).toFixed(2)} sleep=${(packet.sleep_pressure || 0).toFixed(2)} dream=${(packet.dream_pressure || 0).toFixed(2)}`
            : '';
        const organismInfo = typeof packet.energy === 'number'
            ? ` org[e=${packet.energy.toFixed(2)} s=${(packet.stability || 0).toFixed(2)} o=${(packet.overload || 0).toFixed(2)} a=${packet.action_state || 'idle'}]`
            : '';
        const text = utterance
            ? `[BRIDGE] ${utterance.slice(0, 60)}${modeInfo}${organismInfo}${touchInfo}`
            : `[BRIDGE] stance=${stance} intent=${intent} σ=${packet.sigma.toFixed(2)} eng=${packet.engine_state}${modeInfo}${organismInfo}${touchInfo}`;
        this.addLog(text, 'SIGNAL');
    }
}
