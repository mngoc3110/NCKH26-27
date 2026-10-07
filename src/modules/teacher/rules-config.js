/**
 * ============================================================================
 * TEACHER RULES CONFIGURATOR (CẤU HÌNH QUY ƯỚC MÃ MÀU & CAN THIỆP)
 * Cho phép giáo viên thay đổi bảng màu, ý nghĩa sư phạm và độ trễ gợi ý
 * ============================================================================
 */

class RulesConfigurator {
  constructor() {
    this.meaningListEl = document.getElementById('colorMeaningList');
    this.saveRulesBtnEl = document.getElementById('saveColorRulesBtn');
    this.saveScaffoldBtnEl = document.getElementById('saveScaffoldingBtn');
    
    this.initPaletteRadios();
    this.renderColorMeanings();
    this.loadScaffoldingInputs();
    this.bindEvents();
  }

  initPaletteRadios() {
    const radios = document.querySelectorAll('input[name="colorPalette"]');
    radios.forEach(radio => {
      if (radio.value === window.appState.colorPaletteKey) {
        radio.checked = true;
      }
      radio.addEventListener('change', (e) => {
        window.appState.colorPaletteKey = e.target.value;
        window.appState.saveRules();
        window.colorSystem.updateCssVariables();
        this.renderColorMeanings();
      });
    });
  }

  renderColorMeanings() {
    if (!this.meaningListEl) return;
    this.meaningListEl.innerHTML = '';
    const palette = window.appState.getCurrentPalette();

    for (const [key, val] of Object.entries(palette.colors)) {
      const row = document.createElement('div');
      row.className = 'color-rule-row';
      row.innerHTML = `
        <span class="rule-color-badge" style="background-color: ${val.hex}"></span>
        <span class="rule-color-title">${window.colorSystem.getColorNameVi(key)}:</span>
        <input type="text" class="form-control rule-color-input" data-color-key="${key}" value="${val.meaning}">
      `;
      this.meaningListEl.appendChild(row);
    }
  }

  loadScaffoldingInputs() {
    const rules = window.appState.scaffoldingRules;
    const delayInput = document.getElementById('scaffoldDelayInput');
    const errInput = document.getElementById('scaffoldMaxErrorsInput');
    const autoSelect = document.getElementById('autoFadingSelect');

    if (delayInput) delayInput.value = rules.delaySec || 5;
    if (errInput) errInput.value = rules.maxErrors || 2;
    if (autoSelect) autoSelect.value = rules.autoFading || 'enabled';
  }

  bindEvents() {
    if (this.saveRulesBtnEl) {
      this.saveRulesBtnEl.addEventListener('click', () => this.handleSaveColorMeanings());
    }
    if (this.saveScaffoldBtnEl) {
      this.saveScaffoldBtnEl.addEventListener('click', () => this.handleSaveScaffolding());
    }
  }

  handleSaveColorMeanings() {
    const inputs = this.meaningListEl.querySelectorAll('.rule-color-input');
    const palette = window.appState.getCurrentPalette();

    inputs.forEach(input => {
      const key = input.dataset.colorKey;
      if (palette.colors[key]) {
        palette.colors[key].meaning = input.value.trim();
      }
    });

    window.appState.saveRules();
    alert('Đã lưu thành công quy ước ý nghĩa mã màu sư phạm!');
  }

  handleSaveScaffolding() {
    const delay = parseInt(document.getElementById('scaffoldDelayInput').value, 10) || 5;
    const maxErr = parseInt(document.getElementById('scaffoldMaxErrorsInput').value, 10) || 2;
    const autoFading = document.getElementById('autoFadingSelect').value;

    window.appState.scaffoldingRules = {
      delaySec: delay,
      maxErrors: maxErr,
      autoFading: autoFading
    };

    window.appState.saveRules();
    alert(`Đã lưu thiết lập can thiệp: Độ trễ gợi ý ${delay}s, số lỗi tối đa ${maxErr} lần.`);
  }
}

// Global Singleton RulesConfigurator
window.rulesConfigurator = new RulesConfigurator();
