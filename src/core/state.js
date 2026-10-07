/**
 * ============================================================================
 * COREDATA & STATE MANAGEMENT - CODESYSTEM
 * Quản lý trạng thái ứng dụng và lưu trữ cục bộ (Offline-First)
 * ============================================================================
 */

const DEFAULT_CARDS = [
  { id: 'c1', name: 'Quả Táo', emoji: '🍎', category: 'fruit', color: 'red', difficulty: 1 },
  { id: 'c2', name: 'Quả Chuối', emoji: '🍌', category: 'fruit', color: 'yellow', difficulty: 1 },
  { id: 'c3', name: 'Ô Tô Con', emoji: '🚗', category: 'vehicle', color: 'blue', difficulty: 1 },
  { id: 'c4', name: 'Máy Bay', emoji: '✈️', category: 'vehicle', color: 'blue', difficulty: 1 },
  { id: 'c5', name: 'Con Mèo', emoji: '🐱', category: 'animal', color: 'green', difficulty: 1 },
  { id: 'c6', name: 'Con Chó', emoji: '🐶', category: 'animal', color: 'green', difficulty: 1 },
  { id: 'c7', name: 'Bút Chì', emoji: '✏️', category: 'school', color: 'yellow', difficulty: 2 },
  { id: 'c8', name: 'Quyển Sách', emoji: '📚', category: 'school', color: 'red', difficulty: 2 },
  { id: 'c9', name: 'Quả Dưa Hấu', emoji: '🍉', category: 'fruit', color: 'green', difficulty: 2 }
];

const DEFAULT_PALETTES = {
  calmPastel: {
    name: 'Pastel Dịu Mắt (Calming)',
    colors: {
      blue: { hex: '#60A5FA', soft: '#DBEAFE', meaning: 'Phương tiện / Nhiệm vụ ghép đôi' },
      yellow: { hex: '#FACC15', soft: '#FEF9C3', meaning: 'Hoa quả ngọt / Chỉ dẫn định hướng' },
      green: { hex: '#4ADE80', soft: '#DCFCE7', meaning: 'Động vật thân thuộc / Khẳng định đúng' },
      red: { hex: '#F87171', soft: '#FEE2E2', meaning: 'Đồ dùng học tập / Nhận biết chú ý' }
    }
  },
  highContrast: {
    name: 'Tương Phản Cao (High Contrast)',
    colors: {
      blue: { hex: '#1D4ED8', soft: '#BFDBFE', meaning: 'Phương tiện / Nhiệm vụ ghép đôi' },
      yellow: { hex: '#EAB308', soft: '#FEF08A', meaning: 'Hoa quả ngọt / Chỉ dẫn định hướng' },
      green: { hex: '#15803D', soft: '#BBF7D0', meaning: 'Động vật thân thuộc / Khẳng định đúng' },
      red: { hex: '#B91C1C', soft: '#FECACA', meaning: 'Đồ dùng học tập / Nhận biết chú ý' }
    }
  }
};

class AppState {
  constructor() {
    this.currentView = 'child'; // 'child' | 'teacher'
    this.activeChild = { id: 'ASD-01', name: 'Bé Nam' };
    this.activeGame = 'matching'; // 'matching' | 'sorting' | 'sequence'
    this.promptLevel = 1; // 1: Full Prompt, 2: Visual Static, 3: Faded (Tự lập)
    
    // Tải hoặc thiết lập mặc định
    this.colorPaletteKey = localStorage.getItem('cm_palette_key') || 'calmPastel';
    this.scaffoldingRules = JSON.parse(localStorage.getItem('cm_scaffolding')) || {
      delaySec: 5,
      maxErrors: 2,
      autoFading: 'enabled'
    };

    const savedCards = localStorage.getItem('cm_cards');
    this.cards = savedCards ? JSON.parse(savedCards) : DEFAULT_CARDS;

    const savedLogs = localStorage.getItem('cm_research_logs');
    this.researchLogs = savedLogs ? JSON.parse(savedLogs) : [];
  }

  saveCards() {
    localStorage.setItem('cm_cards', JSON.stringify(this.cards));
  }

  saveRules() {
    localStorage.setItem('cm_palette_key', this.colorPaletteKey);
    localStorage.setItem('cm_scaffolding', JSON.stringify(this.scaffoldingRules));
  }

  saveLogs() {
    localStorage.setItem('cm_research_logs', JSON.stringify(this.researchLogs));
  }

  getColorConfig(colorKey) {
    const palette = DEFAULT_PALETTES[this.colorPaletteKey] || DEFAULT_PALETTES.calmPastel;
    return palette.colors[colorKey] || { hex: '#94A3B8', soft: '#F1F5F9', meaning: 'Chưa đặt' };
  }

  getCurrentPalette() {
    return DEFAULT_PALETTES[this.colorPaletteKey] || DEFAULT_PALETTES.calmPastel;
  }
}

// Global Singleton State
window.appState = new AppState();
