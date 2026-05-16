### Sơ đồ kiến trúc triển khai trên Kubernetes (AKS)

**Mô tả:**

Sơ đồ này minh họa cách các thành phần của ứng dụng JobBridge AI được tổ chức và vận hành bên trong một cluster Azure Kubernetes Service (AKS).

**Các thành phần chính trong Kubernetes:**

1.  **AKS Cluster:** Là môi trường Kubernetes được quản lý bởi Azure, nơi ứng dụng được triển khai. Nó bao gồm các Node (máy ảo) để chạy các container.
2.  **Ingress Controller:**
    *   Là cổng vào cho tất cả các traffic từ bên ngoài Internet vào cluster.
    *   Nó nhận các yêu cầu HTTP/HTTPS và định tuyến chúng đến các `Service` phù hợp dựa trên các quy tắc (rules) được định nghĩa trong tài nguyên `Ingress`. Ví dụ: `jobbridge.com/api/auth/*` sẽ được chuyển đến `auth-service`.
3.  **Services:**
    *   Là một đối tượng trừu tượng của Kubernetes, cung cấp một địa chỉ IP và DNS name ổn định cho một nhóm các `Pods`.
    *   Mỗi microservice (`auth`, `jobs`, `ai`, `gateway`, `frontend`) sẽ có một `Service` tương ứng (ví dụ: `auth-service`, `jobs-service`).
    *   `Services` cho phép các microservice giao tiếp với nhau bên trong cluster một cách dễ dàng mà không cần biết địa chỉ IP cụ thể của từng `Pod`.
4.  **Pods:**
    *   Là đơn vị triển khai nhỏ nhất trong Kubernetes.
    *   Mỗi `Pod` chứa một hoặc nhiều container. Trong trường hợp này, mỗi `Pod` sẽ chứa container cho một microservice (ví dụ: một `Pod` chạy container `auth`, một `Pod` khác chạy container `jobs`).
    *   Kubernetes đảm bảo rằng một số lượng `Pods` (bản sao - replicas) nhất định cho mỗi microservice luôn chạy, cung cấp khả năng chịu lỗi và mở rộng.
5.  **Deployments:**
    *   Là tài nguyên Kubernetes quản lý các `Pods`.
    *   Nó định nghĩa trạng thái mong muốn, ví dụ: "Tôi muốn 3 bản sao của `auth-service` luôn chạy với image phiên bản `v1.2.0`".
    *   Khi bạn cập nhật phiên bản image, `Deployment` sẽ quản lý việc tạo `Pods` mới và xóa `Pods` cũ một cách an toàn (rolling update).
6.  **ConfigMaps & Secrets:**
    *   **ConfigMaps:** Dùng để lưu trữ các cấu hình không nhạy cảm của ứng dụng (ví dụ: URL của database, các biến môi trường).
    *   **Secrets:** Dùng để lưu trữ các thông tin nhạy cảm như mật khẩu database, API keys.
    *   Các `Pods` sẽ đọc thông tin từ `ConfigMaps` và `Secrets` khi khởi động.

**Luồng hoạt động:**

*   Yêu cầu từ người dùng đi vào **Ingress Controller**.
*   **Ingress** chuyển yêu cầu đến `Service` của **API Gateway**.
*   `Service` của API Gateway sẽ chuyển tiếp yêu cầu đến một trong các `Pod` của API Gateway.
*   `Pod` API Gateway sau đó sẽ giao tiếp với các `Service` của các microservice khác (`auth-service`, `jobs-service`) khi cần thiết.
*   Quá trình này đảm bảo tính linh hoạt, khả năng mở rộng và khả năng phục hồi cao cho toàn bộ ứng dụng.
