```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AETERNA Phase 9.4 - The Reality Guide (Polished)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <style>
        body {
            margin: 0; overflow: hidden;
            background-color: #010205; color: #ffffff;
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            touch-action: none;
        }
        #canvas-container {
            position: absolute; top: 0; left: 0;
            width: 100vw; height: 100vh; z-index: 1;
        }

        /* ── Intro Guide ── */
        #intro-guide {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);
            padding: 20px; border-radius: 12px; border: 1px solid rgba(34,211,238,0.3);
            text-align: center; font-family: monospace; font-size: 11px; z-index: 100;
            color: rgba(255,255,255,0.9); pointer-events: none;
            transition: opacity 1.5s ease-out;
        }

        /* ── System State Badge ── */
        #system-state-badge {
            display: inline-block; padding: 2px 8px; border-radius: 4px;
            font-size: 9px; font-weight: bold; font-family: monospace;
            margin-left: 12px; vertical-align: middle;
            border: 1px solid currentColor; letter-spacing: 0.1em;
            transition: all 0.3s ease;
        }

        /* ── Tooltips ── */
        .has-tooltip { position: relative; cursor: help; border-bottom: 1px dotted rgba(255,255,255,0.3); }
        .has-tooltip:hover::after {
            content: attr(data-tooltip);
            position: absolute; bottom: 100%; left: 0; transform: translateY(-4px);
            background: rgba(0,0,0,0.9); border: 1px solid rgba(34,211,238,0.4);
            color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 8px;
            white-space: nowrap; z-index: 50; pointer-events: none; font-family: sans-serif;
        }

        /* ── スライダー基本スタイル ── */
        input[type=range] { -webkit-appearance: none; background: transparent; width: 100%; height: 28px; cursor: pointer; margin: 0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 0 10px rgba(255,255,255,0.8); transition: transform 0.1s; margin-top: -8px; }
        input[type=range]::-webkit-slider-thumb:active { transform: scale(1.2); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 3px; background: linear-gradient(to right, rgba(34,211,238,0.8) var(--pct, 0%), rgba(255,255,255,0.1) var(--pct, 0%)); border-radius: 2px; }

        /* ── カスタムスクロールバー ── */
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.4); border-radius: 2px; }

        /* ── アコーディオン ── */
        .accordion-grid { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.25s ease-out, opacity 0.25s ease-out; }
        .accordion-grid.collapsed { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
        .accordion-inner { overflow: hidden; }

        /* ── メトリクスパネル ── */
        #metrics-panel { width: min(55vw, 256px); max-height: calc(100vh - 280px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(34,211,238,0.3) transparent; pointer-events: auto; }

        /* ── σバーグラフ (パフォーマンス最適化版) ── */
        #sigma-bar-track { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 4px; overflow: hidden; position: relative; }
        #sigma-bar-fill { 
            height: 100%; width: 100%; /* 初期幅を100%に */
            background: #22d3ee; 
            border-radius: 2px; 
            transform-origin: left; /* 左端を基準に拡大縮小 */
            transition: transform 0.1s, background-color 0.3s; 
        }
        #sigma-bar-track::after { content: ''; position: absolute; top: 0; left: 50%; width: 1px; height: 100%; background: rgba(255,255,255,0.5); transform: translateX(-50%); }
        .sigma-label-row { display: flex; justify-content: space-between; font-size: 7px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        /* ── プリセットボタン ── */
        .preset-btn { font-size: 9px; font-family: monospace; padding: 6px 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s ease; white-space: nowrap; flex: 1; min-height: 36px; }
        .preset-btn:active { transform: scale(0.95); }
        .preset-btn.active { background: rgba(34,211,238,0.15); border-color: rgba(34,211,238,0.5); color: #22d3ee; box-shadow: 0 0 8px rgba(34,211,238,0.2); }

        /* ── アクションボタン ── */
        .action-btn { min-height: 40px; display: flex; align-items: center; justify-content: center; }

        /* ── Glassmorphism 共通 ── */
        .glass-panel { background: rgba(5, 10, 15, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }

        /* ── セーフエリア対応 ── */
        .pt-safe { padding-top: max(12px, env(safe-area-inset-top, 12px)); }
        .pl-safe { padding-left: max(12px, env(safe-area-inset-left, 12px)); }
        .pr-safe { padding-right: max(12px, env(safe-area-inset-right, 12px)); }
        .pb-safe { padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)); }

        /* ── Phase 9: Guide Panel & Visuals ── */
        #guide-panel { position: absolute; right: max(12px, env(safe-area-inset-right, 12px)); top: 50%; transform: translateY(-50%); width: 280px; pointer-events: auto; background: rgba(0, 0, 0, 0.85); z-index: 20; display: none; }
        @media (min-width: 768px) { #guide-panel { display: flex; } }
        #yin-yang-canvas { position: absolute; left: max(12px, env(safe-area-inset-left, 12px)); bottom: max(12px, env(safe-area-inset-bottom, 12px)); width: 120px; height: 60px; pointer-events: none; z-index: 10; display: none; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .visual-btn.active { background: rgba(34, 211, 238, 0.2); border-color: rgba(34, 211, 238, 0.5); color: #22d3ee; }
    </style>
</head>
<body>
    <div id="canvas-container"></div>
    
    <div id="intro-guide">
        <p class="mb-2 text-cyan-300 font-bold tracking-widest">AETERNA OBSERVER</p>
        <ul class="text-left space-y-1 text-[10px] text-white/80">
            <li>• Try: [シュマン] preset → [VISUAL ON]</li>
            <li>• Touch: 画面タップで予測誤差を注入</li>
            <li>• View: 2本指でズームイン/アウト</li>
            <li>• σ≈1.0 でシステムは臨界状態に接近します</li>
        </ul>
    </div>

    <canvas id="yin-yang-canvas" width="240" height="120"></canvas>

    <div id="guide-panel" class="glass-panel p-4 rounded-xl font-mono text-[9px] text-white/80 shadow-2xl flex-col gap-3">
        <div class="text-cyan-400 font-bold border-b border-white/10 pb-1.5 flex justify-between items-center">
            <span class="tracking-widest">REALITY GUIDE</span>
            <span id="guide-provider" class="text-[7px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded">PROVIDER: NONE</span>
        </div>
        <div id="guide-latest" class="text-[11px] text-white font-bold leading-relaxed min-h-[48px] text-cyan-50">
            Observer is online. Reading whole-vs-parts integration proxy...
        </div>
        <ul id="guide-history" class="space-y-1.5 text-[8px] text-white/40 list-none"></ul>
    </div>
    
    <div id="ui-layer" class="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between overflow-hidden">
        <div class="flex justify-between items-start w-full pt-safe pl-safe pr-safe pointer-events-none">
            <div class="pointer-events-auto flex items-center">
                <div>
                    <h1 class="text-lg sm:text-xl font-bold tracking-[0.3em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] leading-tight">AETERNA</h1>
                    <h2 class="text-[8px] font-mono mt-0.5 text-cyan-400 tracking-[0.2em] opacity-80">PHASE 9.4 : POLISHED</h2>
                </div>
                <span id="system-state-badge" class="text-white/50 border-white/50">QUIET</span>
            </div>
            
            <div id="metrics-panel" class="glass-panel p-1 rounded-xl font-mono text-[8.5px] text-white/70 shadow-2xl custom-scrollbar mt-1">
              <div class="p-2 pb-1">
                  <!-- 物理層 -->
                  <div class="mb-2">
                      <div class="flex justify-between items-center cursor-pointer text-cyan-400 font-bold mb-1 border-b border-white/10 pb-0.5 hover:text-cyan-300" onclick="toggleAccordion('sec-physical', 'icon-physical')">
                          <span class="tracking-wider">PHYSICAL DISK</span>
                          <svg id="icon-physical" class="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      <div id="sec-physical" class="accordion-grid">
                          <div class="accordion-inner space-y-0.5 pt-0.5">
                              <div class="flex justify-between" id="row-omega-t"><span>ω_t (toroidal Hz)</span><span id="val-omega-t" class="text-white">0.00</span></div>
                              <div class="flex justify-between" id="row-omega-p"><span>ω_p (poloidal Hz)</span><span id="val-omega-p" class="text-white">0.00</span></div>
                              <div class="flex justify-between" id="row-ratio"><span>R/r</span><span id="val-ratio" class="text-white">0.000</span></div>
                              <div class="flex justify-between" id="row-phase-ratio"><span>ω_p/ω_t</span><span id="val-phase-ratio" class="text-white">0.000</span></div>
                              <div class="flex justify-between has-tooltip" data-tooltip="軌道がトーラス表面を稠密に埋め尽くす性質" id="row-ergodic"><span>Ergodic</span><span id="val-ergodic" class="text-white">NO</span></div>
                              <div class="flex justify-between" id="row-schumann"><span>Schumann lock</span><span id="val-schumann" class="text-white">NO</span></div>
                          </div>
                      </div>
                  </div>
                  <!-- 幾何層 -->
                  <div class="mb-2">
                      <div class="flex justify-between items-center cursor-pointer text-cyan-400 font-bold mb-1 border-b border-white/10 pb-0.5 hover:text-cyan-300" onclick="toggleAccordion('sec-geometry', 'icon-geometry')">
                          <span class="tracking-wider">TORUS GEOMETRY</span>
                          <svg id="icon-geometry" class="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      <div id="sec-geometry" class="accordion-grid">
                          <div class="accordion-inner space-y-0.5 pt-0.5">
                              <div class="flex justify-between" id="row-torus-formed"><span>Torus formed</span><span id="val-torus-formed" class="text-white">NO</span></div>
                              <div class="flex justify-between has-tooltip" data-tooltip="周波数比の無理数近似度（無理数ほど複雑な軌道）" id="row-irrational"><span>Irrationality</span><span id="val-irrational" class="text-white">0.000</span></div>
                          </div>
                      </div>
                  </div>
                  <!-- ネットワーク層 -->
                  <div class="mb-2">
                      <div class="flex justify-between items-center cursor-pointer text-cyan-400 font-bold mb-1 border-b border-white/10 pb-0.5 hover:text-cyan-300" onclick="toggleAccordion('sec-network', 'icon-network')">
                          <span class="tracking-wider">NETWORK STATE</span>
                          <svg id="icon-network" class="w-3 h-3 transform transition-transform collapsed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      <div id="sec-network" class="accordion-grid collapsed">
                          <div class="accordion-inner space-y-0.5 pt-0.5">
                              <div class="flex justify-between" id="row-firing"><span>Firing rate</span><span id="val-firing" class="text-white">0.0%</span></div>
                              <div class="flex justify-between has-tooltip" data-tooltip="トーラス面上の最大連続活動領域の割合" id="row-cluster"><span>Largest cluster</span><span id="val-cluster" class="text-white">0.0%</span></div>
                              <div class="flex justify-between has-tooltip" data-tooltip="Whole-vs-parts activity integration proxy" id="row-phi"><span>Φ* proxy</span><span id="val-phi" class="text-white">0.0000</span></div>
                              <div class="flex justify-between has-tooltip" data-tooltip="局所結合を含む位相整合の近似指標" id="row-coherence"><span>Phase coherence</span><span id="val-coherence" class="text-white">0.000</span></div>
                              <div class="flex justify-between" id="row-attractor-id"><span>Attractor ID</span><span id="val-attractor-id" class="text-white">NONE</span></div>
                              <div class="flex justify-between" id="row-attractor-sim"><span>Attractor sim</span><span id="val-attractor-sim" class="text-white">0.000</span></div>
                              <div class="flex justify-between" id="row-arousal"><span>Arousal</span><span id="val-arousal" class="text-white">0.000</span></div>
                          </div>
                      </div>
                  </div>
                  <!-- 天然メカニズム層 -->
                  <div class="mb-2">
                      <div class="flex justify-between items-center cursor-pointer text-cyan-400 font-bold mb-1 border-b border-white/10 pb-0.5 hover:text-cyan-300" onclick="toggleAccordion('sec-nature', 'icon-nature')">
                          <span class="tracking-wider">NATURAL MECHANISMS</span>
                          <svg id="icon-nature" class="w-3 h-3 transform transition-transform collapsed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      <div id="sec-nature" class="accordion-grid collapsed">
                          <div class="accordion-inner space-y-0.5 pt-0.5 pb-1">
                              <div class="flex justify-between transition-colors duration-300 has-tooltip" data-tooltip="Smoothed firing propagation proxy. Near 1 suggests critical-like cascade." id="row-branching"><span>σ cascade</span><span id="val-branching" class="text-white font-bold">1.000</span></div>
                              <div id="sigma-bar-track"><div id="sigma-bar-fill"></div></div>
                              <div class="sigma-label-row"><span>0 (沈黙)</span><span>1 (臨界)</span><span>2+ (過興奮)</span></div>
                              <div class="flex justify-between mt-1.5" id="row-homeo"><span>Homeo error</span><span id="val-homeo" class="text-white">0.000</span></div>
                              <div class="flex justify-between has-tooltip" data-tooltip="予測誤差の抑圧蓄積量" id="row-tension"><span>Internal tension</span><span id="val-tension" class="text-white">0.000</span></div>
                              <div class="flex justify-between" id="row-touch"><span>Touch count</span><span id="val-touch" class="text-white">0</span></div>
                          </div>
                      </div>
                  </div>
                  <!-- 前提条件 -->
                  <div>
                      <div class="flex justify-between items-center cursor-pointer text-cyan-400 font-bold mb-1 border-b border-white/10 pb-0.5 hover:text-cyan-300" onclick="toggleAccordion('sec-prereq', 'icon-prereq')">
                          <span class="tracking-wider">PREREQUISITES</span>
                          <svg id="icon-prereq" class="w-3 h-3 transform transition-transform collapsed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      <div id="sec-prereq" class="accordion-grid collapsed">
                          <div class="accordion-inner space-y-0.5 pt-0.5">
                              <div class="flex justify-between" id="row-pre-a"><span>A: Ergodic orbit</span><span id="val-pre-a" class="text-white">–</span></div>
                              <div class="flex justify-between" id="row-pre-b"><span>B: R/r ≈ φ</span><span id="val-pre-b" class="text-white">–</span></div>
                              <div class="flex justify-between" id="row-pre-c"><span>C: Φ* proxy > 0.002</span><span id="val-pre-c" class="text-white">–</span></div>
                              <div class="flex justify-between" id="row-pre-d"><span>D: Cluster > 5%</span><span id="val-pre-d" class="text-white">–</span></div>
                              <div class="flex justify-between" id="row-pre-e"><span>E: White Engine</span><span id="val-pre-e" class="text-white">–</span></div>
                              <div class="flex justify-between font-bold mt-1 text-cyan-300" id="row-total"><span>TOTAL</span><span id="val-total">0/5</span></div>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
        </div>

        <!-- 下部: コントロールパネル -->
        <div id="control-panel" class="w-full max-w-md mx-auto glass-panel rounded-t-2xl rounded-b-none border-b-0 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col pb-safe">
          <div class="flex justify-between items-center px-5 py-2.5 cursor-pointer bg-white/5 hover:bg-white/10 transition-colors border-b border-white/5" onclick="toggleAccordion('control-body', 'icon-control')">
              <span class="text-[10px] font-bold text-cyan-300 tracking-[0.2em] font-mono">CONTROL PANEL</span>
              <svg id="icon-control" class="w-4 h-4 text-cyan-300 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          <div id="control-body" class="accordion-grid">
              <div class="accordion-inner p-4 pt-3 pb-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <div class="flex gap-2 justify-between mb-3">
                    <button id="preset-schumann" class="preset-btn" onclick="applyPreset('schumann')">🌍 シュマン</button>
                    <button id="preset-golden"   class="preset-btn" onclick="applyPreset('golden')">φ 黄金比</button>
                    <button id="preset-gamma"    class="preset-btn" onclick="applyPreset('gamma')">⚡ ガンマ</button>
                  </div>
                  <div class="mb-1.5">
                    <div class="flex justify-between text-[10px] font-mono text-white/60 mb-0.5 px-1"><span>ω_t (トロイダル)</span><span id="slider-val-omega-t" class="font-bold text-white">8.33</span></div>
                    <input type="range" id="slider-omega-t" min="1.0" max="20.0" step="0.01" value="8.33">
                  </div>
                  <div class="mb-1.5">
                    <div class="flex justify-between text-[10px] font-mono text-white/60 mb-0.5 px-1"><span>ω_p (ポロイダル)</span><span id="slider-val-omega-p" class="font-bold text-white">0.00</span></div>
                    <input type="range" id="slider-omega-p" min="0.0" max="5.0" step="0.01" value="0.0">
                  </div>
                  <div class="mb-3">
                    <div class="flex justify-between text-[10px] font-mono text-white/60 mb-0.5 px-1"><span>r (断面半径)</span><span id="slider-val-r" class="font-bold text-white">1.00</span></div>
                    <input type="range" id="slider-r" min="0.5" max="3.0" step="0.01" value="1.0">
                  </div>
                  <div class="flex gap-2 mb-3">
                    <button class="action-btn flex-1 bg-red-500/10 active:scale-95 border border-red-500/20 rounded-xl text-[10px] font-mono text-red-300 tracking-wider transition-all" onclick="injectMassiveError()">⚡ INJECT ERROR</button>
                    <button class="action-btn flex-1 bg-white/5 active:scale-95 border border-white/10 rounded-xl text-[10px] font-mono text-white/80 tracking-wider transition-all" onclick="resetTouchMemory()">🗑 CLEAR TOUCH</button>
                  </div>
                  
                  <div class="border-t border-white/10 pt-3">
                      <div class="flex justify-between items-center text-[10px] font-mono mb-2">
                          <span class="text-white/60">VISUAL LAYER (GLASS)</span>
                          <button id="btn-visual-layer" class="visual-btn px-4 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors tracking-wider" onclick="toggleVisualLayer()">OFF</button>
                      </div>
                      
                      <div class="flex justify-between items-center text-[10px] font-mono mb-2 mt-2">
                          <span class="text-white/60">DEBUG LABELS (DEV)</span>
                          <button id="btn-debug-labels" class="visual-btn px-4 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors tracking-wider" onclick="toggleDebugLabels()">OFF</button>
                      </div>

                      <div class="flex flex-col gap-1.5 text-[10px] font-mono mt-3">
                          <span class="text-white/60 has-tooltip" data-tooltip="Note: 本番運用時はバックエンドプロキシ経由を推奨します">GUIDE API CONFIG</span>
                          <div class="flex gap-1">
                              <select id="api-provider" class="bg-black/50 border border-white/10 rounded px-1 flex-1 text-white/80 outline-none">
                                  <option value="none">NONE</option>
                                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (推奨)</option>
                                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                  <option value="openai">OpenAI GPT-4o</option>
                              </select>
                              <input type="password" id="api-key" placeholder="API KEY" class="bg-black/50 border border-white/10 rounded px-2 w-[40%] text-white/80 outline-none">
                              <button class="bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 rounded px-2 hover:bg-cyan-500/30 transition-colors" onclick="testAPIConnection()">TEST</button>
                          </div>
                          <div id="api-status" class="text-[8px] text-white/40 h-3 text-right pr-1">Not connected</div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
    </div>

    <script>
        // ── Constants & Globals ────────────────────────────────
        // Added explicit global declarations to ensure Strict Mode compliance and clean architecture
        let scene, camera, renderer, particleSystem, network, touchMem;
        let realityVisualLayer, guidePanel;
        let raycaster, mouse;

        let tensionLoad = 0; 
        let tensionDuration = 0;
        let lastHeartbeatTime = 0; 
        let lastPhiApprox = 0; 
        let lastClusterTrend = 0; 
        let lastSigma = 1.0;
        let mouseX = 0, mouseY = 0; 

        const PRESETS = {
            schumann: { omega_t: 7.83,  omega_p: 1.21,  r: 1.0   },
            golden:   { omega_t: 8.33,  omega_p: 5.15,  r: 1.0   },
            gamma:    { omega_t: 16.18, omega_p: 2.5,   r: 1.618 },
        };
        const PHI = 1.6180339887; 
        const PHI_INV = 1.0 / PHI;
        const SCHUMANN_RES = 7.83; 
        const GAMMA_SYNC = 40.0;
        const HEART_CLOCK_HZ = 0.1; 
        const PULSE_STRENGTH = 0.25;
        const TENSION_LAMBDA = 0.077 / 60; 
        const TENSION_90S_FRAMES = 90 * 60; 

        // ── DOM Cache & Utilities ────────────────────────────────
        const UI = {};
        function initDOMCache() {
            const ids = [
                'val-omega-t', 'val-omega-p', 'val-ratio', 'val-phase-ratio', 'val-ergodic', 'val-schumann',
                'row-omega-t', 'row-omega-p', 'row-ratio', 'row-phase-ratio', 'row-ergodic', 'row-schumann',
                'val-torus-formed', 'val-irrational', 'row-torus-formed', 'row-irrational',
                'val-firing', 'val-cluster', 'val-phi', 'val-coherence', 'val-attractor-id', 'val-attractor-sim', 'val-arousal',
                'row-firing', 'row-cluster', 'row-phi', 'row-coherence', 'row-attractor-id', 'row-attractor-sim', 'row-arousal',
                'val-branching', 'row-branching', 'sigma-bar-fill', 'val-homeo', 'row-homeo', 'val-tension', 'row-tension', 'val-touch', 'row-touch',
                'val-pre-a', 'row-pre-a', 'val-pre-b', 'row-pre-b', 'val-pre-c', 'row-pre-c', 'val-pre-d', 'row-pre-d', 'val-pre-e', 'row-pre-e', 'val-total', 'row-total',
                'system-state-badge', 'intro-guide'
            ];
            ids.forEach(id => { UI[id] = document.getElementById(id); });
        }

        function updateUIRow(rowEl, valEl, value, isMet) {
            if(!rowEl || !valEl) return;
            valEl.innerText = value;
            if (isMet) { rowEl.classList.remove('text-white/70'); rowEl.classList.add('text-cyan-300'); }
            else       { rowEl.classList.remove('text-cyan-300'); rowEl.classList.add('text-white/70'); }
        }

        function toggleAccordion(contentId, iconId) {
            const content = document.getElementById(contentId);
            const icon = document.getElementById(iconId);
            if (content && icon) {
                if (content.classList.contains('collapsed')) {
                    content.classList.remove('collapsed');
                    icon.style.transform = 'rotate(0deg)';
                    icon.classList.remove('collapsed-icon');
                } else {
                    content.classList.add('collapsed');
                    icon.style.transform = 'rotate(-180deg)';
                    icon.classList.add('collapsed-icon');
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initDOMCache();
            ['icon-network', 'icon-nature', 'icon-prereq'].forEach(id => {
                const icon = document.getElementById(id);
                if(icon) icon.style.transform = 'rotate(-180deg)';
            });
            setTimeout(() => { if(UI['intro-guide']) UI['intro-guide'].style.opacity = '0'; }, 5000);
        });

        // ── Global Function Restorations ────────────────────────────────
        function applyPreset(name) {
            const p = PRESETS[name];
            if (!p) return;
            disk.omega_t = p.omega_t;
            disk.omega_p = p.omega_p;
            disk.r_disk  = p.r;
            
            const sliderT = document.getElementById('slider-omega-t');
            const sliderP = document.getElementById('slider-omega-p');
            const sliderR = document.getElementById('slider-r');
            if(sliderT) { sliderT.value = p.omega_t; updateSliderTrack(sliderT, 1.0, 20.0); document.getElementById('slider-val-omega-t').innerText = p.omega_t.toFixed(2); }
            if(sliderP) { sliderP.value = p.omega_p; updateSliderTrack(sliderP, 0.0, 5.0); document.getElementById('slider-val-omega-p').innerText = p.omega_p.toFixed(2); }
            if(sliderR) { 
                sliderR.value = p.r; 
                updateSliderTrack(sliderR, 0.5, 3.0); 
                document.getElementById('slider-val-r').innerText = p.r.toFixed(2); 
                if (network) network.updateRadius(p.r);
            }
            
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(`preset-${name}`)?.classList.add('active');
        }

        function updateSliderTrack(sliderEl, min, max) {
            if(!sliderEl) return;
            const pct = ((parseFloat(sliderEl.value) - min) / (max - min)) * 100;
            sliderEl.style.setProperty('--pct', `${pct}%`);
        }

        function resetTouchMemory() {
            if (typeof touchMem !== 'undefined' && touchMem) {
                touchMem.traceMap.fill(0);
                touchMem.touchCount = 0;
                touchMem.lastTouchNode = -1;
                touchMem.lastTouchTime = -Infinity;
            }
        }

        window.injectMassiveError = function() {
            if (!network) return;
            const randomIdx = Math.floor(Math.random() * network.numNodes);
            network.injectPredictionError(randomIdx);
        };

        window.testAPIConnection = async function() {
            const provider = document.getElementById('api-provider')?.value;
            const key = document.getElementById('api-key')?.value;
            const statusEl = document.getElementById('api-status');
            
            if (!provider || !statusEl) return;
            if (provider === 'none') {
                statusEl.innerText = "Please select a provider.";
                if(guidePanel) guidePanel.updateConfig(provider, "");
                return;
            }
            if (!key) {
                statusEl.innerText = "Please enter API Key.";
                return;
            }
            statusEl.innerText = "Testing connection...";
            if(guidePanel) guidePanel.updateConfig(provider, key);
            
            try {
                if (provider.startsWith('gemini')) {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider}:generateContent?key=${key}`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply 'OK' if you receive this." }] }] })
                    });
                    if (res.ok) statusEl.innerText = `Connected: ${provider}`;
                    else statusEl.innerText = "Error: Invalid Key or Quota";
                } else if (provider === 'openai') {
                    const url = `https://api.openai.com/v1/chat/completions`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "Reply 'OK'" }] })
                    });
                    if (res.ok) statusEl.innerText = "Connected: OpenAI API";
                    else statusEl.innerText = "Error: Invalid Key or Quota";
                }
            } catch(e) {
                statusEl.innerText = "Connection Failed.";
                console.error(e);
            }
        };

        // ── Input Handling & Visual Layer Toggle ──────────────────
        let pinchStartDist = 0; let cameraZBase = 14; let activeTouches = new Map();
        let isDragging = false; let touchStartX = 0; let touchStartY = 0;

        function handlePointerDown(event) {
            // UI elements touch prevention (Robust check)
            if (event.target.closest('#ui-layer') || 
                event.target.closest('#guide-panel') || 
                event.target.closest('#intro-guide') || 
                event.target.closest('.glass-panel') || 
                event.target.tagName === 'INPUT') return;
            
            activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (activeTouches.size === 1) {
                isDragging = false; touchStartX = event.clientX; touchStartY = event.clientY;
            } else if (activeTouches.size === 2) {
                const touches = Array.from(activeTouches.values());
                const dx = touches[0].x - touches[1].x; const dy = touches[0].y - touches[1].y;
                pinchStartDist = Math.sqrt(dx*dx + dy*dy); cameraZBase = camera.position.z;
            }
        }

        function handlePointerMove(event) {
            if (!activeTouches.has(event.pointerId)) {
                if (event.pointerType !== 'touch') {
                    mouseX = (event.clientX - window.innerWidth/2) * 0.003;
                    mouseY = (event.clientY - window.innerHeight/2) * 0.003;
                }
                return;
            }
            activeTouches.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (activeTouches.size === 1) {
                const dx = event.clientX - touchStartX; const dy = event.clientY - touchStartY;
                if (Math.sqrt(dx*dx + dy*dy) > 5) isDragging = true;
                mouseX = (event.clientX - window.innerWidth/2) * 0.003;
                mouseY = (event.clientY - window.innerHeight/2) * 0.003;
            } else if (activeTouches.size === 2) {
                const touches = Array.from(activeTouches.values());
                const dx = touches[0].x - touches[1].x; const dy = touches[0].y - touches[1].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (pinchStartDist > 0) { camera.position.z = Math.max(5, Math.min(25, cameraZBase * (pinchStartDist/dist))); }
            }
        }

        function handlePointerUp(event) {
            if (activeTouches.size === 1 && !isDragging && event.target.tagName === 'CANVAS') {
                const normX = event.clientX / window.innerWidth; const normY = event.clientY / window.innerHeight;
                if(touchMem && network) touchMem.recordTouch(normX, normY, network.simTime, network);
                if(raycaster && mouse && camera && particleSystem) {
                    mouse.x = normX * 2 - 1; mouse.y = -(normY) * 2 + 1;
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObject(particleSystem);
                    if (intersects.length > 0 && network) network.injectPredictionError(intersects[0].index);
                }
            }
            activeTouches.delete(event.pointerId);
            if (activeTouches.size < 2) pinchStartDist = 0;
        }

        function toggleVisualLayer() {
            if(realityVisualLayer) {
                realityVisualLayer.toggle();
                const btn = document.getElementById('btn-visual-layer');
                if(realityVisualLayer.visible) { btn.innerText = 'ON'; btn.classList.add('active'); }
                else { btn.innerText = 'OFF'; btn.classList.remove('active'); }
            }
        }

        function toggleDebugLabels() {
            if (!realityVisualLayer) return;
            realityVisualLayer.showHubLabels = !realityVisualLayer.showHubLabels;

            const btn = document.getElementById('btn-debug-labels');
            if (!btn) return;

            if (realityVisualLayer.showHubLabels) {
                btn.innerText = 'ON';
                btn.classList.add('active');
            } else {
                btn.innerText = 'OFF';
                btn.classList.remove('active');
                realityVisualLayer.hubLabels.forEach(h => h.el.style.display = 'none');
            }
        }

        // ── Core Classes ─────────────────────────
        class PhysicalDisk {
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
        const disk = new PhysicalDisk();

        class TouchMemory {
            constructor(segments) {
                this.segments = segments; this.traceMap = new Float32Array(segments * segments);
                this.lastTouchTime = -Infinity; this.lastTouchNode = -1; this.touchCount = 0;
            }
            recordTouch(normX, normY, simTime, network) {
                const idx = (Math.floor(normX * this.segments)%this.segments)*this.segments + (Math.floor(normY * this.segments)%this.segments);
                network.currentBuffer[idx] += 1.5;
                const dt = simTime - this.lastTouchTime;
                if (this.lastTouchNode >= 0 && dt > 0 && dt < 100) network.injectSTDPExternal(this.lastTouchNode, idx, dt);
                this.traceMap[idx] = Math.min(this.traceMap[idx] + 1.0, 10.0);
                this.lastTouchTime = simTime; this.lastTouchNode = idx; this.touchCount++;
            }
            decay() { for (let i = 0; i < this.traceMap.length; i++) if (this.traceMap[i] > 0) this.traceMap[i] = Math.max(0, this.traceMap[i] - 0.0008); }
        }

        class AeternaNetwork {
            constructor(segments = 72) {
                this.segments = segments; this.numNodes = segments * segments;
                this.R = PHI; this.r = 1.0;
                this.basePositions = new Float32Array(this.numNodes * 3);
                this.vertexPositions = new Float32Array(this.numNodes * 3);
                this.normals = new Float32Array(this.numNodes * 3);
                this.colors = new Float32Array(this.numNodes * 3);
                this.prevBuffer = new Float32Array(this.numNodes);
                this.currentBuffer = new Float32Array(this.numNodes);
                this.nextBuffer = new Float32Array(this.numNodes);
                this.nodeType = new Uint8Array(this.numNodes);
                this.nodeSign = new Float32Array(this.numNodes);
                this.spikeTrace = new Float32Array(this.numNodes);
                this.w_up = new Float32Array(this.numNodes).fill(1.0); this.w_down = new Float32Array(this.numNodes).fill(1.0);
                this.w_left = new Float32Array(this.numNodes).fill(1.0); this.w_right = new Float32Array(this.numNodes).fill(1.0);
                this.lastSpikeTime = new Float32Array(this.numNodes).fill(-9999);
                this.simTime = 0; this.currGenFiring = 0; this.prevGenFiring = 0;
                this.branchingRatioRaw = 1.0; this.sigmaDisplay = 1.0; 
                this.TARGET_FIRING_RATE = 0.08; this.firingRateError = 0.0;
                this.nodePhase = new Float32Array(this.numNodes); this.phaseSpeed = 0.02;
                this.attractorLibrary = []; this.currentAttractorId = -1; this.currentAttractorSim = 0;
                this.largestClusterNodes = new Uint8Array(this.numNodes);
                this.isEyeNode = new Uint8Array(this.numNodes); this.nodeLayer = new Uint8Array(this.numNodes);
                this.predictionHistory = new Float32Array(this.numNodes);
                this.AUTO_ERROR_THRESHOLD = 2.0; 
                this.octahedronHubs = []; this.injectedNodes = []; this.heartbeatActive = false;
                
                this.cachedMaxClusterSize = 0; this.cachedPhiApprox = 0; this.cachedPhaseCoherence = 0;

                this.generate();
            }

            generate() {
                let index = 0; const S = this.segments;
                for (let i = 0; i < S; i++) {
                    for (let j = 0; j < S; j++) {
                        const u = (i / S) * Math.PI * 2; const v = (j / S) * Math.PI * 2;
                        const x = (this.R + this.r * Math.cos(v)) * Math.cos(u);
                        const y = (this.R + this.r * Math.cos(v)) * Math.sin(u);
                        const z = this.r * Math.sin(v);
                        const idx3 = index * 3;
                        this.basePositions[idx3] = x; this.basePositions[idx3+1] = y; this.basePositions[idx3+2] = z;
                        this.vertexPositions[idx3] = x; this.vertexPositions[idx3+1] = y; this.vertexPositions[idx3+2] = z;
                        this.normals[idx3] = Math.cos(v)*Math.cos(u); this.normals[idx3+1] = Math.cos(v)*Math.sin(u); this.normals[idx3+2] = Math.sin(v);
                        
                        if (Math.sin(u + v) > 0) { this.nodeType[index] = 0; this.nodeSign[index] = 1.0; } 
                        else { this.nodeType[index] = 1; this.nodeSign[index] = -1.2; } 

                        this.nodeLayer[index] = (Math.abs(Math.cos(v)) > 0.7) ? 1 : 0;

                        if ((i===Math.floor(S*0.25) && j===Math.floor(S*0.75)) || (i===Math.floor(S*0.75) && j===Math.floor(S*0.25))) {
                            this.nodeType[index] = 2; this.nodeSign[index] = 0.0; this.isEyeNode[index] = 1;
                        }
                        this.nodePhase[index] = (i / S) * Math.PI * 2;
                        index++;
                    }
                }
                const hubDefs = [
                    { i: 0, j: 0, modality: 'visual-relay' }, { i: Math.floor(S/2), j: 0, modality: 'auditory-relay' },
                    { i: 0, j: Math.floor(S/4), modality: 'semantic-hub' }, { i: 0, j: Math.floor(3*S/4), modality: 'motor-hub' },
                    { i: Math.floor(S/4), j: Math.floor(S/2), modality: 'interoceptive' }, { i: Math.floor(3*S/4), j:Math.floor(S/2), modality: 'contextual' }
                ];
                hubDefs.forEach(hub => {
                    const idx = hub.i * S + hub.j; hub.nodeIndex = idx;
                    this.nodeType[idx] = 3; this.nodeSign[idx] = 1.5; this.isEyeNode[idx] = 1; this.octahedronHubs.push(hub);
                    for(let di=-3; di<=3; di++){ for(let dj=-3; dj<=3; dj++){
                        const nidx = ((hub.i+di+S)%S)*S + ((hub.j+dj+S)%S);
                        this.w_up[nidx]=Math.min(this.w_up[nidx]*1.15, 2.5); this.w_down[nidx]=Math.min(this.w_down[nidx]*1.15, 2.5);
                        this.w_left[nidx]=Math.min(this.w_left[nidx]*1.15, 2.5); this.w_right[nidx]=Math.min(this.w_right[nidx]*1.15, 2.5);
                    }}
                });
            }

            updateRadius(newR) {
                this.r = newR;
                let index = 0;
                const S = this.segments;
                for (let i = 0; i < S; i++) {
                    for (let j = 0; j < S; j++) {
                        const u = (i / S) * Math.PI * 2;
                        const v = (j / S) * Math.PI * 2;
                        const x = (this.R + newR * Math.cos(v)) * Math.cos(u);
                        const y = (this.R + newR * Math.cos(v)) * Math.sin(u);
                        const z = newR * Math.sin(v);
                        const idx3 = index * 3;
                        this.basePositions[idx3] = x;
                        this.basePositions[idx3+1] = y;
                        this.basePositions[idx3+2] = z;
                        this.normals[idx3] = Math.cos(v)*Math.cos(u);
                        this.normals[idx3+1] = Math.cos(v)*Math.sin(u);
                        this.normals[idx3+2] = Math.sin(v);
                        index++;
                    }
                }
            }

            isHubNode(index) {
                for (let k = 0; k < this.octahedronHubs.length; k++) {
                    if (this.octahedronHubs[k].nodeIndex === index) return true;
                }
                return false;
            }
            
            computeIntegrationProxy() {
                const N = this.numNodes;
                let tAll = 0, tYin = 0, cYin = 0, tYang = 0, cYang = 0;
                let tL0 = 0, cL0 = 0, tL1 = 0, cL1 = 0;
                let tHalf1 = 0, tHalf2 = 0;

                for (let i = 0; i < N; i++) {
                    const f = this.spikeTrace[i]; tAll += f;
                    if(this.nodeType[i]===1){ tYin+=f; cYin++; } else { tYang+=f; cYang++; }
                    if(this.nodeLayer[i]===0){ tL0+=f; cL0++; } else { tL1+=f; cL1++; }
                    if(i < N/2) tHalf1+=f; else tHalf2+=f;
                }
                const H_whole = tAll / N;
                const H_parts = ( (tYin/cYin + tYang/cYang)/2 + (tL0/cL0 + tL1/cL1)/2 + (tHalf1/(N/2) + tHalf2/(N/2))/2 ) / 3;
                return Math.max(0, H_whole - H_parts); 
            }

            computePhaseCoherence() {
                let rCos = 0, rSin = 0;
                for (let i = 0; i < this.numNodes; i++) {
                    const wPhase = (this.nodeLayer[i] === 1) ? this.nodePhase[i] : this.nodePhase[i] * 0.5;
                    const wLocal = this.w_up[i] + this.w_down[i] + this.w_left[i] + this.w_right[i];
                    const amp = Math.max(0.1, Math.min(wLocal, 1.0));
                    rCos += amp * Math.cos(wPhase);
                    rSin += amp * Math.sin(wPhase);
                }
                return Math.sqrt(rCos * rCos + rSin * rSin) / this.numNodes;
            }

            computeMeanPredictionError() {
                let sum = 0;
                for (let i = 0; i < this.numNodes; i++) sum += this.predictionHistory[i];
                return sum / this.numNodes;
            }

            computeLargestCluster() {
                const S = this.segments; const N = this.numNodes;
                const parent = new Int32Array(N); const rank = new Uint8Array(N);
                for (let i = 0; i < N; i++) parent[i] = i;
                const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
                const union = (a, b) => { const ra = find(a), rb = find(b); if (ra === rb) return; if (rank[ra] < rank[rb]) parent[ra] = rb; else if (rank[ra] > rank[rb]) parent[rb] = ra; else { parent[rb] = ra; rank[ra]++; } };
                for (let i = 0; i < S; i++) { for (let j = 0; j < S; j++) {
                    const idx = i*S+j; if (this.spikeTrace[idx] <= 0.5) continue;
                    const right = i*S+((j+1)%S); const down = ((i+1)%S)*S+j;
                    if (this.spikeTrace[right] > 0.5) union(idx, right);
                    if (this.spikeTrace[down] > 0.5) union(idx, down);
                }}
                const sizeMap = new Map(); let maxRoot = -1; let maxSize = 0;
                for (let i = 0; i < N; i++) {
                    if (this.spikeTrace[i] <= 0.5) continue;
                    const root = find(i); const size = (sizeMap.get(root) || 0) + 1; sizeMap.set(root, size);
                    if (size > maxSize) { maxSize = size; maxRoot = root; }
                }
                this.largestClusterNodes.fill(0);
                if (maxRoot !== -1) {
                    for (let i = 0; i < N; i++) if (this.spikeTrace[i] > 0.5 && find(i) === maxRoot) this.largestClusterNodes[i] = 1;
                }
                return maxSize;
            }

            injectSTDPExternal(fromNode, toNode, deltaT) {
                const A_PLUS = 0.08; const TAU = 30.0; const dw = A_PLUS * Math.exp(-deltaT / TAU);
                const S = this.segments; const fi = Math.floor(fromNode / S), fj = fromNode % S; const ti = Math.floor(toNode / S), tj = toNode % S;
                let di = ti - fi; if (di < -S/2) di += S; else if (di > S/2) di -= S;
                let dj = tj - fj; if (dj < -S/2) dj += S; else if (dj > S/2) dj -= S;
                if (Math.abs(di) >= Math.abs(dj)) { if (di > 0) this.w_down[fromNode] = Math.min(this.w_down[fromNode] + dw, 4.0); else this.w_up[fromNode] = Math.min(this.w_up[fromNode] + dw, 4.0); } 
                else { if (dj > 0) this.w_right[fromNode] = Math.min(this.w_right[fromNode] + dw, 4.0); else this.w_left[fromNode] = Math.min(this.w_left[fromNode] + dw, 4.0); }
            }

            injectPredictionError(index) {
                const targetVal = 10.0; const error = targetVal - this.currentBuffer[index];
                this.currentBuffer[index] += error * 0.8;
                const i = Math.floor(index / this.segments); const j = index % this.segments;
                const up = ((i-1+this.segments)%this.segments)*this.segments+j; const down = ((i+1)%this.segments)*this.segments+j;
                const left = i*this.segments+((j-1+this.segments)%this.segments); const right = i*this.segments+((j+1)%this.segments);
                this.currentBuffer[up]+=error*0.4; this.currentBuffer[down]+=error*0.4; this.currentBuffer[left]+=error*0.4; this.currentBuffer[right]+=error*0.4;
                this.injectedNodes.push(index);
            }
            
            autoPredictAndError() {
                if (this.simTime % 60 !== 0) return;
                let maxError = 0; let maxErrorNode = -1;
                for (let i = 0; i < this.numNodes; i++) {
                    const error = Math.abs(this.currentBuffer[i] - this.prevBuffer[i]) * 2.0;
                    this.predictionHistory[i] = this.predictionHistory[i] * 0.95 + error * 0.05;
                    if (error > maxError) { maxError = error; maxErrorNode = i; }
                    
                    const hubBoostThreshold = this.isHubNode(i) ? this.AUTO_ERROR_THRESHOLD * 0.75 : this.AUTO_ERROR_THRESHOLD;
                    if ((this.isEyeNode[i] === 1 || this.isHubNode(i)) && this.predictionHistory[i] > hubBoostThreshold) {
                        this.injectPredictionError(i);
                    }
                }
                if (maxErrorNode >= 0 && maxError > 2.0) this.injectPredictionError(maxErrorNode);
            }

            triggerNoise(tension, sigmaDisp) {
                const thermalRate = disk.omega_t > 30 ? 0.02 : 0.05;
                const eventRate = (tension * 0.2) + (Math.abs(sigmaDisp - 1.0) * 0.1);
                const finalRate = thermalRate + eventRate;
                for (let i = 0; i < 3; i++) {
                    if (Math.random() < finalRate) { this.currentBuffer[Math.floor(Math.random() * this.numNodes)] += 1.0 + Math.random(); }
                }
            }

            updateDynamics(diskNodeIdx) {
                this.injectedNodes = []; this.simTime++;
                const freqRatio = (disk.omega_t - SCHUMANN_RES) / (GAMMA_SYNC - SCHUMANN_RES);
                const waveSpeed = 0.1 + 0.15 * freqRatio; const damping = 0.985 - (1.0 - PHI_INV) * 0.02 * (1.0 - freqRatio);
                
                let newlyFiredCount = 0;
                for (let i = 0; i < this.numNodes; i++) {
                    if (this.currentBuffer[i] > 0.8 && this.prevBuffer[i] <= 0.8) { 
                        this.spikeTrace[i] = 1.0; 
                        this.lastSpikeTime[i] = this.simTime; 
                        newlyFiredCount++;
                    } else { 
                        this.spikeTrace[i] *= 0.9; 
                    }
                }

                for (let i = 0; i < this.numNodes; i++) {
                    this.w_up[i] *= 0.99995; this.w_down[i] *= 0.99995; this.w_left[i] *= 0.99995; this.w_right[i] *= 0.99995;
                    const sum = this.w_up[i]+this.w_down[i]+this.w_left[i]+this.w_right[i];
                    if (sum > 0.001) { const f = 4.0/sum; const a = 0.01; this.w_up[i]+=(this.w_up[i]*f-this.w_up[i])*a; this.w_down[i]+=(this.w_down[i]*f-this.w_down[i])*a; this.w_left[i]+=(this.w_left[i]*f-this.w_left[i])*a; this.w_right[i]+=(this.w_right[i]*f-this.w_right[i])*a; }
                }

                this.prevGenFiring = this.currGenFiring;
                this.currGenFiring = newlyFiredCount;
                
                this.branchingRatioRaw = this.prevGenFiring > 0 ? this.currGenFiring / this.prevGenFiring : 1.0;
                this.sigmaDisplay = this.sigmaDisplay * 0.9 + this.branchingRatioRaw * 0.1; 
                
                const arousal = this.currGenFiring / this.numNodes;
                this.firingRateError = this.TARGET_FIRING_RATE - arousal;

                const homeoDamping = damping + this.firingRateError * 0.002;
                for (let i = 0; i < this.segments; i++) { 
                    for (let j = 0; j < this.segments; j++) {
                        const idx = i*this.segments+j; 
                        const up = ((i-1+this.segments)%this.segments)*this.segments+j; 
                        const down = ((i+1)%this.segments)*this.segments+j; 
                        const left = i*this.segments+((j-1+this.segments)%this.segments); 
                        const right = i*this.segments+((j+1)%this.segments);
                        
                        // Expanded for readability and debuggability
                        let laplacian = 
                            (this.w_down[up] * this.currentBuffer[up] * this.nodeSign[up]) +
                            (this.w_up[down] * this.currentBuffer[down] * this.nodeSign[down]) +
                            (this.w_right[left] * this.currentBuffer[left] * this.nodeSign[left]) +
                            (this.w_left[right] * this.currentBuffer[right] * this.nodeSign[right]) -
                            ((this.w_up[idx] + this.w_down[idx] + this.w_left[idx] + this.w_right[idx]) * this.currentBuffer[idx]);
                            
                        let nextVal = 2*this.currentBuffer[idx]-this.prevBuffer[idx]+waveSpeed*laplacian;
                        nextVal *= homeoDamping;
                        if (nextVal > 8.0) nextVal = 8.0+(nextVal-8.0)*0.01; if (nextVal < -8.0) nextVal = -8.0+(nextVal+8.0)*0.01;
                        this.nextBuffer[idx] = nextVal;
                    }
                }
                
                let temp = this.prevBuffer; this.prevBuffer = this.currentBuffer; this.currentBuffer = this.nextBuffer; this.nextBuffer = temp;
                
                this.phaseSpeed = 0.015 + 0.025 * freqRatio;
                for (let i = 0; i < this.numNodes; i++) { this.nodePhase[i] = (this.nodePhase[i] + this.phaseSpeed) % (Math.PI*2); }

                if (this.simTime % 4 === 0) {
                    this.cachedMaxClusterSize = this.computeLargestCluster();
                    this.cachedPhiApprox = this.computeIntegrationProxy();
                    this.cachedPhaseCoherence = this.computePhaseCoherence();
                }

                for (let i = 0; i < this.numNodes; i++) {
                    const val = this.currentBuffer[i]; const trace = this.spikeTrace[i]; const idx3 = i*3; let r=0,g=0,b=0;
                    if (i === diskNodeIdx) { r = 1.0; }
                    else {
                        if (this.nodeType[i] === 1) { r = 0.3+trace*1.5; b = 0.1+trace*0.2; } 
                        else {
                            if (val > 0) { r = val*0.3+trace; g = 0.1+val*0.7+trace; b = 0.4+val*0.8+trace; }
                            else { r = -val*0.4+trace; g = trace*0.5; b = 0.3-val*0.7+trace; }
                        }
                        if (this.largestClusterNodes[i] === 1) b += 0.5;
                    }
                    this.colors[idx3] = Math.min(Math.max(r,0),1.0); this.colors[idx3+1] = Math.min(Math.max(g,0),1.0); this.colors[idx3+2] = Math.min(Math.max(b,0),1.0);
                    const d = val*0.04+trace*0.06;
                    this.vertexPositions[idx3] = this.basePositions[idx3]+this.normals[idx3]*d; this.vertexPositions[idx3+1] = this.basePositions[idx3+1]+this.normals[idx3+1]*d; this.vertexPositions[idx3+2] = this.basePositions[idx3+2]+this.normals[idx3+2]*d;
                }
                
                this.autoPredictAndError();

                return {
                    ignitionRatio: this.cachedMaxClusterSize / this.numNodes,
                    phiApprox: this.cachedPhiApprox,
                    phaseCoherence: this.cachedPhaseCoherence,
                    meanPredictionError: this.computeMeanPredictionError(),
                    arousal: arousal,
                    sigmaDisplay: this.sigmaDisplay,
                    firingRateError: this.firingRateError
                };
            }
        }

        // ── Visual Layer ────────────────────────────────
        class RealityVisualLayer {
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

                if (camera) {
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
                        pos.project(camera);
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

        // ── GuidePanel ────────────────────────────────
        class GuidePanel {
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
                if (tensionDuration >= TENSION_90S_FRAMES && tensionLoad > 0.3 && (simTime - this.lastEventTime.tension > COOLDOWN)) { ev = { type: 'tension', text: "内部緊張が相転移点に到達。抑圧された予測誤差を解放します。" }; this.lastEventTime.tension = simTime; }
                
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

        // ── Main Loop ──────────────────────────
        let lastUIRenderTime = 0, lastGuideTime = 0; const UI_FPS = 15, GUIDE_FPS = 10;
        
        function init() {
            try {
                scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x010205, 0.04);
                camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100); camera.position.set(0, 4, 14); camera.lookAt(0, 0, 0);
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(window.devicePixelRatio); renderer.setSize(window.innerWidth, window.innerHeight);
                document.getElementById('canvas-container').appendChild(renderer.domElement);
                
                network = new AeternaNetwork(72); touchMem = new TouchMemory(72);
                const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(network.vertexPositions, 3)); geo.setAttribute('color', new THREE.BufferAttribute(network.colors, 3));
                
                const texCanvas = document.createElement('canvas'); texCanvas.width = 64; texCanvas.height = 64; const tCtx = texCanvas.getContext('2d');
                const grad = tCtx.createRadialGradient(32,32,0,32,32,32); grad.addColorStop(0,'rgba(255,255,255,1)'); grad.addColorStop(0.2,'rgba(255,255,255,0.8)'); grad.addColorStop(1,'rgba(0,0,0,0)');
                tCtx.fillStyle = grad; tCtx.fillRect(0,0,64,64); const tex = new THREE.CanvasTexture(texCanvas);
                
                particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.22, map: tex, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
                particleSystem.rotation.x = Math.PI / 5; scene.add(particleSystem);
                
                raycaster = new THREE.Raycaster(); raycaster.params.Points.threshold = 0.5; mouse = new THREE.Vector2(-10, -10);
                
                document.addEventListener('pointermove', handlePointerMove, false); document.addEventListener('pointerdown', handlePointerDown, false); document.addEventListener('pointerup', handlePointerUp, false); document.addEventListener('pointercancel', handlePointerUp, false);
                window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }, false);

                network.currentBuffer[0] = +8.0; network.currentBuffer[Math.floor(network.numNodes/2)] = -8.0;
                realityVisualLayer = new RealityVisualLayer(scene, network, particleSystem); guidePanel = new GuidePanel(network);

                ['omega-t', 'omega-p', 'r'].forEach(k => {
                    const el = document.getElementById(`slider-${k}`);
                    if(el) {
                        el.addEventListener('input', function() {
                            if(k==='omega-t') disk.omega_t = parseFloat(this.value); 
                            else if(k==='omega-p') disk.omega_p = parseFloat(this.value); 
                            else {
                                disk.r_disk = parseFloat(this.value);
                                if (network) network.updateRadius(disk.r_disk);
                            }
                            document.getElementById(`slider-val-${k}`).innerText = parseFloat(this.value).toFixed(2);
                            updateSliderTrack(this, k==='omega-p'?0:k==='omega-t'?1.0:0.5, k==='omega-p'?5:k==='omega-t'?20:3);
                        });
                    }
                });
                requestAnimationFrame(animateLoop);
            } catch (e) {
                console.error('AETERNA init failed:', e);
            }
        }

        function updateDiskPhysics(dt) {
            disk.update(dt); const idx = disk.getInjectionIdx(network.segments);
            if (idx >= 0 && disk.torusFormed) network.currentBuffer[idx] += Math.min(disk.omega_t * disk.omega_p * 0.01, 2.0);
            return idx;
        }

        function updateHeartbeat() {
            const nowMs = performance.now(); if (nowMs - lastHeartbeatTime > 1000 / HEART_CLOCK_HZ) {
                lastHeartbeatTime = nowMs; network.heartbeatActive = true;
                for (let i = 0; i < network.numNodes; i++) network.currentBuffer[i] += (network.nodeLayer[i] === 1) ? PULSE_STRENGTH * 0.8 : PULSE_STRENGTH * 0.15;
            } else { network.heartbeatActive = false; }
        }

        function updateMetricsUI(dyn, engineState) {
            const rRatioStr = `${disk.ratioRr.toFixed(3)} [${disk.ratioRr-PHI>=0?'+':''}${(disk.ratioRr-PHI).toFixed(3)}]`;
            updateUIRow(UI['row-omega-t'], UI['val-omega-t'], disk.omega_t.toFixed(2), disk.omega_t > 0);
            updateUIRow(UI['row-omega-p'], UI['val-omega-p'], disk.omega_p.toFixed(2), disk.omega_p > 0);
            updateUIRow(UI['row-ratio'], UI['val-ratio'], rRatioStr, Math.abs(disk.ratioRr - PHI) < 0.05);
            updateUIRow(UI['row-phase-ratio'], UI['val-phase-ratio'], disk.phaseRatio.toFixed(3), disk.torusFormed);
            updateUIRow(UI['row-ergodic'], UI['val-ergodic'], disk.isErgodic?'YES':'NO', disk.isErgodic);
            updateUIRow(UI['row-schumann'], UI['val-schumann'], disk.schumannLock?'YES':'NO', disk.schumannLock);
            updateUIRow(UI['row-torus-formed'], UI['val-torus-formed'], disk.torusFormed?'YES':'NO', disk.torusFormed);
            const irr = disk._irrationalScore(disk.phaseRatio); updateUIRow(UI['row-irrational'], UI['val-irrational'], irr.toFixed(3), irr > 0.7);
            
            if(UI['val-firing']) UI['val-firing'].innerText = (dyn.arousal * 100).toFixed(1) + "%";
            if(UI['val-cluster']) UI['val-cluster'].innerText = (dyn.ignitionRatio * 100).toFixed(1) + "%";
            if(UI['val-phi']) UI['val-phi'].innerText = dyn.phiApprox.toFixed(4);
            if(UI['val-coherence']) UI['val-coherence'].innerText = dyn.phaseCoherence.toFixed(3);
            if(UI['val-arousal']) UI['val-arousal'].innerText = dyn.arousal.toFixed(3);
            
            const sig = dyn.sigmaDisplay; updateUIRow(UI['row-branching'], UI['val-branching'], sig.toFixed(3), Math.abs(sig-1.0)<0.05);
            if(UI['val-branching']) UI['val-branching'].style.color = engineState==='WHITE'?'#86efac':engineState==='BLACK'?'#fca5a5':'';
            
            // Performance Optimization: Using transform instead of width to prevent reflow
            if (UI['sigma-bar-fill']) { 
                UI['sigma-bar-fill'].style.transform = `scaleX(${Math.min(sig / 2.0, 1.0)})`; 
                UI['sigma-bar-fill'].style.backgroundColor = sig < 0.85 ? '#f87171' : sig < 1.15 ? '#22d3ee' : '#fb923c'; 
            }
            
            updateUIRow(UI['row-homeo'], UI['val-homeo'], dyn.firingRateError.toFixed(4), Math.abs(dyn.firingRateError)<0.01);
            if(UI['val-tension']) UI['val-tension'].innerText = tensionLoad.toFixed(3); 
            if(UI['val-touch']) UI['val-touch'].innerText = touchMem.touchCount;
            
            const pre = disk.getConsciousnessPrerequisites(); pre.C = dyn.phiApprox>0.002; pre.D = dyn.ignitionRatio>0.05; const preE = engineState==='WHITE';
            updateUIRow(UI['row-pre-a'], UI['val-pre-a'], pre.A?'✓':'–', pre.A); updateUIRow(UI['row-pre-b'], UI['val-pre-b'], pre.B?'✓':'–', pre.B);
            updateUIRow(UI['row-pre-c'], UI['val-pre-c'], pre.C?'✓':'–', pre.C); updateUIRow(UI['row-pre-d'], UI['val-pre-d'], pre.D?'✓':'–', pre.D); updateUIRow(UI['row-pre-e'], UI['val-pre-e'], preE?'✓':'–', preE);
            updateUIRow(UI['row-total'], UI['val-total'], `${(pre.A?1:0)+(pre.B?1:0)+(pre.C?1:0)+(pre.D?1:0)+(preE?1:0)}/5`, (pre.A?1:0)+(pre.B?1:0)+(pre.C?1:0)+(pre.D?1:0)+(preE?1:0)===5);

            // Phase I & M: System State Badge & Robust conditions
            const badge = UI['system-state-badge'];
            if(badge) {
                let stateTxt = 'QUIET', colorClass = 'text-white/50 border-white/50';
                if (sig > 1.18 && dyn.arousal > 0.04) {
                    stateTxt = 'OVERDRIVE'; colorClass = 'text-orange-400 border-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]';
                } else if (dyn.arousal > 0.03 && dyn.ignitionRatio < 0.02) {
                    stateTxt = 'FRAGMENTED'; colorClass = 'text-red-400 border-red-400';
                } else if (Math.abs(sig - 1.0) < 0.04 && dyn.phiApprox > 0.0005) {
                    stateTxt = 'CRITICAL'; colorClass = 'text-cyan-300 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
                } else if (Math.abs(dyn.firingRateError) > 0.05 || tensionLoad > 0.25) {
                    stateTxt = 'TURBULENT'; colorClass = 'text-yellow-300 border-yellow-300';
                } else if (dyn.arousal > 0.015 && dyn.phaseCoherence > 0.15 && dyn.ignitionRatio > 0.02) {
                    stateTxt = 'COHERENT'; colorClass = 'text-emerald-300 border-emerald-300';
                }
                badge.className = `inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${colorClass} tracking-widest`; badge.innerText = stateTxt;
            }
        }

        function animateLoop(now) {
            requestAnimationFrame(animateLoop);
            const diskNodeIdx = updateDiskPhysics(1/60); updateHeartbeat();
            
            network.triggerNoise(tensionLoad, network.sigmaDisplay); touchMem.decay();
            const dyn = network.updateDynamics(diskNodeIdx);
            
            particleSystem.geometry.attributes.position.needsUpdate = true; particleSystem.geometry.attributes.color.needsUpdate = true;
            particleSystem.rotation.y += 0.001 + ((disk.omega_t-SCHUMANN_RES)/(GAMMA_SYNC-SCHUMANN_RES)*0.002); particleSystem.rotation.z += 0.0005;
            if (activeTouches.size < 2 && typeof mouseX !== 'undefined') { camera.position.x += (mouseX * 5 - camera.position.x) * 0.05; camera.position.y += (-mouseY * 5 + 4 - camera.position.y) * 0.05; }
            camera.lookAt(scene.position);
            
            // Phase G: Tension logic (Updated to use meanPredictionError)
            const meanError = dyn.meanPredictionError || 0;
            tensionLoad = tensionLoad * Math.exp(-TENSION_LAMBDA) + meanError * 0.05; tensionDuration++;
            if (tensionDuration > TENSION_90S_FRAMES && tensionLoad > 0.3) { window.injectMassiveError(); tensionDuration = 0; tensionLoad *= 0.15; }

            // Phase H: Refined Engine State
            const dPhi = dyn.phiApprox - lastPhiApprox; lastPhiApprox = dyn.phiApprox;
            const clusterTrend = dyn.ignitionRatio - lastClusterTrend; lastClusterTrend = dyn.ignitionRatio;
            let engineState = 'NEUTRAL';
            if (dPhi > 0.0002 && clusterTrend > -0.01) engineState = 'WHITE';
            else if (dPhi < -0.0002 && clusterTrend < 0.01) engineState = 'BLACK';

            if (now - lastUIRenderTime > 1000/UI_FPS) { updateMetricsUI(dyn, engineState); realityVisualLayer.update(dyn); lastUIRenderTime = now; }
            if (now - lastGuideTime > 1000/GUIDE_FPS) { guidePanel.update(dyn, engineState); lastGuideTime = now; }
            renderer.render(scene, camera);
        }

        init();
    </script>
</body>
</html>

```
