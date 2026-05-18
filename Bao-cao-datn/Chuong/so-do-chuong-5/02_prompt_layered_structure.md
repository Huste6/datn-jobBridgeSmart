# Sơ đồ: Cấu trúc Prompt Phân tầng Context-Aware (Layered Prompt Architecture)

## Tên file đích cần lưu
- `prompt_layered_structure.png` (Lưu vào thư mục `so-do-chuong-5/prompt_layered_structure.png`)

## Ý đồ thiết kế (Diagram Layout)
Sơ đồ dạng chồng tầng (Stacked Architecture) hoặc sơ đồ khối mô tả cách AI Service lắp ráp thông tin một cách khoa học để tạo thành Prompt hoàn chỉnh trước khi gửi đến OpenAI API, giúp AI không bị ảo tưởng (hallucination) và bám sát thực tế:
- **Tầng 1 (System Prompt - Lớp quy tắc ứng xử cốt lõi):** Định nghĩa vai trò (Senior IT Recruiter), ngôn ngữ (tiếng Việt), quy tắc định dạng (không markdown, không code block).
- **Tầng 2 (Candidate Profile - Lớp ngữ cảnh ứng viên):** Họ tên, Email, Headline, SĐT, Thành phố của seeker.
- **Tầng 3 (Job Context - Lớp ngữ cảnh tin tuyển dụng):** Tên Job, Mô tả công việc (JD), Yêu cầu chi tiết, Trách nhiệm chính, Quyền lợi.
- **Tầng 4 (CV Text Context - Lớp dữ liệu kinh nghiệm):** Phần text thô đã trích xuất từ file CV của ứng viên (Skills, Work Experience).
- **Tầng 5 (Chat History - Lớp lịch sử hội thoại):** Tối đa 20 tin nhắn trao đổi gần nhất giữa AI và User để giữ mạch nói chuyện.
- **Tầng 6 (User Message - Câu hỏi hiện tại):** Câu hỏi hoặc câu trả lời hiện tại mà ứng viên vừa nhập.

Tất cả các tầng này xếp chồng lên nhau thành một khối Prompt hợp nhất chuyển vào **OpenAI API (GPT-4o-mini)**.

## Prompt gợi ý để Gen ảnh bằng AI
"Create an architectural diagram showing a Stacked Prompt Structure. Minimalist design, clean lines, white background, no colors. Draw a vertical stack of 6 horizontal blocks, from bottom to top: 1. System Prompt (Rules & Behavior); 2. Candidate Profile (Personal Info); 3. Job Context (JD & Requirements); 4. CV Context (Skills & Experience); 5. Chat History (Last 20 messages); 6. User Message (Current Query). All 6 blocks point with a large arrow to a block labeled 'OpenAI API (GPT-4o-mini)'. Title below: Layered Prompt Context Assembly."
