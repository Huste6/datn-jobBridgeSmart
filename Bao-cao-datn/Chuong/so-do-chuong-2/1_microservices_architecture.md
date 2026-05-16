### Sơ đồ kiến trúc Microservices

**Mô tả:**

Sơ đồ này minh họa kiến trúc backend của hệ thống JobBridge AI, được xây dựng theo mô hình Microservices.

**Các thành phần chính:**

1.  **Frontend (React SPA):** Là giao diện người dùng, nơi người dùng (ứng viên và nhà tuyển dụng) tương tác với hệ thống. Mọi yêu cầu từ Frontend sẽ được gửi đến API Gateway.
2.  **API Gateway:** Đóng vai trò là cổng vào duy nhất cho tất cả các yêu cầu từ client. Nó có nhiệm vụ:
    *   Xác thực và ủy quyền (có thể thông qua service Auth).
    *   Điều hướng (route) yêu cầu đến các microservice tương ứng.
    *   Tổng hợp phản hồi từ nhiều service (nếu cần).
3.  **Microservices (Backend - Go):** Các dịch vụ độc lập, mỗi dịch vụ chịu trách nhiệm một nghiệp vụ cụ thể:
    *   **Auth Service:** Quản lý tất cả các vấn đề liên quan đến người dùng, bao gồm đăng ký, đăng nhập, quản lý tài khoản, và tạo/xác thực token (JWT).
    *   **Jobs Service:** Xử lý các nghiệp vụ liên quan đến việc làm, như tạo/quản lý tin tuyển dụng, nộp hồ sơ, tìm kiếm việc làm.
    *   **AI Service:** Chứa đựng logic xử lý các tác vụ Trí tuệ nhân tạo, bao gồm:
        *   Tương tác với OpenAI API để thực hiện chức năng luyện tập phỏng vấn.
        *   Xử lý và chấm điểm CV so với mô tả công việc.
        *   Có thể giao tiếp với một cơ sở dữ liệu vector (như ChromaDB) để lưu trữ và truy vấn ngữ cảnh hội thoại.
4.  **MongoDB Database:** Là cơ sở dữ liệu chính của hệ thống, được sử dụng bởi các service `Auth` và `Jobs` để lưu trữ dữ liệu về người dùng, công ty, tin tuyển dụng, hồ sơ, v.v.

**Luồng hoạt động:**

*   Người dùng thực hiện một hành động trên **Frontend**.
*   **Frontend** gửi một yêu cầu HTTP/GraphQL đến **API Gateway**.
*   **API Gateway** xác thực yêu cầu và chuyển tiếp nó đến **Microservice** phù hợp (ví dụ: yêu cầu đăng nhập đến `Auth Service`, yêu cầu tạo tin tuyển dụng đến `Jobs Service`).
*   **Microservice** xử lý logic nghiệp vụ, có thể đọc/ghi dữ liệu từ **MongoDB**.
*   Kết quả được trả về qua **API Gateway** và đến **Frontend**.
