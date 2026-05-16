### Sơ đồ luồng CI/CD với GitHub Actions và Argo CD

**Mô tả:**

Sơ đồ này mô tả quy trình Tích hợp liên tục (CI) và Triển khai liên tục (CD) hoàn toàn tự động của dự án JobBridge AI, áp dụng thực hành GitOps.

**Giai đoạn 1: Continuous Integration (CI) - Thực thi bởi GitHub Actions**

Luồng này được kích hoạt mỗi khi có code mới được đẩy lên (git push) các nhánh chính (ví dụ: `main` hoặc `develop`) của repository mã nguồn.

1.  **Code Push:** Lập trình viên đẩy code thay đổi lên GitHub.
2.  **GitHub Actions Triggered:** Workflow của GitHub Actions được tự động kích hoạt.
3.  **Build & Test:**
    *   Hệ thống thực hiện build mã nguồn.
    *   Chạy các bài kiểm thử tự động (unit tests, integration tests) để đảm bảo chất lượng code.
4.  **Build Docker Image:** Nếu các bài test thành công, GitHub Actions sẽ build các Docker image cho từng microservice (`auth`, `jobs`, `ai`, `gateway`, `frontend`).
5.  **Push to ACR (Azure Container Registry):** Các image vừa được build sẽ được đẩy lên và lưu trữ tại Azure Container Registry, được gắn thẻ (tag) với một phiên bản duy nhất (ví dụ: mã hash của commit).

**Giai đoạn 2: Continuous Deployment (CD) - Thực thi bởi Argo CD (GitOps)**

Luồng này tập trung vào việc đồng bộ hóa trạng thái của ứng dụng trên Kubernetes với trạng thái được định nghĩa trong một repository cấu hình (GitOps repository).

1.  **Update GitOps Repository:** Sau khi đẩy image thành công lên ACR, một bước trong GitHub Actions (hoặc một quy trình riêng) sẽ tự động cập nhật file cấu hình (ví dụ: `values.yaml` của Helm) trong một **repository Git khác** (GitOps Repo). Thay đổi này chủ yếu là cập nhật `image.tag` sang phiên bản mới nhất.
2.  **Argo CD Detects Change:** Argo CD liên tục theo dõi GitOps Repo. Khi phát hiện có sự thay đổi (commit mới), nó sẽ so sánh trạng thái "mong muốn" (desired state) trong Git với trạng thái "hiện tại" (current state) trên cluster Kubernetes.
3.  **Sync & Pull Image:** Nhận thấy sự khác biệt về phiên bản image, Argo CD bắt đầu quá trình đồng bộ hóa (Sync).
4.  **Deploy to AKS (Azure Kubernetes Service):** Argo CD ra lệnh cho Kubernetes cluster (AKS) kéo (pull) Docker image phiên bản mới từ ACR và triển khai nó, thường bằng cách thực hiện một bản cập nhật cuốn chiếu (rolling update) để đảm bảo không có thời gian chết (zero downtime).

**Kết quả:** Mọi thay đổi về code, sau khi được kiểm duyệt và hợp nhất, sẽ được tự động triển khai lên môi trường production một cách an toàn và có thể dự đoán được.
