# JobBridge AI – Tổng quan dự án

## Giới thiệu

**JobBridge AI** là nền tảng tuyển dụng thông minh tích hợp trí tuệ nhân tạo, giúp kết nối ứng viên với nhà tuyển dụng một cách hiệu quả. Dự án được xây dựng theo kiến trúc microservice với backend Go và frontend React, triển khai trên Azure Kubernetes Service (AKS).

## Vấn đề giải quyết

| Đối tượng | Vấn đề | Giải pháp của JobBridge AI |
|-----------|--------|---------------------------|
| **Ứng viên** | Không biết cách chuẩn bị phỏng vấn | AI Interview Coach luyện tập 1-1 |
| **Ứng viên** | Lo lắng về độ phù hợp CV với JD | AI phân tích CV so với job description |
| **Nhà tuyển dụng** | Sàng lọc hàng trăm CV mất thời gian | AI tự động chấm điểm và đánh giá CV |
| **Nhà tuyển dụng** | Quản lý tin tuyển dụng phức tạp | Dashboard HR quản lý job + ứng viên |
| **Admin** | Kiểm soát chất lượng công ty đăng ký | Workflow phê duyệt công ty |

## Các tính năng chính

### Dành cho Ứng viên (Seeker)
- **Đăng ký / Đăng nhập** – JWT-based authentication
- **Tạo hồ sơ** – Upload avatar (Cloudinary), upload CV (PDF)
- **Tìm kiếm việc làm** – Filter theo địa điểm, mức lương, loại hình, kinh nghiệm
- **Nộp đơn ứng tuyển** – Gửi CV tới nhà tuyển dụng
- **AI Interview Coach** – Chat với AI để luyện tập phỏng vấn cho vị trí cụ thể
- **AI Interview Quiz** – Sinh 1–30 câu hỏi trắc nghiệm từ job description
- **Xem danh sách công ty** – Trang công ty công khai với thông tin chi tiết

### Dành cho Nhà tuyển dụng (Recruiter)
- **Đăng ký công ty** – Tạo hồ sơ công ty, chờ admin phê duyệt
- **Quản lý tin tuyển dụng** – Tạo/sửa/xóa/đóng job posting
- **Xem danh sách ứng viên** – Xem tất cả ứng đơn cho từng job
- **AI Đánh giá CV** – AI tự động chấm điểm CV ứng viên (0–100) và ghi chú

### Dành cho Admin
- **Dashboard thống kê** – Số user, công ty, job, ứng đơn
- **Quản lý người dùng** – Khoá/mở tài khoản
- **Quản lý công ty** – Phê duyệt hoặc từ chối đăng ký công ty
- **Khoá công ty** – Vô hiệu hoá công ty vi phạm

## Tech Stack

### Backend
| Thành phần | Công nghệ |
|-----------|----------|
| Ngôn ngữ | Go 1.24.1 |
| Web framework | Gin Gonic |
| Database | MongoDB 7.0 |
| Auth | JWT (golang-jwt/v5) |
| Password | bcrypt |
| File storage | Cloudinary |
| PDF parsing | ledongthuc/pdf |
| AI | OpenAI API (gpt-4o-mini) |

### Frontend
| Thành phần | Công nghệ |
|-----------|----------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Testing | Vitest |

### Infrastructure
| Thành phần | Công nghệ |
|-----------|----------|
| Container | Docker (distroless images) |
| Orchestration | Kubernetes (AKS) |
| Package manager | Helm |
| GitOps | ArgoCD |
| IaC | Terraform |
| Cloud | Azure (AKS, ACR, Key Vault) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |

## Kiến trúc tổng quan

```
[Browser / Mobile]
       │
       ▼  HTTPS
[Ingress NGINX]
       ├──────────────────────────────────────────┐
       ▼                                          ▼
[Frontend – React]                    [API Gateway :8080]
(Nginx static)                               │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                        [Auth :8081]  [Jobs :8082]  [AI :8085]
                              │              │              │
                              └──────────────┼──────────────┘
                                             ▼
                                      [MongoDB :27017]

[External Services]
  ├── Cloudinary  (avatar, CV upload)
  └── OpenAI API  (AI features)
```

## Phạm vi dự án

- **Repository:** https://github.com/Huste6/datn-jobBridgeSmart
- **Môi trường dev:** Docker Compose + Tilt
- **Môi trường prod:** Azure Kubernetes Service

## Tài liệu liên quan

- [Kiến trúc hệ thống](architecture.md)
- [Luồng dữ liệu](flow.md)
- [Cài đặt local](setup-local.md)
- [API Reference](api-reference.md)
- [Backend Services](../backend/docs/services.md)
- [AI Features](../backend/docs/ai-features.md)
- [Database Schema](../backend/docs/database.md)
- [Frontend Structure](../frontend/docs/structure.md)
- [Infrastructure (Terraform)](../deploy/docs/infrastructure.md)
- [Kubernetes & Helm](../deploy/docs/kubernetes.md)
- [CI/CD & GitOps](../deploy/docs/cicd.md)
