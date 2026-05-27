# Cài đặt môi trường phát triển Local

## Yêu cầu

| Công cụ | Version tối thiểu | Mục đích |
|---------|-------------------|---------|
| Docker | 24+ | Chạy MongoDB và các services |
| Docker Compose | 2.x | Orchestrate local stack |
| Go | 1.24+ | Build/run backend services |
| Node.js | 18+ | Build/run frontend |
| npm | 9+ | Frontend package manager |
| Git | Any | Clone repo |

**Tuỳ chọn (nếu dùng Tilt):**
- [Tilt](https://docs.tilt.dev/install.html) – live reload cho development

## Bước 1: Clone repository

```bash
git clone https://github.com/Huste6/datn-jobBridgeSmart.git
cd datn-jobBridgeSmart
```

## Bước 2: Cấu hình biến môi trường

```bash
cd backend
cp .env.example .env
```

Mở file `.env` và điền các giá trị cần thiết:

```env
# Ports
GATEWAY_PORT=8080
AUTH_SERVICE_PORT=8081
JOBS_SERVICE_PORT=8082
AI_SERVICE_PORT=8085

# Service URLs (dùng cho Gateway)
AUTH_SERVICE_URL=http://localhost:8081
JOBS_SERVICE_URL=http://localhost:8082
AI_SERVICE_URL=http://localhost:8085

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27018/jobbridge
MONGODB_DB=jobbridge

# JWT - BẮT BUỘC thay đổi!
JWT_SECRET=your-super-secret-key-change-this
JWT_ISSUER=jobbridge-api
ACCESS_TOKEN_TTL_MINUTES=60

# Cloudinary (tuỳ chọn - cần để upload avatar/CV)
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
CLOUDINARY_FOLDER=jobbridge/user

# OpenAI (BẮT BUỘC để dùng tính năng AI)
OPENAI_API_KEY=sk-...
MODEL=gpt-4o-mini
URL_BASE=https://api.openai.com/v1

# Gin mode
GIN_MODE=debug
```

> **Lưu ý:** `OPENAI_API_KEY` là bắt buộc nếu bạn muốn dùng tính năng Interview Coach, Quiz, và HR Evaluate CV.

## Cách 1: Docker Compose (Khuyến nghị)

Docker Compose sẽ khởi động toàn bộ backend stack (MongoDB + 4 Go services):

```bash
# Từ root directory
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

**Các container được khởi động:**

| Container | Port | Ghi chú |
|-----------|------|---------|
| `mongodb` | 27018 | MongoDB 7.0 |
| `auth-service` | 8081 | Chạy `go run ./cmd/auth` |
| `jobs-service` | 8082 | Chạy `go run ./cmd/jobs` |
| `ai-service` | 8085 | Chạy `go run ./cmd/ai` |
| `gateway-service` | 8080 | Chạy `go run ./cmd/gateway` |

> **Lưu ý:** Docker Compose mount source code vào container và dùng `go run`, nên lần đầu sẽ cần thời gian download dependencies.

## Cách 2: Chạy trực tiếp (không Docker)

### Chỉ MongoDB qua Docker

```bash
docker run -d --name mongo-local \
  -p 27018:27017 \
  mongo:7.0
```

### Chạy từng service

Mở 4 terminal riêng biệt:

```bash
# Terminal 1 - Auth Service
cd backend
go run ./cmd/auth

# Terminal 2 - Jobs Service
cd backend
go run ./cmd/jobs

# Terminal 3 - AI Service
cd backend
go run ./cmd/ai

# Terminal 4 - Gateway
cd backend
go run ./cmd/gateway
```

## Bước 3: Khởi động Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173` và tự động proxy `/api/*` tới gateway `:8080`.

## Cách 3: Tilt (Live Reload)

Tilt cung cấp live reload và dashboard tại `http://localhost:10350`:

```bash
# Từ root directory
tilt up

# Dừng
tilt down
```

Tiltfile cấu hình 5 resources:
- `backend-auth`, `backend-jobs`, `backend-ai`, `backend-gateway`
- `frontend`

Khi bạn thay đổi code, Tilt tự động rebuild và restart service tương ứng.

## Bước 4: Seed dữ liệu mẫu (Tuỳ chọn)

```bash
cd backend
go run ./cmd/seed
```

Lệnh này sẽ tạo:
- Một tài khoản admin mẫu
- Một số công ty và job postings mẫu

## Kiểm tra hoạt động

```bash
# Health check các services
curl http://localhost:8080/health   # Gateway
curl http://localhost:8081/health   # Auth
curl http://localhost:8082/health   # Jobs
curl http://localhost:8085/health   # AI

# Tất cả đều trả về: {"status":"ok","service":"<name>"}
```

## Truy cập ứng dụng

| URL | Mô tả |
|-----|-------|
| `http://localhost:5173` | Frontend React app |
| `http://localhost:8080` | API Gateway |
| `http://localhost:8081` | Auth Service API |
| `http://localhost:8082` | Jobs Service API |
| `http://localhost:8085` | AI Service API |

## Chạy Tests

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm run test

# Frontend tests với coverage
npm run test:coverage
```

## Môi trường biến quan trọng

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|----------|---------|-------|
| `JWT_SECRET` | Có | `change-me-in-production` | Secret để ký JWT token |
| `OPENAI_API_KEY` | Nếu dùng AI | - | OpenAI API key |
| `MONGODB_URI` | Có | `mongodb://127.0.0.1:27018/jobbridge` | MongoDB connection string |
| `CLOUDINARY_URL` | Nếu upload file | - | Cloudinary credentials URL |
| `GIN_MODE` | Không | `debug` | `debug` hoặc `release` |

## Xử lý lỗi thường gặp

### MongoDB connection refused
```
failed to connect mongodb: context deadline exceeded
```
**Giải pháp:** Đảm bảo MongoDB đang chạy trên port 27018.

### OpenAI API error
```
ai service is not configured
```
**Giải pháp:** Kiểm tra `OPENAI_API_KEY` đã được set trong `.env`.

### Port already in use
```
address :8080: bind: address already in use
```
**Giải pháp:** Dừng process đang dùng port đó:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <pid> /F

# Linux/Mac
lsof -i :8080
kill -9 <pid>
```

### Frontend không kết nối được API
Kiểm tra Vite proxy config trong [frontend/vite.config.ts](../frontend/vite.config.ts) – đảm bảo gateway đang chạy trên `http://localhost:8080`.
