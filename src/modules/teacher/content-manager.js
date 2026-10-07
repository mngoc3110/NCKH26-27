/**
 * ============================================================================
 * TEACHER CONTENT MANAGER (QUẢN TRỊ HỌC LIỆU NO-CODE)
 * Giúp giáo viên tự do thêm/xóa thẻ bài học liệu mà không cần phụ thuộc IT
 * Sửa lỗi xóa thẻ: Dùng Event Delegation và xác nhận 2 chạm (không bị chặn pop-up)
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

    // Bắt sự kiện xóa bằng Event Delegation an toàn 100%
    if (this.tableBodyEl) {
      this.tableBodyEl.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-card-btn');
        if (deleteBtn) {
          const cardId = deleteBtn.dataset.cardId;
          this.handleDeleteClick(cardId, deleteBtn);
        }
      });
    }
  }

  renderCardsTable() {
    if (!this.tableBodyEl) return;
    this.tableBodyEl.innerHTML = '';
    const cards = window.appState.cards;

    if (!cards || cards.length === 0) {
      this.tableBodyEl.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px">
            Kho học liệu hiện đang trống. Cô hãy bấm nút "Thêm Thẻ Học Liệu Mới" để tạo bài!
          </td>
        </tr>
      `;
      return;
    }

    cards.forEach((card) => {
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
          <button class="btn btn-outline delete-card-btn" 
            data-card-id="${card.id}"
            style="padding: 5px 12px; font-size: 0.82rem; color: #DC2626; border-color: #FECACA; background: #FEF2F2;"
            title="Bấm để xóa thẻ bài này">
            🗑️ Xóa
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
      id: 'c_' + Date.now().toString().slice(-6),
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

    // Thông báo mềm
    console.log(`Đã thêm thành công thẻ "${name}" vào kho học liệu!`);
  }

  // Cơ chế Xóa Thẻ 2 Chạm An Toàn (Không bao giờ bị trình duyệt chặn pop-up confirm)
  handleDeleteClick(cardId, btnEl) {
    if (btnEl.classList.contains('confirming-delete')) {
      // Chạm lần 2: XÓA NGAY LẬP TỨC
      window.appState.cards = window.appState.cards.filter(c => c.id !== cardId);
      window.appState.saveCards();
      this.renderCardsTable();
      console.log(`Đã xóa thẻ ID: ${cardId}`);
    } else {
      // Chạm lần 1: Đổi nút sang trạng thái xác nhận đỏ
      btnEl.classList.add('confirming-delete');
      btnEl.style.background = '#DC2626';
      btnEl.style.color = '#FFFFFF';
      btnEl.style.borderColor = '#DC2626';
      btnEl.innerHTML = '⚠️ Xác nhận xóa?';

      // Sau 3.5 giây nếu không bấm lại sẽ tự hủy để tránh xóa nhầm
      setTimeout(() => {
        if (document.body.contains(btnEl) && btnEl.classList.contains('confirming-delete')) {
          btnEl.classList.remove('confirming-delete');
          btnEl.style.background = '#FEF2F2';
          btnEl.style.color = '#DC2626';
          btnEl.style.borderColor = '#FECACA';
          btnEl.innerHTML = '🗑️ Xóa';
        }
      }, 3500);
    }
  }

  deleteCard(cardId) {
    window.appState.cards = window.appState.cards.filter(c => c.id !== cardId);
    window.appState.saveCards();
    this.renderCardsTable();
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
