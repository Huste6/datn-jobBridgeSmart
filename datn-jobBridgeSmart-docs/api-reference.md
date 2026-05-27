# API Reference – JobBridge AI

Base URL (production): `https://jobbridge.duckdns.org`  
Base URL (local): `http://localhost:8080`

Tất cả request/response dùng `Content-Type: application/json`.

Các endpoint yêu cầu xác thực cần header:
```
Authorization: Bearer <JWT token>
```

---

## Auth Service (`/api/auth`, `/api/users`, `/api/hr`, `/api/admin`, `/api/public`)

### Đăng ký

```
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "role": "seeker"
  }
}
```

---

### Đăng nhập

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:** (Giống register)

---

### Lấy thông tin bản thân

```
GET /api/users/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "role": "seeker",
  "avatar_url": "https://res.cloudinary.com/...",
  "cv_url": "https://res.cloudinary.com/...",
  "phone": "0901234567",
  "city": "Hồ Chí Minh",
  "headline": "Backend Developer",
  "profile_completed": true
}
```

---

### Cập nhật thông tin cá nhân

```
PATCH /api/users/me
Authorization: Bearer <token>
```

**Body (tất cả optional):**
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0901234567",
  "city": "Hà Nội",
  "headline": "Senior Go Developer"
}
```

---

### Upload Avatar

```
POST /api/users/me/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar` – file ảnh (JPEG, PNG)

**Response 200:**
```json
{
  "avatar_url": "https://res.cloudinary.com/...",
  "message": "Avatar uploaded successfully"
}
```

---

### Upload CV

```
POST /api/users/me/cv
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `cv` – file PDF

**Response 200:**
```json
{
  "cv_url": "https://res.cloudinary.com/...",
  "message": "CV uploaded successfully"
}
```

---

### Onboarding (Chọn role)

```
POST /api/users/me/onboarding
Authorization: Bearer <token>
```

**Body:**
```json
{
  "role": "seeker"
}
```

`role` nhận: `"seeker"` hoặc `"recruiter"`

---

### Lấy danh sách công ty (Public)

```
GET /api/public/companies
```

**Response 200:**
```json
[
  {
    "id": "...",
    "name": "Tech Corp",
    "industry": "IT",
    "location": "Hồ Chí Minh",
    "size": "50-200",
    "website": "https://techcorp.vn",
    "description": "..."
  }
]
```

---

### Lấy chi tiết công ty (Public)

```
GET /api/public/companies/:id
```

---

### HR: Lấy thông tin công ty của mình

```
GET /api/hr/company
Authorization: Bearer <recruiter token>
```

---

### HR: Tạo công ty

```
POST /api/hr/company
Authorization: Bearer <recruiter token>
```

**Body:**
```json
{
  "name": "My Company",
  "tax_code": "0123456789",
  "website": "https://mycompany.vn",
  "industry": "Công nghệ",
  "size": "10-50",
  "location": "Hà Nội",
  "description": "Mô tả công ty..."
}
```

---

### HR: Cập nhật công ty

```
PUT /api/hr/company
Authorization: Bearer <recruiter token>
```

**Body:** Giống tạo công ty

---

### Admin: Thống kê

```
GET /api/admin/stats
Authorization: Bearer <admin token>
```

**Response 200:**
```json
{
  "total_users": 150,
  "total_companies": 30,
  "total_jobs": 120,
  "total_applications": 500
}
```

---

### Admin: Danh sách người dùng

```
GET /api/admin/users
Authorization: Bearer <admin token>
```

---

### Admin: Khoá/Mở tài khoản

```
POST /api/admin/users/:id/lock
Authorization: Bearer <admin token>
```

---

### Admin: Danh sách công ty

```
GET /api/admin/companies
Authorization: Bearer <admin token>
```

---

### Admin: Phê duyệt công ty

```
POST /api/admin/companies/:id/approve
Authorization: Bearer <admin token>
```

---

### Admin: Khoá/Mở công ty

```
POST /api/admin/companies/:id/lock
Authorization: Bearer <admin token>
```

---

## Jobs Service (`/api/jobs`, `/api/applications`)

### Lấy danh sách việc làm

```
GET /api/jobs
```

**Query Parameters (tất cả optional):**

| Param | Kiểu | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `q` | string | Tìm theo từ khoá | `golang` |
| `location` | string | Tìm theo địa điểm | `HCM` |
| `salary_band` | string | Dải lương | `15-30M` |
| `employment_type` | string[] | Loại hình | `full-time` |
| `experience_level` | string[] | Kinh nghiệm | `mid-level` |
| `sort` | string | Sắp xếp | `newest` |

**Response 200:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Backend Go Developer",
    "company": "Tech Corp",
    "location": "Hồ Chí Minh",
    "salary": "20-30 triệu",
    "employment_type": "full-time",
    "experience_level": "mid-level",
    "status": "open",
    "tags": ["golang", "mongodb", "microservices"],
    "posted_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Lấy chi tiết việc làm

```
GET /api/jobs/:id
```

**Response 200:**
```json
{
  "id": "...",
  "title": "Backend Go Developer",
  "company": "Tech Corp",
  "location": "Hồ Chí Minh",
  "salary": "20-30 triệu",
  "employment_type": "full-time",
  "experience_level": "mid-level",
  "description": "Mô tả công việc...",
  "responsibilities": ["Thiết kế API", "Viết unit tests"],
  "requirements": ["2+ năm Go", "MongoDB", "Docker"],
  "benefits": ["Bảo hiểm", "Thưởng"],
  "tags": ["golang", "mongodb"],
  "status": "open",
  "posted_at": "2024-01-15T10:00:00Z"
}
```

---

### HR: Lấy danh sách job của mình

```
GET /api/jobs/my
Authorization: Bearer <recruiter token>
```

---

### HR: Tạo việc làm mới

```
POST /api/jobs
Authorization: Bearer <recruiter token>
```

**Body:**
```json
{
  "title": "Backend Go Developer",
  "company": "Tech Corp",
  "location": "Hồ Chí Minh",
  "salary": "20-30 triệu",
  "employment_type": "full-time",
  "experience_level": "mid-level",
  "description": "Mô tả...",
  "responsibilities": ["Thiết kế API"],
  "requirements": ["2+ năm Go"],
  "benefits": ["Bảo hiểm"],
  "tags": ["golang"],
  "status": "open"
}
```

---

### HR: Cập nhật việc làm

```
PUT /api/jobs/:id
Authorization: Bearer <recruiter token>
```

**Body:** Giống tạo job

---

### HR: Xoá việc làm

```
DELETE /api/jobs/:id
Authorization: Bearer <recruiter token>
```

---

### Nộp đơn ứng tuyển

```
POST /api/applications
Authorization: Bearer <seeker token>
```

**Body:**
```json
{
  "job_id": "507f1f77bcf86cd799439011"
}
```

**Response 201:**
```json
{
  "id": "...",
  "job_id": "...",
  "status": "pending",
  "applied_at": "2024-01-15T10:00:00Z"
}
```

---

### Seeker: Xem đơn ứng tuyển của mình

```
GET /api/applications/my
Authorization: Bearer <seeker token>
```

---

### HR: Xem đơn ứng tuyển cho một job

```
GET /api/applications/job/:jobId
Authorization: Bearer <recruiter token>
```

**Response 200:**
```json
[
  {
    "id": "...",
    "job_id": "...",
    "user_id": "...",
    "cv_url": "https://cloudinary.com/...",
    "status": "pending",
    "manual_score": 0,
    "notes": "",
    "applied_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### HR: Cập nhật trạng thái đơn

```
PATCH /api/applications/:id
Authorization: Bearer <recruiter token>
```

**Body (tất cả optional):**
```json
{
  "status": "reviewed",
  "manual_score": 85,
  "notes": "Ứng viên tiềm năng, cần phỏng vấn thêm"
}
```

---

## AI Service (`/api/ai`)

> Tất cả AI endpoints yêu cầu `OPENAI_API_KEY` được cấu hình.

### Interview Coach (Seeker only)

```
POST /api/ai/interview-coach
Authorization: Bearer <seeker token>
```

**Body:**
```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "message": "Câu hỏi của ứng viên tại đây",
  "history": [
    { "role": "user", "content": "Tin nhắn trước" },
    { "role": "assistant", "content": "Câu trả lời AI trước" }
  ]
}
```

- `job_id` – bắt buộc
- `message` – bắt buộc, tối thiểu 2 ký tự
- `history` – tuỳ chọn, danh sách tin nhắn trước đó

**Response 200:**
```json
{
  "reply": "Đây là câu trả lời từ AI...",
  "job_id": "507f1f77bcf86cd799439011",
  "cv_url": "https://cloudinary.com/...",
  "cv_ready": true,
  "cv_text_used": true,
  "model": "gpt-4o-mini"
}
```

---

### Interview Quiz (Seeker only)

```
POST /api/ai/interview-quiz
Authorization: Bearer <seeker token>
```

**Body:**
```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "question_count": 10
}
```

- `question_count` – bắt buộc, từ 1 đến 30

**Response 200:**
```json
{
  "job_id": "...",
  "question_count": 10,
  "questions": [
    {
      "number": 1,
      "question": "Goroutine trong Go là gì?",
      "options": [
        { "label": "A", "text": "Một thread hệ điều hành" },
        { "label": "B", "text": "Một lightweight thread do Go runtime quản lý" },
        { "label": "C", "text": "Một function bất đồng bộ" },
        { "label": "D", "text": "Một process con" }
      ],
      "correct_answer": "B",
      "explanation": "Goroutine là lightweight thread..."
    }
  ],
  "cv_ready": true,
  "model": "gpt-4o-mini"
}
```

---

### HR Evaluate CV (Recruiter only)

```
POST /api/ai/hr-evaluate-cv
Authorization: Bearer <recruiter token>
```

**Body:**
```json
{
  "application_id": "507f1f77bcf86cd799439011",
  "prompt": "Chú ý kinh nghiệm Go và microservices"
}
```

- `application_id` – bắt buộc
- `prompt` – tuỳ chọn, hướng dẫn bổ sung cho AI

**Response 200:**
```json
{
  "application_id": "...",
  "job_id": "...",
  "candidate_id": "...",
  "score": 85,
  "notes": "Ứng viên có 3 năm kinh nghiệm Go, đáp ứng 8/10 yêu cầu...",
  "cv_ready": true,
  "cv_text_used": true,
  "model": "gpt-4o-mini"
}
```

---

## Error Responses

Tất cả services trả về lỗi theo format:

```json
{
  "error": "Mô tả lỗi"
}
```

| HTTP Status | Ý nghĩa |
|-------------|---------|
| `400` | Bad Request – input không hợp lệ |
| `401` | Unauthorized – thiếu hoặc sai token |
| `403` | Forbidden – không đủ quyền |
| `404` | Not Found – resource không tồn tại |
| `409` | Conflict – email đã tồn tại, đã ứng tuyển,... |
| `500` | Internal Server Error |
| `502` | Bad Gateway – upstream service không phản hồi |
| `503` | Service Unavailable – AI chưa được cấu hình |

---

## Health Checks

```
GET /health
```

Mỗi service đều có endpoint health check. Response:

```json
{
  "status": "ok",
  "service": "gateway|auth|jobs|ai"
}
```
