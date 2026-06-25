# Database Schema – MongoDB

## Tổng quan

JobBridge AI dùng **MongoDB 7.0** với database tên `jobbridge`. Có 5 collections chính.

```
Database: jobbridge
├── users              – Tài khoản người dùng
├── companies          – Hồ sơ công ty
├── jobs               – Tin tuyển dụng
├── applications       – Đơn ứng tuyển
└── ai_chat_histories  – Lịch sử chat AI (optional)
```

Kết nối: `MONGODB_URI=mongodb://localhost:27017/jobbridge`

---

## Collection: `users`

Lưu tất cả tài khoản (seeker, recruiter, admin).

### Schema

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "nguyenvana@example.com",
  "full_name": "Nguyễn Văn A",
  "role": "seeker",
  "avatar_url": "https://res.cloudinary.com/...",
  "cv_url": "https://res.cloudinary.com/...",
  "cv_text": "Nguyễn Văn A\nEmail: ...\nKinh nghiệm...",
  "phone": "0901234567",
  "city": "Hồ Chí Minh",
  "headline": "Backend Developer",
  "profile_completed": true,
  "is_locked": false,
  "password_hash": "$2a$10$...",
  "created_at": ISODate("2024-01-15T10:00:00Z"),
  "updated_at": ISODate("2024-01-20T08:30:00Z")
}
```

### Giải thích fields

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `_id` | ObjectId | Primary key |
| `email` | string | Unique, dùng để đăng nhập |
| `role` | string | `"seeker"`, `"recruiter"`, hoặc `"admin"` |
| `cv_text` | string | Text được extract từ PDF, cache để AI dùng |
| `profile_completed` | bool | `false` cho đến khi chọn role qua onboarding |
| `is_locked` | bool | Admin có thể khoá tài khoản |
| `password_hash` | string | bcrypt hash, không bao giờ trả về client |

### Indexes khuyến nghị
```
{ email: 1 }  – unique
{ role: 1 }   – filter by role
```

---

## Collection: `companies`

Hồ sơ công ty, được tạo bởi recruiter và phải được admin phê duyệt.

### Schema

```json
{
  "_id": ObjectId("..."),
  "owner_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Tech Corp Vietnam",
  "tax_code": "0123456789",
  "website": "https://techcorp.vn",
  "industry": "Công nghệ thông tin",
  "size": "50-200",
  "location": "Hồ Chí Minh",
  "description": "Công ty cung cấp giải pháp phần mềm...",
  "status": "approved",
  "is_locked": false,
  "created_at": ISODate("2024-01-10T09:00:00Z"),
  "updated_at": ISODate("2024-01-12T14:00:00Z")
}
```

### Giải thích fields

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `owner_id` | ObjectId | Ref → `users._id` (recruiter sở hữu) |
| `status` | string | `"pending"` → `"approved"` hoặc `"rejected"` |
| `is_locked` | bool | Admin có thể khoá công ty |
| `size` | string | VD: `"1-10"`, `"10-50"`, `"50-200"`, `"200+"` |

### Workflow

```
Recruiter tạo → status: "pending"
Admin duyệt  → status: "approved"  (recruiter có thể đăng job)
Admin từ chối → status: "rejected"
Admin khoá   → is_locked: true      (ẩn khỏi public listing)
```

---

## Collection: `jobs`

Tin tuyển dụng do recruiter đăng.

### Schema

```json
{
  "_id": ObjectId("..."),
  "owner_id": ObjectId("507f1f77bcf86cd799439011"),
  "title": "Backend Go Developer",
  "company": "Tech Corp Vietnam",
  "location": "Hồ Chí Minh",
  "salary": "20-30 triệu",
  "employment_type": "full-time",
  "experience_level": "mid-level",
  "status": "open",
  "description": "Chúng tôi tìm kiếm...",
  "responsibilities": [
    "Thiết kế và phát triển RESTful API",
    "Viết unit tests và integration tests"
  ],
  "requirements": [
    "2+ năm kinh nghiệm Go",
    "Kiến thức MongoDB",
    "Hiểu biết Docker/Kubernetes"
  ],
  "benefits": [
    "Bảo hiểm sức khoẻ",
    "13 tháng lương",
    "WFH 2 ngày/tuần"
  ],
  "tags": ["golang", "mongodb", "microservices", "docker"],
  "posted_at": ISODate("2024-01-15T10:00:00Z"),
  "created_at": ISODate("2024-01-15T10:00:00Z"),
  "updated_at": ISODate("2024-01-15T10:00:00Z")
}
```

### Giải thích fields

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `owner_id` | ObjectId | Ref → `users._id` (recruiter tạo) |
| `status` | string | `"open"` (đang tuyển) hoặc `"closed"` (đã đóng) |
| `employment_type` | string | `"full-time"`, `"part-time"`, `"contract"`, `"internship"` |
| `experience_level` | string | `"junior"`, `"mid-level"`, `"senior"`, `"manager"` |
| `responsibilities` | string[] | Danh sách trách nhiệm công việc |
| `requirements` | string[] | Yêu cầu bắt buộc |
| `benefits` | string[] | Phúc lợi |
| `tags` | string[] | Tags để search |

### Search Query

Jobs service build MongoDB filter từ `JobQuery`:

```javascript
// Ví dụ filter cho: q=golang&location=HCM&salary_band=15-30M
{
  status: "open",
  $text: { $search: "golang" },
  location: { $regex: "HCM", $options: "i" },
  // salary_band được parse thành range filter
}
```

---

## Collection: `applications`

Đơn ứng tuyển của seeker cho một job.

### Schema

```json
{
  "_id": ObjectId("..."),
  "job_id": ObjectId("507f1f77bcf86cd799439011"),
  "user_id": ObjectId("507f1f77bcf86cd799439022"),
  "cv_url": "https://res.cloudinary.com/.../cv.pdf",
  "status": "pending",
  "manual_score": 85,
  "notes": "{\"summary\":\"Ứng viên có 3+ năm kinh nghiệm DevOps...\",\"matching_skills\":[\"Docker\",\"Kubernetes\"],\"strengths\":[\"CI/CD (GitHub Actions)\"],\"weaknesses\":[\"Thiếu kinh nghiệm Azure IaC sâu\"],\"recommendations\":[\"Phỏng vấn trực tiếp tại Đà Nẵng\"]}",
  "applied_at": ISODate("2024-01-16T09:00:00Z"),
  "updated_at": ISODate("2024-01-17T14:30:00Z")
}
```

### Giải thích fields

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `job_id` | ObjectId | Ref → `jobs._id` |
| `user_id` | ObjectId | Ref → `users._id` (seeker nộp đơn) |
| `cv_url` | string | URL PDF tại thời điểm nộp đơn |
| `status` | string | `"pending"`, `"reviewed"`, `"shortlisted"`, `"rejected"` |
| `manual_score` | int | 0–100, recruiter hoặc AI chấm điểm tương thích |
| `notes` | string | Ghi chú văn bản thường (HR tự ghi) hoặc chuỗi JSON chứa kết quả phân tích có cấu trúc của AI (gồm các key: `summary`, `matching_skills`, `strengths`, `weaknesses`, `recommendations`) |

### Unique constraint

Mỗi user chỉ ứng tuyển một job một lần:
```javascript
{ job_id: 1, user_id: 1 }  // unique index
```

---

## Collection: `ai_chat_histories`

Lưu lịch sử chat của Interview Coach feature (tuỳ chọn).

### Schema

```json
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),
  "job_id": ObjectId("..."),
  "messages": [
    { "role": "user", "content": "Câu hỏi của tôi..." },
    { "role": "assistant", "content": "Câu trả lời AI..." }
  ],
  "created_at": ISODate("2024-01-16T10:00:00Z"),
  "updated_at": ISODate("2024-01-16T10:30:00Z")
}
```

---

## Quan hệ giữa Collections

```
users (1)
  ├──▶ companies (M)  [companies.owner_id = users._id]
  ├──▶ jobs (M)       [jobs.owner_id = users._id]
  └──▶ applications (M) [applications.user_id = users._id]

jobs (1)
  └──▶ applications (M) [applications.job_id = jobs._id]
```

MongoDB không có foreign key enforcement – quan hệ được maintain ở application level.

---

## Connection

```go
// internal/db/mongo.go
func NewMongoClient(ctx context.Context, uri string) (*mongo.Client, error) {
    client, err := mongo.Connect(options.Client().ApplyURI(uri))
    if err != nil {
        return nil, err
    }
    if err := client.Ping(ctx, nil); err != nil {
        return nil, err
    }
    return client, nil
}
```

Kết nối được tạo khi service start, với timeout 10 giây. Mỗi service tự kết nối vì không có shared connection pool giữa services.
