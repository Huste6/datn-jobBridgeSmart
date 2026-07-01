# Hướng Dẫn Chuyển Đổi Kubernetes Context & Kết Nối Database Client

Tài liệu này hướng dẫn cách quản lý và chuyển đổi qua lại giữa cụm Kubernetes Cloud (**Azure AKS**) và cụm Kubernetes Local (**KinD - Kubernetes in Docker/Podman**), cùng với cách cấu hình kết nối Database Tool (như Beekeeper Studio, MongoDB Compass, DBeaver) vào MongoDB bên trong các cụm này.

---

## 1. Tổng Quan Về 2 Môi Trường
1. **Cloud Cluster (Azure AKS)**
   - **K8s Context:** `aks-jobbridge`
   - **Địa chỉ API Server:** Được quản lý trên Azure Cloud.
2. **Local Cluster (KinD via Podman)**
   - **K8s Context:** `kind-jobbridge`
   - **Địa chỉ API Server:** `127.0.0.1` (thông qua container điều khiển chạy ngầm trên máy).

---

## 2. Cách Chuyển Đổi Qua Lại Giữa Các Cụm (K8s Contexts)

### Bước 2.1: Xem danh sách các cụm đang có trên máy
Chạy lệnh sau để biết bạn đang có những cụm nào và cụm nào đang được chọn (được đánh dấu bằng dấu `*` ở cột `CURRENT`):
```bash
kubectl config get-contexts
```

### Bước 2.2: Chuyển sang Cụm local (KinD)
1. **Thiết lập context hoạt động sang local:**
   ```bash
   kubectl config use-context kind-jobbridge
   ```
2. **Khởi động cụm local (nếu nó đang bị tắt):**
   Vì cụm KinD local chạy dưới dạng container Podman, nếu nó chưa chạy (bị lỗi Connection Refused khi gọi lệnh kubectl), bạn hãy bật nó lên:
   ```bash
   podman start jobbridge-control-plane
   ```
3. **Kiểm tra trạng thái cụm local:**
   ```bash
   kubectl get nodes
   ```
   *(Trạng thái của `jobbridge-control-plane` cần hiển thị là `Ready`)*.

### Bước 2.3: Chuyển sang Cụm Cloud AKS
Để chuyển kết nối của bạn trở lại cụm Cloud chạy trên Azure AKS:
```bash
kubectl config use-context aks-jobbridge
```

---

## 3. Cách Kết Nối Database Client Vào MongoDB Trong Pod

Vì Database MongoDB được deploy sâu trong mạng nội bộ của Kubernetes (ClusterIP), các tool UI quản lý database chạy ngoài máy cá nhân của bạn không thể gọi trực tiếp. Bạn cần thiết lập mở cổng kết nối tạm thời (Port-Forward).

### Bước 3.1: Chạy lệnh Port-Forward trên Terminal
Dựa vào cụm bạn đang chọn ở mục 2, hãy chạy lệnh tương ứng trong một terminal trống và **không tắt terminal này**:

* **Đối với Cụm Local (KinD):**
  ```bash
  kubectl port-forward -n jobbridge svc/jobbridge-jobbridge-mongodb 27017:27017
  ```
* **Đối với Cụm Cloud AKS:**
  ```bash
  kubectl port-forward -n jobbridge svc/jobbridge-jobbridge-mongodb 27017:27017
  ```
  *(Lưu ý: Nếu cổng `27017` trên máy tính cá nhân của bạn đang bị chiếm dụng bởi cơ sở dữ liệu khác chạy trực tiếp trên máy, bạn hãy map sang cổng `27019` thay thế: `... 27019:27017`)*.

### Bước 3.2: Giao diện Database Tool
Khi cấu hình kết nối mới trong phần mềm quản lý (như Beekeeper Studio, MongoDB Compass), hãy điền các thông tin sau:

| Mục cấu hình | Giá trị điền | Ghi chú |
| :--- | :--- | :--- |
| **Connection Type / URL Mode** | Chọn điền theo form hoặc URL | Khuyên dùng URL cho nhanh |
| **URL Connection String** | `mongodb://localhost:27017/jobbridge` | Cần thêm `/jobbridge` ở cuối để phần mềm trỏ đúng db |
| **Host / Server** | `localhost` hoặc `127.0.0.1` | Điền khi dùng chế độ điền form |
| **Port** | `27017` | Hoặc `27019` (nếu đã đổi ở bước 3.1) |
| **Database Name** | `jobbridge` | Điền khi dùng chế độ điền form |
| **SSL Mode** | `NO SSL` | Cụm local/AKS mặc định không mã hóa SSL |
| **Authentication** | Không chọn / Trống | Cụm local dev mặc định không bật Access Control |
| **Over SSH** | **BỎ TÍCH CHỌN (UNCHECK)** | Bạn đã có port-forward nên không cần SSH Tunnel |

Sau khi cấu hình xong, nhấn **Test Connection** để kiểm tra trước khi bấm **Connect/Save**.
