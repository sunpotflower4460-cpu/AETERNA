/**
 * ObservationDisplay - 外部観測装置として日本語で何が起きているかを説明する
 * External observation device that explains what's happening in Japanese
 */

export class ObservationDisplay {
    constructor() {
        this.displayEl = document.getElementById('observation-display');
        this.currentMessage = '';
        this.hideTimeout = null;
        this.lastSystemState = '';
        this.lastSigma = 1.0;
        this.messageQueue = [];
        this.isShowing = false;
    }

    /**
     * タッチ時の説明を表示
     * Show explanation when user touches the screen
     */
    showTouchMessage(_x, _y) {
        const messages = [
            '刺激が伝わっています...',
            'ニューロンが活性化しました',
            'ネットワークに波が広がっています',
            '予測誤差が注入されました',
            '神経活動が伝播しています'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showMessage(randomMessage, 'touch-feedback', 2000);
    }

    /**
     * システム状態変化の説明を表示
     * Show explanation when system state changes
     */
    showStateChange(newState, sigma) {
        let message = '';
        let type = 'state-change';
        let duration = 3000;

        if (newState === 'ACTIVE' && this.lastSystemState !== 'ACTIVE') {
            message = 'システムが活動状態に入りました';
        } else if (newState === 'CRITICAL' && this.lastSystemState !== 'CRITICAL') {
            message = '臨界状態に到達！バランスの取れた活動が生まれています';
            type = 'critical';
            duration = 4000;
        } else if (newState === 'QUIET' && this.lastSystemState !== 'QUIET') {
            message = '静止状態に戻りました';
        }

        // σ (シグマ) 値の変化を説明
        if (sigma > 1.15 && this.lastSigma <= 1.15) {
            message = '過興奮状態：活動が活発すぎます';
            type = 'critical';
        } else if (sigma < 0.85 && this.lastSigma >= 0.85) {
            message = '活動が低下しています';
        } else if (sigma >= 0.95 && sigma <= 1.05 && (this.lastSigma < 0.95 || this.lastSigma > 1.05)) {
            message = '臨界バランスを回復しました';
            type = 'state-change';
        }

        this.lastSystemState = newState;
        this.lastSigma = sigma;

        if (message) {
            this.showMessage(message, type, duration);
        }
    }

    /**
     * プリセット適用時の説明を表示
     * Show explanation when preset is applied
     */
    showPresetMessage(presetName) {
        const presetMessages = {
            'schumann': '🌍 シューマン共鳴モード：地球の周波数で安定した活動が始まります',
            'golden': 'φ 黄金比モード：調和的で美しいパターンが生成されます',
            'gamma': '⚡ ガンマ波モード：高周波で活発な神経活動が始まります'
        };

        const message = presetMessages[presetName] || `${presetName}モードを適用しました`;
        this.showMessage(message, 'state-change', 3500);
    }

    /**
     * 重要なネットワークイベントの説明を表示
     * Show explanation for important network events
     */
    showNetworkEvent(eventType, _data) {
        let message = '';
        let type = 'state-change';
        let duration = 3000;

        switch(eventType) {
            case 'white_engine':
                message = '統合傾向が上昇：全体の秩序が高まっています';
                break;
            case 'heartbeat':
                message = '同期パルス発生：ネットワーク全体が同期しています';
                type = 'critical';
                break;
            case 'tension_release':
                message = '内部緊張が解放されました';
                break;
            case 'eye_active':
                message = '自己観測ノードが活性化：予測誤差が閾値を超えました';
                type = 'state-change';
                duration = 3500;
                break;
            case 'cluster_large':
                message = '大規模な活動クラスターが形成されました';
                break;
            case 'coherence_high':
                message = '位相コヒーレンスが上昇：同期が強まっています';
                break;
            default:
                return;
        }

        this.showMessage(message, type, duration);
    }

    /**
     * カスタムメッセージを表示
     * Show custom message
     */
    showCustomMessage(message, duration = 3000) {
        this.showMessage(message, 'state-change', duration);
    }

    /**
     * メッセージを表示する内部メソッド
     * Internal method to display message
     */
    showMessage(message, type = 'touch-feedback', duration = 2000) {
        if (!this.displayEl) return;

        // 同じメッセージは無視
        if (this.currentMessage === message && this.isShowing) {
            return;
        }

        // 既存のタイムアウトをクリア
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // メッセージを更新
        this.currentMessage = message;
        this.displayEl.textContent = message;

        // スタイルクラスをリセットして新しいものを適用
        this.displayEl.className = '';
        this.displayEl.classList.add('visible', type);
        this.isShowing = true;

        // 指定時間後に非表示
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * 表示を隠す
     * Hide the display
     */
    hide() {
        if (!this.displayEl) return;
        this.displayEl.classList.remove('visible');
        this.isShowing = false;
        this.currentMessage = '';
    }

    /**
     * リセット時の説明を表示
     * Show explanation when reset
     */
    showResetMessage() {
        this.showMessage('システムがリセットされました', 'state-change', 2500);
    }

    /**
     * 刺激注入時の説明を表示
     * Show explanation when massive error is injected
     */
    showInjectionMessage() {
        this.showMessage('⚡ 強い刺激が注入されました！', 'critical', 3000);
    }

    /**
     * モード変化時の説明を表示
     * Show explanation when mode changes
     */
    showModeChange(mode) {
        const modeMessages = {
            'wake': '覚醒モード：外部刺激に敏感な状態です',
            'sleep': '睡眠モード：外部刺激が抑制されています',
            'dream': '夢モード：内部活動が活発化しています'
        };

        const message = modeMessages[mode] || `モードが${mode}に変更されました`;
        this.showMessage(message, 'state-change', 3500);
    }

    /**
     * アクション状態の説明を表示
     * Show explanation when action state changes
     */
    showActionState(actionState) {
        const actionMessages = {
            'idle': 'アイドル状態：静止しています',
            'rest': '休息中：エネルギーを回復しています',
            'orient': '定位反応：外部刺激に注目しています',
            'withdraw': '回避反応：過負荷から退避しています'
        };

        const message = actionMessages[actionState];
        if (message) {
            this.showMessage(message, 'state-change', 3000);
        }
    }

    /**
     * 統合指標（Φ）の変化を説明
     * Show explanation when integration (Phi) changes significantly
     */
    showIntegrationChange(phi, threshold = 0.002) {
        if (phi > threshold && this.lastPhi <= threshold) {
            this.showMessage('統合性が上昇：全体としてのまとまりが生まれています', 'state-change', 3500);
        } else if (phi <= threshold && this.lastPhi > threshold) {
            this.showMessage('統合性が低下：活動が断片化しています', 'state-change', 3000);
        }
        this.lastPhi = phi;
    }
}
