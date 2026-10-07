/**
 * ============================================================================
 * 3D AI HAND GESTURE & PINCH/DWELL INTERACTION CONTROLLER
 * Sử dụng Google MediaPipe Hands nhận diện 21 khớp xương bàn tay 3D theo thời gian thực
 * - KHÔNG CÓ BÀN TAY: ẨN HOÀN TOÀN CON TRỎ, TUYỆT ĐỐI KHÔNG TRÔI LUNG TUNG
 * - CÓ BÀN TAY: Vẽ khung xương AI trực tiếp trên camera preview
 * - CỬ CHỈ 1 (Pinch Click): Chụm ngón cái và ngón trỏ để Click tức thì
 * - CỬ CHỈ 2 (Dwell Click): Giữ bàn tay trên thẻ bài 1 giây để Click tự động
 * - Lọc rung (Anti-jitter smoothing & Deadzone) giúp con trỏ cực kỳ ổn định
 * ============================================================================
 */

class AiHandGestureController {
  constructor() {
    this.isActive = false;
    this.hands = null;
    this.cameraHelper = null;
    this.videoEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.cursorEl = null;
    this.cursorIconEl = null;
    this.statusDotEl = null;
    this.statusTextEl = null;
    this.toggleBtn = null;
    this.previewBox = null;
    this.guideBanner = null;

    // Tọa độ làm mượt (Smoothing & Deadzone)
    this.handX = window.innerWidth / 2;
    this.handY = window.innerHeight / 2;
    this.targetX = this.handX;
    this.targetY = this.handY;

    // Quản lý Pinch Click (Chụm ngón tay)
    this.isPinching = false;
    this.lastPinchTime = 0;
    this.pinchCooldownMs = 600;

    // Quản lý Dwell Click (Giữ tay 1 giây)
    this.dwellTargetEl = null;
    this.dwellStartTime = 0;
    this.dwellThresholdMs = 1000; // 1 giây

    this.initDOM();
  }

  initDOM() {
    this.videoEl = document.getElementById('aiVideoFeed');
    this.canvasEl = document.getElementById('aiSkeletonCanvas');
    this.cursorEl = document.getElementById('virtualAiHandCursor');
    this.cursorIconEl = document.getElementById('cursorIconSymbol');
    this.statusDotEl = document.getElementById('aiStatusDot');
    this.statusTextEl = document.getElementById('aiStatusText');
    this.previewBox = document.getElementById('aiGesturePreviewBox');
    this.toggleBtn = document.getElementById('cameraToggleBtn');
    this.guideBanner = document.getElementById('aiGestureGuideBanner');
    const closeBtn = document.getElementById('closeAiGestureBtn');

    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext('2d');
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleGestureMode());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.stopGestureMode());
    }
  }

  async toggleGestureMode() {
    if (this.isActive) {
      this.stopGestureMode();
    } else {
      await this.startGestureMode();
    }
  }

  async startGestureMode() {
    try {
      this.updateStatus('Đang khởi tạo AI...', 'loading');
      if (this.previewBox) this.previewBox.classList.add('active');
      if (this.guideBanner) this.guideBanner.classList.add('show');
      if (this.toggleBtn) {
        this.toggleBtn.classList.add('active');
        this.toggleBtn.innerHTML = '<span>📷</span> <span>Tắt Cử Chỉ Tay 3D</span>';
      }

      // 1. Đảm bảo thư viện Google MediaPipe Hands đã nạp xong
      await this.ensureMediaPipeLoaded();

      // 2. Khởi tạo mô hình Google MediaPipe Hands AI
      if (!this.hands) {
        this.hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
          maxNumHands: 1,              // Chỉ bắt 1 bàn tay của trẻ/cô giáo
          modelComplexity: 1,           // Độ chính xác cao
          minDetectionConfidence: 0.65, // Ngưỡng tin cậy cao để loại bỏ hoàn toàn quạt/mặt
          minTrackingConfidence: 0.65
        });

        this.hands.onResults((results) => this.onHandTrackingResults(results));
      }

      // 3. Khởi động Camera qua Camera Utils
      if (!this.cameraHelper) {
        this.cameraHelper = new window.Camera(this.videoEl, {
          onFrame: async () => {
            if (this.isActive && this.hands) {
              await this.hands.send({ image: this.videoEl });
            }
          },
          width: 320,
          height: 240
        });
      }

      await this.cameraHelper.start();
      this.isActive = true;
      this.updateStatus('Đang tìm bàn tay...', 'loading');
      console.log('[MediaPipe Hands] Khởi động thành công camera cử chỉ tay 3D');

    } catch (err) {
      console.error('Lỗi khởi động MediaPipe:', err);
      alert('Không thể mở Camera AI. Vui lòng cấp quyền Camera trên trình duyệt và thử lại!');
      this.stopGestureMode();
    }
  }

  // Đảm bảo MediaPipe scripts đã sẵn sàng
  async ensureMediaPipeLoaded() {
    let retries = 0;
    while ((typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') && retries < 40) {
      await new Promise(r => setTimeout(r, 150));
      retries++;
    }
    if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
      throw new Error('Không thể tải thư viện MediaPipe từ CDN');
    }
  }

  stopGestureMode() {
    this.isActive = false;

    if (this.cameraHelper) {
      try { this.cameraHelper.stop(); } catch (e) {}
    }

    if (this.previewBox) this.previewBox.classList.remove('active');
    if (this.guideBanner) this.guideBanner.classList.remove('show');
    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('active');
      this.toggleBtn.innerHTML = '<span>📷</span> <span>Bật Cử Chỉ Tay 3D</span>';
    }

    // ẨN NGAY LẬP TỨC CON TRỎ ẢO
    if (this.cursorEl) {
      this.cursorEl.classList.remove('visible', 'dwelling', 'pinching');
    }
    this.dwellTargetEl = null;
    this.updateStatus('Đã tắt', '');
  }

  updateStatus(text, dotClass) {
    if (this.statusTextEl) this.statusTextEl.textContent = text;
    if (this.statusDotEl) {
      this.statusDotEl.className = 'ai-status-dot ' + (dotClass || '');
    }
  }

  // XỬ LÝ KẾT QUẢ THEO DÕI 21 KHỚP XƯƠNG BÀN TAY (RESULTS CALLBACK)
  onHandTrackingResults(results) {
    if (!this.isActive) return;

    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    // 1. Vẽ khung hình video lên canvas xem trước
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(this.videoEl, 0, 0, w, h);

    // 2. KIỂM TRA XEM CÓ BÀN TAY THẬT TRONG KHUNG HÌNH KHÔNG
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // === CÓ BÀN TAY THẬT ===
      const landmarks = results.multiHandLandmarks[0];

      this.updateStatus('Đang bám bàn tay 🟢', 'tracking');

      // Vẽ toàn bộ 21 khớp xương và đường nối AI lên màn hình camera
      this.renderHandSkeleton(landmarks, w, h);

      // Điểm điều khiển: Đầu ngón tay trỏ (Landmark 8)
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      // Ánh xạ tọa độ sang màn hình máy tính (Lật trục X vì camera là gương)
      const normX = 1 - indexTip.x;
      const normY = indexTip.y;

      const newTargetX = normX * window.innerWidth;
      const newTargetY = normY * window.innerHeight;

      // Deadzone: Nếu khoảng cách di chuyển < 4px -> Giữ nguyên để chống rung tay
      const deltaDist = Math.hypot(newTargetX - this.targetX, newTargetY - this.targetY);
      if (deltaDist > 4) {
        this.targetX = newTargetX;
        this.targetY = newTargetY;
      }

      // Làm mượt chuyển động con trỏ (Exponential Smoothing)
      this.handX += (this.targetX - this.handX) * 0.38;
      this.handY += (this.targetY - this.handY) * 0.38;

      // HIỂN THỊ CON TRỎ VÀ CẬP NHẬT TỌA ĐỘ
      if (this.cursorEl) {
        this.cursorEl.classList.add('visible');
        this.cursorEl.style.left = `${this.handX}px`;
        this.cursorEl.style.top = `${this.handY}px`;
      }

      // 3. NHẬN DIỆN CỬ CHỈ 1: CHỤM NGÓN TAY (PINCH CLICK)
      // Khoảng cách giữa ngón cái (4) và ngón trỏ (8)
      const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
      const isNowPinching = pinchDist < 0.07;

      if (isNowPinching) {
        // Đang chụm 2 ngón tay lại
        this.cursorEl.classList.add('pinching');
        this.cursorIconEl.textContent = '👌';

        const now = performance.now();
        if (!this.isPinching && (now - this.lastPinchTime > this.pinchCooldownMs)) {
          // KÍCH HOẠT PINCH CLICK TỨC THÌ!
          this.lastPinchTime = now;
          this.executeClickAtPosition(this.handX, this.handY, 'Pinch Click');
        }
        this.isPinching = true;
        // Hủy Dwell nếu đang chụm
        this.dwellTargetEl = null;
        this.cursorEl.classList.remove('dwelling');

      } else {
        // Đang mở bàn tay bình thường
        this.isPinching = false;
        this.cursorEl.classList.remove('pinching');
        this.cursorIconEl.textContent = '🖐️';

        // 4. NHẬN DIỆN CỬ CHỈ 2: GIỮ YÊN TRÊN THẺ (DWELL CLICK 1 GIÂY)
        this.checkDwellSelection(this.handX, this.handY);
      }

    } else {
      // === HOÀN TOÀN KHÔNG CÓ BÀN TAY (HOẶC CHỈ CÓ QUẠT QUAY / MẶT NGƯỜI) ===
      this.updateStatus('Đang chờ bàn tay... ⚪', 'loading');

      // ẨN NGAY LẬP TỨC CON TRỎ ẢO! TUYỆT ĐỐI KHÔNG ĐỂ LƯU LẠI HOẶC TRÔI LUNG TUNG!
      if (this.cursorEl) {
        this.cursorEl.classList.remove('visible', 'dwelling', 'pinching');
      }
      this.dwellTargetEl = null;
    }
  }

  // Vẽ 21 khớp xương bàn tay AI
  renderHandSkeleton(landmarks, w, h) {
    // Các cặp nối xương bàn tay chuẩn MediaPipe
    const connections = [
      [0,1],[1,2],[2,3],[3,4],           // Ngón cái
      [0,5],[5,6],[6,7],[7,8],           // Ngón trỏ
      [5,9],[9,10],[10,11],[11,12],      // Ngón giữa
      [9,13],[13,14],[14,15],[15,16],    // Ngón áp út
      [13,17],[17,18],[18,19],[19,20],   // Ngón út
      [0,17]                             // Lòng bàn tay
    ];

    // Vẽ các đường xương màu xanh dạ quang
    this.ctx.strokeStyle = '#38BDF8';
    this.ctx.lineWidth = 3;
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
      this.ctx.stroke();
    });

    // Vẽ 21 điểm mốc khớp ngón tay (Màu xanh lá tươi)
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const x = pt.x * w;
      const y = pt.y * h;
      this.ctx.beginPath();
      this.ctx.arc(x, y, i === 8 ? 6 : 4, 0, Math.PI * 2);
      this.ctx.fillStyle = i === 8 ? '#EF4444' : '#22C55E'; // Đầu ngón trỏ màu đỏ nổi bật
      this.ctx.fill();
    }
  }

  // Kiểm tra giữ bàn tay trên thẻ bài (Dwell Selection 1 giây)
  checkDwellSelection(x, y) {
    this.cursorEl.style.display = 'none';
    const hoveredEl = document.elementFromPoint(x, y);
    this.cursorEl.style.display = 'flex';

    if (!hoveredEl) {
      this.dwellTargetEl = null;
      this.cursorEl.classList.remove('dwelling');
      return;
    }

    const interactableCard = hoveredEl.closest('.option-card, .sorting-basket, .seq-input-btn, #nextCardBtn');

    if (interactableCard) {
      if (this.dwellTargetEl === interactableCard) {
        // Đang giữ tay trên thẻ
        const elapsed = performance.now() - this.dwellStartTime;
        if (elapsed >= this.dwellThresholdMs) {
          // HOÀN TẤT DWELL: CLICK TỰ ĐỘNG!
          this.dwellTargetEl = null;
          this.cursorEl.classList.remove('dwelling');
          this.executeClickAtPosition(x, y, 'Dwell Click (Giữ tay 1s)');
        }
      } else {
        // Mới di chuyển tới thẻ này
        this.dwellTargetEl = interactableCard;
        this.dwellStartTime = performance.now();
        this.cursorEl.classList.add('dwelling');
      }
    } else {
      this.dwellTargetEl = null;
      this.cursorEl.classList.remove('dwelling');
    }
  }

  // Thực hiện Click lên phần tử giao diện
  executeClickAtPosition(x, y, reason = '') {
    this.cursorEl.style.display = 'none';
    const targetEl = document.elementFromPoint(x, y);
    this.cursorEl.style.display = 'flex';

    if (!targetEl) return;
    const clickable = targetEl.closest('.option-card, .sorting-basket, .seq-input-btn, #nextCardBtn, .btn');

    if (clickable) {
      console.log(`[AI Gesture] ${reason} thành công lên thẻ:`, clickable);
      window.audioEngine.playHint();
      clickable.click();
    }
  }
}

// Khởi tạo Singleton
document.addEventListener('DOMContentLoaded', () => {
  window.aiHandGestureController = new AiHandGestureController();
});
