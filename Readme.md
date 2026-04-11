# 🚀 JobBridge AI - Nền tảng Tuyển dụng Thông minh & Kết nối Việc làm

JobBridge AI là một hệ thống tuyển dụng hiện đại, ứng dụng Trí tuệ Nhân tạo (AI) giúp tối ưu hóa quá trình kết nối giữa ứng viên và nhà tuyển dụng. Dự án được thiết kế theo kiến trúc Microservices và triển khai hoàn toàn tự động theo mô hình GitOps trên nền tảng Cloud Azure.

## 🏗 Kiến trúc Hệ thống (Architecture)
Hệ thống được chia thành nhiều dịch vụ độc lập (Microservices) giao tiếp với nhau qua API Gateway:
- **API Gateway (Port 8080):** Điểm vào trung tâm (Entry point), chịu trách nhiệm định tuyến (routing) các request từ Frontend tới đúng Backend Service tương ứng.
- **Auth Service (Port 8081):** Chuyên quản lý người dùng, đăng nhập/đăng ký (Authentication, JWT), phân quyền (Authorization), thông tin hồ sơ Hệ thống Công ty, và các luồng xử lý trích xuất (CV_Text_Extractor)/upload tài liệu.
- **Jobs Service (Port 8082):** Trái tim nghiệp vụ của hệ thống: Đăng tin tuyển dụng, phân tích ứng dụng theo công việc, duyệt ứng viên (Applications), cấu hình các quy trình tuyển dụng.
- **AI Service (Port 8085):** Module tương tác độc lập đóng vai trò tương tác và gọi OpenAI API nhằm cung cấp trải nghiệm trợ lý ảo (AI Interview Coach, Gợi ý, Phân tích CV thông minh).
- **Database:** Sử dụng MongoDB lưu trữ toàn bộ dữ liệu hệ thống (dạng dữ liệu phi cấu trúc NoSQL dễ mở rộng).

## 🛠 Công nghệ Sử dụng (Tech Stack)
### Frontend (Application UI)
- **Cốt lõi:** ReactJS bundle bằng Vite cực nhanh.
- **Ngôn ngữ:** TypeScript để đảm bảo tính chặt chẽ về logic.
- **Giao diện (UI/UX):** Sử dụng Tailwind CSS kết hợp với biểu tượng lucide-react để cấu trúc design hiện đại, mượt mà.
- **Tính năng nổi bật:** State quản lý chặt chẽ, bảo toàn tham số Query URL (searchParams), Code chunk splitting tối ưu.

### Backend (Microservices)
- **Ngôn ngữ:** Golang (cập nhật mới theo phiên bản Go 1.24/1.25).
- **Web Framework:** Tiêu chuẩn RESTful xử lý bởi framework siêu tốc Gin Gonic.
- **Thiết kế Backend:** Hướng sự kiện và Domain-Driven Design (Clean Architecture). Mô-đun hoá từng luồng logic (Handler -> Model -> Repository).

### Mô hình DevOps & Cơ sở hạ tầng (Azure & K8s)
- **Quản lý Hạ tầng (IaC):** Sử dụng Terraform phân tầng gồm 3 Lớp (01-Foundation, 02-Cluster, 03-Security). Tự động tạo nhóm tài nguyên, Azure Kubernetes Service (AKS), Container Registry (ACR), KeyVault.
- **Containerization:** Đóng gói bằng Docker (Sử dụng Multi-stage build để thu nhỏ kích thước Image).
- **Triển khai tự động (Continuous Deployment):** ArgoCD ứng dụng kiến trúc GitOps kéo cấu hình và tự triển khai lên AKS.
- **Continuous Integration (CI):** Luồng GitHub Action CI (Build Image, quét bảo mật, đẩy lên tính năng).
- **Helm Charts:** Khai báo cụm Manifest của ứng dụng được quản lý toàn diện trong deploy/helm/jobbridge/.

## 📂 Tổng quan Cấu trúc Không gian làm việc (Workspace Structure)
```
datn-jobBridge/
├── backend/                           # Mã nguồn toàn bộ các vi dịch vụ Go
│   ├── cmd/                           # Entrypoint của các dịch vụ chính
│   │   ├── ai/main.go                 # AI Service: Tích hợp OpenAI API
│   │   ├── auth/main.go               # Auth Service: JWT, User, Company
│   │   ├── jobs/main.go               # Jobs Service: Tuyển dụng cốt lõi
│   │   ├── gateway/main.go            # API Gateway: Định tuyến & Proxy
│   │   └── seed/main.go               # Database Seeding: Tạo dữ liệu gốc
│   ├── internal/                      # Logic nghiệp vụ core (Clean Architecture)
│   │   ├── ai/                        # Handler, Model, OpenAI Client
│   │   ├── auth/                      # Authentication, User, Company
│   │   ├── job/                       # Job Postings, Applications
│   │   ├── application/               # Application Processing
│   │   ├── db/                        # MongoDB Connection
│   │   ├── server/                    # Server Setup, Middleware
│   │   └── config/                    # Configuration Management
│   ├── tests/                         # Unit Tests (auth, config)
│   ├── Dockerfile.ai                  # Multi-stage build cho AI Service
│   ├── Dockerfile.auth                # Multi-stage build cho Auth Service
│   ├── Dockerfile.jobs                # Multi-stage build cho Jobs Service
│   ├── Dockerfile.gateway             # Multi-stage build cho Gateway
│   ├── go.mod & go.sum                # Go Module Dependencies
│   └── README.md                      # Backend Documentation
│
├── frontend/                          # Web Application (React + TypeScript)
│   ├── src/
│   │   ├── features/                  # Business Logic & API Clients
│   │   │   ├── auth/                  # Login, Register, Token Management
│   │   │   ├── jobs/                  # Job Listing, Application, Save Jobs
│   │   │   └── companies/             # Public Company List & Details (Mới!)
│   │   ├── pages/                     # UI Components & Page Layouts
│   │   │   ├── auth/                  # Login, Register Pages
│   │   │   ├── app/                   # Authenticated User Pages
│   │   │   ├── admin/                 # Admin Dashboard Pages
│   │   │   ├── hr/                    # HR / Recruiter Pages
│   │   │   ├── public/                # Public Landing & Company Pages
│   │   │   └── error/                 # Error Pages (403, 404)
│   │   ├── shared/                    # Shared Components & Logic
│   │   │   ├── routes/                # Route Definitions & Navigation
│   │   │   └── helpers/               # Common Utilities
│   │   ├── layouts/                   # Main Layouts (AdminLayout, AppLayout)
│   │   ├── App.tsx                    # Root Component
│   │   ├── main.tsx                   # Entry Point
│   │   └── index.css & App.css        # Global Styling
│   ├── public/                        # Static Assets
│   ├── nginx/                         # Production Nginx Config
│   ├── package.json                   # NPM Dependencies
│   ├── vite.config.ts                 # Vite Build Configuration
│   ├── tsconfig.json                  # TypeScript Configuration  
│   ├── vitest.config.ts               # Unit Test Configuration
│   └── README.md                      # Frontend Documentation
│
├── deploy/                            # Deployment & Infrastructure
│   ├── argocd/                        # ArgoCD GitOps Configuration
│   │   ├── argocd-cmd-params-cm.yaml  # ArgoCD Config Map
│   │   ├── argocd-server-ingress.yaml # Ingress Rules
│   │   └── jobbridge-application.yaml # Application Definition
│   │
│   ├── helm/jobbridge/                # Helm Chart cho Kubernetes Deployment
│   │   ├── Chart.yaml                 # Chart Metadata
│   │   ├── values.yaml                # Default Values
│   │   ├── values-local.yaml          # Local Development Values
│   │   ├── values-azure.yaml          # Azure Production Values
│   │   ├── values-azure-argocd.yaml   # ArgoCD Auto-update Values (CI/CD Target)
│   │   └── templates/                 # K8s Manifest Templates
│   │       ├── app-workloads.yaml     # Deployments, Services, ConfigMaps
│   │       ├── hpa.yaml               # Horizontal Pod Autoscaler
│   │       ├── ingress.yaml           # Ingress Configuration
│   │       └── mongodb-service.yaml   # MongoDB StatefulSet
│   │
│   ├── terraforms/                    # Infrastructure as Code (Terraform)
│   │   ├── layers/
│   │   │   ├── 01-foundation/         # Azure Subscription, Resource Groups
│   │   │   ├── 02-cluster/            # AKS Cluster, Container Registry (ACR)
│   │   │   └── 03-security/           # KeyVault, RBAC, Network Policies
│   │   └── modules/                   # Reusable Terraform Modules
│   │       ├── acr/                   # Azure Container Registry Module
│   │       ├── aks/                   # Azure Kubernetes Service Module
│   │       ├── keyvault/              # Key Vault Module
│   │       └── resource-group/        # Resource Group Module
│   │
│   └── scripts/                       # Automation Scripts
│       ├── bootstrap-argocd.sh        # Initialize ArgoCD on AKS
│       ├── deploy-infra.sh            # Deploy Infrastructure via Terraform
│       ├── setup-azure.sh             # Azure CLI Setup
│       └── setup-tfstate-backend.sh   # Terraform State Backend Setup
│
├── docker-compose.yml                 # Local Dev Environment (MongoDB + 4 Services)
├── Tiltfile                           # ⚡ Tilt Config: Live-reload Local k8s
├── sonar-project.properties           # SonarQube Code Quality Scanning
└── README.md                          # Tài liệu dự án (File này)

## 🌟 Chức Năng Tiêu Biểu Trong Dự Án (Core Features)
1. **Khối Cộng Đồng (Public Space):**
   - Không cần đăng nhập có thể thao tác dễ dàng trên Web. 
   - Danh bạ Doanh Nghiệp, chi tiết công ty và các gói công việc đang mở (Vừa triển khai mới).
   - Thanh Menu điều hướng thông minh.
2. **Khối Ứng Viên (Job Seeker):**
   - Ứng tuyển nhanh, quản lý danh sách việc đã lưu, phân tích kỹ năng dựa trên CV Extract.
   - 🤖 *Đặc biệt:* Trợ lý Chat AI rèn luyện Kỹ năng Phỏng vấn (Interview Coach).
3. **Khối Nhà Tuyển Dụng (Recruiter / HR):**
   - Đội ngũ doanh nghiệp tham gia mở tài khoản -> Đăng tin -> Nhận List ứng viên theo từng Pipeline Tuyển dụng.
4. **Khối Quản Trị Hệ Thống (System Admin):**
   - Dashboard rà soát các Công Ty được phép Public, cấp phép ứng tuyển và theo dõi metric hệ thống.

## 🚀 Môi Trường Phát Triển Cục Bộ (Local Deployment)

### 1. Chuẩn bị (Prerequisites):
- Docker Desktop
- Node.js (Phiên bản v18+) & NPM.

### 2. Khởi chạy Dịch vụ Backend
Tại thư mục gốc của datn-jobBridge:
`ash
docker-compose up -d
`
Lệnh này sẽ tự động tải các Dependency của Go và khởi động 1 server MongoDB nội bộ (Cổng 27018) cùng lúc 4 dịch vụ Backend tại các port (8080, 8081, 8082, 8085). 
*Lưu ý: Bạn không cần thiết lập MongoDB Studio rườm rà, Docker tự lo hết.*

### 3. Khởi Tải Front-end
`ash
cd frontend
npm install
npm run dev
`
Vào trình duyệt xem trang tại đường dẫn: http://localhost:5173. 

## 🔄 Chu trình CI/CD Toàn Diện (Continuous Integration & Deployment)

Dự án sử dụng **GitOps** như tiêu chuẩn Enterprise DevOps. Không cần deploy thủ công, tất cả đều tự động hoá:

```
[Developer Push Commit] 
        ↓
[GitHub Actions: CI Triggered]
        ├─ Lint & Test Code
        ├─ Build Docker Images
        ├─ Scan Security (Image Scanning)
        └─ Push to ACR (Azure Container Registry)
        ↓
[Update Helm Values: values-azure-argocd.yaml]
        ├─ Extract new Image Tag
        ├─ Update deployment specs
        └─ Auto-commit 'chore(cd): update argocd image tags...'
        ↓
[ArgoCD Detects Git Change]
        ├─ Watch GitHub for manifest updates
        ├─ Apply rolling update strategy
        └─ Deploy to AKS (0-Downtime)
        ↓
[Application Live on Azure! 🚀]
```

### Chi tiết từng bước:

**1️⃣ Developer Commit & Push:**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

**2️⃣ GitHub Actions CI Pipeline:**
- Trigger trên mỗi push tới `main` branch
- Chạy linter, unit tests cho Go & React
- Build Docker Images cho mỗi service
- Push images lên **Azure Container Registry (ACR)**
- Quét bảo mật (CVE scanning) trên images

**3️⃣ Auto-Update Deployment:**
- CI workflow trích Image Tag mới (`repo/image:v1.2.3`)
- Cập nhật file `deploy/helm/jobbridge/values-azure-argocd.yaml`
- Tự động nhả commit `chore(cd): update argocd image tags to <hash>` vào Git

**4️⃣ ArgoCD Synchronization:**
- ArgoCD Pod chạy trong **AKS cluster** liên tục watch GitHub
- Phát hiện thay đổi manifest -> kích hoạt sync
- Sử dụng **Rolling Update Strategy** (Không downtime)
- Tắt từ từ old pods, bật từ từ new pods

**5️⃣ Result:**
✅ Ứng dụng mới được deploy lên Azure Production tự động  
✅ Zero-Downtime Deployment (Users không bị gián đoạn)  
✅ Audit trail đầy đủ (Git history + ArgoCD logs)
