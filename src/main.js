/**
 * ============================================================================
 * MAIN APPLICATION ENTRY POINT (COLORMIND ASD)
 * Điều phối ứng dụng, gắn kết sự kiện và quản lý chuyển đổi chế độ Trẻ/Giáo viên
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Khởi tạo ColorMind ASD App...');

  // 1. Gắn kết nút chuyển đổi Chế độ Trẻ <-> Giáo viên
  const toggleRoleBtn = document.getElementById('toggleRoleBtn');
  const returnToChildBtn = document.getElementById('returnToChildBtn');
  const childView = document.getElementById('childView');
  const teacherView = document.getElementById('teacherView');
  const currentModeBadge = document.getElementById('modeBadgeText');
  const roleBtnText = document.getElementById('roleBtnText');

  function switchToTeacherMode() {
    childView.classList.remove('active');
    teacherView.classList.add('active');
    currentModeBadge.textContent = 'Cổng Quản Trị Nghiên Cứu: Giáo Viên';
    roleBtnText.textContent = 'Màn Hình Trẻ Học';
    window.appState.currentView = 'teacher';

    // Cập nhật các bảng số liệu giáo viên
    window.contentManager.renderCardsTable();
    window.spssExporter.renderKPIs();
    window.spssExporter.renderLogTable();
  }

  function switchToChildMode() {
    teacherView.classList.remove('active');
    childView.classList.add('active');
    currentModeBadge.textContent = 'Chế độ Can thiệp: Trẻ 5–6 Tuổi';
    roleBtnText.textContent = 'Cổng Giáo Viên';
    window.appState.currentView = 'child';

    // Khởi động lại màn chơi hiện tại
    launchActiveGame();
  }

  toggleRoleBtn.addEventListener('click', () => {
    if (window.appState.currentView === 'child') {
      switchToTeacherMode();
    } else {
      switchToChildMode();
    }
  });

  returnToChildBtn.addEventListener('click', () => {
    switchToChildMode();
  });

  // 2. Chuyển đổi giữa 3 Trò chơi Nhận thức (Tabs)
  const gameTabs = document.querySelectorAll('.game-tab');
  const stages = {
    matching: document.getElementById('stageMatching'),
    sorting: document.getElementById('stageSorting'),
    sequence: document.getElementById('stageSequence')
  };

  const instructionText = document.getElementById('instructionText');

  function selectGame(gameKey) {
    window.appState.activeGame = gameKey;
    gameTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.game === gameKey);
    });

    Object.keys(stages).forEach(key => {
      stages[key].classList.toggle('active', key === gameKey);
    });

    if (gameKey === 'matching') {
      instructionText.textContent = 'Hãy ghép hình có cùng mã màu vào ô tương ứng nhé!';
    } else if (gameKey === 'sorting') {
      instructionText.textContent = 'Hãy xếp đồ vật vào đúng Khay có cùng mã màu nhé!';
    } else if (gameKey === 'sequence') {
      instructionText.textContent = 'Quan sát chuỗi nhịp sáng của các mã màu rồi bấm lại theo đúng thứ tự!';
    }

    launchActiveGame();
  }

  gameTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      selectGame(tab.dataset.game);
    });
  });

  // 3. Chuyển đổi Cấp độ Gợi ý Mã màu (Scaffolding Level)
  const promptButtons = [
    document.getElementById('promptLvl1Btn'),
    document.getElementById('promptLvl2Btn'),
    document.getElementById('promptLvl3Btn')
  ];

  promptButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      promptButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.appState.promptLevel = parseInt(btn.dataset.promptLevel, 10);
      console.log('Mức gợi ý mã màu đã chọn:', window.appState.promptLevel);
      launchActiveGame();
    });
  });

  // 4. Nút Bài tiếp theo trong Modal Chúc mừng
  const nextCardBtn = document.getElementById('nextCardBtn');
  const celebrationOverlay = document.getElementById('celebrationOverlay');

  nextCardBtn.addEventListener('click', () => {
    celebrationOverlay.classList.remove('show');
    launchActiveGame();
  });

  // 5. Nút Hướng dẫn âm thanh
  const replayInstructionBtn = document.getElementById('replayInstructionBtn');
  replayInstructionBtn.addEventListener('click', () => {
    window.audioEngine.playHint();
  });

  // 6. Chuyển đổi Tab trong Sidebar Giáo viên
  const teacherNavItems = document.querySelectorAll('.teacher-nav .nav-item');
  const teacherPanels = {
    content: document.getElementById('tabPanelContent'),
    colorRules: document.getElementById('tabPanelColorRules'),
    scaffolding: document.getElementById('tabPanelScaffolding'),
    analytics: document.getElementById('tabPanelAnalytics')
  };

  teacherNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabKey = item.dataset.teacherTab;
      teacherNavItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      Object.keys(teacherPanels).forEach(key => {
        teacherPanels[key].classList.toggle('active', key === tabKey);
      });
    });
  });

  // 7. Hàm kích hoạt màn chơi
  function launchActiveGame() {
    const game = window.appState.activeGame;
    if (game === 'matching') {
      window.matchingGame.startRound();
    } else if (game === 'sorting') {
      window.sortingGame.startRound();
    } else if (game === 'sequence') {
      window.sequenceGame.startRound();
    }
  }

  // Khởi động màn chơi mặc định ban đầu
  launchActiveGame();
});
