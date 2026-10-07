/**
 * ============================================================================
 * RESEARCH LOGGER - BỘ GHI NHẬT KÝ THỰC NGHIỆM SƯ PHẠM
 * Tự động đo thời gian phản hồi (RT), số lần thử sai và mức độ hỗ trợ
 * Phục vụ báo cáo định lượng NCKH chuẩn SPSS / JASP
 * ============================================================================
 */

class ResearchLogger {
  constructor() {
    this.currentTrial = null;
  }

  startTrial(taskType, colorCode, promptLevel) {
    this.currentTrial = {
      trialId: 'TR_' + Date.now().toString().slice(-6),
      childId: window.appState.activeChild.id,
      taskType: taskType,
      colorCode: colorCode,
      promptLevel: promptLevel,
      startTime: performance.now(),
      errorCount: 0,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }

  recordError() {
    if (this.currentTrial) {
      this.currentTrial.errorCount += 1;
    }
  }

  completeTrial(isSuccess) {
    if (!this.currentTrial) return null;

    const endTime = performance.now();
    const reactionTimeMs = Math.round(endTime - this.currentTrial.startTime);

    let outcome = 'FAILED';
    if (isSuccess) {
      outcome = this.currentTrial.errorCount === 0 ? 'SUCCESS_1ST' : 'SUCCESS_ASSISTED';
    }

    const logEntry = {
      ...this.currentTrial,
      reactionTimeMs: reactionTimeMs,
      outcome: outcome
    };

    window.appState.researchLogs.unshift(logEntry);
    // Giới hạn lưu 500 bản ghi
    if (window.appState.researchLogs.length > 500) {
      window.appState.researchLogs.pop();
    }
    window.appState.saveLogs();

    this.currentTrial = null;

    // Kích hoạt sự kiện để Dashboard giáo viên tự cập nhật nếu đang mở
    window.dispatchEvent(new CustomEvent('research-log-updated', { detail: logEntry }));
    return logEntry;
  }

  getStatistics() {
    const logs = window.appState.researchLogs;
    const total = logs.length;
    if (total === 0) {
      return { total: 0, avgAccuracy: '0%', avgReactionSec: '0s', helpRate: '0%' };
    }

    const success1st = logs.filter(l => l.outcome === 'SUCCESS_1ST').length;
    const avgAccuracy = Math.round((success1st / total) * 100) + '%';

    const sumRT = logs.reduce((acc, l) => acc + l.reactionTimeMs, 0);
    const avgReactionSec = (sumRT / total / 1000).toFixed(1) + 's';

    const assisted = logs.filter(l => l.promptLevel < 3 || l.errorCount > 0).length;
    const helpRate = Math.round((assisted / total) * 100) + '%';

    return { total, avgAccuracy, avgReactionSec, helpRate };
  }

  clearLogs() {
    window.appState.researchLogs = [];
    window.appState.saveLogs();
    window.dispatchEvent(new CustomEvent('research-log-updated'));
  }
}

// Global Singleton ResearchLogger
window.researchLogger = new ResearchLogger();
