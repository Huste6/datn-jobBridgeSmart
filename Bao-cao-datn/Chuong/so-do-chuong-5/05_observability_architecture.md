# Prompt gen ảnh: Kiến trúc Observability JobBridge AI

## Mục tiêu

Tạo một sơ đồ kỹ thuật học thuật, nền trắng, dùng trong Chương 5 báo cáo đồ án. Sơ đồ minh họa hệ thống giám sát tập trung của JobBridge AI bằng Prometheus và Grafana trên Azure Kubernetes Service.

## Kích thước và phong cách

- Tỷ lệ: A4 ngang hoặc 16:9.
- Độ phân giải: tối thiểu 3000px chiều ngang.
- Phong cách: sạch, dễ đọc khi in, màu xanh dương/xanh lá/xám.
- Không dùng nền tối, không dùng hiệu ứng 3D, không dùng quá nhiều icon.
- Đường nối không được đè lên chữ.

## Tiêu đề ảnh

**Kiến trúc giám sát tập trung của JobBridge AI**

## Thành phần cần có

### Cụm AKS / namespace jobbridge

Vẽ các Pod/service chính:

- Frontend
- Gateway
- Auth Service
- Jobs Service
- AI Service
- Ingress NGINX

Mỗi service có nhãn nhỏ: `/metrics` hoặc Kubernetes metrics.

### Namespace monitoring

Vẽ các thành phần:

- Prometheus Operator
- Prometheus
- kube-state-metrics
- node exporter
- Alertmanager
- Grafana

### Luồng dữ liệu

Vẽ mũi tên:

`Pods / Ingress / Nodes -> Prometheus scrape 30s -> Time-series storage 10d -> Grafana dashboards`

Vẽ thêm:

`Prometheus -> Alertmanager` cho cảnh báo.

### Dashboard cần thể hiện

Trong khối Grafana, hiển thị 2 dashboard:

1. **API & Pod Health**
   - Request rate
   - Error rate
   - P95/P99 latency
   - Pod readiness

2. **Pod Stress Test**
   - CPU
   - Memory
   - Network
   - Restart count

## Nhấn mạnh giá trị

Thêm callout nhỏ:

**Giá trị vận hành:** phát hiện lỗi 5xx, service chậm, Pod restart và kiểm chứng HPA khi tải tăng.

