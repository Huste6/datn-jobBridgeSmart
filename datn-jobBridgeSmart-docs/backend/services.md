# Backend Services – Chi tiết

## Tổng quan

Backend JobBridge AI gồm 4 microservice viết bằng Go 1.24, sử dụng framework Gin Gonic. Tất cả follow Clean Architecture pattern: `Handler → Repository → MongoDB`.

```
backend/
├── cmd/                    # Entrypoint của mỗi service
│   ├── gateway/main.go
│   ├── auth/main.go
│   ├── jobs/main.go
│   ├── ai/main.go
│   └── seed/main.go
├── internal/               # Business logic (không expose ra ngoài)
│   ├── ai/
│   ├── auth/
│   ├── job/
│   ├── application/
│   ├── config/
│   ├── db/
│   └── server/
├── Dockerfile.auth
├── Dockerfile.jobs
├── Dockerfile.ai
├── Dockerfile.gateway
└── go.mod
```

---

## 1. API Gateway (Port 8080)

**File:** [cmd/gateway/main.go](../cmd/gateway/main.go)

### Chức năng
Gateway là điểm vào duy nhất cho toàn bộ API. Nó chỉ làm một việc: **proxy requests** đến đúng service.

### Routing Logic

```go
// Proxy rules (từ main.go)
r.Any("/api/auth/*path",    authProxy)    → Auth Service :8081
r.Any("/api/users/*path",   authProxy)    → Auth Service :8081
r.Any("/api/hr/*path",      authProxy)    → Auth Service :8081
r.Any("/api/admin/*path",   authProxy)    → Auth Service :8081
r.Any("/api/public/*path",  authProxy)    → Auth Service :8081
r.Any("/api/jobs/*path",    jobsProxy)    → Jobs Service :8082
r.Any("/api/applications/*",jobsProxy)    → Jobs Service :8082
r.Any("/api/ai/*path",      aiProxy)      → AI Service :8085
```

### Middleware
- `gin.Logger()` – log mọi request
- `gin.Recovery()` – recover panic thành 500
- Khi upstream error: trả về `{"error":"upstream service unavailable"}` với HTTP 502

### Env Vars
```
GATEWAY_PORT=8080
AUTH_SERVICE_URL=http://localhost:8081
JOBS_SERVICE_URL=http://localhost:8082
AI_SERVICE_URL=http://localhost:8085
```

Gateway **không validate JWT** – việc đó do từng service tự làm.

---

## 2. Auth Service (Port 8081)

**File:** [cmd/auth/main.go](../cmd/auth/main.go)

### Chức năng
Quản lý toàn bộ liên quan đến người dùng: đăng ký/đăng nhập, hồ sơ cá nhân, upload file, quản lý công ty, admin.

### Cấu trúc file

```
internal/auth/
├── model.go               – User, Company struct
├── company_model.go       – Company struct chi tiết
├── token.go               – JWT generation/validation
├── middleware.go          – AuthMiddleware, RoleMiddleware
├── repository.go          – UserRepository (CRUD users)
├── company_repository.go  – CompanyRepository (CRUD companies)
├── handler.go             – Main HTTP handlers
├── admin_handler.go       – Admin-specific handlers
├── company_public_handler.go – Public company endpoints
├── avatar_uploader.go     – Upload avatar lên Cloudinary
├── cv_uploader.go         – Upload CV PDF lên Cloudinary
└── cv_text_extractor.go   – Extract text từ PDF
```

### Routes

```
POST   /api/auth/register          – Đăng ký tài khoản
POST   /api/auth/login             – Đăng nhập

GET    /api/users/me               – Lấy profile (JWT required)
PATCH  /api/users/me               – Cập nhật profile
POST   /api/users/me/avatar        – Upload avatar
POST   /api/users/me/cv            – Upload CV PDF
POST   /api/users/me/onboarding    – Chọn role (seeker/recruiter)

GET    /api/public/companies       – Danh sách công ty (public)
GET    /api/public/companies/:id   – Chi tiết công ty (public)

GET    /api/hr/company             – Lấy công ty của recruiter (JWT required)
POST   /api/hr/company             – Tạo công ty
PUT    /api/hr/company             – Cập nhật công ty

GET    /api/admin/stats            – Thống kê (admin only)
GET    /api/admin/users            – Danh sách users
POST   /api/admin/users/:id/lock   – Khoá/mở user
GET    /api/admin/companies        – Danh sách companies
POST   /api/admin/companies/:id/approve – Phê duyệt công ty
POST   /api/admin/companies/:id/lock    – Khoá/mở công ty
```

### JWT Token

Token chứa claims:
```go
type Claims struct {
    UserID string `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}
```

TTL mặc định: 60 phút (cấu hình qua `ACCESS_TOKEN_TTL_MINUTES`).

### Upload Flow

**Avatar:**
1. Nhận file từ multipart form
2. Upload lên Cloudinary folder `jobbridge/user`
3. Update `users.avatar_url`

**CV:**
1. Nhận PDF từ multipart form
2. Upload lên Cloudinary folder `jobbridge/cv`
3. Extract text dùng `ledongthuc/pdf` library
4. Lưu cả `cv_url` và `cv_text` vào MongoDB
5. `cv_text` được cache để AI service dùng

### Env Vars
```
AUTH_SERVICE_PORT=8081
MONGODB_URI=...
MONGODB_DB=jobbridge
JWT_SECRET=...
JWT_ISSUER=jobbridge-api
ACCESS_TOKEN_TTL_MINUTES=60
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>
CLOUDINARY_FOLDER=jobbridge/user
```

---

## 3. Jobs Service (Port 8082)

**File:** [cmd/jobs/main.go](../cmd/jobs/main.go)

### Chức năng
Quản lý tin tuyển dụng và đơn ứng tuyển.

### Cấu trúc file

```
internal/job/
├── model.go          – Job struct
├── repository.go     – JobRepository, JobQuery
└── handler.go        – Job HTTP handlers

internal/application/
├── model.go          – Application struct
├── repository.go     – ApplicationRepository
└── handler.go        – Application HTTP handlers
```

### Routes – Jobs

```
GET    /api/jobs              – Tìm kiếm việc làm (public)
GET    /api/jobs/:id          – Chi tiết job (public)
GET    /api/jobs/my           – Jobs của recruiter (JWT + recruiter role)
POST   /api/jobs              – Tạo job mới (recruiter)
PUT    /api/jobs/:id          – Cập nhật job (recruiter)
DELETE /api/jobs/:id          – Xoá job (recruiter)
```

### Routes – Applications

```
POST   /api/applications           – Nộp đơn (seeker)
GET    /api/applications/my        – Đơn của mình (seeker)
GET    /api/applications/job/:id   – Đơn cho một job (recruiter)
PATCH  /api/applications/:id       – Cập nhật trạng thái (recruiter)
```

### Job Search

Hàm `FindByQuery` trong `repository.go` hỗ trợ filter động:

```go
type JobQuery struct {
    Keyword          string
    Location         string
    SalaryBand       string   // e.g. "15-30M"
    EmploymentTypes  []string // ["full-time", "part-time"]
    ExperienceLevels []string // ["junior", "mid-level", "senior"]
    Sort             string   // "newest" (default)
}
```

MongoDB filter được build theo các field có giá trị, status luôn là `"open"`.

### Env Vars
```
JOBS_SERVICE_PORT=8082
MONGODB_URI=...
MONGODB_DB=jobbridge
JWT_SECRET=...
```

---

## 4. AI Service (Port 8085)

**File:** [cmd/ai/main.go](../cmd/ai/main.go)

### Chức năng
Tích hợp OpenAI API để cung cấp 3 tính năng AI:
1. **Interview Coach** – chatbot luyện phỏng vấn
2. **Interview Quiz** – sinh câu hỏi trắc nghiệm
3. **HR Evaluate CV** – chấm điểm và đánh giá CV

### Cấu trúc file

```
internal/ai/
├── handler.go              – HTTP handlers (3 features)
├── openai_client.go        – OpenAI API client
├── history_repository.go   – Lưu lịch sử chat
└── handler_test.go         – Unit tests
```

### Routes

```
POST /api/ai/interview-coach    – Seeker: chat với AI coach
POST /api/ai/interview-quiz     – Seeker: tạo quiz trắc nghiệm
POST /api/ai/hr-evaluate-cv     – Recruiter: đánh giá CV ứng viên
```

### Dependencies

AI service cần đọc data từ các service khác, nên nó share repository:

```go
// cmd/ai/main.go
userRepo  := auth.NewUserRepository(database)
jobRepo   := job.NewRepository(database)
appRepo   := application.NewRepository(database)
aiHandler := ai.NewHandler(appRepo, userRepo, jobRepo, aiClient, ...)
```

Không có HTTP call giữa services – truy cập trực tiếp cùng MongoDB database.

### OpenAI Client

```go
// internal/ai/openai_client.go
type OpenAIClient struct {
    apiKey  string
    baseURL string
    model   string
}
```

Gọi `POST <URL_BASE>/chat/completions` với model có thể cấu hình (default: `gpt-4o-mini`).

### Env Vars
```
AI_SERVICE_PORT=8085
MONGODB_URI=...
MONGODB_DB=jobbridge
JWT_SECRET=...
OPENAI_API_KEY=sk-...
MODEL=gpt-4o-mini
URL_BASE=https://api.openai.com/v1
```

---

## Shared Packages

### `internal/config`

Load tất cả config từ environment variables:

```go
type Config struct {
    Port                  string
    Mode                  string   // gin.SetMode
    MongoURI              string
    MongoDB               string
    JWTSecret             string
    JWTIssuer             string
    AccessTokenTTLMinutes int
    CloudinaryURL         string
    CloudinaryFolder      string
    OpenAIAPIKey          string
    URLBase               string
    Model                 string
}
```

### `internal/db`

Kết nối MongoDB với timeout 10 giây:

```go
func NewMongoClient(ctx context.Context, uri string) (*mongo.Client, error)
```

### `internal/auth` (Middleware)

Dùng bởi cả Jobs và AI service:

```go
auth.AuthMiddleware(jwtSecret)  // Validate JWT, inject user_id + role
auth.RoleMiddleware("recruiter") // Check role
```

---

## Build & Docker

### Multi-stage Dockerfile pattern

```dockerfile
# Stage 1: Build
FROM golang:1.24.5-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o /app/service ./cmd/<service>

# Stage 2: Runtime
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/service /service
ENTRYPOINT ["/service"]
```

Kết quả: image ~10–15MB, không có shell, chạy với non-root user.

---

## Tests

```bash
# Chạy tất cả tests
cd backend
go test ./...

# Chạy với coverage
go test ./... -cover

# Chạy test cụ thể
go test ./internal/ai/... -v
go test ./internal/auth/... -v
```

Test files có trong:
- `internal/ai/handler_test.go`
- `internal/auth/context_test.go`
- `internal/job/repository_helpers_test.go`
- `internal/application/handler_test.go`
- `internal/config/config_test.go`
- `internal/db/mongo_test.go`
