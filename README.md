# ColorMind ASD - Hệ Thống Trò Chơi Mã Màu Hỗ Trợ Nhận Thức

> **Đề tài NCKH Sư phạm (2026 – 2027):**  
> *"Thiết kế ứng dụng trò chơi mã màu nhằm hỗ trợ phát triển nhận thức cho trẻ rối loạn phổ tự kỷ từ 5–6 tuổi"*  
> **Đơn vị chủ trì:** Khoa Giáo dục Đặc biệt  
> **Cố vấn & Kiến trúc kỹ thuật:** Chuyên gia Công nghệ Thông tin

---

## 1. Cấu Trúc Thư Mục Dự Án (Modular Directory Structure)

Mã nguồn được phân tách module chặt chẽ theo nguyên tắc **tách biệt Động cơ trò chơi (IT Engine)** và **Nội dung / Quy ước Sư phạm (Pedagogy & Data)**, giúp Khoa Giáo dục Đặc biệt làm chủ hoàn toàn:

```
NCKH26-27/
├── Document/                           # Tài liệu khoa học & Đề cương nghiên cứu
│   └── De-Cuong.docx.pdf               # Đề cương NCKH chi tiết (17 trang)
├── src/                                # Mã nguồn chính của ứng dụng
│   ├── assets/                         # Tài nguyên giao diện
│   │   └── css/                        # Hệ thống Styling Design System
│   │       ├── main.css                # Biến HSL, Typography, Layout gốc
│   │       ├── components.css          # Nút bấm, Thẻ bài, Modal, Bảng biểu
│   │       ├── child-view.css          # Giao diện can thiệp thân thiện trẻ tự kỷ
│   │       └── teacher-portal.css      # Giao diện Cổng Giáo viên (No-Code & SPSS)
│   ├── core/                           # Lõi động cơ (Core Engine)
│   │   ├── state.js                    # Quản lý trạng thái, dữ liệu thẻ, lưu trữ Offline
│   │   ├── audio-engine.js             # Bộ tổng hợp âm thanh Web Audio API êm dịu
│   │   └── color-system.js             # Ánh xạ bảng màu động & biến CSS
│   ├── modules/                        # Các phân hệ chức năng chuyên biệt
│   │   ├── games/                      # 3 Trò chơi can thiệp nhận thức
│   │   │   ├── matching-game.js        # Bài 1: Ghép cặp tương đồng theo mã màu
│   │   │   ├── sorting-game.js         # Bài 2: Phân loại theo khay mã màu
│   │   │   └── sequence-game.js        # Bài 3: Chuỗi trí nhớ thị giác
│   │   ├── teacher/                    # Phân hệ Quản trị No-Code dành cho Giáo viên
│   │   │   ├── content-manager.js      # Thêm/sửa/xóa thẻ học liệu, tải mẫu Excel
│   │   │   ├── rules-config.js         # Cấu hình bảng màu & độ trễ gợi ý (Fading)
│   │   │   └── spss-exporter.js        # Dashboard KPIs & Xuất CSV chuẩn SPSS 1-Click
│   │   ├── camera/                     # Mô-đun Camera AI Nhận diện Cử chỉ tay (Experimental)
│   │   │   └── camera-gesture.js       # Tracking bàn tay & tương tác chọn không chạm (Dwell/Hover)
│   │   └── research/                   # Phân hệ Nhật ký Nghiên cứu Sư phạm
│   │       └── research-logger.js      # Đo Reaction Time (ms), đếm lỗi, tỷ lệ trợ giúp
│   └── main.js                         # Entry point kết nối và điều phối ứng dụng
├── index.html                          # Trang chủ ứng dụng (Web / PWA)
├── package.json                        # Cấu hình dự án & script khởi chạy
└── README.md                           # Tài liệu hướng dẫn sử dụng & vận hành
```

---

## 2. Cách Khởi Chạy Ứng Dụng

Ứng dụng được thiết kế dạng **Offline-First**, không phụ thuộc server phức tạp:

### Cách 1: Khởi chạy nhanh qua npm
```bash
npm run dev
# Mở trình duyệt tại: http://localhost:3000
```

### Cách 2: Khởi chạy bằng Python Server có sẵn
```bash
python3 -m http.server 3000
# Mở trình duyệt tại: http://localhost:3000
```

### Cách 3: Cài đặt thành Ứng dụng Độc lập (PWA Installable App)
- Mở **`http://localhost:3000`** trên trình duyệt.
- Bấm nút **"📲 Cài Đặt App"** ở góc phải trên cùng.
- **Trên iPad / iPhone:** Bấm nút Chia sẻ (Share ⎋) trong Safari ➔ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
- **Trên máy tính Mac / Windows / Android Tablet:** Nhấn **Cài đặt** trên thanh địa chỉ hoặc nút trên web. Ứng dụng sẽ được thêm thẳng vào màn hình Desktop / Launchpad / Home Screen với Icon riêng, mở ra toàn màn hình độc lập, không còn thanh trình duyệt!

---

## 4. Đóng Gói Thành File Vật Lý Nộp Nghiệm Thu (.APK / .DMG)

Nếu Hội đồng Khoa học yêu cầu nộp file cài đặt vật lý vào đĩa CD / USB:
* **Xuất file Android (.APK):** Có thể sử dụng công cụ Capacitor (`npx cap add android && npx cap build`) hoặc tải lên dịch vụ chuẩn quốc tế [PWABuilder.com](https://www.pwabuilder.com/) để nhận file `.apk` cài đặt trực tiếp lên mọi máy tính bảng Android trong 3 phút.
* **Xuất file Desktop (.DMG / .EXE):** Đóng gói qua Electron hoặc Tauri chỉ với 1 lệnh build.

1. **Chuyển sang Cổng Giáo Viên:**
   - Bấm nút **"👩‍🏫 Cổng Giáo Viên"** ở góc phải thanh tiêu đề (có khóa xác nhận an toàn để trẻ không bấm nhầm).
2. **Tự thêm học liệu mới (No-Code):**
   - Vào tab **"Quản trị Học liệu"**, bấm **"Thêm Thẻ Học Liệu Mới"** để thêm đồ vật, con vật, thức ăn theo bài giảng.
   - Bấm **"Tải mẫu Excel"** để xem cấu trúc và nhập dữ liệu hàng loạt.
3. **Cấu hình Quy ước Mã màu & Giàn giáo sư phạm (Scaffolding):**
   - Vào tab **"Cấu hình Quy ước Mã màu"** để đổi bảng màu Pastel hoặc Tương phản cao, chỉnh sửa ý nghĩa sư phạm của từng màu.
   - Vào tab **"Quy tắc Hỗ trợ & Fading"** để chỉnh thời gian trễ tự động gợi ý (ví dụ sau 5 giây trẻ chưa bấm thì viền màu nhấp nháy).
4. **Trích xuất Dữ liệu Nghiên cứu Thực nghiệm cho SPSS (1-Click):**
   - Vào tab **"Dữ liệu Thực nghiệm (SPSS)"**, theo dõi các chỉ số KPI: Tỷ lệ chính xác, Reaction Time (ms), Tỷ lệ dùng gợi ý.
   - Bấm nút **"📥 Xuất File SPSS/Excel (1-Click)"** để tải về tệp `.csv` sạch, các biến số đã mã hóa sẵn, mở trực tiếp bằng SPSS hoặc Excel để viết Chương 4 của báo cáo NCKH!
