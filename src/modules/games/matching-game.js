/**
 * ============================================================================
 * MATCHING GAME MODULE (TRÒ CHƠI GHÉP CẶP TƯƠNG ĐỒNG THEO MÃ MÀU)
 * Hỗ trợ nhận diện đặc điểm đối tượng và liên kết tín hiệu trực quan mã màu
 * ============================================================================
 */

class MatchingGame {
  constructor() {
    this.targetCard = null;
    this.options = [];
    this.fadingTimer = null;
    this.initDOMElements();
  }

  initDOMElements() {
    this.targetCardEl = document.getElementById('matchTargetCard');
    this.targetImgEl = document.getElementById('matchTargetImg');
    this.targetNameEl = document.getElementById('matchTargetName');
    this.targetColorTagEl = document.getElementById('matchTargetColorTag');
    this.optionsGridEl = document.getElementById('matchingOptionsGrid');
  }

  startRound() {
    clearTimeout(this.fadingTimer);
    const cards = window.appState.cards;
    if (!cards || cards.length === 0) return;

    // Chọn 1 thẻ mục tiêu ngẫu nhiên
    const randIdx = Math.floor(Math.random() * cards.length);
    this.targetCard = cards[randIdx];

    // Tạo danh sách 3 lựa chọn (1 đúng, 2 gây nhiễu)
    const distractors = cards.filter(c => c.id !== this.targetCard.id);
    const shuffledDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 2);
    this.options = [this.targetCard, ...shuffledDistractors].sort(() => 0.5 - Math.random());

    // Bắt đầu ghi nhật ký nghiên cứu
    window.researchLogger.startTrial('MATCHING', this.targetCard.color, window.appState.promptLevel);

    // Cập nhật giao diện thẻ mẫu
    this.renderTarget();

    // Render các thẻ lựa chọn
    this.renderOptions();

    // Phát âm thanh liên kết mã màu
    window.audioEngine.playColorTone(this.targetCard.color);

    // Xử lý cơ chế Fading Delay ở Cấp 3 (Tự lập)
    if (window.appState.promptLevel === 3) {
      const delayMs = (window.appState.scaffoldingRules.delaySec || 5) * 1000;
      this.fadingTimer = setTimeout(() => {
        this.applyDelayedFadingAssistance();
      }, delayMs);
    }
  }

  renderTarget() {
    const colorHex = window.colorSystem.getColorHex(this.targetCard.color);
    this.targetImgEl.textContent = this.targetCard.emoji;
    this.targetNameEl.textContent = this.targetCard.name;
    this.targetColorTagEl.style.backgroundColor = colorHex;

    // Cập nhật viền thẻ mẫu theo mã màu
    this.targetCardEl.style.borderColor = colorHex;
  }

  renderOptions() {
    this.optionsGridEl.innerHTML = '';
    const promptLvl = window.appState.promptLevel;
    const targetColorHex = window.colorSystem.getColorHex(this.targetCard.color);

    this.options.forEach(opt => {
      const card = document.createElement('div');
      card.className = 'card-display option-card';
      card.dataset.cardId = opt.id;

      const optColorHex = window.colorSystem.getColorHex(opt.color);
      const isCorrect = opt.id === this.targetCard.id;

      // Áp dụng phong cách hỗ trợ mã màu sư phạm
      if (promptLvl === 1) {
        // Cấp 1: Gợi ý rõ ràng, thẻ đúng phát sáng rực rỡ
        card.style.borderColor = optColorHex;
        if (isCorrect) {
          card.classList.add('prompt-lvl-1');
          card.style.setProperty('--prompt-glow-color', optColorHex);
        }
      } else if (promptLvl === 2) {
        // Cấp 2: Tín hiệu màu tĩnh
        card.classList.add('prompt-lvl-2');
        card.style.borderColor = optColorHex;
      } else {
        // Cấp 3: Mờ dần gợi ý (viền xám trung tính, không gợi ý trước)
        card.classList.add('prompt-lvl-3');
      }

      card.innerHTML = `
        <span class="card-img-placeholder">${opt.emoji}</span>
        <span class="card-name">${opt.name}</span>
        ${promptLvl < 3 ? `<div class="color-badge-indicator" style="background-color: ${optColorHex}"></div>` : ''}
      `;

      card.addEventListener('click', () => this.handleOptionClick(opt, card));
      this.optionsGridEl.appendChild(card);
    });
  }

  handleOptionClick(selectedCard, cardEl) {
    clearTimeout(this.fadingTimer);
    const isCorrect = selectedCard.id === this.targetCard.id;

    if (isCorrect) {
      // Đúng: Khen ngợi và ghi nhận
      window.audioEngine.playSuccess();
      window.researchLogger.completeTrial(true);
      this.showSuccessCelebration();
    } else {
      // Chưa đúng: Âm thanh êm dịu, không phạt giật mình
      window.audioEngine.playGentleWrong();
      window.researchLogger.recordError();

      // Hiệu ứng rung nhẹ
      cardEl.style.transform = 'scale(0.95)';
      setTimeout(() => { cardEl.style.transform = 'none'; }, 200);

      // Nếu lỗi vượt ngưỡng cấu hình của giáo viên -> Kích hoạt gợi ý trực quan cứu trợ
      const maxErr = window.appState.scaffoldingRules.maxErrors || 2;
      if (window.researchLogger.currentTrial && window.researchLogger.currentTrial.errorCount >= maxErr) {
        this.applyDelayedFadingAssistance();
      }
    }
  }

  // Cứu trợ trực quan khi trẻ chần chừ hoặc sai nhiều lần
  applyDelayedFadingAssistance() {
    window.audioEngine.playHint();
    const correctCardEl = this.optionsGridEl.querySelector(`[data-card-id="${this.targetCard.id}"]`);
    if (correctCardEl) {
      const colorHex = window.colorSystem.getColorHex(this.targetCard.color);
      correctCardEl.style.borderColor = colorHex;
      correctCardEl.classList.add('prompt-lvl-3', 'faded-assisted');
      correctCardEl.style.boxShadow = `0 0 20px ${colorHex}`;
    }
  }

  showSuccessCelebration() {
    const overlay = document.getElementById('celebrationOverlay');
    const subtext = document.getElementById('celebrationSubtext');
    subtext.textContent = `Bé đã ghép đúng ${this.targetCard.name} theo mã màu ${window.colorSystem.getColorNameVi(this.targetCard.color)}!`;
    overlay.classList.add('show');
  }
}

// Global Singleton MatchingGame
window.matchingGame = new MatchingGame();
