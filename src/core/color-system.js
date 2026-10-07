/**
 * ============================================================================
 * COLOR SYSTEM - HỆ THỐNG MÃ MÀU SƯ PHẠM
 * Quản lý ánh xạ màu sắc, cập nhật biến CSS và chuyển đổi quy ước
 * ============================================================================
 */

class ColorSystem {
  constructor() {
    this.updateCssVariables();
  }

  updateCssVariables() {
    const palette = window.appState.getCurrentPalette();
    const root = document.documentElement;

    for (const [key, val] of Object.entries(palette.colors)) {
      root.style.setProperty(`--code-${key}`, val.hex);
      root.style.setProperty(`--code-${key}-soft`, val.soft);
    }
  }

  getColorHex(colorKey) {
    const config = window.appState.getColorConfig(colorKey);
    return config.hex;
  }

  getColorSoft(colorKey) {
    const config = window.appState.getColorConfig(colorKey);
    return config.soft;
  }

  getColorNameVi(colorKey) {
    const names = {
      blue: 'Xanh Dương',
      yellow: 'Màu Vàng',
      green: 'Xanh Lá',
      red: 'Màu Đỏ'
    };
    return names[colorKey] || colorKey;
  }
}

// Global Singleton ColorSystem
window.colorSystem = new ColorSystem();
