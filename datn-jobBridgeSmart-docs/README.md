# Tài liệu – JobBridge AI

## Điểm xuất phát

Nếu bạn mới tiếp cận dự án, đọc theo thứ tự này:

1. [Tổng quan dự án](overview.md) – JobBridge làm gì, tính năng, tech stack
2. [Kiến trúc hệ thống](architecture.md) – Microservices, ports, routing, RBAC
3. [Luồng dữ liệu](flow.md) – Request flows từ client đến database
4. [Cài đặt local](setup-local.md) – Chạy dự án trên máy tính trong 5 phút

## Tài liệu chi tiết

### Backend
| File | Nội dung |
|------|---------|
| [backend/docs/services.md](../backend/docs/services.md) | 4 Go services: Gateway, Auth, Jobs, AI |
| [backend/docs/database.md](../backend/docs/database.md) | MongoDB schema, collections, indexes |
| [backend/docs/ai-features.md](../backend/docs/ai-features.md) | Prompt engineering, OpenAI integration |

### Frontend
| File | Nội dung |
|------|---------|
| [frontend/docs/structure.md](../frontend/docs/structure.md) | React pages, routing, layouts, Vite config |

### API
| File | Nội dung |
|------|---------|
| [api-reference.md](api-reference.md) | Tất cả endpoints, request/response format |

### Deploy & Infrastructure
| File | Nội dung |
|------|---------|
| [deploy/docs/infrastructure.md](../deploy/docs/infrastructure.md) | Terraform 3 layers, Azure resources |
| [deploy/docs/kubernetes.md](../deploy/docs/kubernetes.md) | Helm chart, AKS deployment, HPA |
| [deploy/docs/cicd.md](../deploy/docs/cicd.md) | GitHub Actions CI/CD, ArgoCD GitOps |
