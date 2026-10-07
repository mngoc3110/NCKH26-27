/**
 * ============================================================================
 * TEACHER CONTENT MANAGER (QUẢN TRỊ HỌC LIỆU NO-CODE)
 * Giúp giáo viên tự do thêm/xóa thẻ bài học liệu mà không cần phụ thuộc IT
 * ============================================================================
 */

class ContentManager {
  constructor() {
    this.tableBodyEl = document.getElementById('cardsTableBody');
    this.modalEl = document.getElementById('cardModal');
    this.formEl = document.getElementById('cardForm');
    this.addBtnEl = document.getElementById('addNewCardBtn');
    this.closeBtnEl = document.getElementById('closeCardModalBtn');
    this.cancelBtnEl = document.getElementById('cancelCardModalBtn');
    this.excelTplBtnEl = document.getElementById('exportExcelTemplateBtn');

    this.bindEvents();
    this.renderCardsTable();
  }

  bindEvents() {
    if (this.addBtnEl) {
      this.addBtnEl.addEventListener('click', () => this.openAddModal());
    }
    if (this.closeBtnEl) {
      this.closeBtnEl.addEventListener('click', () => this.closeModal());
    }
    if (this.cancelBtnEl) {
      this.cancelBtnEl.addEventListener('click', () => this.closeModal());
    }
    if (this.formEl) {
      this.formEl.addEventListener('submit', (e) => this.handleSaveCard(e));
    }
    if (this.excelTplBtnEl) {
      this.excelTplBtnEl.addEventListener('click', () => this.downloadExcelTemplate());
    }
  }

  renderCardsTable() {
    if (!this.tableBodyEl) return;
    this.tableBodyEl.innerHTML = '';
    const cards = window.appState.cards;

    cards.forEach((card, idx) => {
      const tr = document.createElement('tr');
      const colorHex = window.colorSystem.getColorHex(card.color);
      const categoryNames = {
        fruit: 'Hoa quả (Trái cây)',
        animal: 'Động vật (Thú cưng)',
        vehicle: 'Phương tiện giao thông',
        school: 'Đồ dùng học tập'
      };

      tr.innerHTML = `
        <td><span style="font-size: 1.8rem">${card.emoji}</span></td>
        <td><strong>${card.name}</strong></td>
        <td><span class="badge-tag">${categoryNames[card.category] || card.category}</span></td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 6px">
            <span style="width: 14px; height: 14px; border-radius: 50%; background: ${colorHex}"></span>
            ${window.colorSystem.getColorNameVi(card.color)}
          </span>
        </td>
        <td>Cấp ${card.difficulty || 1}</td>
        <td>
          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #DC2626; border-color: #FECACA" 
            onclick="window.contentManager.deleteCard('${card.id}')">
            Xóa
          </button>
        </td>
      `;
      this.tableBodyEl.appendChild(tr);
    });
  }

  openAddModal() {
    this.formEl.reset();
    this.modalEl.classList.add('show');
  }

  closeModal() {
    this.modalEl.classList.remove('show');
  }

  handleSaveCard(e) {
    e.preventDefault();
    const name = document.getElementById('cardNameInput').value.trim();
    const emoji = document.getElementById('cardEmojiInput').value.trim();
    const category = document.getElementById('cardCategorySelect').value;
    const color = document.getElementById('cardColorSelect').value;

    const newCard = {
      id: 'c_' + Date.now().toString().slice(-5),
      name: name,
      emoji: emoji,
      category: category,
      color: color,
      difficulty: 1
    };

    window.appState.cards.unshift(newCard);
    window.appState.saveCards();

    this.renderCardsTable();
    this.closeModal();

    alert(`Đã thêm thành công thẻ "${name}" vào kho học liệu! Giáo viên có thể cho trẻ học ngay lập tức.`);
  }

  deleteCard(cardId) {
    if (confirm('Cô có chắc chắn muốn xóa thẻ bài học liệu này không?')) {
      window.appState.cards = window.appState.cards.filter(c => c.id !== cardId);
      window.appState.saveCards();
      this.renderCardsTable();
    }
  }

  // Tải mẫu Excel để giáo viên nhập bài học hàng loạt
  downloadExcelTemplate() {
    const csvContent = "\uFEFF" + 
      "Ten_Vat_Pham,Bieu_Tuong_Emoji,DanhMuc,Ma_Mau_Quy_Uoc,Cap_Do\n" +
      "Quả Cam,🍊,fruit,yellow,1\n" +
      "Trực Thăng,🚁,vehicle,blue,1\n" +
      "Con Thỏ,🐰,animal,green,1\n" +
      "Thước Kẻ,📐,school,red,2\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Mau_Hoc_Lieu_NoCode_GDDB.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Global Singleton ContentManager
window.contentManager = new ContentManager();
