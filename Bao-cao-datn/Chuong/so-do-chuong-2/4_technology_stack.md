### Sơ đồ các công nghệ sử dụng (Technology Stack)

**Mô tả:**

Sơ đồ này là một bản trình bày trực quan, tổng hợp các công nghệ, ngôn ngữ, và nền tảng chính đã được sử dụng để xây dựng và triển khai dự án "JobBridge AI". Việc lựa chọn các công nghệ này dựa trên các tiêu chí về hiệu năng, khả năng mở rộng, cộng đồng hỗ trợ và sự phù hợp với kiến trúc hiện đại.

**Các nhóm công nghệ:**

1.  **Backend:**
    *   **Go (Golang):** Ngôn ngữ lập trình chính, được chọn vì hiệu năng cao, khả năng xử lý đồng thời tốt và cú pháp đơn giản, rất phù hợp để xây dựng các microservice hiệu suất cao.
    *   **Gin Framework:** Một framework web tối giản và nhanh cho Go, giúp tăng tốc độ phát triển API.

2.  **Frontend:**
    *   **React:** Một thư viện JavaScript phổ biến để xây dựng giao diện người dùng (UI) dạng component.
    *   **TypeScript:** Một phiên bản mở rộng của JavaScript, bổ sung hệ thống kiểu tĩnh (static types) giúp phát hiện lỗi sớm và làm cho code dễ bảo trì hơn.
    *   **Vite:** Một công cụ build và development server cực nhanh cho các ứng dụng web hiện đại.

3.  **Cơ sở dữ liệu:**
    *   **MongoDB:** Một hệ quản trị cơ sở dữ liệu NoSQL, hướng tài liệu (document-oriented). Được chọn vì cấu trúc linh hoạt, dễ dàng lưu trữ các đối tượng JSON phức tạp như hồ sơ người dùng và tin tuyển dụng.

4.  **Containerization & Orchestration (Đóng gói & Điều phối):**
    *   **Docker:** Nền tảng để đóng gói ứng dụng và các phụ thuộc của nó vào các container độc lập, đảm bảo tính nhất quán trên các môi trường khác nhau.
    *   **Kubernetes (K8s):** Hệ thống điều phối container mã nguồn mở để tự động hóa việc triển khai, mở rộng và quản lý các ứng dụng container hóa.

5.  **Cloud & DevOps:**
    *   **Microsoft Azure:** Nền tảng đám mây được sử dụng để triển khai toàn bộ hệ thống.
        *   **Azure Kubernetes Service (AKS):** Dịch vụ Kubernetes được quản lý bởi Azure.
        *   **Azure Container Registry (ACR):** Dịch vụ lưu trữ và quản lý các Docker image.
    *   **GitHub Actions:** Công cụ CI/CD được tích hợp sẵn trong GitHub để tự động hóa các quy trình build, test và push image.
    *   **Argo CD:** Một công cụ GitOps cho Kubernetes, giúp tự động hóa việc triển khai và đồng bộ hóa trạng thái ứng dụng.

**Cách thể hiện:**

Sơ đồ này nên được trình bày dưới dạng một tập hợp các logo của các công nghệ trên, được nhóm lại theo các danh mục (Backend, Frontend, Database, v.v.) để người xem có thể dễ dàng nắm bắt được toàn bộ bức tranh công nghệ của dự án.
