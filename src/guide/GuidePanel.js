import { state } from '../state.js';
import { TENSION_90S_FRAMES } from '../constants/aeternaConstants.js';

export class GuidePanel {
    constructor(network) {
        this.network = network; this.history = []; this.lastEventTime = { whiteEngine: 0, heartbeat: 0, tension: 0, eye: 0, sigma: 0 };
        this.whiteFrameCount = 0; this.lastHeartbeatPulse = 0;
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
}
