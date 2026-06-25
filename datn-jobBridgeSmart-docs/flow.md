# Luồng dữ liệu – JobBridge AI

## 1. Luồng Đăng ký & Đăng nhập

### Đăng ký tài khoản

```
[Browser]
  │
  ├─ POST /api/auth/register
  │   Body: { email, password, full_name }
  │
  ▼
[API Gateway :8080]
  │ Proxy to Auth Service
  ▼
[Auth Service :8081]
  │
  ├─ Validate input (email format, password length)
  ├─ Check email chưa tồn tại trong users collection
  ├─ Hash password bằng bcrypt
  ├─ Insert document vào MongoDB: users collection
  └─ Return { token: "JWT...", user: {...} }

[MongoDB]
  └── db.users.insertOne({
        email, full_name, role: "seeker",
        password_hash: bcrypt(password),
        profile_completed: false,
        created_at: now
      })
```

### Đăng nhập

```
[Browser]
  │
  ├─ POST /api/auth/login
  │   Body: { email, password }
  │
  ▼
[Auth Service :8081]
  │
  ├─ Tìm user theo email trong MongoDB
  ├─ bcrypt.CompareHashAndPassword(hash, password)
  ├─ Tạo JWT với claims: { user_id, role, exp: now + 60min }
  └─ Return { token: "eyJ...", user: { id, email, role, ... } }

Token được lưu ở client (localStorage hoặc memory).
Mọi request sau đó gửi kèm: Authorization: Bearer <token>
```

## 2. Luồng Xác thực Request (JWT Middleware)

```
[Client] ──▶ GET /api/jobs [Authorization: Bearer eyJ...]
                    │
              [API Gateway]
                    │ Proxy (không validate token)
                    ▼
              [Jobs Service]
                    │
              auth.AuthMiddleware()
                    │
              ├─ Parse "Bearer <token>" từ header
              ├─ Verify JWT signature với JWT_SECRET
              ├─ Check token chưa expired
              ├─ Extract claims: user_id, role
              ├─ c.Set("user_id", userID)
              └─ c.Set("user_role", role)
                    │
              Handler tiếp tục xử lý...
```

Nếu token invalid hoặc expired: `401 Unauthorized`.

## 3. Luồng Upload CV & Text Extraction

```
[Ứng viên] ──▶ POST /api/users/me/cv
                Body: multipart/form-data { file: cv.pdf }
                    │
              [Auth Service :8081]
                    │
              ├─ Validate: file type = application/pdf, size < 10MB
              ├─ Upload PDF lên Cloudinary
              │     └─ Return: cv_url = "https://res.cloudinary.com/..."
              ├─ Extract text từ PDF (ledongthuc/pdf library)
              │     └─ Return: cv_text = "Nguyễn Văn A...\nKinh nghiệm..."
              ├─ Update MongoDB: users.cv_url = url, users.cv_text = text
              └─ Return { cv_url, message: "CV uploaded successfully" }

[MongoDB]
  └── db.users.updateOne(
        { _id: userID },
        { cv_url: "cloudinary...", cv_text: "extracted text..." }
      )
```

`cv_text` được cache để AI service dùng mà không cần re-download PDF.

## 4. Luồng Tìm kiếm Việc làm

```
[Browser]
  │
  ├─ GET /api/jobs?q=golang&location=HCM&salary_band=15-30M
  │             &employment_type=full-time&sort=newest
  │
  ▼
[Jobs Service :8082]
  │
  ├─ Parse query params: { keyword, location, salary_band,
  │                        employment_types[], experience_levels[], sort }
  ├─ Build MongoDB filter:
  │     status: "open"
  │     + text search nếu có keyword
  │     + regex location nếu có
  │     + salary_band range
  │     + $in employment_type[]
  │     + $in experience_level[]
  ├─ Sort: newest = { posted_at: -1 }, default = newest
  └─ Return [ { id, title, company, location, salary, ... }, ... ]

[MongoDB]
  └── db.jobs.find({ status:"open", ...filters }).sort({ posted_at: -1 })
```

## 5. Luồng Ứng tuyển

```
[Ứng viên] ──▶ POST /api/applications
                Body: { job_id: "abc123" }
                Authorization: Bearer <seeker token>
                    │
              [Jobs Service :8082]
                    │
              ├─ Validate JWT (role = seeker)
              ├─ Check job tồn tại và status = "open"
              ├─ Check ứng viên chưa nộp đơn cho job này
              ├─ Lấy cv_url từ user profile
              └─ Insert vào applications collection:
                    { job_id, user_id, cv_url, status: "pending",
                      applied_at: now }

[MongoDB]
  └── db.applications.insertOne({ job_id, user_id, cv_url, ... })
```

## 6. Luồng AI Interview Coach

```
[Ứng viên] ──▶ POST /api/ai/interview-coach
                Authorization: Bearer <seeker token>
                Body: {
                  job_id: "abc123",
                  message: "Giải thích về kinh nghiệm của bạn với Go?",
                  history: [ {role:"user",content:"..."}, {role:"assistant",content:"..."} ]
                }
                    │
              [AI Service :8085]
                    │
              ├─ Validate JWT (role = seeker)
              ├─ Lấy job document từ MongoDB (title, description, requirements)
              ├─ Lấy user document từ MongoDB (cv_url, cv_text)
              │
              ├─ Build prompt với 4 lớp context:
              │     System:  "Bạn là AI coach phỏng vấn chuyên nghiệp..."
              │     Job ctx: "Vị trí: <title>, Mô tả: <description>, Yêu cầu: ..."
              │     CV ctx:  "CV ứng viên: <cv_text>" (nếu có)
              │     History: messages trước đó
              │     User:    "Tin nhắn hiện tại"
              │
              ├─ Gọi OpenAI API (gpt-4o-mini)
              │     POST https://api.openai.com/v1/chat/completions
              │     { model, messages, max_tokens: 1000, temperature: 0.7 }
              │
              └─ Return {
                    reply: "Câu trả lời của AI...",
                    job_id, cv_ready: true, cv_text_used: true, model
                 }
```

## 7. Luồng AI Interview Quiz

```
[Ứng viên] ──▶ POST /api/ai/interview-quiz
                Body: { job_id: "abc123", question_count: 10 }
                    │
              [AI Service :8085]
                    │
              ├─ Lấy job description từ MongoDB
              ├─ Build prompt yêu cầu AI tạo {n} câu hỏi trắc nghiệm
              │     Format: JSON array với question, options[A-D],
              │             correct_answer, explanation
              │
              ├─ Gọi OpenAI API
              ├─ Parse JSON response
              └─ Return {
                    job_id, question_count: 10,
                    questions: [
                      { number: 1, question: "...", options: [...],
                        correct_answer: "A", explanation: "..." }
                    ]
                 }
```

## 8. Luồng HR Đánh giá CV bằng AI

```
[Recruiter] ──▶ POST /api/ai/hr-evaluate-cv
                Authorization: Bearer <recruiter token>
                Body: { application_id: "xyz789", prompt: "..." }
                    │
              [AI Service :8085]
                    │
              ├─ Validate JWT (role = recruiter)
              ├─ Lấy application document (job_id, user_id, cv_url)
              ├─ Lấy job document (title, requirements, responsibilities)
              ├─ Lấy candidate user document (cv_text)
              │
              ├─ Build prompt:
              │     "Đánh giá CV ứng viên cho vị trí <job>
              │      JD: <requirements>, <responsibilities>
              │      CV ứng viên: <cv_text>
              │      Trả về cấu trúc JSON bắt buộc gồm: score, summary,
              │      matching_skills, strengths, weaknesses, recommendations"
              │
              ├─ Gọi OpenAI API (gpt-4o-mini)
              ├─ Parse response: trích xuất điểm score và parse cấu trúc JSON
              └─ Update applications: { manual_score: score, notes: "<chuỗi JSON đã serialize>" }
                 Return { application_id, score, notes: "<chuỗi JSON đã serialize>" }
```

## 9. Luồng Phê duyệt Công ty

```
[Recruiter]
  │
  ├─ POST /api/hr/company
  │   Body: { name, tax_code, website, industry, size, location, description }
  │
  ▼
[Auth Service]
  ├─ Tạo company document: { status: "pending", owner_id: recruiter_id }
  └─ Return company

[Admin] kiểm tra danh sách công ty chờ duyệt
  │
  ├─ POST /api/admin/companies/:id/approve
  ▼
[Auth Service]
  ├─ Validate admin role
  ├─ Update company: { status: "approved" }
  └─ Recruiter có thể đăng job sau khi công ty được duyệt
```

## 10. Luồng CI/CD và Deploy

```
[Developer] ──▶ git push origin main
                    │
              [GitHub Actions: ci-build-scan-push.yml]
                    │
              ├─ Test: go test ./...
              ├─ Test: npm run test
              ├─ Build Docker images (Kaniko)
              ├─ Scan images (Trivy CVE)
              ├─ Push to ACR: image:sha-<commit>
                    │
              [GitHub Actions: deploy-aks.yml]
                    │
              ├─ Update values-azure-argocd.yaml:
              │     auth.image.tag: sha-abc1234
              │     jobs.image.tag: sha-abc1234
              │     ...
              ├─ git commit "chore(cd): update image tags to sha-abc1234"
              └─ git push
                    │
              [ArgoCD] (watching repo)
                    │
              ├─ Detect thay đổi trong values-azure-argocd.yaml
              ├─ helm upgrade jobbridge ./deploy/helm/jobbridge
              │     --values values-azure-argocd.yaml
              └─ Rolling update trên AKS (zero downtime)
```

## Tóm tắt dữ liệu flow theo role

| Role | Endpoint chính | Dữ liệu truy cập |
|------|---------------|-----------------|
| Seeker | `/api/auth/*`, `/api/jobs/*`, `/api/applications`, `/api/ai/interview-*` | Đọc jobs, viết applications, chat AI |
| Recruiter | `/api/hr/*`, `/api/jobs/*` (own), `/api/ai/hr-evaluate-cv` | CRUD jobs, đọc applications, AI evaluate |
| Admin | `/api/admin/*` | Đọc tất cả, update user/company status |
