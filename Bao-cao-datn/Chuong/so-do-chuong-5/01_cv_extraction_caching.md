# Mô tả Sơ đồ: Luồng Trích xuất và Bộ nhớ đệm Văn bản CV (CV Text Extraction & Caching Flow)

## Tên file đích cần lưu
- `flow_cv_extraction_caching.png` (Lưu vào thư mục `so-do-chuong-5/flow_cv_extraction_caching.png`)

## Ý đồ thiết kế (Diagram Layout)
Sơ đồ mô tả quy trình tối ưu hóa hiệu năng và độ trễ bằng cách trích xuất văn bản từ file CV PDF ngay khi upload và sử dụng bộ nhớ đệm (caching) thay vì xử lý lại nhiều lần khi gọi các tính năng AI.
- **Bắt đầu:** Ứng viên tải file CV dạng PDF lên.
- **Tiến trình 1 (Upload):** Auth Service đẩy file lên Cloudinary CDN và nhận về đường dẫn URL (`CvURL`).
- **Tiến trình 2 (Trích xuất):** Auth Service sử dụng thư viện Go thuần (`ledongthuc/pdf`) đọc nhị phân file PDF, trích xuất chuỗi ký tự thô (`CvText`).
- **Tiến trình 3 (Lưu trữ/Cache):** Lưu cả `CvURL` và `CvText` vào CSDL MongoDB (`users` collection).
- **Tiến trình 4 (AI Trigger):** Khi ứng viên chat với AI Coach hoặc HR yêu cầu AI chấm điểm CV:
  - Hệ thống kiểm tra xem `CvText` trong MongoDB đã tồn tại chưa?
  - **Nhánh Yes (Cache Hit):** Sử dụng ngay `CvText` có sẵn từ DB gửi đến OpenAI API (Độ trễ phản hồi < 100ms cho bước chuẩn bị dữ liệu).
  - **Nhánh No (Cache Miss):** Fetch file PDF từ URL CDN -> tiến hành trích xuất thô -> cập nhật ngược lại MongoDB (để cache cho các lần sau) -> gửi đến OpenAI API.

## Prompt gợi ý để Gen ảnh bằng AI
"Create a technical flow chart diagram for 'CV Text Extraction & Caching' system optimization. Minimalist design, clean lines, white background, no colors. Steps in boxes: 1. Candidate uploads PDF CV; 2. System uploads PDF to Cloudinary CDN & gets CvURL; 3. Go Backend extracts raw text using ledongthuc/pdf; 4. System saves CvURL and CvText into MongoDB (Caching). 5. AI Service triggers: check if CvText exists in DB; 6. If Yes (Cache Hit) -> Send CvText directly to OpenAI API; 7. If No (Cache Miss) -> Fetch PDF from CDN, extract text, save cache, then send to OpenAI. Use rectangular boxes, diamond for decision, and directional arrows."
