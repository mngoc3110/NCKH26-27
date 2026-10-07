/**
 * ============================================================================
 * SPSS & RESEARCH EXPORTER (TRÍCH XUẤT DỮ LIỆU NCKH 1-CLICK)
 * Giúp giáo viên & nhà nghiên cứu xuất dữ liệu sạch chuẩn SPSS/Excel
 * để viết báo cáo kết quả thực nghiệm mà không cần viết lệnh SQL hay nhờ IT
 * ============================================================================
 */

class SpssExporter {
  constructor() {
    this.tableBodyEl = document.getElementById('researchLogTableBody');
    this.exportBtnEl = document.getElementById('exportCsvSpssBtn');
    this.clearBtnEl = document.getElementById('clearLogsBtn');

    this.bindEvents();
    this.renderKPIs();
    this.renderLogTable();

    // Lắng nghe cập nhật khi trẻ vừa hoàn thành 1 lượt chơi
    window.addEventListener('research-log-updated', () => {
      this.renderKPIs();
      this.renderLogTable();
    });
  }

  bindEvents() {
    if (this.exportBtnEl) {
      this.exportBtnEl.addEventListener('click', () => this.exportToSpssCsv());
    }
    if (this.clearBtnEl) {
      this.clearBtnEl.addEventListener('click', () => this.clearAllLogs());
    }
  }

  renderKPIs() {
    const stats = window.researchLogger.getStatistics();
    const totalEl = document.getElementById('kpiTotalTrials');
    const accEl = document.getElementById('kpiAvgAccuracy');
    const rtEl = document.getElementById('kpiAvgReaction');
    const helpEl = document.getElementById('kpiHelpRate');

    if (totalEl) totalEl.textContent = stats.total;
    if (accEl) accEl.textContent = stats.avgAccuracy;
    if (rtEl) rtEl.textContent = stats.avgReactionSec;
    if (helpEl) helpEl.textContent = stats.helpRate;
  }

  renderLogTable() {
    if (!this.tableBodyEl) return;
    this.tableBodyEl.innerHTML = '';
    const logs = window.appState.researchLogs;

    if (logs.length === 0) {
      this.tableBodyEl.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px">
            Chưa có lượt thực nghiệm nào được ghi nhận. Hãy cho trẻ chơi thử ở màn hình Trẻ em!
          </td>
        </tr>
      `;
      return;
    }

    logs.slice(0, 50).forEach((log, idx) => {
      const tr = document.createElement('tr');
      const outcomeBadge = log.outcome === 'SUCCESS_1ST' 
        ? '<span class="badge-tag tag-success">Đúng lần 1</span>'
        : log.outcome === 'SUCCESS_ASSISTED'
        ? '<span class="badge-tag tag-warning">Cần hỗ trợ</span>'
        : '<span class="badge-tag">Chưa đạt</span>';

      tr.innerHTML = `
        <td><strong>#${log.trialId}</strong></td>
        <td>${log.childId}</td>
        <td><code>${log.taskType}</code></td>
        <td><span style="font-weight:700; color: ${window.colorSystem.getColorHex(log.colorCode)}">${log.colorCode}</span></td>
        <td>L${log.promptLevel}</td>
        <td><strong>${log.reactionTimeMs} ms</strong></td>
        <td>${log.errorCount}</td>
        <td>${outcomeBadge}</td>
        <td><small>${log.timestamp}</small></td>
      `;
      this.tableBodyEl.appendChild(tr);
    });
  }

  exportToSpssCsv() {
    const logs = window.appState.researchLogs;
    if (logs.length === 0) {
      alert('Hiện chưa có dữ liệu thực nghiệm để xuất file! Vui lòng cho trẻ thực hiện một số bài tập trước.');
      return;
    }

    // Tiêu đề cột chuẩn hóa phục vụ phân tích SPSS / JASP
    // Trial_ID, Child_ID, Task_Type, Color_Code, Prompt_Level, Reaction_Time_ms, Error_Count, Outcome_Code, Timestamp
    let csvContent = "\uFEFF"; // UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn không lỗi font
    csvContent += "Trial_ID,Child_ID,Task_Type,Color_Code,Prompt_Level,Reaction_Time_ms,Error_Count,Outcome_Code,Timestamp\n";

    logs.forEach(l => {
      // Mã hóa biến Outcome: 1 = Thành công độc lập, 2 = Thành công có hỗ trợ, 0 = Không đạt
      const outcomeNumeric = l.outcome === 'SUCCESS_1ST' ? 1 : l.outcome === 'SUCCESS_ASSISTED' ? 2 : 0;
      csvContent += `${l.trialId},${l.childId},${l.taskType},${l.colorCode},${l.promptLevel},${l.reactionTimeMs},${l.errorCount},${outcomeNumeric},"${l.timestamp}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestampStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `NCKH_ASD_ColorCoding_Dataset_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Đã xuất thành công ${logs.length} bản ghi thực nghiệm chuẩn SPSS! Tệp CSV đã được tải về máy của bạn.`);
  }

  clearAllLogs() {
    if (confirm('Cô có chắc chắn muốn đặt lại (xóa toàn bộ) nhật ký thực nghiệm hiện tại không?')) {
      window.researchLogger.clearLogs();
    }
  }
}

// Global Singleton SpssExporter
window.spssExporter = new SpssExporter();
