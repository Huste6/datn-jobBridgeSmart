# Prompt gen ảnh: Luồng CI/CD GitOps triển khai JobBridge AI

## Mục tiêu

Tạo một sơ đồ kỹ thuật học thuật, nền trắng, dùng trong Chương 5 báo cáo đồ án. Sơ đồ minh họa luồng tự động hóa phát hành của JobBridge AI từ commit mã nguồn đến production trên Azure Kubernetes Service.

## Kích thước và phong cách

- Tỷ lệ: A4 ngang hoặc 16:9.
- Độ phân giải: tối thiểu 3000px chiều ngang.
- Phong cách: rõ ràng, ít màu, dùng xanh dương/xanh lá/xám, chữ tiếng Việt dễ đọc khi in.
- Không dùng nền đen, không dùng 3D, không để mũi tên đè lên chữ.

## Tiêu đề ảnh

**Luồng CI/CD GitOps triển khai JobBridge AI**

## Thành phần cần có

Vẽ theo luồng trái sang phải:

1. **Developer / Git Commit**
   - Commit vào nhánh `main`
   - Thay đổi trong `backend` hoặc `frontend`

2. **GitHub Actions - CI**
   - Detect changed paths
   - Build frontend/backend
   - Run tests with coverage
   - SonarCloud scan
   - Kaniko build image
   - Trivy image scan

3. **Azure Container Registry**
   - Lưu 5 image:
   - `jobbridge-auth`
   - `jobbridge-gateway`
   - `jobbridge-jobs`
   - `jobbridge-ai`
   - `jobbridge-frontend`
   - Image tag theo short commit SHA

4. **GitHub Actions - CD**
   - Thu release metadata
   - Cập nhật `values-azure-argocd.yaml`
   - Commit Helm values mới vào Git

5. **Argo CD**
   - Theo dõi Helm chart
   - Auto sync
   - Self-heal
   - Prune

6. **AKS Production**
   - Rolling update Deployment
   - Service / Ingress
   - Người dùng truy cập `jobbridge.duckdns.org`

## Gợi ý bố cục

Sử dụng 6 khối lớn nối bằng mũi tên:

`Commit -> CI Pipeline -> ACR -> CD Update Helm Values -> Argo CD -> AKS Production`

Bên dưới mỗi khối có 2-4 bullet ngắn. Không viết đoạn văn dài trong ảnh.

## Nhấn mạnh kết quả

Thêm một callout nhỏ ở cuối:

**Kết quả quan sát:** Argo CD đồng bộ production khoảng 1 phút, trạng thái `Healthy` và `Synced`.

