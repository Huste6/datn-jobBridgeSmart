# Screenshot thực tế cần lấy: Grafana "Pod Stress Test" Dashboard

## Đây KHÔNG phải gen ảnh — cần chụp màn hình thực từ Grafana

Truy cập Grafana instance (thường tại nodeIP:30000 hoặc ingress URL),
mở dashboard tên "JobBridge - Pod Stress Test" và chụp toàn màn hình.

---

## Các panel cần có trong dashboard (để xác nhận đúng dashboard)

Dashboard này dùng cho mục đích stress test / kiểm tra HPA, cần có ít nhất 4 panel:

### Panel 1: CPU Usage vs Limit (%)
- PromQL gợi ý:
  ```
  (rate(container_cpu_usage_seconds_total{namespace="default"}[2m]) 
   / on(pod) kube_pod_container_resource_limits{resource="cpu", namespace="default"}) * 100
  ```
- Hiển thị: Line chart, mỗi line = 1 Pod
- Đơn vị: %

### Panel 2: Memory Usage vs Limit (Mi)
- PromQL gợi ý:
  ```
  container_memory_working_set_bytes{namespace="default"} / 1024 / 1024
  ```
- Hiển thị: Line chart
- Đơn vị: MiB

### Panel 3: Network Receive/Transmit (bytes/s)
- PromQL gợi ý:
  ```
  rate(container_network_receive_bytes_total{namespace="default"}[2m])
  rate(container_network_transmit_bytes_total{namespace="default"}[2m])
  ```
- Hiển thị: Line chart với 2 series (Rx = xanh, Tx = cam)

### Panel 4: Pod Restart Count
- PromQL gợi ý:
  ```
  kube_pod_container_status_restarts_total{namespace="default"}
  ```
- Hiển thị: Stat panel hoặc bar chart

---

## Lưu ý khi chụp
- Chụp lúc hệ thống có traffic (để thấy đường line không phẳng)
- Chọn time range: Last 1 hour hoặc Last 30 minutes
- Có thể dùng `ab` (Apache Benchmark) hoặc `k6` để tạo tải trước khi chụp
- Kích thước ảnh đề xuất: ≥1200px chiều ngang

## Tên file output
`grafana_stress_test.png`
Đặt vào thư mục: `Bao-cao-datn/Chuong/so-do-chuong-4/screens/`

---

## Nếu chưa có dashboard này trong Grafana

Tạo nhanh bằng cách import JSON sau vào Grafana (New Dashboard → Import):
Hoặc tạo thủ công 4 panel như mô tả ở trên với namespace="default".

Sau khi tạo, chạy stress test đơn giản bằng lệnh:
```bash
# Stress test AI service endpoint (thay URL thực tế)
ab -n 100 -c 10 https://jobbridge.duckdns.org/api/health
```
Rồi chụp màn hình dashboard.
