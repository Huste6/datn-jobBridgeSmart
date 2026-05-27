# Frontend Structure – JobBridge AI

## Tech Stack

| Thành phần | Công nghệ | Version |
|-----------|----------|---------|
| Framework | React | 19.2.4 |
| Language | TypeScript | ~5.9.3 |
| Build tool | Vite | 8.0.0 |
| Styling | Tailwind CSS | 4.2.1 |
| Icons | lucide-react | 0.577.0 |
| Markdown editor | @uiw/react-md-editor | 4.0.11 |
| Testing | Vitest + jsdom | 3.2.4 |

## Cấu trúc thư mục

```
frontend/src/
├── features/            # API client layer (axios/fetch calls)
│   ├── auth/
│   │   └── api/         – login, register, profile endpoints
│   ├── jobs/
│   │   └── api/         – job search, CRUD endpoints
│   ├── companies/
│   │   └── api/         – company listing endpoints
│   └── hr/
│       └── api/         – HR-specific endpoints
│
├── pages/               # React components / pages
│   ├── admin/           – Admin dashboard
│   ├── app/             – Authenticated seeker pages
│   ├── hr/              – Recruiter pages
│   ├── public/          – Landing page, company listing
│   ├── companies/       – Company detail
│   ├── errors/          – 403, 404 pages
│   ├── onboarding/      – Role selection page
│   └── auth/            – Login / Register pages
│
├── layouts/             # Wrapper layouts
│   ├── AdminLayout.tsx  – Admin với sidebar
│   ├── AppLayout.tsx    – Seeker với navbar
│   └── ...
│
├── shared/
│   ├── routes/          – Route definitions & navigation
│   └── helpers/         – Utility functions
│
├── assets/              – Static files (images, fonts)
├── App.tsx              – Root component với router
├── main.tsx             – Entry point
└── index.css            – Global Tailwind CSS
```

## Pages theo Role

### Seeker (Ứng viên) – `/app/*`

| Page | Path | Chức năng |
|------|------|---------|
| Job Listing | `/app/jobs` | Tìm kiếm và filter việc làm |
| Job Detail | `/app/jobs/:id` | Chi tiết một tin tuyển dụng |
| My Applications | `/app/applications` | Xem các đơn đã nộp |
| AI Interview Coach | `/app/coach` | Chat với AI coach |
| AI Interview Quiz | `/app/quiz` | Làm bài quiz |
| Profile | `/app/profile` | Quản lý hồ sơ, upload CV |
| Company List | `/app/companies` | Xem danh sách công ty |

### Recruiter (HR) – `/hr/*`

| Page | Path | Chức năng |
|------|------|---------|
| Job Management | `/hr/jobs` | Danh sách job của công ty |
| Create/Edit Job | `/hr/jobs/new`, `/hr/jobs/:id/edit` | CRUD job |
| Applications | `/hr/applications` | Xem ứng viên nộp đơn |
| Application Detail | `/hr/applications/:id` | Chi tiết + AI evaluate CV |
| Company Profile | `/hr/company` | Quản lý hồ sơ công ty |

### Admin – `/admin/*`

| Page | Path | Chức năng |
|------|------|---------|
| Dashboard | `/admin` | Thống kê tổng quan |
| Users | `/admin/users` | Quản lý tài khoản |
| Companies | `/admin/companies` | Phê duyệt công ty |

### Public – `/`

| Page | Path | Chức năng |
|------|------|---------|
| Landing | `/` | Trang chủ giới thiệu |
| Company Directory | `/companies` | Danh sách công ty công khai |
| Company Detail | `/companies/:id` | Chi tiết công ty |

### Auth

| Page | Path |
|------|------|
| Login | `/login` |
| Register | `/register` |
| Onboarding | `/onboarding` |
| 403 | `/403` |
| 404 | `*` |

## Features Layer (API Clients)

Tầng `features/` chứa tất cả HTTP calls đến backend. Mỗi domain có thư mục riêng:

```typescript
// Ví dụ: features/auth/api/index.ts
export const login = (email: string, password: string) =>
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(res => res.json());

export const getMe = (token: string) =>
  fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json());
```

Tất cả API calls đều proxy qua `/api` → Vite dev server forward tới `http://localhost:8080` (Gateway).

## Layouts

### AppLayout (Seeker)
- Navbar với logo, search, navigation links
- User avatar dropdown (profile, logout)
- Main content area

### AdminLayout
- Sidebar với navigation links
- Header với admin info
- Content area

## Routing

Routes được define trong `shared/routes/`. Dùng React Router v6 với:
- Protected routes (redirect to `/login` nếu chưa auth)
- Role-based routing (redirect tới đúng layout theo role)

## Development

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # Tạo dist/
npm run test         # Chạy Vitest
npm run test:coverage
npm run lint
```

## Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',   // → API Gateway
      '/health': 'http://localhost:8080'
    }
  }
})
```

## Production Build

```
npm run build → dist/
```

Deployed trong Docker image với Nginx:

```
frontend/nginx/   – Nginx config
  └── nginx.conf  – SPA routing (fallback to index.html), gzip, caching
```

Dockerfile pattern:
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
```

## TypeScript Config

Dùng 3 tsconfig files:
- `tsconfig.json` – root, references app và node
- `tsconfig.app.json` – React app (strict mode, target ES2020)
- `tsconfig.node.json` – Vite config và Node scripts
