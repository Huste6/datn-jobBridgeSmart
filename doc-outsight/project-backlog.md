# Project Backlog — JobBridge AI

> **Nguyên tắc thứ tự:** Infra → CI/CD → DB → Auth → Backend skeleton → Frontend skeleton → Features → AI → Messaging → Observability → Security → Testing → Go-live
>
> **Ký hiệu effort:** XS = <2h | S = 2–4h | M = 0.5–1 ngày | L = 1–2 ngày | XL = 3–5 ngày
> **Ký hiệu priority:** P0 = Blocker | P1 = Critical | P2 = Important | P3 = Nice-to-have

---

## Tổng quan phases

| Phase | Tên | Tickets | Ghi chú |
|---|---|---|---|
| 0 | Architecture & Design | DESIGN-001–006 | Làm xong trước khi code bất cứ thứ gì |
| 1 | Infrastructure Foundation | INFRA-001–012 | AWS core resources |
| 2 | CI/CD Pipeline | CICD-001–008 | Phải có trước khi deploy service đầu tiên |
| 3 | Database Layer | DB-001–007 | Schema & migrations |
| 4 | Authentication | AUTH-001–009 | Cognito + Auth Service |
| 5 | Backend — Skeleton | BE-001–006 | Init repo, Dockerfile, K8s manifest |
| 6 | Frontend — Skeleton | FE-001–004 | Init project, routing, Cognito connect |
| 7 | Backend — Core Features | FEAT-001–020 | Job CRUD, Apply, Search, Profile |
| 8 | AI Features | AI-001–008 | CV parse, Matching, Recommend |
| 9 | Messaging & Notifications | MSG-001–008 | SES, SQS, Lambda, SNS |
| 10 | Frontend — Features | UI-001–018 | All pages |
| 11 | Observability | OBS-001–009 | Monitoring, logging, alerting |
| 12 | Security Hardening | SEC-001–008 | WAF, GuardDuty, scanning |
| 13 | Testing | TEST-001–010 | Unit, integration, E2E, load |
| 14 | Go-live | GOLIVE-001–007 | Prod cutover |

---

## Phase 0 — Architecture & Design

> Không có code, chỉ có quyết định và tài liệu. Làm sai ở đây thì tốn công refactor sau.

### DESIGN-001: Thiết kế database schema tổng thể
- **Phụ thuộc:** Không có
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Vẽ ERD cho tất cả entity: users, companies, jobs, applications, skills, categories, notifications, ai_analyses
- **Done khi:**
  - ERD có đầy đủ quan hệ (FK, index, constraint)
  - Được review và approved
  - Xuất ra file SQL DDL draft

### DESIGN-002: Thiết kế API contract (OpenAPI/Swagger)
- **Phụ thuộc:** DESIGN-001
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Định nghĩa tất cả endpoints cho API Gateway, Auth Service, Job Service, AI Service
- **Done khi:**
  - File `openapi.yaml` có đầy đủ endpoints, request/response schema, error codes
  - Frontend và Backend team đã review và đồng ý contract

### DESIGN-003: Thiết kế UI/UX wireframes
- **Phụ thuộc:** DESIGN-002
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Vẽ wireframe cho tất cả màn hình: landing, login/signup, job search, job detail, apply, employer dashboard, job seeker dashboard, AI features
- **Done khi:**
  - Wireframe đủ tất cả màn hình chính
  - Responsive breakpoint đã xác định

### DESIGN-004: Xác định cấu trúc repository
- **Phụ thuộc:** Không có
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Quyết định monorepo hay polyrepo, đặt tên repo, cấu trúc thư mục cho từng service
- **Done khi:**
  - Quyết định đã được ghi lại (monorepo với Go workspaces hoặc polyrepo riêng)
  - Cấu trúc thư mục mẫu đã được tạo

### DESIGN-005: Xác định tech stack chi tiết
- **Phụ thuộc:** Không có
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Confirm ngôn ngữ, framework, library cho từng service
  - Backend: Go (Gin/Echo/Fiber?) | Node.js (Express/Fastify?)
  - Frontend: React + Vite + TailwindCSS + shadcn/ui
  - DB migration: golang-migrate / goose
  - Testing: testify, gomock (Go) | Jest, Vitest (FE)
- **Done khi:** `tech-stack.md` được tạo và team đồng ý

### DESIGN-006: Xác định môi trường triển khai
- **Phụ thuộc:** Không có
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Xác định rõ: dev local (docker-compose), dev AWS, staging AWS, production AWS. Naming convention cho resources (prefix, tags)
- **Done khi:** `environments.md` mô tả rõ từng môi trường và cách switch

---

## Phase 1 — Infrastructure Foundation

> Thứ tự trong phase này cũng phải theo đúng dependency: network → compute → data → security.

### INFRA-001: Tạo AWS Account & Organizations structure
- **Phụ thuộc:** DESIGN-006
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo AWS Organization, OU: Production, Development, Shared. Enable billing alerts. Setup root MFA.
- **Done khi:**
  - Organization có 3 OU
  - Root account MFA bật
  - Budget alert $50/$100/$200 đã setup
  - CloudTrail bật ở root level

### INFRA-002: Setup IAM — Groups, Users, Permission Boundaries
- **Phụ thuộc:** INFRA-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tạo IAM groups theo phòng ban (xem `diagrams/12–19`). Tạo user đầu tiên cho DevOps. Gán Permission Boundaries.
- **Done khi:**
  - Tất cả 7 IAM groups được tạo với đúng policies
  - Permission Boundaries được gán
  - Không ai dùng root account sau bước này

### INFRA-003: Setup VPC, Subnets, Internet Gateway
- **Phụ thuộc:** INFRA-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tạo VPC 10.0.0.0/16, 5 subnets (xem `diagrams/01`), Internet Gateway, route tables, NACLs
- **Done khi:**
  - VPC và subnets tồn tại đúng CIDR
  - Route tables đúng (public → IGW, private → NAT)
  - NACLs đúng rules
  - Ping test giữa subnets OK

### INFRA-004: Setup NAT Gateway & Bastion Host
- **Phụ thuộc:** INFRA-003
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo NAT Gateway trong public subnet. Tạo Bastion Host (SSM enabled, không cần port 22 public).
- **Done khi:**
  - Instance trong private subnet có thể ping 8.8.8.8 qua NAT
  - Có thể SSH vào Bastion qua SSM Session Manager

### INFRA-005: Setup Security Groups
- **Phụ thuộc:** INFRA-003
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo 4 SGs: alb-sg, eks-node-sg, rds-sg, bastion-sg theo `diagrams/03`
- **Done khi:**
  - SG rules đúng với thiết kế
  - Không có SG nào mở 0.0.0.0/0 ngoài alb-sg port 443

### INFRA-006: Setup Amazon EKS Cluster
- **Phụ thuộc:** INFRA-003, INFRA-005, INFRA-002
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Tạo EKS cluster (managed), node groups mỗi AZ, install system add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI Driver, Metrics Server, Cluster Autoscaler)
- **Done khi:**
  - `kubectl get nodes` trả về 3 nodes (1 per AZ) ở trạng thái Ready
  - Tất cả add-ons Running
  - OIDC Provider đã enable (cho IRSA)

### INFRA-007: Setup ALB Ingress Controller & Ingress
- **Phụ thuộc:** INFRA-006
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Cài AWS Load Balancer Controller lên EKS. Tạo IRSA role `sa-lb-controller`. Tạo Ingress resource cho frontend.
- **Done khi:**
  - ALB được tạo tự động khi apply Ingress resource
  - Test endpoint `/health` trả về 200

### INFRA-008: Setup Amazon RDS PostgreSQL
- **Phụ thuộc:** INFRA-003, INFRA-005
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tạo RDS PostgreSQL (db.t3.medium, Multi-AZ). Tạo RDS Subnet Group từ database subnets. Tạo DB mặc định `jobbridge`.
- **Done khi:**
  - RDS endpoint accessible từ EKS nodes (port 5432)
  - Không accessible từ internet
  - Automated backup bật (retention 7 ngày)

### INFRA-009: Setup Amazon ECR
- **Phụ thuộc:** INFRA-001
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo ECR repositories cho: `api-gateway`, `auth-service`, `job-service`, `ai-service`, `frontend`. Bật image scanning.
- **Done khi:**
  - 5 repos tồn tại
  - Image scanning on push bật
  - Lifecycle policy: giữ 10 images mới nhất

### INFRA-010: Setup Secrets Manager & SSM Parameter Store
- **Phụ thuộc:** INFRA-001
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo secrets: DB credentials, JWT secret. Tạo parameters: app config, feature flags. Cấu hình auto rotation 30 ngày cho DB password.
- **Done khi:**
  - Secrets tồn tại với naming convention `/jobbridge/{env}/{service}/{key}`
  - Rotation Lambda đã setup cho DB password

### INFRA-011: Setup Amazon S3 Buckets
- **Phụ thuộc:** INFRA-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Tạo buckets: `jobbridge-helm-charts`, `jobbridge-db-backups`, `jobbridge-ml-models`, `jobbridge-cv-uploads`. Bật versioning + lifecycle policy.
- **Done khi:**
  - 4 buckets tồn tại, đều private (block public access)
  - Versioning bật
  - Lifecycle: chuyển sang Glacier sau 90 ngày

### INFRA-012: Setup Route 53 & ACM Certificate
- **Phụ thuộc:** INFRA-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Đăng ký/import domain. Tạo hosted zone. Request ACM certificate cho domain chính + wildcard. Tạo alias record trỏ về ALB.
- **Done khi:**
  - Certificate ở trạng thái ISSUED
  - `https://yourdomain.com` load được qua ALB

---

## Phase 2 — CI/CD Pipeline

### CICD-001: Khởi tạo cấu trúc repository
- **Phụ thuộc:** DESIGN-004
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo repo(s), thiết lập `.gitignore`, `CODEOWNERS`, branch protection rules (main branch: require PR + 1 review), Conventional Commits hook (commitlint)
- **Done khi:**
  - Push thẳng vào main bị block
  - commitlint chạy ở pre-commit

### CICD-002: Tạo GitHub Actions workflow — Build & Test
- **Phụ thuộc:** CICD-001, INFRA-009
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Workflow chạy khi có PR: checkout → lint → unit test → build docker → trivy scan
- **Done khi:**
  - PR tự động trigger workflow
  - Merge bị block nếu test fail hoặc Trivy tìm thấy CRITICAL CVE

### CICD-003: Tạo GitHub Actions workflow — Build & Push Image
- **Phụ thuộc:** CICD-002
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Workflow chạy khi merge vào main: build image → tag với git SHA → push lên ECR → update Helm chart values
- **Done khi:**
  - Merge vào main tự động push image lên ECR
  - Image tag = git short SHA

### CICD-004: Tạo Helm Charts cho từng service
- **Phụ thuộc:** INFRA-006, INFRA-011
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Tạo Helm chart cho: api-gateway, auth-service, job-service, ai-service, frontend. Mỗi chart có: Deployment, Service, HPA, ServiceAccount (IRSA), ConfigMap, Ingress (frontend only)
- **Done khi:**
  - `helm template` render không lỗi
  - Có values file riêng cho dev/staging/prod

### CICD-005: Đẩy Helm Charts lên S3
- **Phụ thuộc:** CICD-004, INFRA-011
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Thêm bước `helm package` + `helm s3 push` vào GitHub Actions workflow
- **Done khi:**
  - Mỗi lần merge main, chart version mới được upload lên S3

### CICD-006: Cài đặt Argo CD trên EKS
- **Phụ thuộc:** INFRA-006
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Cài Argo CD qua Helm. Expose UI qua ALB (internal). Tạo IRSA role `sa-argocd`. Cấu hình kết nối tới S3 Helm chart repo.
- **Done khi:**
  - Argo CD UI accessible
  - Argo CD có thể pull chart từ S3

### CICD-007: Tạo Argo CD Applications
- **Phụ thuộc:** CICD-006, CICD-005
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tạo Argo CD Application resource cho từng service ở từng môi trường (dev, staging, prod). Cấu hình sync policy (auto-sync dev, manual prod).
- **Done khi:**
  - 5 Applications ở trạng thái Synced/Healthy trên dev
  - Merge code → tự động deploy lên dev trong 2 phút

### CICD-008: Setup môi trường dev local với Docker Compose
- **Phụ thuộc:** DESIGN-004
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Tạo `docker-compose.yml` chạy tất cả services + PostgreSQL + Redis (nếu có) local. Hot reload cho từng service.
- **Done khi:**
  - `docker compose up` chạy được toàn bộ stack local
  - Mỗi service có hot reload (air cho Go, vite dev cho React)

---

## Phase 3 — Database Layer

### DB-001: Thiết kế & implement schema migrations
- **Phụ thuộc:** DESIGN-001, INFRA-008
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Dùng golang-migrate. Tạo migration files theo thứ tự:
  - `001_create_users.sql`
  - `002_create_companies.sql`
  - `003_create_jobs.sql`
  - `004_create_applications.sql`
  - `005_create_skills_categories.sql`
  - `006_create_notifications.sql`
  - `007_create_ai_analyses.sql`
- **Done khi:**
  - `migrate up` chạy thành công không lỗi
  - `migrate down` rollback được

### DB-002: Tạo indexes cho performance
- **Phụ thuộc:** DB-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Index cho: jobs(status, created_at), applications(job_id, user_id), users(email), jobs full-text search (GIN index)
- **Done khi:**
  - `EXPLAIN ANALYZE` trên query tìm kiếm job chạy dưới 10ms với 10k records

### DB-003: Tạo database seed data
- **Phụ thuộc:** DB-001
- **Priority:** P2 | **Effort:** S
- **Mô tả:** Seed data cho dev: 10 companies, 100 jobs, 50 users, categories & skills
- **Done khi:**
  - `make seed` chạy được, data xuất hiện trong DB

### DB-004: Setup RDS Proxy
- **Phụ thuộc:** INFRA-008, INFRA-010
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Tạo RDS Proxy để connection pooling. Cấu hình secret từ Secrets Manager. Cập nhật connection string trong app.
- **Done khi:**
  - App kết nối qua RDS Proxy endpoint, không phải trực tiếp RDS

### DB-005: Viết database helper package
- **Phụ thuộc:** DB-001
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Package Go dùng chung: kết nối DB (pgx/sqlx), retry logic, health check, transaction helper
- **Done khi:**
  - Package export hàm `NewDB(cfg)`, `WithTx(ctx, fn)`, `HealthCheck()`

### DB-006: Cấu hình backup tự động RDS → S3
- **Phụ thuộc:** INFRA-008, INFRA-011
- **Priority:** P1 | **Effort:** S
- **Mô tả:** RDS automated backup đã bật. Thêm export snapshot định kỳ sang S3 bằng Lambda + CloudWatch Event (daily 2am).
- **Done khi:**
  - Mỗi ngày có 1 snapshot file trong S3 bucket `jobbridge-db-backups`

### DB-007: Test restore từ backup
- **Phụ thuộc:** DB-006
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Thực hiện drill restore: lấy snapshot từ S3, restore lên RDS instance mới (dev), verify data integrity
- **Done khi:**
  - RPO < 24h, RTO < 2h có tài liệu chứng minh

---

## Phase 4 — Authentication

### AUTH-001: Tạo Cognito User Pool
- **Phụ thuộc:** INFRA-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tạo Cognito User Pool với: email là username, password policy (min 8 ký tự, có số + hoa), MFA optional, custom attributes: `custom:role` (job_seeker/employer/admin), `custom:userId`
- **Done khi:**
  - User Pool tồn tại
  - Có thể signup/confirm/signin qua AWS CLI test

### AUTH-002: Tạo Cognito App Client & Hosted UI
- **Phụ thuộc:** AUTH-001
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo App Client cho SPA (no secret). Cấu hình callback URLs. Setup Hosted UI với custom CSS (logo, màu brand).
- **Done khi:**
  - Hosted UI hiển thị đúng branding
  - OAuth flow (Authorization Code + PKCE) hoạt động

### AUTH-003: Cấu hình Lambda triggers cho Cognito
- **Phụ thuộc:** AUTH-001, DB-001
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Viết và deploy 4 Lambda triggers (xem `diagrams/23a`):
  - Pre Sign-up: validate email, block disposable domains
  - Post Confirmation: INSERT user vào RDS, gửi welcome email
  - Pre Token Generation: thêm custom claims vào JWT
  - Post Authentication: UPDATE last_login
- **Done khi:**
  - Signup flow tạo user trong RDS
  - JWT có custom claims `role`, `userId`

### AUTH-004: Cấu hình Social Login (Google)
- **Phụ thuộc:** AUTH-002
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Tạo Google OAuth2 credentials. Cấu hình Cognito Identity Provider Google. Test flow login qua Google.
- **Done khi:**
  - "Login with Google" button hoạt động và trả về JWT

### AUTH-005: Cấu hình ALB Cognito Authenticator
- **Phụ thuộc:** AUTH-001, INFRA-007
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Cấu hình ALB listener rule: authenticate via Cognito trước khi forward request. Chỉ áp dụng cho API routes (`/api/*`), không áp dụng cho `/health` và static assets.
- **Done khi:**
  - Request không có JWT nhận 401
  - Request có JWT hợp lệ được forward với header `X-User-Id`, `X-User-Role`

### AUTH-006: Viết Auth Service — User Profile CRUD
- **Phụ thuộc:** AUTH-001, DB-001, BE-001
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Implement endpoints:
  - `GET /profile` — lấy profile user hiện tại
  - `PUT /profile` — cập nhật profile (name, bio, avatar, skills)
  - `GET /users/{id}` — xem profile public
- **Done khi:**
  - API hoạt động, có test
  - Lưu dữ liệu vào RDS

### AUTH-007: Viết Auth Service — RBAC Middleware
- **Phụ thuộc:** AUTH-006
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Middleware kiểm tra role từ JWT header `X-User-Role`. Định nghĩa permissions: employer có thể POST job, job_seeker có thể apply, admin có thể quản lý tất cả.
- **Done khi:**
  - Employer gọi endpoint của job_seeker nhận 403
  - Admin bypass tất cả role checks

### AUTH-008: Viết Auth Service — Admin User Management
- **Phụ thuộc:** AUTH-007
- **Priority:** P2 | **Effort:** M
- **Mô tả:**
  - `GET /admin/users` — list users (paginated)
  - `PUT /admin/users/{id}/status` — ban/unban user
  - `DELETE /admin/users/{id}` — xóa user (soft delete)
- **Done khi:**
  - Chỉ admin mới gọi được, có unit test

### AUTH-009: IRSA cho Auth Service & Lambda triggers
- **Phụ thuộc:** INFRA-006, AUTH-003
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Tạo IRSA roles: `sa-auth-service` (Secrets Manager, CloudWatch), Lambda execution role (RDS access, SES)
- **Done khi:**
  - Auth Service pod có thể đọc secret từ Secrets Manager mà không cần hardcode credentials

---

## Phase 5 — Backend Skeleton

> Tạo skeleton cho tất cả services trước khi viết feature. Đảm bảo deploy được lên EKS.

### BE-001: Khởi tạo API Gateway service
- **Phụ thuộc:** CICD-008, DESIGN-005
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Init Go project (Go module). Setup framework (Gin/Echo). Implement: health check endpoint, graceful shutdown, logging middleware (structured JSON), request ID middleware, error handling middleware. Viết Dockerfile multi-stage.
- **Done khi:**
  - `GET /health` trả về `{"status": "ok"}`
  - Docker image build được, size < 50MB
  - Deploy lên EKS dev thành công

### BE-002: Khởi tạo Auth Service
- **Phụ thuộc:** BE-001 (cùng pattern)
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tương tự BE-001 nhưng cho auth-service. Thêm kết nối DB (dùng package từ DB-005).
- **Done khi:** Giống BE-001

### BE-003: Khởi tạo Job Service
- **Phụ thuộc:** BE-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tương tự BE-001 nhưng cho job-service.
- **Done khi:** Giống BE-001

### BE-004: Khởi tạo AI Service
- **Phụ thuộc:** BE-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tương tự BE-001 nhưng cho ai-service. Có thể dùng Python (FastAPI) nếu cần ML libraries.
- **Done khi:** Giống BE-001

### BE-005: Cấu hình API Gateway routing
- **Phụ thuộc:** BE-001, BE-002, BE-003, BE-004
- **Priority:** P0 | **Effort:** M
- **Mô tả:** API Gateway proxy requests đến đúng service:
  - `/api/v1/auth/*` → auth-service:8081
  - `/api/v1/jobs/*` → job-service:8082
  - `/api/v1/ai/*` → ai-service:8083
  - Extract `X-User-Id`, `X-User-Role` từ header, forward xuống services
- **Done khi:**
  - Routing đúng cho tất cả paths
  - Headers được forward đúng

### BE-006: Setup IRSA cho tất cả services
- **Phụ thuộc:** INFRA-006, INFRA-010, BE-001–004
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Tạo IRSA roles cho: api-gateway, job-service, ai-service (xem `diagrams/20`). Cập nhật Helm chart ServiceAccount.
- **Done khi:**
  - Mỗi pod có thể đọc secret của mình từ Secrets Manager

---

## Phase 6 — Frontend Skeleton

### FE-001: Khởi tạo React project
- **Phụ thuộc:** DESIGN-005
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Init Vite + React + TypeScript. Cài: TailwindCSS, shadcn/ui, React Router v6, React Query (TanStack), Zustand, Axios. Cấu hình ESLint + Prettier. Viết Dockerfile (Nginx).
- **Done khi:**
  - `npm run dev` chạy được
  - Docker build thành công
  - Deploy lên EKS dev, truy cập được qua domain

### FE-002: Setup AWS Amplify / Cognito SDK
- **Phụ thuộc:** FE-001, AUTH-002
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Cài `aws-amplify` hoặc `amazon-cognito-identity-js`. Cấu hình User Pool ID, App Client ID. Setup Auth context (useAuth hook).
- **Done khi:**
  - `useAuth().user` trả về user info sau khi login
  - Token tự động refresh trước khi hết hạn

### FE-003: Tạo trang Login / Signup / Forgot Password
- **Phụ thuộc:** FE-002, AUTH-001
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Implement forms với validation (react-hook-form + zod):
  - Login: email + password + "Login with Google"
  - Signup: email + password + confirm + role (job_seeker/employer)
  - Verify email (nhập code)
  - Forgot password flow
- **Done khi:**
  - Toàn bộ auth flow hoạt động end-to-end
  - Error messages rõ ràng (wrong password, email existed, etc.)

### FE-004: Cấu hình Axios interceptors & Route Guards
- **Phụ thuộc:** FE-002
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Axios interceptor tự động đính JWT vào header. Response interceptor xử lý 401 (refresh token). Route Guard component chặn trang cần login.
- **Done khi:**
  - Mọi API call tự động có Bearer token
  - Hết session → redirect login, không mất trang đang xem

---

## Phase 7 — Backend Core Features

### FEAT-001: Job Service — Tạo/Sửa/Xóa job posting (Employer)
- **Phụ thuộc:** BE-003, DB-001, AUTH-007
- **Priority:** P0 | **Effort:** L
- **Mô tả:**
  - `POST /api/v1/jobs` — tạo job (chỉ employer)
  - `PUT /api/v1/jobs/{id}` — sửa job (chỉ owner)
  - `DELETE /api/v1/jobs/{id}` — xóa/ẩn job
  - `GET /api/v1/jobs/mine` — list job của employer mình
- **Done khi:** CRUD hoạt động, có validation, unit + integration test

### FEAT-002: Job Service — Tìm kiếm & lọc jobs (Public)
- **Phụ thuộc:** FEAT-001, DB-002
- **Priority:** P0 | **Effort:** L
- **Mô tả:**
  - `GET /api/v1/jobs` — list jobs (public, paginated)
  - Query params: `q` (full-text), `location`, `salary_min`, `salary_max`, `category`, `job_type`, `sort`
  - Full-text search dùng PostgreSQL GIN index
- **Done khi:**
  - Search 100k records trả về kết quả < 200ms
  - Pagination đúng (cursor-based hoặc offset)

### FEAT-003: Job Service — Xem chi tiết job (Public)
- **Phụ thuộc:** FEAT-001
- **Priority:** P0 | **Effort:** S
- **Mô tả:** `GET /api/v1/jobs/{id}` — trả về full job detail + company info. Tăng view_count.
- **Done khi:** API hoạt động, có unit test

### FEAT-004: Job Service — Apply job (Job Seeker)
- **Phụ thuộc:** FEAT-001, AUTH-007
- **Priority:** P0 | **Effort:** L
- **Mô tả:**
  - `POST /api/v1/jobs/{id}/apply` — nộp CV (upload file lên S3, lưu path vào DB)
  - `GET /api/v1/applications/mine` — list applications của mình
  - Không cho apply 2 lần cùng 1 job
- **Done khi:** Apply tạo record trong DB, file CV lên S3

### FEAT-005: Job Service — Quản lý applications (Employer)
- **Phụ thuộc:** FEAT-004
- **Priority:** P0 | **Effort:** L
- **Mô tả:**
  - `GET /api/v1/jobs/{id}/applications` — list applicants
  - `PUT /api/v1/applications/{id}/status` — update status (reviewing, shortlisted, rejected, hired)
  - Trigger notification khi đổi status
- **Done khi:** Employer có thể review và update status ứng viên

### FEAT-006: Auth Service — Company Profile CRUD
- **Phụ thuộc:** AUTH-006, DB-001
- **Priority:** P1 | **Effort:** M
- **Mô tả:**
  - `POST /api/v1/companies` — tạo company (chỉ employer)
  - `PUT /api/v1/companies/{id}` — cập nhật info (logo, description, website)
  - `GET /api/v1/companies/{id}` — xem public profile
- **Done khi:** Employer tạo và quản lý company của mình

### FEAT-007: Job Service — Bookmark / Save job (Job Seeker)
- **Phụ thuộc:** FEAT-001, AUTH-007
- **Priority:** P2 | **Effort:** S
- **Mô tả:**
  - `POST /api/v1/jobs/{id}/bookmark` — lưu job
  - `DELETE /api/v1/jobs/{id}/bookmark` — bỏ lưu
  - `GET /api/v1/bookmarks` — list saved jobs
- **Done khi:** Job seeker bookmark được jobs yêu thích

### FEAT-008: Auth Service — Skills & Categories management
- **Phụ thuộc:** DB-001
- **Priority:** P1 | **Effort:** M
- **Mô tả:**
  - `GET /api/v1/skills` — list all skills (public)
  - `GET /api/v1/categories` — list job categories (public)
  - `POST /api/v1/admin/skills` — admin thêm skill
- **Done khi:** Seeder data đầy đủ, API trả đúng list

---

## Phase 8 — AI Features

### AI-001: AI Service — Upload & parse CV
- **Phụ thuộc:** BE-004, INFRA-011
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Nhận file CV (PDF/DOCX), upload lên S3, extract text (pdfminer/docx2txt), parse thông tin (skills, experience, education) dùng LLM (Claude API)
- **Done khi:**
  - Upload CV → nhận JSON có fields: skills[], years_experience, education[]
  - Xử lý async qua SQS (không block request)

### AI-002: AI Service — Job-candidate matching score
- **Phụ thuộc:** AI-001, FEAT-001
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Tính match score (0–100) giữa CV của ứng viên và job posting. Dùng embedding similarity hoặc LLM scoring.
- **Done khi:**
  - `GET /api/v1/ai/jobs/{id}/match` trả về score + breakdown (skills match, experience match)
  - Thời gian < 3s

### AI-003: AI Service — Job recommendations cho Job Seeker
- **Phụ thuộc:** AI-001, FEAT-002
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Dựa vào profile + lịch sử apply, gợi ý top 10 jobs phù hợp nhất. Chạy batch daily hoặc real-time.
- **Done khi:**
  - `GET /api/v1/ai/recommendations` trả về list jobs sorted by relevance score

### AI-004: AI Service — Gợi ý cải thiện CV
- **Phụ thuộc:** AI-001
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Phân tích CV và đưa ra gợi ý cụ thể: thiếu keyword, format, skills cần bổ sung
- **Done khi:** Trả về list suggestions có actionable advice

### AI-005: AI Service — Interview questions generator
- **Phụ thuộc:** AI-002
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Dựa vào job description, generate 10 câu hỏi phỏng vấn phổ biến + gợi ý trả lời
- **Done khi:** `POST /api/v1/ai/jobs/{id}/interview-prep` trả về Q&A list

### AI-006: AI Service — Cấu hình SQS async processing
- **Phụ thuộc:** BE-004, INFRA xem MSG
- **Priority:** P1 | **Effort:** M
- **Mô tả:** CV parsing và matching chạy async qua SQS. Job Service push message, AI Service consume và update kết quả vào DB.
- **Done khi:**
  - AI tasks không block request
  - Dead Letter Queue cho failed tasks

### AI-007: IRSA cho AI Service
- **Phụ thuộc:** INFRA-006, AI-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** IRSA role `sa-ai-service`: S3 (model + CV bucket), Secrets Manager (AI API keys), SQS, CloudWatch
- **Done khi:** AI Service pod truy cập S3 và Secrets Manager qua IRSA

### AI-008: Lưu AI analysis results vào DB
- **Phụ thuộc:** AI-001, DB-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Table `ai_analyses`: lưu parsed CV data, match scores, recommendations theo user + job. Có TTL hoặc cleanup job.
- **Done khi:** Kết quả AI được persist, không gọi lại API nếu đã có cache trong DB

---

## Phase 9 — Messaging & Notifications

### MSG-001: Setup SES domain + DKIM
- **Phụ thuộc:** INFRA-012
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Verify domain trong SES. Thêm DKIM/SPF/DMARC DNS records. Request production access (out of sandbox).
- **Done khi:**
  - Email gửi từ `no-reply@yourdomain.com` không vào spam
  - SES không còn ở sandbox mode

### MSG-002: Tạo SQS queues & SNS topics
- **Phụ thuộc:** INFRA-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Tạo queues: `email-queue`, `job-processing-queue`, và Dead Letter Queues tương ứng. Tạo SNS topic: `email-topic`, `system-notifications`.
- **Done khi:**
  - Queues và topics tồn tại với đúng cấu hình (visibility timeout, message retention)

### MSG-003: Viết Lambda — Email Sender
- **Phụ thuộc:** MSG-001, MSG-002
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Lambda trigger từ SQS `email-queue`. Parse message, render HTML template, gửi qua SES. Xử lý retry và DLQ.
- **Done khi:**
  - Push message vào SQS → Lambda gửi email thành công
  - Failed email vào DLQ

### MSG-004: Welcome email khi signup
- **Phụ thuộc:** MSG-003, AUTH-003 (Post Confirmation trigger)
- **Priority:** P2 | **Effort:** S
- **Mô tả:** Post Confirmation Lambda push message vào `email-queue` với template welcome email
- **Done khi:** Signup xong nhận được welcome email < 30s

### MSG-005: Email thông báo khi đổi application status
- **Phụ thuộc:** MSG-003, FEAT-005
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Khi employer update status (shortlisted, rejected, hired) → push message vào `email-queue` → lambda gửi email cho job seeker
- **Done khi:** Ứng viên nhận email thông báo khi status thay đổi

### MSG-006: Email thông báo có applicant mới (Employer)
- **Phụ thuộc:** MSG-003, FEAT-004
- **Priority:** P2 | **Effort:** S
- **Mô tả:** Khi có người apply job → gửi email cho employer
- **Done khi:** Employer nhận email notification

### MSG-007: In-app notification system
- **Phụ thuộc:** DB-001, FEAT-004
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Table `notifications` trong DB. API:
  - `GET /api/v1/notifications` — list unread
  - `PUT /api/v1/notifications/{id}/read`
  - `PUT /api/v1/notifications/read-all`
- **Done khi:** Notification bell trong UI hiển thị số unread

### MSG-008: CloudWatch Alarm → SNS → Email/Slack
- **Phụ thuộc:** OBS-001
- **Priority:** P2 | **Effort:** S
- **Mô tả:** Cấu hình alarm cho: CPU > 80%, Memory > 85%, RDS connections > 80%, 5xx rate > 5%. Gửi alert qua SNS → email + Slack webhook.
- **Done khi:** Tự trigger test alarm, nhận được Slack message

---

## Phase 10 — Frontend Features

### UI-001: Layout chính & Navigation
- **Phụ thuộc:** FE-001, FE-004
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Navbar (logo, search bar, login/user menu), Footer, Sidebar (cho dashboard). Responsive mobile.
- **Done khi:** Layout hiển thị đúng trên mobile (375px) và desktop (1440px)

### UI-002: Trang Landing Page
- **Phụ thuộc:** UI-001
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Hero section, featured jobs, company logos, CTA. SEO meta tags.
- **Done khi:** Page load < 2s (Lighthouse score > 85)

### UI-003: Trang tìm kiếm Jobs
- **Phụ thuộc:** UI-001, FEAT-002
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Search bar, filter panel (category, location, salary, job type), job list cards, pagination. URL-based filter state (shareable link).
- **Done khi:** Search + filter hoạt động, URL thay đổi theo filter

### UI-004: Trang chi tiết Job
- **Phụ thuộc:** UI-003, FEAT-003
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Full job description, company info, Apply button (modal), bookmark button, share button, similar jobs section
- **Done khi:** Apply modal hoạt động, CV upload lên S3

### UI-005: Trang Apply — Upload CV
- **Phụ thuộc:** UI-004, FEAT-004, AI-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Form apply: chọn CV (upload mới hoặc dùng CV đã có), cover letter text, submit. Show AI match score sau khi upload.
- **Done khi:** Submit apply → tạo application record + kích hoạt AI parse CV

### UI-006: Job Seeker Dashboard — Tổng quan
- **Phụ thuộc:** FE-004, FEAT-004
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Trang dashboard: stats (applied, shortlisted, rejected), recent applications list, recommended jobs, notifications
- **Done khi:** Dashboard load đúng data của user đang đăng nhập

### UI-007: Job Seeker Dashboard — My Applications
- **Phụ thuộc:** UI-006, FEAT-004
- **Priority:** P0 | **Effort:** M
- **Mô tả:** List tất cả applications, filter theo status, xem chi tiết từng application, timeline status changes
- **Done khi:** Hiển thị đúng danh sách và status

### UI-008: Job Seeker Dashboard — Profile & CV
- **Phụ thuộc:** UI-006, AUTH-006
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Form cập nhật profile: avatar upload, bio, skills (multi-select), work experience, education. Upload và quản lý CV files.
- **Done khi:** Update profile lưu vào DB, avatar upload lên S3

### UI-009: Job Seeker Dashboard — AI Features
- **Phụ thuộc:** UI-006, AI-001, AI-003, AI-004
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Trang AI assistant: xem CV analysis, job recommendations, CV improvement suggestions, interview prep cho job đang apply
- **Done khi:** UI hiển thị kết quả AI từ API

### UI-010: Employer Dashboard — Tổng quan
- **Phụ thuộc:** FE-004, FEAT-001
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Stats (active jobs, total applicants, views), recent activity, quick actions (post job, view applicants)
- **Done khi:** Dashboard load đúng data company

### UI-011: Employer Dashboard — Quản lý Jobs
- **Phụ thuộc:** UI-010, FEAT-001
- **Priority:** P0 | **Effort:** L
- **Mô tả:** List jobs của company, tạo/sửa/ẩn job, rich text editor cho JD (Quill/TipTap), preview trước khi publish
- **Done khi:** CRUD job hoạt động hoàn chỉnh

### UI-012: Employer Dashboard — Quản lý Applications
- **Phụ thuộc:** UI-011, FEAT-005
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Kanban board (Reviewing / Shortlisted / Interview / Hired / Rejected), xem CV inline (PDF viewer), download CV, đổi status, filter theo job
- **Done khi:** Employer drag-drop hoặc click đổi status ứng viên

### UI-013: Employer Dashboard — Company Profile
- **Phụ thuộc:** UI-010, FEAT-006
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Form cập nhật company: logo upload, description, website, social links, office locations, benefits
- **Done khi:** Company profile public page hiển thị đúng

### UI-014: Trang Company Public Profile
- **Phụ thuộc:** UI-013, FEAT-006
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Trang public của company: info, tất cả jobs đang active, reviews (nếu có)
- **Done khi:** Ai cũng xem được, không cần login

### UI-015: Admin Dashboard
- **Phụ thuộc:** UI-001, AUTH-008
- **Priority:** P2 | **Effort:** L
- **Mô tả:** Quản lý users (ban/unban), quản lý jobs (remove vi phạm), statistics tổng quan
- **Done khi:** Admin có thể thực hiện moderation actions

### UI-016: Notifications UI
- **Phụ thuộc:** UI-001, MSG-007
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Notification bell icon với badge count, dropdown list, mark as read, link đến resource liên quan
- **Done khi:** Real-time hoặc polling 30s update count

### UI-017: Responsive & Cross-browser Testing
- **Phụ thuộc:** Tất cả UI tickets
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Test trên: Chrome, Firefox, Safari, Edge. Mobile: 375px, 768px. Fix mọi layout issue.
- **Done khi:** Không có layout break trên các browsers và screen sizes trên

### UI-018: Loading states, Error boundaries, Empty states
- **Phụ thuộc:** Tất cả UI tickets
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Skeleton loading cho tất cả list/card. Error boundary component. Empty state illustrations (no jobs found, no applications yet).
- **Done khi:** Không có layout shift, không có blank screen khi loading/error

---

## Phase 11 — Observability

### OBS-001: Setup CloudWatch Log Groups & Log Retention
- **Phụ thuộc:** INFRA-006
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Tạo log groups cho từng service với naming `/jobbridge/{env}/{service}`. Retention: dev=7d, staging=14d, prod=90d
- **Done khi:** Logs từ pods xuất hiện trong CloudWatch

### OBS-002: Cài CloudWatch Agent & Container Insights
- **Phụ thuộc:** OBS-001, INFRA-006
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Deploy CloudWatch agent DaemonSet lên EKS. Enable Container Insights (CPU, memory, network per pod/node).
- **Done khi:** CloudWatch Containers dashboard có metrics

### OBS-003: Setup AWS Distro for OpenTelemetry (ADOT)
- **Phụ thuộc:** OBS-001, INFRA-006
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Deploy ADOT Collector. Cấu hình services emit traces. Export sang X-Ray và CloudWatch Metrics.
- **Done khi:** Service map hiển thị trong X-Ray console

### OBS-004: Setup Amazon OpenSearch & Kibana
- **Phụ thuộc:** OBS-001
- **Priority:** P2 | **Effort:** L
- **Mô tả:** Tạo OpenSearch domain (dev: 1 node, prod: 3 nodes). Cấu hình Fluent Bit trên EKS shipper logs → OpenSearch. Tạo Kibana index pattern.
- **Done khi:** Có thể full-text search logs trong Kibana

### OBS-005: Setup Grafana dashboards
- **Phụ thuộc:** OBS-002
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Cài Grafana (hoặc dùng managed). Tạo dashboards: cluster overview, per-service metrics (latency P50/P95/P99, RPS, error rate), RDS metrics.
- **Done khi:** 3 dashboards tồn tại với panels có ý nghĩa

### OBS-006: CloudWatch Alarms
- **Phụ thuộc:** OBS-002
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Tạo alarms: CPU > 80%, Memory > 85%, 5xx > 5%, RDS connections > 80%, SQS DLQ messages > 0, EKS node not ready
- **Done khi:** Tất cả alarms ở trạng thái OK, test trigger 1 alarm

### OBS-007: Distributed Tracing trong code
- **Phụ thuộc:** OBS-003, BE-001–004
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Thêm trace instrumentation vào tất cả HTTP handlers. Propagate trace ID qua services (B3 / W3C TraceContext headers). Log trace ID trong structured logs.
- **Done khi:** Một request end-to-end có 1 trace xuyên suốt từ API Gateway → Auth → Job service

### OBS-008: Structured logging standards
- **Phụ thuộc:** BE-001–004
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Chuẩn hoá log format JSON cho tất cả services: `{timestamp, level, service, traceId, userId, message, ...fields}`. Không log sensitive data (password, token).
- **Done khi:** Tất cả logs đồng nhất format, có thể query trong CloudWatch Insights

### OBS-009: Runbook & On-call documentation
- **Phụ thuộc:** OBS-006
- **Priority:** P2 | **Effort:** M
- **Mô tả:** Viết runbook cho top 5 alarm: cách investigate, command chạy, cách remediate
- **Done khi:** File `runbook.md` có 5 scenarios với steps rõ ràng

---

## Phase 12 — Security Hardening

### SEC-001: Cấu hình AWS WAF rules
- **Phụ thuộc:** INFRA-007
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Enable AWS Managed Rules: Core Rule Set, SQL Injection, XSS. Thêm rate limiting rule: 1000 req/5min per IP. IP-based blocking cho known malicious IPs.
- **Done khi:**
  - SQLi test payload bị block (403)
  - Rate limit test trigger được rule

### SEC-002: Enable GuardDuty
- **Phụ thuộc:** INFRA-001
- **Priority:** P1 | **Effort:** XS
- **Mô tả:** Enable GuardDuty cho tất cả accounts. Configure SNS notification khi có finding severity HIGH.
- **Done khi:** GuardDuty active, test finding (credential exfiltration simulation) → nhận notification

### SEC-003: Enable CloudTrail & AWS Config
- **Phụ thuộc:** INFRA-001
- **Priority:** P1 | **Effort:** S
- **Mô tả:** CloudTrail multi-region, log to S3, log validation enabled. AWS Config rules: MFA on root, no unused credentials > 90 days, EBS encrypted, RDS encrypted.
- **Done khi:** Config compliance dashboard không có CRITICAL non-compliant rules

### SEC-004: Secrets rotation & audit
- **Phụ thuộc:** INFRA-010
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Verify auto-rotation Lambda cho DB password hoạt động. Audit tất cả secrets có rotation bật. Remove mọi hardcoded credential trong code.
- **Done khi:**
  - `git grep -r "password\|secret\|apikey" --include="*.go" --include="*.ts"` không có kết quả trong production code

### SEC-005: Container image security
- **Phụ thuộc:** CICD-002, INFRA-009
- **Priority:** P1 | **Effort:** S
- **Mô tả:** Trivy scan bắt buộc trong CI. ECR image scanning on push. Chặn deploy image có CRITICAL CVE. Dùng distroless hoặc alpine base image.
- **Done khi:**
  - Pipeline fail khi có CRITICAL CVE
  - Base images không có OS-level CRITICAL vulns

### SEC-006: Kubernetes security hardening
- **Phụ thuộc:** INFRA-006
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Pod Security Standards (restricted). Network Policies (Calico): chặn cross-namespace traffic. RBAC: ServiceAccount không có cluster-admin. Read-only root filesystem.
- **Done khi:**
  - Pod từ namespace `frontend` không gọi được pod trong `services`
  - Tất cả pods chạy non-root user

### SEC-007: Enable SecurityHub
- **Phụ thuộc:** SEC-002, SEC-003
- **Priority:** P2 | **Effort:** S
- **Mô tả:** Enable SecurityHub. Connect GuardDuty, Inspector, Config vào SecurityHub. Tạo automation rule: HIGH finding → tạo ticket (Jira/GitHub Issue).
- **Done khi:**
  - SecurityHub score > 80%
  - Có automated response cho HIGH severity findings

### SEC-008: Penetration testing checklist
- **Phụ thuộc:** Tất cả features
- **Priority:** P2 | **Effort:** L
- **Mô tả:** Thực hiện pentest cơ bản: OWASP Top 10, auth bypass, IDOR, mass assignment, rate limit bypass. Dùng tools: OWASP ZAP, Burp Suite.
- **Done khi:** Report pentest với tất cả CRITICAL/HIGH issues đã được fix

---

## Phase 13 — Testing

### TEST-001: Unit tests — Backend services
- **Phụ thuộc:** FEAT-001–020, AI-001–008
- **Priority:** P0 | **Effort:** XL
- **Mô tả:** Unit test cho tất cả business logic (service layer). Mock DB và external APIs. Target coverage: > 70% cho critical paths.
- **Done khi:** `go test ./...` pass, coverage report > 70% cho service packages

### TEST-002: Integration tests — API endpoints
- **Phụ thuộc:** TEST-001
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Test thực tế với test DB (dockerized Postgres). Test happy path và error cases cho tất cả endpoints.
- **Done khi:** Tất cả integration tests pass trong CI pipeline

### TEST-003: Unit tests — Frontend
- **Phụ thuộc:** UI-001–018
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Vitest + Testing Library test cho components, hooks, utils. Mock API calls với MSW (Mock Service Worker).
- **Done khi:** `npm test` pass, coverage > 60%

### TEST-004: E2E tests
- **Phụ thuộc:** TEST-003, Deploy lên staging
- **Priority:** P1 | **Effort:** L
- **Mô tả:** Playwright test cho critical flows:
  - Job seeker: signup → browse → apply → check status
  - Employer: signup → post job → review application → update status
  - AI: upload CV → xem match score
- **Done khi:** 3 flows trên pass trên staging environment

### TEST-005: Load testing
- **Phụ thuộc:** Deploy lên staging
- **Priority:** P1 | **Effort:** M
- **Mô tả:** k6 test: 100 concurrent users, ramp up 5 phút, sustain 10 phút. Target: P95 < 500ms, error rate < 1%.
- **Done khi:** Load test report ghi lại kết quả, không có out-of-memory hoặc crash

### TEST-006: Database migration testing
- **Phụ thuộc:** DB-001
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Test `migrate up` và `migrate down` trên DB mới. Verify không mất data khi migrate.
- **Done khi:** Script `make test-migration` chạy được trong CI

### TEST-007: Chaos Engineering — cơ bản
- **Phụ thuộc:** Deploy lên staging
- **Priority:** P3 | **Effort:** M
- **Mô tả:** Test graceful shutdown (kill 1 pod), database connection loss, SQS không available. Verify system recover đúng.
- **Done khi:** Tất cả 3 scenarios trên có documented behaviour và system tự recover

### TEST-008: Security testing — DAST
- **Phụ thuộc:** SEC-008
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Chạy OWASP ZAP automated scan trên staging. Fix tất cả CRITICAL và HIGH findings.
- **Done khi:** ZAP report không có CRITICAL findings

### TEST-009: Accessibility testing
- **Phụ thuộc:** UI-001–018
- **Priority:** P3 | **Effort:** S
- **Mô tả:** axe-core scan tất cả pages. Fix violations level AA.
- **Done khi:** Lighthouse accessibility score > 90

### TEST-010: Browser & device testing
- **Phụ thuộc:** UI-017
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Test thực tế (BrowserStack hoặc thủ công) trên: iPhone 13, Samsung Galaxy S21, iPad, MacBook (Safari), Windows (Chrome/Edge/Firefox)
- **Done khi:** Không có critical layout issues trên các devices trên

---

## Phase 14 — Go-live

### GOLIVE-001: Setup production environment
- **Phụ thuộc:** Tất cả phases
- **Priority:** P0 | **Effort:** L
- **Mô tả:** Áp dụng lại toàn bộ INFRA phase cho account Prod. Chạy lại tất cả Terraform/CDK cho prod VPC, EKS, RDS (Multi-AZ), v.v.
- **Done khi:** Production environment là bản copy của staging nhưng với sizing phù hợp production

### GOLIVE-002: Data migration & seed prod data
- **Phụ thuộc:** GOLIVE-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Chạy migration lên prod DB. Seed categories, skills, job types. Tạo admin account đầu tiên.
- **Done khi:** Prod DB có schema đầy đủ và reference data

### GOLIVE-003: DNS cutover & SSL verification
- **Phụ thuộc:** GOLIVE-001, INFRA-012
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Chuyển DNS records trỏ về prod ALB. Verify HTTPS hoạt động. Test certificate.
- **Done khi:** `https://yourdomain.com` load production app, không có SSL warning

### GOLIVE-004: Smoke test production
- **Phụ thuộc:** GOLIVE-003
- **Priority:** P0 | **Effort:** S
- **Mô tả:** Chạy manual smoke test: signup, login, post job, apply, receive email. Verify observability (logs, metrics đang chảy).
- **Done khi:** Tất cả smoke test cases pass

### GOLIVE-005: Cấu hình backup & DR procedure
- **Phụ thuộc:** GOLIVE-001
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Verify automated backup chạy. Test restore procedure một lần. Document RTO/RPO. Cấu hình cross-region backup (S3 replication).
- **Done khi:** DR drill thành công, document xong

### GOLIVE-006: Monitoring & alerting production
- **Phụ thuộc:** GOLIVE-001, OBS-006
- **Priority:** P0 | **Effort:** M
- **Mô tả:** Verify tất cả alarms active trên prod. Cấu hình on-call rotation. Test alert delivery (Slack + email).
- **Done khi:** 1 test alarm được trigger và team nhận notification

### GOLIVE-007: Performance baseline & optimization
- **Phụ thuộc:** GOLIVE-004
- **Priority:** P1 | **Effort:** M
- **Mô tả:** Đo P50/P95/P99 latency cho các endpoints quan trọng. Document baseline. Identify và fix bottlenecks nếu P95 > 1s.
- **Done khi:**
  - Job search API: P95 < 300ms
  - Apply job API: P95 < 500ms
  - Frontend FCP < 1.5s

---

## Quick Reference — Dependency graph (phases)

```
DESIGN (0)
  └── INFRA (1)
        ├── CICD (2)
        │     └── BE-skeleton (5) ──────────────┐
        │                                        │
        ├── DB (3) ─────────────────────────────┤
        │                                        │
        └── AUTH-Cognito (4) ─────────────────┐ │
                                               ↓ ↓
                             FE-skeleton (6) ← FEAT (7)
                                    │               │
                                    ↓               ↓
                                AI (8)         MSG (9)
                                    │               │
                                    └────────┬───────┘
                                             ↓
                                        UI-features (10)
                                             │
                              ┌──────────────┼──────────────┐
                              ↓              ↓              ↓
                          OBS (11)       SEC (12)       TEST (13)
                              └──────────────┴──────────────┘
                                             ↓
                                        GO-LIVE (14)
```
