# Sơ đồ: Kiến trúc Phân quyền và Bảo mật Phân lớp (Layered Security Authorization Architecture)

## Tên file đích cần lưu
- `layered_security_architecture.png` (Lưu vào thư mục `so-do-chuong-5/layered_security_architecture.png`)

## Ý đồ thiết kế (Diagram Layout)
Sơ đồ mô tả cơ chế bảo mật nghiêm ngặt từ lớp Gateway đến các microservice nội bộ:
- **Client (Frontend):** Gửi request đính kèm Header `Authorization: Bearer <JWT_Token>`.
- **Lớp 1 (API Gateway - JWT Middleware):**
  - Giải mã JWT bằng khóa bí mật (`jwtSecret`).
  - Kiểm tra tính hợp lệ và thời hạn sống (expired) của Token.
  - Trích xuất `UserID` và `Role` từ Token, tiêm vào Header của request chuyển tiếp: `X-User-Id` và `X-User-Role`.
- **Lớp 2 (Microservices Handler - Role-based Middleware):**
  - Nhận request từ Gateway.
  - Đọc `X-User-Id` và `X-User-Role` từ Context.
  - **Kiểm tra quyền:**
    - AI Handler (/ai/interview-coach) -> Role check: Chỉ cho phép `seeker`.
    - AI Handler (/ai/hr-evaluate-cv) -> Role check: Chỉ cho phép `recruiter`.
    - Jobs Handler (/jobs/my) -> Role check: Chỉ cho phép `recruiter`.
  - **Kiểm tra nghiệp vụ (Resource Ownership Check):**
    - Ví dụ ở AI Coach: Chỉ cho phép chat nếu User đã thực sự ứng tuyển Job tương ứng (`h.getApplicationForJob(...)`).
    - Ví dụ ở HR Evaluate: Chỉ cho phép đánh giá nếu Job ID đó do chính Recruiter này sở hữu (`jobDoc.OwnerID == recruiterID`).

## Prompt gợi ý để Gen ảnh bằng AI
"Create a security architecture diagram labeled 'Layered Security Authorization'. Minimalist design, clean lines, white background, no colors. Steps: 1. Client sends request with JWT Bearer Token; 2. API Gateway decrypts token, validates expiration, and injects 'X-User-Id' and 'X-User-Role' headers; 3. Target Microservice Middleware parses headers; 4. Role-based Access Control checks permissions (e.g. Seeker for Coach, Recruiter for CV Evaluation); 5. Business logic verifies resource ownership (checks if applied, or if recruiter owns the job). Show sequential arrows passing through vertical dotted lines representing protection boundaries."
