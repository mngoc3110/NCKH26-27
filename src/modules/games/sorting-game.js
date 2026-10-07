/**
 * ============================================================================
 * SORTING GAME MODULE (TRÒ CHƠI PHÂN LOẠI DANH MỤC THEO KHAY MÃ MÀU)
 * Hỗ trợ kỹ năng nhận thức: Gom nhóm thuộc tính và phân loại đối tượng
 * ============================================================================
 */

class SortingGame {
  constructor() {
    this.currentItem = null;
    this.baskets = [];
    this.fadingTimer = null;
    this.initDOMElements();
  }

  initDOMElements() {
    this.basketsGridEl = document.getElementById('sortingBasketsGrid');
    this.sortingCardEl = document.getElementById('currentSortingCard');
    this.sortingItemImgEl = document.getElementById('sortingItemImg');
    this.sortingItemNameEl = document.getElementById('sortingItemName');
    this.sortingItemColorTagEl = document.getElementById('sortingItemColorTag');
  }

  startRound() {
    clearTimeout(this.fadingTimer);
    const cards = window.appState.cards;
    if (!cards || cards.length === 0) return;

    // Thiết lập 3 khay phân loại mẫu
    this.baskets = [
      { id: 'fruit', name: 'Hoa Quả', icon: '🍎', colorKey: 'yellow' },
      { id: 'vehicle', name: 'Phương Tiện', icon: '🚗', colorKey: 'blue' },
      { id: 'animal', name: 'Động Vật', icon: '🐶', colorKey: 'green' }
    ];

    // Chọn 1 vật phẩm ngẫu nhiên thuộc 1 trong 3 nhóm trên
    const validCards = cards.filter(c => ['fruit', 'vehicle', 'animal'].includes(c.category));
    const randCard = validCards[Math.floor(Math.random() * validCards.length)];
    this.currentItem = randCard;

    // Bắt đầu ghi log nghiên cứu
    window.researchLogger.startTrial('SORTING', this.currentItem.color, window.appState.promptLevel);

    this.renderBaskets();
    this.renderCurrentItem();

    // Hỗ trợ Fading delay ở Cấp 3
    if (window.appState.promptLevel === 3) {
      const delayMs = (window.appState.scaffoldingRules.delaySec || 5) * 1000;
      this.fadingTimer = setTimeout(() => {
        this.applyDelayedFadingAssistance();
      }, delayMs);
    }
  }

  renderBaskets() {
    this.basketsGridEl.innerHTML = '';
    const promptLvl = window.appState.promptLevel;
    const targetBasket = this.baskets.find(b => b.id === this.currentItem.category);

    this.baskets.forEach(basket => {
      const basketEl = document.createElement('div');
      basketEl.className = 'sorting-basket';
      basketEl.dataset.categoryId = basket.id;

      const hex = window.colorSystem.getColorHex(basket.colorKey);
      const soft = window.colorSystem.getColorSoft(basket.colorKey);

      basketEl.style.setProperty('--basket-color', hex);
      basketEl.style.setProperty('--basket-bg', soft);

      // Cấp 1: Khay đúng phát sáng đồng bộ với vật phẩm
      if (promptLvl === 1 && basket.id === targetBasket.id) {
        basketEl.classList.add('prompt-lvl-1');
        basketEl.style.setProperty('--prompt-glow-color', hex);
      }

      basketEl.innerHTML = `
        <span class="basket-icon">${basket.icon}</span>
        <span class="basket-title">${basket.name}</span>
        <span class="basket-code-name" style="color: ${hex}">Mã: ${window.colorSystem.getColorNameVi(basket.colorKey)}</span>
      `;

      basketEl.addEventListener('click', () => this.handleBasketClick(basket, basketEl));
      this.basketsGridEl.appendChild(basketEl);
    });
  }

  renderCurrentItem() {
    const item = this.currentItem;
    const promptLvl = window.appState.promptLevel;
    const hex = window.colorSystem.getColorHex(item.color);

    this.sortingItemImgEl.textContent = item.emoji;
    this.sortingItemNameEl.textContent = item.name;

    // Áp dụng mức gợi ý mã màu cho vật phẩm
    if (promptLvl === 1) {
      this.sortingCardEl.style.borderColor = hex;
      this.sortingCardEl.classList.add('prompt-lvl-1');
      this.sortingCardEl.style.setProperty('--prompt-glow-color', hex);
      this.sortingItemColorTagEl.style.display = 'block';
      this.sortingItemColorTagEl.style.backgroundColor = hex;
    } else if (promptLvl === 2) {
      this.sortingCardEl.style.borderColor = hex;
      this.sortingCardEl.className = 'card-display current-sorting-card prompt-lvl-2';
      this.sortingItemColorTagEl.style.display = 'block';
      this.sortingItemColorTagEl.style.backgroundColor = hex;
    } else {
      this.sortingCardEl.className = 'card-display current-sorting-card prompt-lvl-3';
      this.sortingItemColorTagEl.style.display = 'none';
    }
  }

  handleBasketClick(basket, basketEl) {
    clearTimeout(this.fadingTimer);
    const isCorrect = basket.id === this.currentItem.category;

    if (isCorrect) {
      window.audioEngine.playSuccess();
      window.researchLogger.completeTrial(true);
      this.showSuccessCelebration(basket);
    } else {
      window.audioEngine.playGentleWrong();
      window.researchLogger.recordError();

      basketEl.style.transform = 'scale(0.96)';
      setTimeout(() => { basketEl.style.transform = 'none'; }, 200);

      const maxErr = window.appState.scaffoldingRules.maxErrors || 2;
      if (window.researchLogger.currentTrial && window.researchLogger.currentTrial.errorCount >= maxErr) {
        this.applyDelayedFadingAssistance();
      }
    }
  }

  applyDelayedFadingAssistance() {
    window.audioEngine.playHint();
    const correctBasket = this.basketsGridEl.querySelector(`[data-category-id="${this.currentItem.category}"]`);
    if (correctBasket) {
      const hex = window.colorSystem.getColorHex(this.currentItem.color);
      correctBasket.style.boxShadow = `0 0 25px ${hex}`;
      correctBasket.style.transform = 'scale(1.05)';
    }
  }

  showSuccessCelebration(basket) {
    const overlay = document.getElementById('celebrationOverlay');
    const subtext = document.getElementById('celebrationSubtext');
    subtext.textContent = `Bé đã phân loại đúng ${this.currentItem.name} vào khay ${basket.name} theo mã màu!`;
    overlay.classList.add('show');
  }
}

// Global Singleton SortingGame
window.sortingGame = new SortingGame();
