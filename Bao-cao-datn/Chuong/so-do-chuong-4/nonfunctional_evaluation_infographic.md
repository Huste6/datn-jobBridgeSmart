# Prompt gen ảnh: Đánh giá yêu cầu phi chức năng JobBridge AI

## Mục tiêu

Tạo một infographic học thuật, nền trắng, dùng trong báo cáo đồ án tốt nghiệp, minh họa phần "Đánh giá mức độ đáp ứng yêu cầu phi chức năng" của hệ thống JobBridge AI. Ảnh cần rõ ràng khi in A4, không dùng nền đen, không dùng hiệu ứng 3D, không dùng icon quá màu mè.

## Kích thước đề xuất

- Tỷ lệ: A4 ngang hoặc 16:9.
- Độ phân giải: tối thiểu 3000px chiều ngang.
- Phong cách: sơ đồ kỹ thuật học thuật, nét mảnh, màu xanh dương/xanh lá/xám, chữ tiếng Việt rõ ràng.

## Bố cục mong muốn

Tiêu đề trên cùng:

**Đánh giá mức độ đáp ứng yêu cầu phi chức năng của JobBridge AI**

Bên dưới chia thành 4 khối nội dung dạng card hoặc swimlane ngang, mỗi khối có icon nhỏ và 2-3 dòng mô tả ngắn. Không để quá nhiều chữ trong ảnh.

### Khối 1: Tự động hóa triển khai

Nhãn chính:

**CI/CD + GitOps**

Nội dung hiển thị:

- Commit vào nhánh chính
- GitHub Actions build image và cập nhật GitOps repo
- Argo CD đồng bộ production tự động
- Thời gian quan sát: khoảng 1 phút

Gợi ý visual:

`Developer commit -> GitHub Actions -> ACR/GitOps repo -> Argo CD -> AKS production`

### Khối 2: Khả năng mở rộng

Nhãn chính:

**Autoscaling bằng HPA**

Nội dung hiển thị:

- k6 tạo tải đến 3.000 virtual users
- Jobs Service scale từ 1 lên 4 Pod
- Gateway scale từ 1 lên 2 Pod
- Không ghi nhận timeout trong lần quan sát

Gợi ý visual:

Một biểu đồ nhỏ thể hiện số Pod tăng lên khi tải tăng, kèm mũi tên "CPU vượt ngưỡng 70%".

### Khối 3: Khả năng quan sát

Nhãn chính:

**Observability**

Nội dung hiển thị:

- Prometheus thu thập metrics
- Grafana hiển thị request rate, error rate, latency, CPU, memory
- Hỗ trợ phát hiện lỗi 5xx, Pod restart, service chậm

Gợi ý visual:

`AKS Pods -> Prometheus -> Grafana Dashboard`

### Khối 4: Giới hạn và hướng mở rộng

Nhãn chính:

**Giới hạn hiện tại và hướng tối ưu**

Nội dung hiển thị:

- Chưa khẳng định sẵn sàng cho 1 triệu người dùng đồng thời
- Cần mở rộng node pool, tăng HPA max replicas
- Cần cache dữ liệu đọc nhiều, rate limiting, queue cho tác vụ AI
- MongoDB nên dùng replica/sharding khi tăng quy mô

Gợi ý visual:

Một vùng "Next optimization" với các nhánh: Node pool, Cache, Queue, MongoDB scaling, AI Service autoscaling.

## Dữ liệu cần giữ đúng

- CI/CD và Argo CD triển khai production tự động sau commit chính.
- Argo CD quan sát đồng bộ trong khoảng 1 phút.
- Stress test bằng k6 đạt 3.000 virtual users.
- Jobs Service tăng từ 1 lên 4 Pod.
- Gateway tăng từ 1 lên 2 Pod.
- CPU Jobs Service khoảng 222% so với ngưỡng 70%.
- CPU Gateway khoảng 130% so với ngưỡng 70%.
- Không trình bày câu lệnh terminal hoặc màn hình dòng lệnh.

## Yêu cầu thẩm mỹ

- Chữ đủ lớn, dễ đọc khi in.
- Không để mũi tên hoặc đường nối đè lên chữ.
- Không dùng nền tối.
- Không dùng quá nhiều đoạn văn dài.
- Nếu cần icon, dùng icon đơn giản: Git, container, Kubernetes, chart, shield/eye, database.
- Ưu tiên bố cục gọn trong một trang, không để ảnh quá cao.

