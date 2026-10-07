/**
 * ============================================================================
 * TANGIBLE COLOR OBJECT & HAND RECOGNITION (TUI ENGINE)
 * Trẻ cầm khối màu bên ngoài giơ lên trước Camera - Hệ thống tự biết đúng/sai
 * KHÔNG CẦN CHẠM MÀN HÌNH - KHÔNG CÒN CON TRỎ TRÔI LUNG TUNG - KHÁNG 100% QUẠT MÁY
 * ============================================================================
 */

class TangibleColorController {
  constructor() {
    this.isActive = false;
    this.stream = null;
    this.videoEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.toggleBtn = null;
    this.guideBanner = null;

    // Các phần tử giao diện quét vật thể (HUD)
    this.portalOverlay = null;
    this.scanTargetBox = null;
    this.detectedTextEl = null;
    this.detectedColorCircle = null;
    this.progressBarEl = null;

    // Trạng thái nhận diện thời gian thực
    this.detectedColor = null; // 'blue' | 'yellow' | 'green' | 'red' | null
    this.holdingColor = null;
    this.holdStartTime = 0;
    this.holdDurationRequired = 800; // Giữ khối màu ổn định 0.8s để nộp bài
    this.isTriggered = false;

    // Vòng lặp camera
    this.animFrameId = null;

    this.initDOM();
  }

  initDOM() {
    this.videoEl = document.getElementById('portalVideoElem');
    this.canvasEl = document.getElementById('portalCanvasElem');
    this.portalOverlay = document.getElementById('tangiblePortalOverlay');
    this.scanTargetBox = document.getElementById('scanTargetBox');
    this.detectedTextEl = document.getElementById('detectedColorText');
    this.detectedColorCircle = document.getElementById('detectedColorCircle');
    this.progressBarEl = document.getElementById('portalProgressBar');
    this.toggleBtn = document.getElementById('cameraToggleBtn');
    this.guideBanner = document.getElementById('tangibleGuideBanner');
    const closeBtn = document.getElementById('closePortalBtn');

    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext('2d', { willReadFrequently: true });
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleCamera());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.stopCamera());
    }
  }

  async toggleCamera() {
    if (this.isActive) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Trình duyệt hoặc thiết bị của bạn không hỗ trợ truy cập Camera!');
        return;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoEl.srcObject = this.stream;
      await this.videoEl.play();

      this.canvasEl.width = 320;
      this.canvasEl.height = 240;

      this.isActive = true;
      this.isTriggered = false;
      this.portalOverlay.classList.add('active');
      
      if (this.toggleBtn) {
        this.toggleBtn.classList.add('active');
        this.toggleBtn.innerHTML = '<span>📷</span> <span>Tắt Quét Vật Thể</span>';
      }
      if (this.guideBanner) {
        this.guideBanner.classList.add('show');
      }

      // Ẩn vĩnh viễn con trỏ chuột trôi dạt cũ (nếu có)
      const oldCursor = document.getElementById('virtualHandCursor');
      if (oldCursor) oldCursor.style.display = 'none';

      // Khởi động vòng lặp nhận diện vật thể màu bão hòa cao
      this.processScanLoop();
      console.log('[Tangible Engine] Đã kích hoạt quét vật thể mã màu trên tay');

    } catch (err) {
      console.warn('Lỗi mở Camera:', err);
      alert('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera cho trình duyệt!');
      this.stopCamera();
    }
  }

  stopCamera() {
    this.isActive = false;
    cancelAnimationFrame(this.animFrameId);

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.portalOverlay) this.portalOverlay.classList.remove('active');
    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('active');
      this.toggleBtn.innerHTML = '<span>📷</span> <span>Bật Quét Vật Thể</span>';
    }
    if (this.guideBanner) {
      this.guideBanner.classList.remove('show');
    }

    this.resetDetectionState();
  }

  resetDetectionState() {
    this.holdingColor = null;
    this.holdStartTime = 0;
    this.isTriggered = false;
    if (this.progressBarEl) this.progressBarEl.style.width = '0%';
    if (this.scanTargetBox) this.scanTargetBox.classList.remove('locked');
    if (this.detectedTextEl) this.detectedTextEl.textContent = 'Đang chờ khối màu...';
    if (this.detectedColorCircle) this.detectedColorCircle.style.backgroundColor = '#CBD5E1';
  }

  // VÒNG LẶP NHẬN DIỆN MÀU SẮC ĐỒ CHƠI / VẬT THỂ TRONG VÙNG TÂM NGẮM
  processScanLoop() {
    if (!this.isActive) return;

    if (this.videoEl.readyState >= 2) {
      const w = this.canvasEl.width;
      const h = this.canvasEl.height;

      // 1. Vẽ video vào canvas nội bộ
      this.ctx.drawImage(this.videoEl, 0, 0, w, h);

      // 2. Chỉ phân tích VÙNG TÂM NGẮM (Target Scan Zone: 40% trung tâm khung hình)
      // Loại bỏ hoàn toàn 60% diện tích viền xung quanh (nơi có quạt máy, đèn trần, tường)
      const boxW = Math.round(w * 0.45);
      const boxH = Math.round(h * 0.45);
      const startX = Math.round((w - boxW) / 2);
      const startY = Math.round((h - boxH) / 2);

      const frameData = this.ctx.getImageData(startX, startY, boxW, boxH);
      const data = frameData.data;

      // Đếm số lượng pixel của 4 màu sắc bão hòa cao (Vật thể đồ chơi)
      const colorVotes = {
        red: 0,
        yellow: 0,
        green: 0,
        blue: 0
      };

      for (let i = 0; i < data.length; i += 8) { // Bước 2 pixel để cực nhanh và mượt
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const classified = this.classifyHighSaturationColor(r, g, b);
        if (classified) {
          colorVotes[classified]++;
        }
      }

      // Tìm màu chiếm ưu thế lớn nhất trong ô tâm ngắm
      const minRequiredPixels = Math.round((boxW * boxH) / 40); // Cần ít nhất ~5% diện tích là màu đậm
      let dominantColor = null;
      let maxCount = minRequiredPixels;

      for (const [col, count] of Object.entries(colorVotes)) {
        if (count > maxCount) {
          maxCount = count;
          dominantColor = col;
        }
      }

      // Xử lý logic giữ yên để nộp bài
      this.handleColorConfirmation(dominantColor);
    }

    this.animFrameId = requestAnimationFrame(() => this.processScanLoop());
  }

  // PHÂN LOẠI MÀU SẮC VẬT THỂ BẰNG KHÔNG GIAN MÀU HSV (LOẠI BỎ KHUÔN MẶT & ĐỒ GIA DỤNG)
  classifyHighSaturationColor(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // Nếu quá tối hoặc màu quá nhờn nhạt (S < 0.38) -> Bỏ qua (Khuôn mặt, tường, quạt đều bị loại bỏ ở đây!)
    if (max < 65) return null; // Quá tối
    const s = max === 0 ? 0 : delta / max;
    if (s < 0.38) return null; // Độ bão hòa thấp (màu da người, tường nhà, quạt máy)

    // Tính góc Hue (0 đến 360 độ)
    let h = 0;
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6;
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    // Phân loại dải màu đồ chơi đặc trưng:
    // 1. MÀU ĐỎ (Red): 0 - 22 độ hoặc 335 - 360 độ
    if ((h >= 0 && h <= 22) || (h >= 335 && h <= 360)) {
      if (r > 110) return 'red';
    }

    // 2. MÀU VÀNG (Yellow): 35 - 68 độ (R và G đều cao, B thấp)
    if (h >= 35 && h <= 68) {
      if (r > 120 && g > 110) return 'yellow';
    }

    // 3. MÀU XANH LÁ (Green): 75 - 165 độ
    if (h >= 75 && h <= 165) {
      if (g > 90) return 'green';
    }

    // 4. MÀU XANH DƯƠNG (Blue): 180 - 255 độ
    if (h >= 180 && h <= 255) {
      if (b > 90) return 'blue';
    }

    return null;
  }

  // XỬ LÝ XÁC NHẬN KHI TRẺ GIỮ KHỐI MÀU TRONG TÂM NGẮM
  handleColorConfirmation(detectedCol) {
    const colorNamesVi = {
      blue: 'Xanh Dương 🔵',
      yellow: 'Màu Vàng 🟡',
      green: 'Xanh Lá 🟢',
      red: 'Màu Đỏ 🔴'
    };

    if (detectedCol) {
      const hex = window.colorSystem.getColorHex(detectedCol);
      this.detectedTextEl.textContent = colorNamesVi[detectedCol];
      this.detectedColorCircle.style.backgroundColor = hex;
      this.scanTargetBox.classList.add('locked');
      this.scanTargetBox.style.setProperty('--detected-color-hex', hex);

      if (this.holdingColor === detectedCol) {
        // Tiếp tục giữ đúng màu này -> tăng thanh tiến trình
        const elapsed = performance.now() - this.holdStartTime;
        const progressPct = Math.min(100, Math.round((elapsed / this.holdDurationRequired) * 100));
        this.progressBarEl.style.width = `${progressPct}%`;
        this.progressBarEl.style.backgroundColor = hex;

        if (elapsed >= this.holdDurationRequired && !this.isTriggered) {
          // HOÀN THÀNH: TỰ ĐỘNG NỘP BÀI VÀ KIỂM TRA ĐÚNG/SAI!
          this.isTriggered = true;
          this.submitAnswerWithColor(detectedCol);
        }
      } else {
        // Bắt đầu giơ màu mới
        this.holdingColor = detectedCol;
        this.holdStartTime = performance.now();
        this.isTriggered = false;
        this.progressBarEl.style.width = '10%';
      }
    } else {
      // Khi không có khối màu nào trong ô tâm ngắm
      this.holdingColor = null;
      this.holdStartTime = 0;
      this.progressBarEl.style.width = '0%';
      this.scanTargetBox.classList.remove('locked');
      this.detectedTextEl.textContent = 'Đang chờ khối màu...';
      this.detectedColorCircle.style.backgroundColor = '#CBD5E1';
    }
  }

  // KIỂM TRA ĐÁP ÁN THEO TRÒ CHƠI HIỆN TẠI VÀ CHUYỂN BÀI
  submitAnswerWithColor(submittedColorKey) {
    const activeGame = window.appState.activeGame;

    if (activeGame === 'matching') {
      // Màn 1: Ghép cặp tương đồng
      const targetCard = window.matchingGame.targetCard;
      if (!targetCard) return;

      if (submittedColorKey === targetCard.color) {
        // ĐÚNG: Tìm thẻ đúng và tự động click
        console.log('[Tangible Engine] Bé giơ đúng khối màu của thẻ:', submittedColorKey);
        const correctCardEl = document.querySelector(`.option-card[data-card-id="${targetCard.id}"]`);
        if (correctCardEl) {
          correctCardEl.click();
        }
      } else {
        // SAI: Âm thanh êm dịu nhắc nhở
        console.log('[Tangible Engine] Chưa đúng mã màu:', submittedColorKey, 'Cần:', targetCard.color);
        window.audioEngine.playGentleWrong();
        window.researchLogger.recordError();
        this.flashWrongBorder();
      }

    } else if (activeGame === 'sorting') {
      // Màn 2: Phân loại danh mục theo khay
      const currentItem = window.sortingGame.currentItem;
      if (!currentItem) return;

      if (submittedColorKey === currentItem.color) {
        console.log('[Tangible Engine] Bé giơ đúng màu khay phân loại:', submittedColorKey);
        const correctBasketEl = document.querySelector(`.sorting-basket[data-category-id="${currentItem.category}"]`);
        if (correctBasketEl) {
          correctBasketEl.click();
        }
      } else {
        window.audioEngine.playGentleWrong();
        window.researchLogger.recordError();
        this.flashWrongBorder();
      }

    } else if (activeGame === 'sequence') {
      // Màn 3: Chuỗi trí nhớ màu
      console.log('[Tangible Engine] Bé nộp màu chuỗi trí nhớ:', submittedColorKey);
      window.sequenceGame.handleUserColorInput(submittedColorKey);
    }

    // Sau 1.2s cho phép nhận diện tiếp
    setTimeout(() => {
      this.isTriggered = false;
      this.holdingColor = null;
      this.progressBarEl.style.width = '0%';
    }, 1200);
  }

  flashWrongBorder() {
    this.scanTargetBox.style.setProperty('--detected-color-hex', '#EF4444');
    setTimeout(() => {
      this.scanTargetBox.classList.remove('locked');
    }, 400);
  }
}

// Khởi tạo Singleton
document.addEventListener('DOMContentLoaded', () => {
  window.tangibleColorController = new TangibleColorController();
});
