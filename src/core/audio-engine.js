/**
 * ============================================================================
 * AUDIO ENGINE - SENSORY-FRIENDLY SOUND SYNTHESIZER
 * Tổng hợp âm thanh bằng Web Audio API - Tối ưu cho trẻ nhạy cảm thính giác
 * Tuyệt đối không dùng âm thanh sắc nhọn, còi báo gây hoảng loạn cho trẻ tự kỷ
 * ============================================================================
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tạo âm marimba/xylophone êm dịu hình sin
  playTone(freq, duration = 0.35, gainLevel = 0.15) {
    if (this.isMuted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine'; // Sóng sin tròn, ấm và không gây chói
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Envelope âm lượng: Tăng êm và giảm dần tự nhiên
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Âm thanh khích lệ khi hoàn thành đúng: Hợp âm Đô trưởng (C-E-G-C) êm ái
  playSuccess() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 0.12);
      }, idx * 120);
    });
  }

  // Âm thanh gợi ý / nhấp nháy mã màu nhẹ nhàng
  playHint() {
    this.playTone(440, 0.25, 0.08); // A4 êm
  }

  // Âm thanh khi thao tác chưa đúng: Âm trầm ấm, không gây ức chế
  playGentleWrong() {
    this.init();
    this.playTone(261.63, 0.3, 0.1); // C4 dịu
  }

  // Âm thanh riêng cho từng mã màu để tạo liên kết đa giác quan (Multisensory)
  playColorTone(colorName) {
    const colorFreqMap = {
      blue: 440.00,   // A4
      yellow: 523.25, // C5
      green: 587.33,  // D5
      red: 659.25     // E5
    };
    const freq = colorFreqMap[colorName] || 440;
    this.playTone(freq, 0.3, 0.1);
  }
}

// Global Singleton Audio
window.audioEngine = new AudioEngine();
