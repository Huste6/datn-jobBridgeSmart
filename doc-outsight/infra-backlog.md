# Infrastructure Backlog

> **Scope:** Chỉ hạ tầng AWS — không bao gồm code ứng dụng (backend/frontend).
> **Thay `[PROJECT]`** bằng tên dự án thực tế trước khi dùng.
>
> **Effort:** XS <2h | S 2–4h | M 0.5–1 ngày | L 1–2 ngày | XL 3–5 ngày
> **Priority:** P0 Blocker | P1 Critical | P2 Important | P3 Nice-to-have

---

## Tổng quan phases

| Phase | Tên | Tickets |
|---|---|---|
| 1 | AWS Account & Organizations | ACCOUNT-001–004 |
| 2 | IAM — Groups, Roles, Boundaries | IAM-001–006 |
| 3 | Network — VPC, Subnets, Routing | NET-001–007 |
| 4 | Compute — EKS Cluster & Add-ons | EKS-001–008 |
| 5 | Container Registry | ECR-001–003 |
| 6 | CI/CD Pipeline | CICD-001–008 |
| 7 | Database — RDS | DB-001–006 |
| 8 | Storage — S3 | S3-001–003 |
| 9 | Secrets & Config | SECRET-001–004 |
| 10 | Authentication — Cognito | COGNITO-001–005 |
| 11 | Messaging — SQS / SNS | MSG-001–004 |
| 12 | Observability | OBS-001–008 |
| 13 | Security Hardening | SEC-001–008 |
| 14 | DNS, SSL & Load Balancer | DNS-001–004 |

---

## Phase 1 — AWS Account & Organizations

### ACCOUNT-001: Tạo AWS Organization & cấu trúc OU
- **Phụ thuộc:** Không có
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo AWS Organization
  - Tạo 3 OU: `Production`, `Development`, `Shared`
  - Enable tất cả features (không chỉ consolidated billing)
- **Done khi:**
  - Organization tồn tại với 3 OU
  - Management account không dùng cho workload

### ACCOUNT-002: Bật MFA & bảo vệ root account
- **Phụ thuộc:** ACCOUNT-001
- **Priority:** P0 | **Effort:** XS
- **Việc cần làm:**
  - Bật MFA cho root account
  - Xóa root access keys nếu có
  - Lưu recovery codes ở nơi an toàn
- **Done khi:** Root account không có access key, MFA bật

### ACCOUNT-003: Tạo AWS accounts cho từng môi trường
- **Phụ thuộc:** ACCOUNT-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo account `[PROJECT]-dev` → OU Development
  - Tạo account `[PROJECT]-staging` → OU Development
  - Tạo account `[PROJECT]-prod` → OU Production
- **Done khi:** 3 accounts tồn tại, mỗi account có email riêng

### ACCOUNT-004: Cấu hình Budget Alerts
- **Phụ thuộc:** ACCOUNT-001
- **Priority:** P1 | **Effort:** XS
- **Việc cần làm:**
  - Budget alert tại $50, $100, $200 (adjust theo dự án)
  - Gửi email khi đạt 80% và 100% budget
- **Done khi:** Budget alerts active, test nhận được email

---

## Phase 2 — IAM

### IAM-001: Tạo IAM Groups cho các team
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:** Tạo groups (xem `diagrams/12–19`):
  - `devops-engineers` — full infra access
  - `backend-developers` — EKS namespace access, ECR, CloudWatch
  - `frontend-developers` — ECR, CloudWatch frontend
  - `data-engineers` — RDS, S3 backup
  - `security-auditors` — read-only all + WAF + IAM
  - `management` — billing read-only
- **Done khi:** 6 groups tồn tại với đúng managed policies đính kèm

### IAM-002: Tạo IAM Users & gán Groups
- **Phụ thuộc:** IAM-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo user cho từng thành viên team
  - Bật MFA bắt buộc (IAM policy: DenyWithoutMFA)
  - Gán đúng group theo vai trò
- **Done khi:** Mọi user có MFA, không ai dùng root account

### IAM-003: Tạo Permission Boundaries
- **Phụ thuộc:** IAM-001
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Tạo boundary `developer-boundary`: deny IAM write, deny Organizations
  - Tạo boundary `service-account-boundary`: chỉ allow services cụ thể
  - Gán boundaries cho tất cả developer users và IRSA roles
- **Done khi:** Developer user không thể tự leo thang quyền (tạo policy mới cho mình)

### IAM-004: Tạo IRSA Roles cho EKS Service Accounts
- **Phụ thuộc:** EKS-001 (cần OIDC provider)
- **Priority:** P0 | **Effort:** L
- **Việc cần làm:** Tạo roles (xem `diagrams/20`):
  - `sa-api-gateway` — Secrets Manager, SSM, SQS, CloudWatch
  - `sa-auth-service` — Secrets Manager, CloudWatch
  - `sa-job-service` — SQS, SNS, S3, Secrets Manager, CloudWatch
  - `sa-ai-service` — S3 (models), Secrets Manager, SQS, CloudWatch
  - `sa-argocd` — S3 (helm), ECR
  - `sa-cluster-autoscaler` — EC2 autoscaling
  - `sa-ebs-csi` — EC2 volume management
  - `sa-lb-controller` — ELB, EC2, ACM
  - `sa-cloudwatch-agent` — CloudWatch, EC2 describe
- **Done khi:** Mỗi role có đúng trust policy trỏ về OIDC provider của EKS

### IAM-005: Tạo Service Control Policies (SCP)
- **Phụ thuộc:** ACCOUNT-001
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - SCP `production-guardrails` cho OU Production:
    - Deny: region ngoài danh sách cho phép
    - Deny: xóa RDS, S3, CloudTrail, GuardDuty, Config
    - Deny: terminate EC2 không có approval tag
  - SCP `dev-cost-control` cho OU Development:
    - Deny: instance type GPU/high-mem (p*, g*, x*)
    - Deny: RDS class db.r5.* trở lên
- **Done khi:** SCP attached vào đúng OU, test deny action hoạt động

### IAM-006: Rotate & audit Access Keys định kỳ
- **Phụ thuộc:** IAM-002
- **Priority:** P2 | **Effort:** S
- **Việc cần làm:**
  - AWS Config rule: `access-keys-rotated` (90 ngày)
  - AWS Config rule: `iam-user-mfa-enabled`
  - Cấu hình alert khi có user vi phạm
- **Done khi:** Config rules active, non-compliant user nhận email cảnh báo

---

## Phase 3 — Network

### NET-001: Tạo VPC
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo VPC CIDR `10.0.0.0/16` tại `us-east-1`
  - Bật DNS hostnames và DNS resolution
  - Tag đúng convention: `Name=[PROJECT]-vpc-[env]`
- **Done khi:** VPC tồn tại, DNS bật

### NET-002: Tạo Subnets
- **Phụ thuộc:** NET-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm** (xem `diagrams/01`):
  - Public: `10.0.1.0/24` AZ-a
  - Private AZ-a: `10.0.2.0/24`
  - Private AZ-b: `10.0.3.0/24`
  - Private AZ-c: `10.0.4.0/24`
  - Database AZ-a: `10.0.5.0/24`
  - Database AZ-b: `10.0.6.0/24` *(thêm cho Multi-AZ RDS)*
- **Done khi:** 6 subnets tồn tại, đúng CIDR và AZ

### NET-003: Tạo Internet Gateway & NAT Gateway
- **Phụ thuộc:** NET-002
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo Internet Gateway, attach vào VPC
  - Tạo Elastic IP
  - Tạo NAT Gateway trong public subnet, gắn EIP
- **Done khi:** Instance private subnet ping được 8.8.8.8 qua NAT

### NET-004: Tạo Route Tables
- **Phụ thuộc:** NET-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm** (xem `diagrams/02`):
  - RT Public: `0.0.0.0/0` → IGW
  - RT Private: `0.0.0.0/0` → NAT Gateway
  - RT Database: chỉ `10.0.0.0/16 → local`, không có internet route
  - Associate đúng subnet vào đúng route table
- **Done khi:** Route tables đúng, không có route dư thừa

### NET-005: Tạo Security Groups
- **Phụ thuộc:** NET-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm** (xem `diagrams/03`):
  - `alb-sg`: inbound 443/80 từ 0.0.0.0/0
  - `eks-node-sg`: inbound từ alb-sg, outbound 5432 → rds-sg, outbound 443 → SSM VPC endpoints
  - `rds-sg`: inbound 5432 chỉ từ eks-node-sg
  - ~~`bastion-sg`~~ — **không cần**, dùng SSM Session Manager thay thế
- **Done khi:** Không có SG nào open 0.0.0.0/0 ngoài alb-sg port 443

### NET-006: Tạo Network ACLs
- **Phụ thuộc:** NET-002
- **Priority:** P1 | **Effort:** S
- **Việc cần làm** (xem `diagrams/04`):
  - NACL Public: allow 443, 80, ephemeral in/out
  - NACL Private: allow VPC CIDR + ephemeral
  - NACL Database: allow 5432 chỉ từ private subnets
- **Done khi:** NACLs attached vào đúng subnets, không block traffic hợp lệ

### NET-007: Cấu hình SSM Session Manager (thay Bastion)
- **Phụ thuộc:** NET-002, IAM-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Tạo VPC Endpoints cho SSM (3 endpoints cần thiết):
    - `com.amazonaws.[region].ssm`
    - `com.amazonaws.[region].ssmmessages`
    - `com.amazonaws.[region].ec2messages`
  - Endpoints đặt trong private subnets, gắn `eks-node-sg`
  - Verify EKS node IAM role có policy `AmazonSSMManagedInstanceCore`
  - Test: `aws ssm start-session --target <node-instance-id>`
  - Test tunnel RDS: `aws ssm start-session --document AWS-StartPortForwardingSessionToRemoteHost`
- **Done khi:**
  - Vào được shell EKS node qua SSM không cần port 22
  - Connect được RDS từ local qua SSM tunnel (DBeaver/psql)
  - **Tiết kiệm:** ~$10/tháng so với Bastion EC2

---

## Phase 4 — EKS Cluster

### EKS-001: Tạo EKS Cluster
- **Phụ thuộc:** NET-002, NET-005, IAM-001
- **Priority:** P0 | **Effort:** L
- **Việc cần làm:**
  - Tạo EKS cluster (managed control plane)
  - Kubernetes version: 1.29+ (latest stable)
  - Enable OIDC Provider (bắt buộc cho IRSA)
  - Cluster endpoint: private (không expose public nếu production)
  - Logging: api, audit, authenticator, controllerManager, scheduler
- **Done khi:**
  - `kubectl cluster-info` trả về kết quả
  - OIDC Provider URL tồn tại

### EKS-002: Tạo Node Groups
- **Phụ thuộc:** EKS-001
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Node group mỗi AZ (3 groups): deploy trong private subnets
  - Instance type: t3.medium (dev), t3.large (prod)
  - Min: 1, Max: 5 per AZ
  - AMI: Amazon Linux 2 EKS Optimized
  - Gắn đúng `eks-node-sg`
- **Done khi:** `kubectl get nodes` trả về 3 nodes ở trạng thái Ready

### EKS-003: Cài Add-on — VPC CNI, CoreDNS, kube-proxy
- **Phụ thuộc:** EKS-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Cài 3 add-ons managed qua EKS console/CLI
  - Cập nhật lên version mới nhất tương thích
- **Done khi:** `kubectl get pods -n kube-system` — 3 add-ons Running

### EKS-004: Cài Add-on — AWS EBS CSI Driver
- **Phụ thuộc:** EKS-001, IAM-004 (sa-ebs-csi)
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Cài EBS CSI Driver managed add-on
  - Tạo StorageClass `gp3` làm default
  - Test tạo PVC
- **Done khi:** PVC tạo được, PersistentVolume được provision tự động

### EKS-005: Cài Metrics Server
- **Phụ thuộc:** EKS-001
- **Priority:** P0 | **Effort:** XS
- **Việc cần làm:**
  - Cài Metrics Server (bắt buộc cho HPA)
  - `kubectl top nodes` và `kubectl top pods` hoạt động
- **Done khi:** HPA có thể đọc CPU/memory metrics

### EKS-006: Cài Cluster Autoscaler
- **Phụ thuộc:** EKS-002, IAM-004 (sa-cluster-autoscaler)
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Deploy Cluster Autoscaler với IRSA role
  - Cấu hình đúng `--node-group-auto-discovery` tag
  - Test scale: tạo nhiều pods đến khi thiếu node → node mới được thêm
- **Done khi:** Cluster tự thêm node khi pods Pending, tự xóa node khi idle

### EKS-007: Cài AWS Load Balancer Controller
- **Phụ thuộc:** EKS-001, IAM-004 (sa-lb-controller)
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Cài AWS Load Balancer Controller qua Helm
  - Tạo IRSA role `sa-lb-controller`
  - Test: apply Ingress resource → ALB được tạo tự động
- **Done khi:** Ingress tạo ALB thành công, target groups healthy

### EKS-008: Cấu hình Namespaces & RBAC
- **Phụ thuộc:** EKS-001
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Tạo namespaces: `frontend`, `backend`, `services`, `data`, `monitoring`, `argocd`
  - Tạo Kubernetes RBAC: Role + RoleBinding per namespace
  - Cập nhật `aws-auth` ConfigMap cho IAM users/roles
- **Done khi:**
  - Developer chỉ `kubectl` được namespace của mình
  - `aws-auth` có đủ mappings cho team

---

## Phase 5 — Container Registry (ECR)

### ECR-001: Tạo ECR Repositories
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo private repository cho từng service (thay tên theo dự án)
  - Bật image scanning on push
  - Bật encryption (AES-256 hoặc KMS)
- **Done khi:** Repositories tồn tại, push test image thành công

### ECR-002: Cấu hình Lifecycle Policy
- **Phụ thuộc:** ECR-001
- **Priority:** P1 | **Effort:** XS
- **Việc cần làm:**
  - Giữ tối đa 10 images tagged mới nhất
  - Xóa untagged images sau 1 ngày
- **Done khi:** Lifecycle policy active, cũ images tự bị xóa

### ECR-003: Cấu hình cross-account pull (nếu multi-account)
- **Phụ thuộc:** ECR-001, ACCOUNT-003
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - ECR nằm ở account Shared
  - Thêm resource-based policy cho phép account Dev và Prod pull image
- **Done khi:** EKS ở account Prod pull được image từ ECR Shared

---

## Phase 6 — CI/CD Pipeline

### CICD-001: Khởi tạo repository & branch protection
- **Phụ thuộc:** Không có
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo GitHub repository (hoặc dùng existing)
  - Branch protection cho `main`: require PR, require 1 review, require CI pass
  - Thêm `.gitignore` phù hợp
  - Cài pre-commit hooks (commitlint, secret scanning)
- **Done khi:** Push thẳng vào main bị block, commit message sai format bị reject

### CICD-002: GitHub Actions — CI workflow (Build & Test)
- **Phụ thuộc:** CICD-001, ECR-001
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Trigger: mỗi PR
  - Steps: checkout → lint → unit test → docker build → Trivy scan
  - Chặn merge nếu Trivy tìm CRITICAL CVE
  - Cấu hình GitHub OIDC để không cần AWS access key tĩnh
- **Done khi:** PR tự chạy workflow, merge bị block khi fail

### CICD-003: GitHub Actions — CD workflow (Push Image)
- **Phụ thuộc:** CICD-002
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Trigger: merge vào `main`
  - Build image → tag = git short SHA + `latest`
  - Push lên ECR
  - Cập nhật image tag trong Helm values file → commit bot
- **Done khi:** Merge main → image mới xuất hiện trên ECR trong 5 phút

### CICD-004: Tạo Helm Charts
- **Phụ thuộc:** EKS-001
- **Priority:** P0 | **Effort:** L
- **Việc cần làm:**
  - Tạo Helm chart cho từng service
  - Mỗi chart có: `Deployment`, `Service`, `HPA`, `ServiceAccount`, `ConfigMap`
  - `values.yaml` chung + `values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml`
  - `helm lint` pass
- **Done khi:** `helm template . -f values-dev.yaml` render không lỗi

### CICD-005: Push Helm Charts lên S3
- **Phụ thuộc:** CICD-004, S3-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Thêm step `helm package` + `helm s3 push` vào CD workflow
  - Version chart tăng tự động theo git tag
- **Done khi:** Merge main → chart version mới xuất hiện trên S3

### CICD-006: Cài Argo CD lên EKS
- **Phụ thuộc:** EKS-001, IAM-004 (sa-argocd)
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Cài Argo CD qua Helm vào namespace `argocd`
  - Expose UI qua ALB (internal, không public)
  - Cấu hình IRSA role `sa-argocd`
  - Kết nối S3 Helm chart repo
  - Đổi admin password mặc định
- **Done khi:** Argo CD UI accessible, kết nối được S3

### CICD-007: Tạo Argo CD Applications
- **Phụ thuộc:** CICD-006, CICD-005
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Tạo Application resource cho từng service × môi trường
  - Dev: auto-sync (tự deploy khi chart mới)
  - Staging/Prod: manual sync (deploy khi approve)
  - Cấu hình health checks và sync waves (thứ tự deploy)
- **Done khi:** Merge main → Argo CD tự deploy lên dev trong 2 phút

### CICD-008: Docker Compose cho local development
- **Phụ thuộc:** Không có
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - `docker-compose.yml` chạy: services + PostgreSQL + LocalStack (giả lập AWS services)
  - `.env.example` với tất cả biến môi trường cần thiết
  - Hot reload cho mỗi service
- **Done khi:** `docker compose up` chạy toàn bộ stack local trong 2 phút

---

## Phase 7 — Database

### DB-001: Tạo RDS Subnet Group
- **Phụ thuộc:** NET-002
- **Priority:** P0 | **Effort:** XS
- **Việc cần làm:**
  - Tạo DB Subnet Group từ 2 database subnets (AZ-a và AZ-b)
- **Done khi:** Subnet group tồn tại với 2 AZs

### DB-002: Tạo RDS PostgreSQL Instance
- **Phụ thuộc:** DB-001, NET-005
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Engine: PostgreSQL 16
  - Instance class: `db.t3.medium` (dev), `db.t3.large` (prod)
  - Storage: 100GB gp3, autoscaling đến 500GB
  - Multi-AZ: bật cho staging và prod
  - Automated backup: retention 7 ngày, backup window 2–3am
  - Encryption at rest: bật
  - Gắn `rds-sg`
- **Done khi:**
  - RDS endpoint accessible từ EKS (port 5432)
  - Không accessible từ internet

### DB-003: Tạo RDS Proxy
- **Phụ thuộc:** DB-002, SECRET-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Tạo RDS Proxy (connection pooling)
  - Cấu hình lấy credentials từ Secrets Manager
  - Cập nhật connection string trong app sang proxy endpoint
- **Done khi:** App kết nối qua proxy, số connections đến RDS giảm rõ rệt

### DB-004: Cấu hình Performance Insights & Enhanced Monitoring
- **Phụ thuộc:** DB-002
- **Priority:** P1 | **Effort:** XS
- **Việc cần làm:**
  - Bật Performance Insights (retention 7 ngày)
  - Enhanced monitoring: 60 giây
- **Done khi:** Performance Insights dashboard hiển thị queries

### DB-005: Cấu hình backup export sang S3
- **Phụ thuộc:** DB-002, S3-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Tạo EventBridge rule trigger Lambda hàng ngày 3am
  - Lambda export snapshot sang S3 bucket backup
  - Lifecycle S3: chuyển sang Glacier sau 30 ngày, xóa sau 1 năm
- **Done khi:** Mỗi ngày có file backup mới trên S3

### DB-006: Test restore từ backup
- **Phụ thuộc:** DB-005
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Thực hiện restore drill: lấy snapshot, restore lên RDS instance mới (dev)
  - Verify data integrity
  - Document thời gian restore (RTO)
- **Done khi:** RPO < 24h, RTO < 2h được document

---

## Phase 8 — Storage (S3)

### S3-001: Tạo S3 Buckets
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - `[project]-helm-charts-[env]` — Helm chart repo
  - `[project]-db-backups-[env]` — database backups
  - `[project]-assets-[env]` — user uploads (CV, avatar, etc.)
  - Tất cả buckets: block public access, encryption SSE-S3
- **Done khi:** 3 buckets tồn tại, public access blocked

### S3-002: Cấu hình Versioning & Lifecycle
- **Phụ thuộc:** S3-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Bật versioning cho `db-backups` và `helm-charts`
  - Lifecycle rule `db-backups`: → Glacier sau 30 ngày, xóa sau 365 ngày
  - Lifecycle rule `helm-charts`: xóa versions cũ hơn 90 ngày
- **Done khi:** Lifecycle rules active

### S3-003: Cấu hình CORS cho assets bucket
- **Phụ thuộc:** S3-001
- **Priority:** P1 | **Effort:** XS
- **Việc cần làm:**
  - Cho phép GET từ domain của frontend
  - Pre-signed URL cho upload (PUT) từ frontend trực tiếp lên S3
- **Done khi:** Frontend upload file trực tiếp lên S3 qua pre-signed URL

---

## Phase 9 — Secrets & Config

### SECRET-001: Tạo Secrets Manager entries
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Naming convention: `[project]/[env]/[service]/[key]`
  - Tạo secrets: DB credentials, JWT secret key, external API keys
  - Bật auto-rotation cho DB credentials (Lambda rotation, 30 ngày)
- **Done khi:** Secrets tồn tại, rotation Lambda test thành công

### SECRET-002: Tạo SSM Parameter Store entries
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - SecureString cho sensitive config
  - String cho non-sensitive config (app port, log level, feature flags)
  - Naming: `/[project]/[env]/[service]/[param]`
- **Done khi:** Parameters tồn tại, EKS pod đọc được qua IRSA

### SECRET-003: Cấu hình External Secrets Operator (tùy chọn)
- **Phụ thuộc:** EKS-001, SECRET-001
- **Priority:** P2 | **Effort:** M
- **Việc cần làm:**
  - Cài External Secrets Operator lên EKS
  - Tạo `SecretStore` trỏ vào Secrets Manager
  - Tạo `ExternalSecret` resource tự động sync vào Kubernetes Secret
- **Done khi:** Kubernetes Secret tự cập nhật khi Secrets Manager thay đổi

### SECRET-004: Audit & scan secret leaks trong code
- **Phụ thuộc:** CICD-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Cài `gitleaks` hoặc `truffleHog` vào pre-commit hook
  - Thêm bước scan vào GitHub Actions CI
  - `git log` scan toàn bộ history lần đầu
- **Done khi:** CI fail khi phát hiện credential trong code

---

## Phase 10 — Authentication Infrastructure (Cognito)

### COGNITO-001: Tạo Cognito User Pool
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Email là username (unique)
  - Password policy: min 8 ký tự, số + chữ hoa
  - MFA: optional (TOTP/SMS)
  - Custom attributes: `custom:role`, `custom:userId`
  - Email verification bắt buộc
- **Done khi:** User Pool tồn tại, signup/signin test OK qua AWS CLI

### COGNITO-002: Tạo App Client & Hosted UI
- **Phụ thuộc:** COGNITO-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - App Client: no client secret (SPA)
  - OAuth flows: Authorization Code + PKCE
  - Callback URLs: dev/staging/prod domains
  - Hosted UI: custom CSS với logo, màu brand
- **Done khi:** Login qua Hosted UI → redirect về app với code

### COGNITO-003: Cấu hình ALB Cognito Authentication
- **Phụ thuộc:** COGNITO-001, EKS-007
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - ALB listener rule: authenticate-cognito trước `forward` action
  - Áp dụng cho `/api/*`, bỏ qua `/health`, `/public/*`
  - Cấu hình inject headers: `X-Amzn-Oidc-Identity` (sub), custom header từ claims
- **Done khi:**
  - Request không có session → redirect login
  - Request hợp lệ → forward với user info trong header

### COGNITO-004: Tạo Lambda Triggers (skeleton)
- **Phụ thuộc:** COGNITO-001
- **Priority:** P0 | **Effort:** M
- **Việc cần làm:**
  - Tạo Lambda functions (chỉ infra + deploy, logic sẽ implement sau):
    - `pre-signup` — validate email
    - `post-confirmation` — tạo user record
    - `pre-token-generation` — custom claims
    - `post-authentication` — audit log
  - Gán Lambda vào User Pool triggers
  - Cấu hình VPC cho Lambda (để access RDS)
- **Done khi:** Lambda triggers được gán, test invoke không lỗi runtime

### COGNITO-005: Cấu hình Social Login (Google)
- **Phụ thuộc:** COGNITO-002
- **Priority:** P2 | **Effort:** M
- **Việc cần làm:**
  - Tạo Google OAuth2 credentials (Google Cloud Console)
  - Tạo Cognito Identity Provider: Google
  - Thêm Google vào Hosted UI
  - Map Google attributes → Cognito attributes
- **Done khi:** "Login with Google" hoạt động end-to-end

---

## Phase 11 — Messaging Infrastructure

### MSG-001: Tạo SQS Queues
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Queue: `[project]-email-queue-[env]`
  - Queue: `[project]-job-queue-[env]` (async processing)
  - Dead Letter Queue cho mỗi queue (maxReceiveCount: 3)
  - Visibility timeout: 30s, Message retention: 4 ngày
  - Encryption at rest: SQS managed key
- **Done khi:** 4 queues tồn tại (2 main + 2 DLQ)

### MSG-002: Tạo SNS Topics
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Topic: `[project]-email-topic-[env]` — subscribe SQS email queue
  - Topic: `[project]-alerts-[env]` — subscribe email + Slack webhook
  - Cấu hình filter policies nếu cần
- **Done khi:** Publish test message lên SNS → xuất hiện trong SQS

### MSG-003: Cấu hình SES
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Verify domain trong SES (DNS: TXT record)
  - Thêm DKIM records (DNS: CNAME × 3)
  - Thêm SPF record
  - Request production access (out of sandbox) — cần submit AWS case
  - Cấu hình bounce/complaint handling (SNS topic)
- **Done khi:**
  - Email từ `no-reply@[domain]` không vào spam (test với mail-tester.com)
  - SES không còn sandbox

### MSG-004: Tạo Lambda Email Sender (infrastructure)
- **Phụ thuộc:** MSG-001, MSG-003
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Tạo Lambda function `[project]-email-sender`
  - Trigger: SQS `email-queue`
  - IAM role: SES SendEmail, SQS ReceiveMessage/DeleteMessage, CloudWatch
  - Deploy placeholder code (chỉ log message, chưa gửi thật)
  - Cấu hình concurrency và retry
- **Done khi:** Lambda trigger khi có message trong SQS, log thấy message content

---

## Phase 12 — Observability

### OBS-001: Tạo CloudWatch Log Groups
- **Phụ thuộc:** EKS-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Log groups cho từng service: `/[project]/[env]/[service]`
  - Retention: dev=7d, staging=14d, prod=90d
  - Log group cho Lambda functions
- **Done khi:** Log groups tồn tại, logs từ pods xuất hiện

### OBS-002: Cài CloudWatch Agent & Container Insights
- **Phụ thuộc:** OBS-001, IAM-004 (sa-cloudwatch-agent)
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Deploy CloudWatch agent DaemonSet lên EKS
  - Enable Container Insights
  - Metrics: CPU, Memory, Network per pod/node/namespace
- **Done khi:** CloudWatch Containers dashboard hiển thị metrics

### OBS-003: Cài Fluent Bit log shipper
- **Phụ thuộc:** OBS-001
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Deploy Fluent Bit DaemonSet
  - Cấu hình output: CloudWatch Logs
  - Parse structured JSON logs
  - Filter noise (health check logs)
- **Done khi:** Application logs hiển thị trong CloudWatch với đúng log group

### OBS-004: Setup CloudWatch Alarms
- **Phụ thuộc:** OBS-002
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - EKS: CPU node > 80%, Memory > 85%
  - RDS: CPU > 75%, connections > 80%, free storage < 20GB
  - ALB: 5xx rate > 5%, target response time > 2s
  - SQS DLQ: message count > 0
  - Tất cả alarms → SNS alerts topic
- **Done khi:** Test trigger 1 alarm → nhận notification

### OBS-005: Setup X-Ray Tracing
- **Phụ thuộc:** EKS-001
- **Priority:** P2 | **Effort:** M
- **Việc cần làm:**
  - Cài AWS Distro for OpenTelemetry (ADOT) Collector
  - Cấu hình collector export traces → X-Ray
  - Cấu hình IRSA cho ADOT collector
- **Done khi:** ADOT collector running, X-Ray service map hiển thị

### OBS-006: Setup Amazon OpenSearch (tùy chọn)
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P2 | **Effort:** L
- **Việc cần làm:**
  - Tạo OpenSearch domain (dev: 1 node, prod: 3 nodes)
  - Đặt trong VPC (private subnet)
  - Cấu hình Fluent Bit output → OpenSearch (song song CloudWatch)
- **Done khi:** Kibana/OpenSearch Dashboards accessible, full-text search log hoạt động

### OBS-007: Setup Grafana
- **Phụ thuộc:** OBS-002
- **Priority:** P2 | **Effort:** M
- **Việc cần làm:**
  - Cài Grafana lên EKS (namespace `monitoring`) hoặc dùng Amazon Managed Grafana
  - Cấu hình data source: CloudWatch
  - Import dashboard: EKS Cluster Overview, RDS, ALB
- **Done khi:** 3 dashboards có dữ liệu thực

### OBS-008: Cấu hình on-call & runbook
- **Phụ thuộc:** OBS-004
- **Priority:** P2 | **Effort:** M
- **Việc cần làm:**
  - Viết runbook cho top 5 alarms phổ biến nhất
  - Cấu hình Slack channel nhận alerts
  - Document escalation path
- **Done khi:** `runbook.md` có 5 scenarios với steps xử lý rõ ràng

---

## Phase 13 — Security Hardening

### SEC-001: Cấu hình AWS WAF
- **Phụ thuộc:** DNS-002
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Tạo Web ACL gắn vào ALB
  - Enable Managed Rules: Core Rule Set, SQL injection, XSS
  - Rate limiting rule: 1000 req / 5 phút / IP
  - Geo-blocking nếu cần
  - Bật logging WAF → S3 hoặc CloudWatch
- **Done khi:**
  - SQLi payload test bị block (403)
  - Rate limit trigger đúng

### SEC-002: Enable GuardDuty
- **Phụ thuộc:** ACCOUNT-001
- **Priority:** P1 | **Effort:** XS
- **Việc cần làm:**
  - Enable GuardDuty tất cả accounts + tất cả regions đang dùng
  - Enable EKS Protection, RDS Protection, S3 Protection
  - Cấu hình SNS notification cho finding severity HIGH+
- **Done khi:** GuardDuty active, test finding → nhận notification

### SEC-003: Enable CloudTrail
- **Phụ thuộc:** ACCOUNT-001, S3-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Bật CloudTrail multi-region
  - Log đến S3 bucket riêng (cloudtrail-logs)
  - Bật log file validation
  - Bật CloudWatch Logs integration
- **Done khi:** Mọi API call được ghi lại, S3 có log files

### SEC-004: Enable AWS Config
- **Phụ thuộc:** ACCOUNT-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Enable AWS Config tất cả resources
  - Enable managed rules:
    - `mfa-enabled-for-iam-console-access`
    - `root-account-mfa-enabled`
    - `access-keys-rotated` (90 ngày)
    - `rds-storage-encrypted`
    - `s3-bucket-public-read-prohibited`
- **Done khi:** Config compliance dashboard không có CRITICAL violations

### SEC-005: Container Image Security
- **Phụ thuộc:** CICD-002, ECR-001
- **Priority:** P1 | **Effort:** S
- **Việc cần làm:**
  - Trivy scan trong CI: block nếu có CRITICAL CVE
  - ECR scan on push: email alert nếu có CRITICAL
  - Base images: dùng `distroless` hoặc `alpine` (minimal)
  - Không chạy container với root user
- **Done khi:** CI fail khi có CRITICAL CVE, tất cả containers chạy non-root

### SEC-006: Kubernetes Security Hardening
- **Phụ thuộc:** EKS-001
- **Priority:** P1 | **Effort:** M
- **Việc cần làm:**
  - Bật Pod Security Standards: `restricted` namespace labels
  - Network Policies (Calico): deny all cross-namespace mặc định, chỉ allow explicit
  - Read-only root filesystem cho tất cả pods
  - Drop ALL Linux capabilities, chỉ add khi cần
- **Done khi:**
  - Pod namespace `frontend` không reach được pod namespace `backend`
  - Pod không thể write vào root filesystem

### SEC-007: Enable SecurityHub
- **Phụ thuộc:** SEC-002, SEC-003, SEC-004
- **Priority:** P2 | **Effort:** S
- **Việc cần làm:**
  - Enable SecurityHub
  - Connect: GuardDuty, Config, Inspector
  - Enable standards: AWS Foundational Security Best Practices
  - Auto-create GitHub Issue khi có HIGH finding
- **Done khi:** SecurityHub score > 80%

### SEC-008: Secrets & Credential Audit
- **Phụ thuộc:** SECRET-001, SECRET-004
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Scan toàn bộ git history với `gitleaks`
  - Verify không có hardcoded credential trong code
  - Verify tất cả secrets đang dùng Secrets Manager, không dùng env file
  - Verify tất cả secrets có rotation bật
- **Done khi:** Zero hardcoded credentials trong code + git history

---

## Phase 14 — DNS, SSL & Load Balancer

### DNS-001: Cấu hình Route 53 Hosted Zone
- **Phụ thuộc:** ACCOUNT-003
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Tạo Public Hosted Zone cho domain chính
  - Nếu domain mua ở nơi khác: cập nhật NS records
  - Tạo subdomain records: `api.[domain]`, `www.[domain]`
- **Done khi:** `dig [domain]` trả về đúng nameservers

### DNS-002: Request ACM Certificate
- **Phụ thuộc:** DNS-001
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - Request certificate cho `[domain]` và `*.[domain]`
  - Validation method: DNS (tự động với Route 53)
  - Region: `us-east-1` (cùng region ALB)
- **Done khi:** Certificate ở trạng thái `ISSUED`

### DNS-003: Tạo ALB & HTTPS Listener
- **Phụ thuộc:** DNS-002, EKS-007
- **Priority:** P0 | **Effort:** S
- **Việc cần làm:**
  - ALB được tạo tự động qua Ingress resource (EKS-007)
  - Listener 443: gắn ACM certificate
  - Listener 80: redirect → 443
  - Security policy: TLS 1.2 minimum
- **Done khi:** `https://[domain]` trả về 200, không có SSL warning

### DNS-004: Tạo Route 53 Alias Records
- **Phụ thuộc:** DNS-001, DNS-003
- **Priority:** P0 | **Effort:** XS
- **Việc cần làm:**
  - Tạo Alias record `[domain]` → ALB DNS name
  - Tạo Alias record `api.[domain]` → ALB DNS name
  - Tạo Alias record `www.[domain]` → `[domain]` (redirect)
- **Done khi:** `https://[domain]` và `https://api.[domain]` resolve đúng

---

## Dependency Graph

```
ACCOUNT (1)
    │
    ├── IAM (2)
    │     └─────────────────────────────────────┐
    │                                            │
    ├── NET (3)                                  │
    │     └── EKS (4) ←──────────────────────── ┤
    │               └── ECR (5)                 │
    │               └── CICD (6)                │
    │                                            │
    ├── DB (7) ←── NET (3)                       │
    │                                            │
    ├── S3 (8)                                   │
    │     └── CICD (6)                           │
    │                                            │
    ├── SECRET (9) ←── DB (7)                    │
    │                                            │
    ├── COGNITO (10)                             │
    │     └── DNS (14)                          │
    │                                            │
    ├── MSG (11) ←── S3 (8)                     │
    │                                            │
    ├── OBS (12) ←── EKS (4)                    │
    │                                            │
    ├── SEC (13) ←── DNS (14)                   │
    │                                            │
    └── DNS (14) ←── NET (3) ──────────────────┘
```

---

## Checklist hoàn thành hạ tầng

- [ ] AWS Organization + 3 OU + 3 accounts
- [ ] MFA bắt buộc tất cả users, root không có access key
- [ ] VPC + subnets + routing hoạt động
- [ ] EKS cluster + node groups + add-ons Running
- [ ] CI/CD pipeline: merge → deploy trong 5 phút
- [ ] RDS accessible từ EKS, không từ internet
- [ ] Tất cả secrets trong Secrets Manager, không hardcode
- [ ] Cognito User Pool + ALB auth hoạt động
- [ ] HTTPS trên toàn bộ endpoints
- [ ] CloudWatch logs + alarms active
- [ ] GuardDuty + CloudTrail + Config bật
- [ ] Trivy scan trong CI, không có CRITICAL CVE
- [ ] Network Policies chặn cross-namespace traffic
