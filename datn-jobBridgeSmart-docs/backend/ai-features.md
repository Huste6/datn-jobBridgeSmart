# AI Features – Chi tiết kỹ thuật

## Tổng quan

AI Service (port 8085) tích hợp **OpenAI API** để cung cấp 3 tính năng thông minh. Tất cả được implement trong [internal/ai/handler.go](../internal/ai/handler.go).

## OpenAI Client

**File:** [internal/ai/openai_client.go](../internal/ai/openai_client.go)

```go
type OpenAIClient struct {
    apiKey  string
    baseURL string   // "https://api.openai.com/v1"
    model   string   // "gpt-4o-mini"
}
```

Gọi `POST {baseURL}/chat/completions`:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}
```

`URL_BASE` và `MODEL` có thể cấu hình để trỏ tới OpenAI-compatible API khác (Azure OpenAI, local Ollama, etc.).

---

## Feature 1: Interview Coach

**Endpoint:** `POST /api/ai/interview-coach`  
**Role:** Seeker only

### Mục đích
Chatbot luyện phỏng vấn 1-1. AI đóng vai người phỏng vấn, đặt câu hỏi và đưa ra feedback dựa trên job description và CV của ứng viên.

### Request

```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "message": "Bạn có thể giới thiệu về kinh nghiệm Go của bạn không?",
  "history": [
    { "role": "user", "content": "Xin chào, tôi muốn luyện phỏng vấn" },
    { "role": "assistant", "content": "Xin chào! Hãy bắt đầu với câu hỏi đầu tiên..." }
  ]
}
```

### Prompt Construction

Handler xây dựng context theo 4 lớp:

```
messages = [
  {
    role: "system",
    content: "Bạn là một chuyên gia phỏng vấn và career coach. 
              Vị trí: {job.title} tại {job.company}
              Mô tả: {job.description}
              Yêu cầu: {job.requirements}
              
              [Nếu có CV]: CV ứng viên: {user.cv_text}"
  },
  // ... history messages ...
  {
    role: "user",
    content: "{message hiện tại}"
  }
]
```

### Response

```json
{
  "reply": "Câu trả lời từ AI...",
  "job_id": "507f1f77bcf86cd799439011",
  "cv_url": "https://cloudinary.com/...",
  "cv_ready": true,
  "cv_text_used": true,
  "model": "gpt-4o-mini"
}
```

- `cv_ready`: `true` nếu user đã upload CV
- `cv_text_used`: `true` nếu text CV được đưa vào prompt

### CV Text Caching

AI service lấy `cv_text` từ MongoDB (field đã được cache khi upload):

```go
user, _ := h.userRepo.FindByID(ctx, userID)
cvText := user.CVText  // text đã extract sẵn, không cần download lại
```

Điều này giảm latency đáng kể so với download PDF mỗi lần.

---

## Feature 2: Interview Quiz

**Endpoint:** `POST /api/ai/interview-quiz`  
**Role:** Seeker only

### Mục đích
Tự động tạo bộ câu hỏi trắc nghiệm (MCQ) từ job description để ứng viên tự kiểm tra kiến thức trước phỏng vấn.

### Request

```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "question_count": 10
}
```

`question_count`: 1–30 câu hỏi.

### Prompt

```
Tạo {n} câu hỏi trắc nghiệm cho vị trí {job.title}.

Job description: {job.description}
Yêu cầu: {job.requirements}

Trả về JSON array theo format:
[
  {
    "number": 1,
    "question": "Câu hỏi...",
    "options": [
      { "label": "A", "text": "Option A" },
      { "label": "B", "text": "Option B" },
      { "label": "C", "text": "Option C" },
      { "label": "D", "text": "Option D" }
    ],
    "correct_answer": "B",
    "explanation": "Giải thích..."
  }
]
```

### Response Parsing

Handler parse JSON từ AI response, xử lý các edge case:
- Strip markdown code blocks (` ```json ... ``` `)
- Extract JSON array từ response text
- Validate số lượng câu hỏi

### Response

```json
{
  "job_id": "...",
  "question_count": 10,
  "questions": [
    {
      "number": 1,
      "question": "Goroutine trong Go là gì?",
      "options": [
        { "label": "A", "text": "Thread hệ điều hành" },
        { "label": "B", "text": "Lightweight thread của Go runtime" },
        { "label": "C", "text": "Async function" },
        { "label": "D", "text": "Process con" }
      ],
      "correct_answer": "B",
      "explanation": "Goroutine là lightweight thread được Go runtime quản lý, không phải OS thread..."
    }
  ],
  "cv_ready": true,
  "cv_text_used": false,
  "model": "gpt-4o-mini"
}
```

---

## Feature 3: HR Evaluate CV

**Endpoint:** `POST /api/ai/hr-evaluate-cv`  
**Role:** Recruiter only

### Mục đích
AI tự động chấm điểm và đánh giá CV ứng viên (0–100) dựa trên job description. Kết quả được lưu vào application record.

### Request

```json
{
  "application_id": "507f1f77bcf86cd799439011",
  "prompt": "Chú ý kinh nghiệm với distributed systems và cloud"
}
```

- `application_id`: bắt buộc
- `prompt`: tuỳ chọn – hướng dẫn bổ sung cho AI

### Data Loading

Handler fetch 3 documents từ MongoDB:
1. **Application** – lấy `job_id`, `user_id`, `cv_url`
2. **Job** – lấy `title`, `description`, `requirements`, `responsibilities`
3. **Candidate User** – lấy `cv_text` (text đã cache)

### Prompt

```
Bạn là chuyên gia tuyển dụng kỹ thuật IT hỗ trợ HR đánh giá hồ sơ ứng viên.

Yêu cầu bắt buộc:
- Chỉ dùng dữ liệu từ CV context và JD context được cung cấp.
- Không bịa thông tin chưa có trong CV/JD.
- Trả kết quả ở dạng JSON hợp lệ duy nhất, không kèm markdown, không kèm giải thích ngoài JSON.

Schema JSON bắt buộc:
{
  "score": <0-100 (điểm tương thích tổng thể)>,
  "summary": "<nhận xét/đánh giá chung của AI về hồ sơ ứng viên>",
  "matching_skills": ["<kỹ năng phù hợp 1>", "<kỹ năng phù hợp 2>", ...],
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>", ...],
  "weaknesses": ["<điểm cần cải thiện 1>", "<điểm cần cải thiện 2>", ...],
  "recommendations": ["<đề xuất cho nhà tuyển dụng 1>", "<đề xuất cho nhà tuyển dụng 2>", ...]
}
```

### Score & Notes Extraction

Handler cố gắng parse JSON từ AI response. Nếu thành công và chứa thông tin có cấu trúc, trường `notes` lưu trữ dưới dạng chuỗi JSON đã được serialize. Nếu thất bại, hệ thống tự động rơi về cơ chế fallback (truy quét Regex tìm `score` và dùng toàn bộ văn bản phản hồi làm `notes` phi cấu trúc):

```go
type parsedFull struct {
    Score           int      `json:"score"`
    Summary         string   `json:"summary"`
    MatchingSkills  []string `json:"matching_skills"`
    Strengths       []string `json:"strengths"`
    Weaknesses      []string `json:"weaknesses"`
    Recommendations []string `json:"recommendations"`
}
// Nếu parse thành công, lưu notes dưới dạng JSON:
// { "summary": "...", "matching_skills": [...], "strengths": [...], "weaknesses": [...], "recommendations": [...] }
```

### Database Update

Sau khi có kết quả, AI service cập nhật application record:

```go
// Tải dữ liệu vào MongoDB
h.appRepo.UpdateScoreAndNotes(ctx, appOID, score, notes)
```

### Response

Khi thành công, API trả về dữ liệu có dạng:

```json
{
  "application_id": "69c7dce8b6e986eb9f871375",
  "job_id": "69c7d760385fe6fb5cf575eb",
  "candidate_id": "69c7d760385fe6fb5cf575f8",
  "score": 85,
  "notes": "{\"summary\":\"Ứng viên có 3+ năm kinh nghiệm DevOps, thành thạo Docker/K8s...\",\"matching_skills\":[\"Docker\",\"Kubernetes\",\"CI/CD\"],\"strengths\":[\"Kinh nghiệm thực tế với IaC\",\"Có chứng chỉ AWS\"],\"weaknesses\":[\"Kinh nghiệm về Go còn cơ bản\"],\"recommendations\":[\"Phỏng vấn trực tiếp về kiến thức hệ thống\"]}",
  "cv_ready": true,
  "cv_text_used": true,
  "model": "gpt-4o-mini"
}
```

---

## Xử lý khi thiếu CV

Nếu user chưa upload CV:
- `cv_ready: false`
- `cv_text_used: false`
- Prompt chỉ dùng job description (không có context CV)
- AI vẫn hoạt động nhưng kém chính xác hơn

---

## Cấu hình Model

AI service hỗ trợ thay đổi model qua env:

```env
MODEL=gpt-4o-mini        # OpenAI (mặc định, cost-effective)
MODEL=gpt-4o             # OpenAI (chất lượng cao hơn)
URL_BASE=http://localhost:11434/v1  # Ollama local
MODEL=llama3.2           # Local model
```

---

## Error Handling

| Tình huống | Response |
|-----------|---------|
| AI chưa cấu hình (`OPENAI_API_KEY` trống) | `503 Service Unavailable` |
| Job không tồn tại | `404 Not Found` |
| Application không tồn tại | `404 Not Found` |
| OpenAI API lỗi | `500 Internal Server Error` |
| Parse JSON quiz thất bại | Trả về questions rỗng hoặc 500 |

---

## Latency Considerations

| Operation | Thời gian ước tính |
|-----------|-------------------|
| MongoDB query user/job | ~5–20ms |
| OpenAI API (gpt-4o-mini) | ~1–3s |
| JSON parsing | <1ms |
| **Total** | **~1–3s** |

CV text caching giúp loại bỏ ~200–500ms so với download PDF mỗi lần.
