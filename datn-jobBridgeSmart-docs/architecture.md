# Kiến trúc hệ thống JobBridge AI

## Tổng quan

JobBridge AI được xây dựng theo **kiến trúc microservice** gồm 4 dịch vụ Go độc lập, một API Gateway và một SPA React. Toàn bộ được containerize bằng Docker và deploy lên Azure Kubernetes Service (AKS).

## Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Azure Kubernetes Service                      │
│                                                                       │
│  ┌──────────────┐    ┌─────────────────────────────────────────────┐ │
│  │   Ingress    │    │              Application Pods                │ │
│  │   NGINX      │    │                                             │ │
│  │              │───▶│  ┌──────────┐   ┌───────────────────────┐  │ │
│  │  jobbridge   │    │  │ Frontend │   │     API Gateway       │  │ │
│  │  .duckdns    │    │  │  :80     │   │       :8080           │  │ │
│  │  .org        │    │  │  (Nginx) │   │       (Go/Gin)        │  │ │
│  └──────────────┘    │  └──────────┘   └──────────┬────────────┘  │ │
│                      │                             │               │ │
│                      │              ┌──────────────┼──────────────┐│ │
│                      │              │              │              ││ │
│                      │              ▼              ▼              ▼│ │
│                      │  ┌────────────────┐ ┌──────────────┐ ┌───────────┐│
│                      │  │ Auth Service   │ │ Jobs Service │ │AI Service ││
│                      │  │    :8081       │ │    :8082     │ │   :8085   ││
│                      │  │   (Go/Gin)     │ │  (Go/Gin)   │ │ (Go/Gin)  ││
│                      │  └───────┬────────┘ └──────┬───────┘ └─────┬─────┘│
│                      │          │                  │               │      │
│                      │          └──────────────────┼───────────────┘      │
│                      │                             ▼                       │
│                      │                  ┌────────────────┐                │
│                      │                  │   MongoDB       │                │
│                      │                  │  StatefulSet    │                │
│                      │                  └────────────────┘                │
│                      └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘

[Dịch vụ bên ngoài]
  ├── Cloudinary CDN  – lưu trữ avatar, CV PDF
  └── OpenAI API      – xử lý AI (gpt-4o-mini)

[Azure Services]
  ├── ACR             – Docker image registry
  ├── Key Vault       – quản lý secrets
  └── Storage Account – Terraform state
```

## Danh sách dịch vụ

| Service | Port | Trách nhiệm | MongoDB Collections |
|---------|------|-------------|---------------------|
| **API Gateway** | 8080 | Reverse proxy, route requests | Không có |
| **Auth Service** | 8081 | Auth, users, companies | `users`, `companies` |
| **Jobs Service** | 8082 | Jobs, applications | `jobs`, `applications` |
| **AI Service** | 8085 | Interview coach, quiz, CV eval | `ai_chat_histories` |
| **Frontend** | 80 | React SPA (Nginx) | Không có |

## API Gateway – Routing Rules

Gateway không có business logic, chỉ là reverse proxy:

```
/api/auth/*       ──▶  Auth Service :8081
/api/users/*      ──▶  Auth Service :8081
/api/hr/*         ──▶  Auth Service :8081
/api/admin/*      ──▶  Auth Service :8081
/api/public/*     ──▶  Auth Service :8081
/api/jobs/*       ──▶  Jobs Service :8082
/api/applications/*──▶ Jobs Service :8082
/api/ai/*         ──▶  AI Service :8085
```

## Clean Architecture Pattern

Tất cả backend services đều theo cùng một pattern:

```
cmd/<service>/main.go
  └── Khởi động server, kết nối MongoDB, wire dependencies

internal/<domain>/
  ├── handler.go     – HTTP handlers (nhận request, trả response)
  ├── repository.go  – Data access layer (tương tác MongoDB)
  └── model.go       – Domain models (struct definitions)
```

Dependency flow: `Handler → Repository → MongoDB`

Không có service-to-service call trong business logic; chỉ dùng shared repository khi AI service cần đọc user/job data.

## Authentication Flow

```
Client ──POST /api/auth/login──▶ Gateway ──▶ Auth Service
                                                  │
                              ◀──JWT Token─────────┘

Client ──GET /api/jobs [Authorization: Bearer <token>]──▶ Gateway
  ──▶ Jobs Service
         │
         ├── auth.AuthMiddleware() giải mã JWT
         ├── Lấy user_id và role từ token claims
         └── Inject vào Gin context để handler dùng
```

## Role-Based Access Control

| Role | Quyền |
|------|-------|
| `seeker` | Xem jobs, nộp đơn, dùng AI coach/quiz |
| `recruiter` | Tạo job, xem ứng đơn, dùng AI evaluate CV |
| `admin` | Tất cả + quản lý users/companies |

Mỗi service tự validate role qua middleware `auth.RoleMiddleware("role")`. Gateway không kiểm tra role.

## Database Architecture

MongoDB chạy trong **StatefulSet** với Persistent Volume (production) hoặc port 27018 (local):

```
Database: jobbridge
  ├── users           – tài khoản người dùng
  ├── companies       – hồ sơ công ty
  ├── jobs            – tin tuyển dụng
  ├── applications    – đơn ứng tuyển
  └── ai_chat_histories – lịch sử chat AI
```

## Secrets Management

### Development
- File `.env` trong thư mục `backend/`

### Production (AKS)
```
Azure Key Vault
  └── Secrets: JWT_SECRET, OPENAI_API_KEY, CLOUDINARY_URL, ...
       │
       ▼ (CSI Secret Store Driver)
Kubernetes Pod
  └── Mount tại: /mnt/secrets-store/<secret-name>
       │
       ▼
ConfigMap / EnvFrom → Environment Variables trong container
```

## Networking & DNS

| Environment | URL | Ghi chú |
|-------------|-----|---------|
| Local dev | `http://localhost:5173` | Vite dev server |
| Local API | `http://localhost:8080` | Docker Compose |
| Production | `https://jobbridge.duckdns.org` | AKS + Ingress |
| Grafana | `https://grafana.jobbridge.duckdns.org` | Monitoring |
| ArgoCD | `https://argocd.jobbridge.duckdns.org` | GitOps UI |

TLS certificates được quản lý tự động bởi **cert-manager** (Let's Encrypt).

## Scalability

Horizontal Pod Autoscaler (HPA) tự động scale pods:
- **Min replicas:** 1
- **Max replicas:** 10
- **Trigger:** CPU utilization > 80%

Pod Disruption Budget (PDB) đảm bảo ít nhất 1 pod chạy khi rolling update.

## Container Images

Multi-stage Docker build cho tất cả services:

| Stage | Base Image | Mục đích |
|-------|-----------|---------|
| Builder | `golang:1.24.5-alpine` | Compile Go binary |
| Runtime | `gcr.io/distroless/static-debian12:nonroot` | Chạy binary (không có shell) |

**Kết quả:** Image ~10–15MB, non-root user, không có công cụ build.

## Xem thêm

- [Luồng dữ liệu chi tiết](flow.md)
- [Backend Services](../backend/docs/services.md)
- [Kubernetes & Helm](../deploy/docs/kubernetes.md)
- [Infrastructure Terraform](../deploy/docs/infrastructure.md)
