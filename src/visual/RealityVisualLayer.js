import { state } from '../state.js';

// THREE is loaded as a CDN global — no import needed.

export class RealityVisualLayer {
    constructor(scene, network, particleSystem) {
        this.scene = scene; this.network = network; this.particleSystem = particleSystem;
        this.visible = false; this.baseSize = 0.22;
        this.showHubLabels = false;

        this.trailHistory = []; this.trailMaxCount = 120;
        this.trailPositions = new Float32Array(this.trailMaxCount * 3); this.trailColors = new Float32Array(this.trailMaxCount * 3);
        this.trailGeo = new THREE.BufferGeometry();
        this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.trailGeo.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3).setUsage(THREE.DynamicDrawUsage));
        this.trailGeo.setDrawRange(0, 0); 
        this.trailMaterial = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        this.trailPoints = new THREE.Points(this.trailGeo, this.trailMaterial); this.scene.add(this.trailPoints); this.trailPoints.visible = false;

        this.avalancheGeo = new THREE.BufferGeometry(); const maxAvalanche = 5184;
        this.avalanchePositions = new Float32Array(maxAvalanche * 3);
        this.avalancheGeo.setAttribute('position', new THREE.BufferAttribute(this.avalanchePositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.avalancheGeo.setDrawRange(0, 0); 
        this.avalancheMaterial = new THREE.PointsMaterial({ size: 0.4, color: 0xff2200, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
        this.avalanchePoints = new THREE.Points(this.avalancheGeo, this.avalancheMaterial); this.scene.add(this.avalanchePoints); this.avalanchePoints.visible = false;

        // PR7: Stroke path trail — visualises centroid trajectory during stroke gestures.
        this.strokeTrailMaxCount = 40;
        this.strokeTrailPositions = new Float32Array(this.strokeTrailMaxCount * 3);
        this.strokeTrailColors    = new Float32Array(this.strokeTrailMaxCount * 3);
        this.strokeTrailGeo = new THREE.BufferGeometry();
        this.strokeTrailGeo.setAttribute('position', new THREE.BufferAttribute(this.strokeTrailPositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.strokeTrailGeo.setAttribute('color',    new THREE.BufferAttribute(this.strokeTrailColors, 3).setUsage(THREE.DynamicDrawUsage));
        this.strokeTrailGeo.setDrawRange(0, 0);
        this.strokeTrailMaterial = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
        this.strokeTrailPoints = new THREE.Points(this.strokeTrailGeo, this.strokeTrailMaterial);
        this.scene.add(this.strokeTrailPoints); this.strokeTrailPoints.visible = false;

        this.canvas = document.getElementById('yin-yang-canvas'); this.ctx = this.canvas.getContext('2d');
        this.hubLabels = []; this.hubContainer = document.createElement('div');
        this.hubContainer.style.cssText = 'position:absolute; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:5; display:block;'; 
        document.body.appendChild(this.hubContainer);

        this.network.octahedronHubs.forEach(hub => {
            const el = document.createElement('div');
            el.innerText = hub.modality.toUpperCase();
            el.style.cssText = `
                position:absolute;
                color:rgba(255,255,255,0.45);
                font-size:7px;
                font-family:monospace;
                text-shadow:0 0 4px #000,0 0 4px #22d3ee;
                transform:translate(-50%,-50%);
                display:none;
                letter-spacing:0.08em;
            `;
            this.hubContainer.appendChild(el); this.hubLabels.push({ el: el, nodeIndex: hub.nodeIndex });
        });
    }

    toggle() {
        this.visible = !this.visible;
        this.trailPoints.visible = this.visible;

        if (!this.visible) {
            this.avalanchePoints.visible = false;
            this.strokeTrailPoints.visible = false;
            this.hubLabels.forEach(h => h.el.style.display = 'none');
        }

        this.canvas.style.display = this.visible ? 'block' : 'none';

        if (!this.visible) {
            this.particleSystem.material.size = this.baseSize;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    update(dynamicsInfo) {
        if (!this.visible) return;
        this.particleSystem.material.size = this.network.heartbeatActive ? this.baseSize * 1.5 : this.baseSize;
        if (this.network.injectedNodes.length > 0) {
            this.network.injectedNodes.forEach(idx => {
                const idx3 = idx * 3;
                this.trailHistory.push({ pos: new THREE.Vector3(this.network.basePositions[idx3], this.network.basePositions[idx3+1], this.network.basePositions[idx3+2]), type: this.network.nodeType[idx], age: 0 });
            });
        }
        for (let i = this.trailHistory.length - 1; i >= 0; i--) { this.trailHistory[i].age++; if (this.trailHistory[i].age > 60) this.trailHistory.splice(i, 1); }
        if (this.trailHistory.length > this.trailMaxCount) this.trailHistory.splice(0, this.trailHistory.length - this.trailMaxCount);

        const tPos = this.trailGeo.attributes.position.array; const tCol = this.trailGeo.attributes.color.array; let drawCount = 0;
        for (let i = 0; i < this.trailHistory.length; i++) {
            const item = this.trailHistory[i]; if (item.age > 60) continue;
            const idx3 = drawCount * 3; tPos[idx3] = item.pos.x; tPos[idx3+1] = item.pos.y; tPos[idx3+2] = item.pos.z;
            const c = item.type === 1 ? new THREE.Color('#4ecdc4') : new THREE.Color('#ff6b35'); const alpha = Math.max(0, 1.0 - (item.age / 60));
            tCol[idx3] = c.r*alpha; tCol[idx3+1] = c.g*alpha; tCol[idx3+2] = c.b*alpha; drawCount++;
        }
        for (let i = drawCount; i < this.trailMaxCount; i++) { const idx3 = i*3; tPos[idx3]=0;tPos[idx3+1]=0;tPos[idx3+2]=0; tCol[idx3]=0;tCol[idx3+1]=0;tCol[idx3+2]=0; }
        this.trailGeo.setDrawRange(0, drawCount);
        if (drawCount > 0) { this.trailGeo.attributes.position.needsUpdate = true; this.trailGeo.attributes.color.needsUpdate = true; }

        let avCount = 0; const aPos = this.avalancheGeo.attributes.position.array;
        if (dynamicsInfo.sigmaDisplay > 1.05) {
            for (let i = 0; i < this.network.numNodes; i++) {
                if (this.network.currentBuffer[i] > 2.0 && avCount < 5184) {
                    const idx3 = i*3; const aidx3 = avCount*3;
                    aPos[aidx3]=this.network.basePositions[idx3]; aPos[aidx3+1]=this.network.basePositions[idx3+1]; aPos[aidx3+2]=this.network.basePositions[idx3+2]; avCount++;
                }
            }
        }
        this.avalancheGeo.setDrawRange(0, avCount);
        if (avCount > 0) { this.avalancheGeo.attributes.position.needsUpdate = true; this.avalanchePoints.visible = true; } else { this.avalanchePoints.visible = false; }

        // PR7: Render stroke path trail — maps centroid history to torus node positions.
        this.updateStrokeTrail();

        if (state.camera) {
            this.hubLabels.forEach(hub => {
                if (!this.visible || !this.showHubLabels || window.innerWidth < 600) {
                    hub.el.style.display = 'none';
                    return;
                }
                const pos = new THREE.Vector3(
                    this.network.vertexPositions[hub.nodeIndex * 3],
                    this.network.vertexPositions[hub.nodeIndex * 3 + 1],
                    this.network.vertexPositions[hub.nodeIndex * 3 + 2]
                );
                pos.project(state.camera);
                if (pos.z > 1) {
                    hub.el.style.display = 'none';
                } else {
                    hub.el.style.display = 'block';
                    hub.el.style.left = `${(pos.x * 0.5 + 0.5) * window.innerWidth}px`;
                    hub.el.style.top = `${(pos.y * -0.5 + 0.5) * window.innerHeight}px`;
                }
            });
        }
        this.drawYinYangBalance();
    }

    // PR7: Map stroke centroid path to torus node 3D positions and render as a residual trail.
    updateStrokeTrail() {
        const path = this.network.strokePath;
        const S = this.network.segments;
        const sPos = this.strokeTrailGeo.attributes.position.array;
        const sCol = this.strokeTrailGeo.attributes.color.array;
        const count = Math.min(path.length, this.strokeTrailMaxCount);

        for (let k = 0; k < count; k++) {
            const p = path[k];
            const nodeIdx = (Math.floor(p.normX * S) % S) * S + (Math.floor(p.normY * S) % S);
            const idx3 = nodeIdx * 3;
            const k3 = k * 3;
            sPos[k3]   = this.network.vertexPositions[idx3];
            sPos[k3+1] = this.network.vertexPositions[idx3+1];
            sPos[k3+2] = this.network.vertexPositions[idx3+2];
            // Fade from bright cyan at newest to dim purple at oldest
            const t = k / Math.max(count - 1, 1);
            const alpha = 0.3 + t * 0.7;
            sCol[k3]   = 0.4 * alpha;
            sCol[k3+1] = 0.8 * alpha;
            sCol[k3+2] = 1.0 * alpha;
        }
        for (let k = count; k < this.strokeTrailMaxCount; k++) {
            const k3 = k * 3;
            sPos[k3]=0; sPos[k3+1]=0; sPos[k3+2]=0;
            sCol[k3]=0; sCol[k3+1]=0; sCol[k3+2]=0;
        }
        this.strokeTrailGeo.setDrawRange(0, count);
        if (count > 0) {
            this.strokeTrailGeo.attributes.position.needsUpdate = true;
            this.strokeTrailGeo.attributes.color.needsUpdate = true;
            this.strokeTrailPoints.visible = true;
        } else {
            this.strokeTrailPoints.visible = false;
        }
    }

    drawYinYangBalance() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let fireYin=0,cYin=0,fireYang=0,cYang=0;
        for(let i=0; i<this.network.numNodes; i++){ const f = this.network.spikeTrace[i]>0.5; if(this.network.nodeType[i]===1){cYin++; if(f)fireYin++;}else{cYang++; if(f)fireYang++;} }
        const b = (cYin+cYang>0) ? Math.max(-1, Math.min(1, ((cYang>0?fireYang/cYang:0) - (cYin>0?fireYin/cYin:0)) / (((cYang>0?fireYang/cYang:0) + (cYin>0?fireYin/cYin:0))||1))) : 0;
        const cx = this.canvas.width/2, cy = this.canvas.height*0.75, r = 50;
        this.ctx.beginPath(); this.ctx.arc(cx, cy, r, Math.PI, 0); this.ctx.lineWidth=8; this.ctx.strokeStyle='rgba(255,255,255,0.15)'; this.ctx.stroke();
        const a = Math.PI*1.5 + b*(Math.PI/2); this.ctx.beginPath(); this.ctx.moveTo(cx,cy); this.ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)); this.ctx.lineWidth=3; this.ctx.strokeStyle='#22d3ee'; this.ctx.stroke();
        this.ctx.fillStyle='#fff'; this.ctx.font='bold 14px monospace'; this.ctx.textAlign='right'; this.ctx.fillText('陰',cx-r-10,cy+5); this.ctx.textAlign='left'; this.ctx.fillText('陽',cx+r+10,cy+5); this.ctx.textAlign='center'; this.ctx.fillText('E/I',cx,cy-r-10);
        this.ctx.font='10px monospace'; this.ctx.fillStyle='rgba(255,255,255,0.6)'; this.ctx.fillText((b>=0?'YANG ':'YIN ')+(Math.abs(b)*100).toFixed(0)+'%', cx, cy+20);
    }
}
