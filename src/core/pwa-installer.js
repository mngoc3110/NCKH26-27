/**
 * ============================================================================
 * PWA INSTALLER MODULE - XỬ LÝ CÀI ĐẶT ỨNG DỤNG LÊN IPAD / TABLET / MAC
 * Cho phép giáo viên cài đặt ứng dụng thành biểu tượng độc lập toàn màn hình
 * ============================================================================
 */

class PwaInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.installBtn = document.getElementById('installAppBtn');
    this.init();
  }

  init() {
    // 1. Đăng ký Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((reg) => {
            console.log('[PWA] Service Worker đăng ký thành công:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker lỗi:', err);
          });
      });
    }

    // 2. Bắt sự kiện có thể cài đặt (Chromium, Edge, Android)
    window.addEventListener('beforeinstallprompt', (e) => {
      // Ngăn trình duyệt hiển thị thanh cài mặc định
      e.preventDefault();
      this.deferredPrompt = e;
      if (this.installBtn) {
        this.installBtn.style.display = 'inline-flex';
      }
    });

    // 3. Xử lý khi nhấn nút Cài đặt
    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.handleInstallClick());
    }

    // 4. Lắng nghe khi ứng dụng đã được cài đặt thành công
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Ứng dụng đã được cài đặt vào hệ thống.');
      if (this.installBtn) {
        this.installBtn.style.display = 'none';
      }
      alert('Tuyệt vời! Ứng dụng ColorMind ASD đã được cài đặt vào máy của bạn.');
      this.deferredPrompt = null;
    });

    // 5. Kiểm tra nếu đang chạy ở chế độ Standalone (Đã cài đặt)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      console.log('[PWA] Đang chạy trong môi trường App độc lập (Standalone).');
      if (this.installBtn) {
        this.installBtn.style.display = 'none';
      }
    } else {
      // Nếu là thiết bị di động / Safari mà chưa cài đặt, luôn hiển thị nút để cô giáo biết
      if (this.installBtn) {
        this.installBtn.style.display = 'inline-flex';
      }
    }
  }

  handleInstallClick() {
    if (this.deferredPrompt) {
      // Trình duyệt hỗ trợ hộp thoại cài trực tiếp
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] Người dùng đã đồng ý cài đặt ứng dụng');
        }
        this.deferredPrompt = null;
      });
    } else {
      // Dành cho Safari trên iPad / iPhone hoặc macOS Safari:
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert("Để cài đặt lên iPad:\n1. Bấm nút Chia sẻ (biểu tượng mũi tên hướng lên ⎋ ở Safari)\n2. Chọn 'Thêm vào Màn hình chính' (Add to Home Screen).\n\nỨng dụng sẽ xuất hiện như một App độc lập!");
      } else {
        alert("Để cài đặt thành Ứng dụng độc lập:\n• Trên Chrome / Edge: Bấm biểu tượng 'Cài đặt' (hoặc icon tải xuống) trên thanh địa chỉ.\n• Trên Safari Mac: Chọn Tệp (File) ➔ 'Thêm vào Dock' (Add to Dock).");
      }
    }
  }
}

// Khởi tạo Singleton
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInstaller = new PwaInstaller();
});
