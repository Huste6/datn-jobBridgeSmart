# 📚 Phân tích Tổng quan Dự án JobBridge AI — Phục vụ Báo cáo DATN

---

## 1. THÔNG TIN CHUNG

| Mục | Nội dung |
|-----|----------|
| **Tên dự án** | JobBridge AI — Nền tảng Tuyển dụng Thông minh |
| **Mục tiêu** | Xây dựng hệ thống tuyển dụng ứng dụng AI, hỗ trợ ứng viên luyện phỏng vấn và nhà tuyển dụng sàng lọc CV |
| **Kiến trúc** | Microservices (4 service Go) + React SPA |
| **Triển khai** | Azure Kubernetes Service (AKS) + GitOps (ArgoCD) |
| **Ngôn ngữ backend** | Go 1.24+ |
| **Ngôn ngữ frontend** | TypeScript (React 19 + Vite 8) |
| **CSDL** | MongoDB (NoSQL) |
| **AI Provider** | OpenAI API (GPT-4o-mini mặc định) |

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Sơ đồ tổng quan

```
[Người dùng / Trình duyệt]
         ↓ HTTPS
[Frontend: React SPA — Nginx :80]
         ↓ REST API
[API Gateway (Go) — Port 8080]
    ├─→ [Auth Service     — Port 8081]
    ├─→ [Jobs Service     — Port 8082]
    └─→ [AI Service       — Port 8085]
              ↓                ↓
         [MongoDB :27017]  [OpenAI API]
                 ↑
         [Cloudinary CDN]  ← Upload Avatar/CV
```

### 2.2 Các Microservice

| Service | Port | Trách nhiệm |
|---------|------|-------------|
| **API Gateway** | 8080 | Định tuyến (reverse proxy), điểm vào duy nhất cho Frontend |
| **Auth Service** | 8081 | Đăng ký/đăng nhập (JWT), quản lý User, Company, upload Avatar/CV |
| **Jobs Service** | 8082 | CRUD tin tuyển dụng, quản lý ứng tuyển (Application), tìm kiếm Job |
| **AI Service** | 8085 | Interview Coach, Interview Quiz, HR Evaluate CV (qua OpenAI API) |

### 2.3 Phân tầng hạ tầng Azure (IaC — Terraform 3 lớp)

| Layer | Tài nguyên |
|-------|------------|
| **01-Foundation** | Resource Group `rg-jobbridge`, Container Registry `acrjobbridge` |
| **02-Cluster** | AKS `aks-jobbridge`, kubenet, node pool tối ưu chi phí |
| **03-Security** | Key Vault `kv-jobbridge`, Secrets (JWT, OpenAI, Cloudinary), RBAC |

---

## 3. MÔ HÌNH DỮ LIỆU (MongoDB Collections)

### 3.1 `users`
```json
{
  "_id": ObjectID,
  "email": string,
  "full_name": string,
  "role": "seeker" | "recruiter" | "admin",
  "avatar_url": string,
  "cv_url": string,
  "cv_text": string,       // text trích xuất từ PDF (cache cho AI)
  "phone": string,
  "city": string,
  "headline": string,
  "profile_completed": bool,
  "is_locked": bool,
  "password_hash": string, // bcrypt
  "created_at": time,
  "updated_at": time
}
```

### 3.2 `companies`
```json
{
  "_id": ObjectID,
  "owner_id": ObjectID,    // ref → users._id (recruiter)
  "name": string,
  "tax_code": string,
  "website": string,
  "industry": string,
  "size": string,
  "location": string,
  "description": string,
  "status": "pending" | "approved" | "rejected",
  "is_locked": bool,
  "created_at": time,
  "updated_at": time
}
```

### 3.3 `jobs`
```json
{
  "_id": ObjectID,
  "owner_id": ObjectID,         // ref → users._id (recruiter)
  "title": string,
  "company": string,
  "location": string,
  "salary": string,
  "employment_type": string,
  "status": "open" | "closed",
  "experience_level": string,
  "description": string,
  "responsibilities": [string],
  "requirements": [string],
  "benefits": [string],
  "tags": [string],
  "posted_at": time,
  "created_at": time,
  "updated_at": time
}
```

### 3.4 `applications`
```json
{
  "_id": ObjectID,
  "job_id": ObjectID,     // ref → jobs._id
  "user_id": ObjectID,    // ref → users._id (seeker)
  "cv_url": string,
  "status": string,
  "manual_score": int,    // điểm do HR chấm thủ công
  "notes": string,
  "applied_at": time,
  "updated_at": time
}
```

---

## 4. API ENDPOINTS CHÍNH

### Auth Service (qua Gateway `/api/auth`, `/api/users`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |
| GET | `/api/users/me` | Lấy thông tin user hiện tại |
| PATCH | `/api/users/me` | Cập nhật hồ sơ cá nhân |
| POST | `/api/users/me/avatar` | Upload avatar (Cloudinary) |
| POST | `/api/users/me/cv` | Upload CV PDF (Cloudinary + extract text) |
| POST | `/api/users/me/onboarding` | Chọn role sau đăng ký |
| GET | `/api/company/me` | Lấy thông tin công ty của recruiter |
| POST | `/api/company/me` | Tạo công ty |
| PUT | `/api/company/me` | Cập nhật công ty |

### Jobs Service (qua Gateway `/api/jobs`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/jobs` | Danh sách job (filter: q, location, salary_band, employment_type, experience_level, sort) |
| GET | `/api/jobs/:id` | Chi tiết một job |
| GET | `/api/jobs/my` | Danh sách job của recruiter |
| POST | `/api/jobs/my` | Tạo job mới (recruiter) |
| PUT | `/api/jobs/my/:id` | Cập nhật job (recruiter) |
| DELETE | `/api/jobs/my/:id` | Xóa job (recruiter) |

### AI Service (qua Gateway `/api/ai`)

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | `/api/ai/interview-coach` | seeker | Chat AI luyện phỏng vấn theo job đã apply |
| POST | `/api/ai/interview-quiz` | seeker | Sinh bộ câu hỏi trắc nghiệm theo JD |
| POST | `/api/ai/hr-evaluate-cv` | recruiter | AI đánh giá + chấm điểm CV ứng viên |

---

## 5. TÍNH NĂNG AI — CHI TIẾT KỸ THUẬT

### 5.1 Interview Coach
- **Luồng xử lý:** Ứng viên gửi `job_id` + `message` + `history` → AI Service lấy Job JD từ Jobs Service, lấy CV text từ Auth Service → Gửi prompt đến OpenAI API → Trả về `reply`
- **Bảo mật:** Chỉ cho phép ứng viên đã apply job đó mới được dùng (`403` nếu chưa apply)
- **CV Resolution:** Ưu tiên `user.cv_text` (cache), nếu rỗng thì fetch từ URL → parse PDF → cache lại
- **System prompt:** Đóng vai nhà tuyển dụng senior IT, trả lời tiếng Việt, không dùng markdown

### 5.2 Interview Quiz
- **Đầu vào:** `job_id` + `question_count` (1–30)
- **Output:** JSON schema gồm `questions[]` với đầy đủ `options[A,B,C,D]`, `correct_answer`, `explanation`
- **Độ khó:** 70% câu chuyên sâu kỹ thuật thực chiến, 30% tình huống áp dụng
- **Parse:** Server tự parse JSON từ LLM, validate schema trước khi trả về client

### 5.3 HR Evaluate CV
- **Luồng:** HR gửi `application_id` → AI Service lấy Application → lấy Job (kiểm tra ownership) → lấy candidate profile + CV text → Gửi prompt → Parse JSON `{score: 0-100, notes: "..."}`
- **Output:** `score` (clamp 0–100) + `notes` nhận xét ngắn gọn

---

## 6. CÔNG NGHỆ STACK

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Go | 1.24+ | Ngôn ngữ lập trình chính |
| Gin Gonic | v1.10 | REST API framework |
| MongoDB Driver | v2.5.0 | Kết nối MongoDB |
| golang-jwt | v5.3.1 | JWT authentication |
| bcrypt | golang.org/x/crypto | Hash mật khẩu |
| godotenv | v1.5.1 | Đọc file `.env` |
| ledongthuc/pdf | latest | Trích xuất text từ PDF |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | 19.2.4 | UI framework |
| TypeScript | ~5.9.3 | Type-safe JavaScript |
| Vite | 8.0.0 | Build tool + Dev server |
| Tailwind CSS | 4.2.1 | Utility CSS |
| lucide-react | 0.577.0 | Icon library |
| @uiw/react-md-editor | 4.0.11 | Markdown editor |
| Vitest | 3.2.4 | Unit testing |

### DevOps & Infrastructure
| Công nghệ | Mục đích |
|-----------|----------|
| Docker (multi-stage build) | Containerization |
| Kubernetes (AKS) | Container orchestration |
| Helm Charts | Kubernetes manifest management |
| ArgoCD | GitOps continuous deployment |
| GitHub Actions | CI pipeline (build, test, scan, push) |
| Terraform (3 layers) | Infrastructure as Code |
| Prometheus + Grafana | Monitoring & observability |
| Azure Container Registry (ACR) | Docker image registry |
| Cloudinary | CDN upload avatar/CV |

---

## 7. LUỒNG CI/CD (GitOps)

```
Developer push → main branch
        ↓
GitHub Actions CI:
  ├─ go test / vitest
  ├─ Docker build (multi-stage)
  ├─ Trivy security scan
  └─ Push image → ACR (tag: SHA commit)
        ↓
Workflow cập nhật values-azure-argocd.yaml
  └─ Auto-commit "chore(cd): update argocd image tags"
        ↓
ArgoCD detect Git change
  └─ Rolling update → AKS (zero-downtime)
        ↓
✅ Production live tại jobbridge.duckdns.org
```

---

## 8. CẤU TRÚC FRONTEND

### Pages theo Role

| Role | Trang |
|------|-------|
| **Public** | Landing page, danh sách công ty, chi tiết công ty |
| **Seeker** | Danh sách job + filter, chi tiết job, profile, danh sách ứng tuyển, AI Interview Coach |
| **Recruiter (HR)** | Tạo công ty, quản lý job (CRUD), xem ứng viên theo job, đánh giá CV |
| **Admin** | Dashboard tổng quan, quản lý user (lock/unlock), quản lý công ty (approve/reject) |

### Cấu trúc thư mục Frontend
```
src/
├── api/              # API client functions
├── features/         # Business logic theo domain
│   ├── auth/         # Login, register, token management
│   ├── jobs/         # Job listing, application, saved jobs
│   └── companies/    # Company list & details
├── pages/
│   ├── admin/        # AdminDashboard, UserMgmt, CompanyMgmt
│   ├── app/          # JobsList, AiCoach, Profile, Applications
│   ├── hr/           # JobMgmt, CandidateReview, CompanyProfile
│   ├── public/       # Landing, company pages
│   └── errors/       # 403, 404
├── layouts/          # AdminLayout, AppLayout
└── shared/           # Routes, helpers
```

---

## 9. CÁC ĐIỂM NỔI BẬT ĐỂ TRÌNH BÀY TRONG BÁO CÁO

### 9.1 Giải pháp kỹ thuật đáng chú ý
1. **CV Text Caching:** Khi ứng viên upload CV (PDF), hệ thống tự động trích xuất text bằng `ledongthuc/pdf` và lưu vào `users.cv_text`. Khi AI cần dùng, ưu tiên cache này, không cần fetch lại mỗi lần → giảm latency.
2. **Prompt Engineering:** AI Service xây dựng prompt phân tầng (system prompt → candidate context → job context → CV context → history → user message) để đảm bảo tính chính xác và nhất quán.
3. **Role-based Security:** Gateway validate JWT, đính kèm `user_id` và `role` vào request context. Từng handler tự kiểm tra role phù hợp (`seeker`/`recruiter`/`admin`).
4. **GitOps Zero-Downtime:** ArgoCD rolling update đảm bảo không có downtime khi deploy phiên bản mới.
5. **Multi-stage Docker Build:** Image production nhỏ gọn, không chứa Go compiler hay source code.

### 9.2 Yêu cầu phi chức năng đạt được
- **Performance:** Gin Go nhanh hơn nhiều so với Node.js/Python; thời gian phản hồi API thông thường < 100ms
- **Scalability:** HPA (Horizontal Pod Autoscaler) tự động scale pod theo CPU/memory
- **Security:** bcrypt hash password, JWT short-lived token, HTTPS (cert-manager + Let's Encrypt), Key Vault cho secrets
- **Availability:** PDB (Pod Disruption Budget) đảm bảo không tắt toàn bộ pod cùng lúc

---

## 10. NHỮNG PHẦN CÒN CẦN HOÀN THIỆN TRONG BÁO CÁO

> Dựa trên phân tích file `.tex` trong `Bao-cao-datn/Chuong/`

| Chương | Tình trạng | Cần bổ sung |
|--------|------------|-------------|
| Chương 1 - Giới thiệu | ✅ Đã có nội dung đầy đủ | — |
| Chương 2 - Cơ sở lý thuyết | ✅ Đã có nội dung đầy đủ | — |
| Chương 3 - Phân tích & Thiết kế | ✅ Đã có nội dung đầy đủ | — |
| Chương 4 - Kết quả thực nghiệm | ⚠️ Vẫn còn template | Cần điền: công cụ sử dụng, số dòng code, demo chức năng, test cases, kết quả triển khai |
| Chương 5 - Giải pháp & Đóng góp | ⚠️ Vẫn còn template | Cần viết: CV caching, prompt engineering, GitOps pipeline, HR evaluate AI |
| Chương 6 - Kết luận | ⚠️ Vẫn còn template | Cần viết: kết quả đạt được, hạn chế, hướng phát triển |

---

## 11. GỢI Ý NỘI DUNG CHO CÁC CHƯƠNG CÒN THIẾU

### Chương 4 — Kết quả thực nghiệm (cần điền)

**Bảng công cụ sử dụng:**
| Mục đích | Công cụ | Phiên bản |
|----------|---------|-----------|
| IDE | VS Code | latest |
| Backend language | Go | 1.24.1 |
| Frontend framework | React + Vite | 19.2.4 / 8.0.0 |
| CSS | Tailwind CSS | 4.2.1 |
| Database | MongoDB | 7.x |
| Container | Docker | 27.x |
| K8s | Azure AKS | 1.29.x |
| CI/CD | GitHub Actions + ArgoCD | — |
| IaC | Terraform | 1.7.x |
| API testing | Postman / curl | — |
| Unit test Go | go test | — |
| Unit test FE | Vitest | 3.2.4 |

**Test cases quan trọng:**
- Đăng ký / Đăng nhập (valid & invalid)
- Upload CV PDF → AI nhận được cv_text
- Ứng tuyển job → AI Coach hoạt động đúng
- HR đánh giá CV → trả về score hợp lệ

### Chương 5 — Giải pháp & Đóng góp nổi bật (gợi ý)
1. **Giải pháp CV Text Extraction & Caching** — Trích xuất PDF bằng Go thuần không phụ thuộc Python/external process
2. **Prompt Engineering phân tầng** — Thiết kế prompt bảo đảm AI không hallucinate, luôn bám JD/CV
3. **GitOps Pipeline Zero-Downtime** — Tự động hoá hoàn toàn từ commit đến production
4. **Role-based Architecture** — Phân quyền chặt chẽ trong microservice pattern

### Chương 6 — Kết luận (gợi ý)
- **Đã làm được:** Hệ thống tuyển dụng đầy đủ chức năng, AI Coach/Quiz/Evaluate hoạt động, CI/CD tự động, IaC Terraform
- **Chưa làm được:** Vector DB (ChromaDB) cho lịch sử hội thoại dài hạn, notification realtime, mobile app
- **Hướng phát triển:** Tích hợp vector search, recommendation engine, email notification, đa ngôn ngữ

---

## 12. SỐ LIỆU THỐNG KÊ DỰ ÁN

| Chỉ số | Giá trị |
|--------|---------|
| Số microservice backend | 4 (Gateway, Auth, Jobs, AI) |
| Số collection MongoDB | 4+ (users, companies, jobs, applications) |
| Số API endpoint | ~30+ |
| Số trang UI | ~20+ (admin, HR, seeker, public) |
| Số Dockerfile | 7 (Auth, Jobs, AI, Gateway + prebuilt variants) |
| Terraform layer | 3 (Foundation, Cluster, Security) |
| Helm chart templates | 8+ file |
| GitHub Actions workflow | 4+ workflow |
| Ngôn ngữ backend | Go 1.24 |
| Ngôn ngữ frontend | TypeScript + React 19 |
