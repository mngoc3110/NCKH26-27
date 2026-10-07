/**
 * ============================================================================
 * SEQUENCE GAME MODULE (TRÒ CHƠI CHUỖI TRÍ NHỚ MÃ MÀU)
 * Hỗ trợ chức năng nhận thức: Ghi nhớ thị giác ngắn hạn và chú ý có chủ định
 * ============================================================================
 */

class SequenceGame {
  constructor() {
    this.sequence = [];
    this.userStep = 0;
    this.isPlaying = false;
    this.colorKeys = ['blue', 'yellow', 'green'];
    this.initDOMElements();
  }

  initDOMElements() {
    this.previewRowEl = document.getElementById('sequencePreviewRow');
    this.inputRowEl = document.getElementById('sequenceInputRow');
    this.startBtnEl = document.getElementById('startSequenceBtn');

    if (this.startBtnEl) {
      this.startBtnEl.addEventListener('click', () => this.playSequenceDemo());
    }
  }

  startRound() {
    this.userStep = 0;
    this.isPlaying = false;
    
    // Tạo chuỗi 3 màu ngẫu nhiên
    this.sequence = [
      this.colorKeys[Math.floor(Math.random() * this.colorKeys.length)],
      this.colorKeys[Math.floor(Math.random() * this.colorKeys.length)],
      this.colorKeys[Math.floor(Math.random() * this.colorKeys.length)]
    ];

    window.researchLogger.startTrial('SEQUENCE', this.sequence[0], window.appState.promptLevel);
    this.renderSlots();
    this.renderInputButtons();
  }

  renderSlots() {
    this.previewRowEl.innerHTML = '';
    this.sequence.forEach((cKey, idx) => {
      const slot = document.createElement('div');
      slot.className = 'seq-slot';
      slot.id = `seq-slot-${idx}`;
      slot.textContent = '?';
      this.previewRowEl.appendChild(slot);
    });
  }

  renderInputButtons() {
    this.inputRowEl.innerHTML = '';
    this.colorKeys.forEach(cKey => {
      const hex = window.colorSystem.getColorHex(cKey);
      const btn = document.createElement('button');
      btn.className = 'seq-input-btn';
      btn.style.setProperty('--seq-btn-color', hex);
      btn.innerHTML = `
        <span class="card-img-placeholder" style="color: ${hex}">●</span>
        <span class="card-name" style="font-size: 0.85rem">${window.colorSystem.getColorNameVi(cKey)}</span>
      `;
      btn.addEventListener('click', () => this.handleUserColorInput(cKey));
      this.inputRowEl.appendChild(btn);
    });
  }

  async playSequenceDemo() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startBtnEl.disabled = true;
    this.userStep = 0;

    // Chiếu từng bước trong chuỗi
    for (let i = 0; i < this.sequence.length; i++) {
      const cKey = this.sequence[i];
      const slotEl = document.getElementById(`seq-slot-${i}`);
      const hex = window.colorSystem.getColorHex(cKey);

      await new Promise(r => setTimeout(r, 400));
      if (slotEl) {
        slotEl.style.backgroundColor = hex;
        slotEl.style.color = '#FFFFFF';
        slotEl.textContent = '★';
        slotEl.classList.add('highlight');
      }
      window.audioEngine.playColorTone(cKey);

      await new Promise(r => setTimeout(r, 700));
      if (slotEl) {
        slotEl.style.backgroundColor = 'var(--bg-surface)';
        slotEl.style.color = 'var(--text-main)';
        slotEl.textContent = `${i + 1}`;
        slotEl.classList.remove('highlight');
      }
    }

    this.isPlaying = false;
    this.startBtnEl.disabled = false;
    this.startBtnEl.textContent = '🔄 Chiếu lại mẫu';
  }

  handleUserColorInput(selectedKey) {
    if (this.isPlaying) return;
    const expectedKey = this.sequence[this.userStep];

    if (selectedKey === expectedKey) {
      window.audioEngine.playColorTone(selectedKey);
      const slotEl = document.getElementById(`seq-slot-${this.userStep}`);
      if (slotEl) {
        const hex = window.colorSystem.getColorHex(selectedKey);
        slotEl.style.backgroundColor = hex;
        slotEl.style.color = '#FFFFFF';
        slotEl.textContent = '✓';
      }
      this.userStep++;

      // Hoàn thành cả chuỗi
      if (this.userStep === this.sequence.length) {
        setTimeout(() => {
          window.audioEngine.playSuccess();
          window.researchLogger.completeTrial(true);
          this.showSuccessCelebration();
        }, 300);
      }
    } else {
      window.audioEngine.playGentleWrong();
      window.researchLogger.recordError();
    }
  }

  showSuccessCelebration() {
    const overlay = document.getElementById('celebrationOverlay');
    const subtext = document.getElementById('celebrationSubtext');
    subtext.textContent = 'Bé đã ghi nhớ và bấm đúng toàn bộ chuỗi 3 mã màu!';
    overlay.classList.add('show');
  }
}

// Global Singleton SequenceGame
window.sequenceGame = new SequenceGame();
