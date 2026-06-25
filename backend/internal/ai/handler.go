package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
	pdf "github.com/ledongthuc/pdf"
	"go.mongodb.org/mongo-driver/v2/bson"

	"jobbridge-ai/backend/internal/application"
	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/job"
)

type Handler struct {
	appRepo   *application.Repository
	userRepo  *auth.UserRepository
	jobRepo   job.Repository
	chat      ChatClient
	jwtSecret string
	model     string
}

type chatHistoryItem struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type interviewCoachRequest struct {
	JobID   string            `json:"job_id" binding:"required"`
	Message string            `json:"message" binding:"required,min=2"`
	History []chatHistoryItem `json:"history"`
}

type interviewCoachResponse struct {
	Reply      string `json:"reply"`
	JobID      string `json:"job_id"`
	CVURL      string `json:"cv_url,omitempty"`
	CVReady    bool   `json:"cv_ready"`
	CVTextUsed bool   `json:"cv_text_used"`
	Model      string `json:"model"`
}

type interviewQuizRequest struct {
	JobID         string `json:"job_id" binding:"required"`
	QuestionCount int    `json:"question_count" binding:"required,gte=1,lte=30"`
}

type interviewQuizOption struct {
	Label string `json:"label"`
	Text  string `json:"text"`
}

type interviewQuizQuestion struct {
	Number        int                   `json:"number"`
	Question      string                `json:"question"`
	Options       []interviewQuizOption `json:"options"`
	CorrectAnswer string                `json:"correct_answer"`
	Explanation   string                `json:"explanation,omitempty"`
}

type interviewQuizResponse struct {
	JobID         string                  `json:"job_id"`
	QuestionCount int                     `json:"question_count"`
	Questions     []interviewQuizQuestion `json:"questions"`
	CVURL         string                  `json:"cv_url,omitempty"`
	CVReady       bool                    `json:"cv_ready"`
	CVTextUsed    bool                    `json:"cv_text_used"`
	Model         string                  `json:"model"`
}

type hrEvaluateRequest struct {
	ApplicationID string `json:"application_id" binding:"required"`
	Prompt        string `json:"prompt"`
}

type hrEvaluateResponse struct {
	ApplicationID string `json:"application_id"`
	JobID         string `json:"job_id"`
	CandidateID   string `json:"candidate_id"`
	Score         int    `json:"score"`
	Notes         string `json:"notes"`
	CVReady       bool   `json:"cv_ready"`
	CVTextUsed    bool   `json:"cv_text_used"`
	Model         string `json:"model"`
}

func NewHandler(appRepo *application.Repository, userRepo *auth.UserRepository, jobRepo job.Repository, chat ChatClient, jwtSecret string, model string) *Handler {
	return &Handler{
		appRepo:   appRepo,
		userRepo:  userRepo,
		jobRepo:   jobRepo,
		chat:      chat,
		jwtSecret: jwtSecret,
		model:     strings.TrimSpace(model),
	}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	group := router.Group("/ai")
	group.Use(auth.AuthMiddleware(h.jwtSecret), auth.RoleMiddleware("seeker"))
	{
		group.POST("/interview-coach", h.InterviewCoach)
		group.POST("/interview-quiz", h.InterviewQuiz)
	}

	hrGroup := router.Group("/ai")
	hrGroup.Use(auth.AuthMiddleware(h.jwtSecret), auth.RoleMiddleware("recruiter"))
	{
		hrGroup.POST("/hr-evaluate-cv", h.HREvaluateCV)
	}
}

func (h *Handler) HREvaluateCV(c *gin.Context) {
	if h.chat == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "ai service is not configured"})
		return
	}

	recruiterID, ok := currentUserID(c)
	if !ok {
		return
	}

	var req hrEvaluateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	appOID, err := bson.ObjectIDFromHex(strings.TrimSpace(req.ApplicationID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid application_id"})
		return
	}

	appDoc, err := h.appRepo.FindByID(c.Request.Context(), appOID)
	if err != nil || appDoc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	jobDoc, err := h.jobRepo.FindByID(c.Request.Context(), appDoc.JobID.Hex())
	if err != nil || jobDoc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	if jobDoc.OwnerID != recruiterID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this job"})
		return
	}

	candidate, err := h.userRepo.FindByID(c.Request.Context(), appDoc.UserID)
	if err != nil || candidate == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	cvURL := strings.TrimSpace(candidate.CvURL)
	if cvURL == "" {
		cvURL = strings.TrimSpace(appDoc.CvURL)
	}

	cvText, cvTextUsed := h.resolveCVText(c.Request.Context(), candidate.ID, candidate.CvText, cvURL)
	prompt := strings.TrimSpace(req.Prompt)
	if prompt == "" {
		prompt = "Hãy đánh giá cv của từng ứng viên dựa trên cv và jd"
	}

	messages := buildHREvaluationPromptMessages(candidate, jobDoc, prompt, cvURL, cvText)
	reply, err := h.chat.Complete(c.Request.Context(), messages)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "ai provider failed", "detail": err.Error()})
		return
	}

	score, notes := parseHRScoreAndNotes(reply)

	c.JSON(http.StatusOK, hrEvaluateResponse{
		ApplicationID: req.ApplicationID,
		JobID:         appDoc.JobID.Hex(),
		CandidateID:   appDoc.UserID.Hex(),
		Score:         score,
		Notes:         sanitizeAssistantReply(notes),
		CVReady:       cvURL != "",
		CVTextUsed:    cvTextUsed,
		Model:         h.model,
	})
}

func (h *Handler) InterviewCoach(c *gin.Context) {
	if h.chat == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "ai service is not configured"})
		return
	}

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	var req interviewCoachRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	jobOID, err := bson.ObjectIDFromHex(strings.TrimSpace(req.JobID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job_id"})
		return
	}

	targetApp, appErr := h.getApplicationForJob(c.Request.Context(), userID, jobOID)
	if appErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch applications"})
		return
	}
	if targetApp == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only coach for jobs you already applied"})
		return
	}

	jobDoc, err := h.jobRepo.FindByID(c.Request.Context(), req.JobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch job"})
		return
	}
	if jobDoc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	user, err := h.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch candidate profile"})
		return
	}

	cvURL := strings.TrimSpace(user.CvURL)
	if cvURL == "" {
		cvURL = strings.TrimSpace(targetApp.CvURL)
	}

	cvText, cvTextUsed := h.resolveCVText(c.Request.Context(), userID, user.CvText, cvURL)

	messages := buildPromptMessages(user, jobDoc, req.Message, req.History, cvURL, cvText)

	reply, err := h.chat.Complete(c.Request.Context(), messages)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "ai provider failed", "detail": err.Error()})
		return
	}

	reply = sanitizeAssistantReply(reply)

	c.JSON(http.StatusOK, interviewCoachResponse{
		Reply:      reply,
		JobID:      req.JobID,
		CVURL:      cvURL,
		CVReady:    cvURL != "",
		CVTextUsed: cvTextUsed,
		Model:      h.model,
	})
}

func (h *Handler) InterviewQuiz(c *gin.Context) {
	if h.chat == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "ai service is not configured"})
		return
	}

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	var req interviewQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	jobOID, err := bson.ObjectIDFromHex(strings.TrimSpace(req.JobID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job_id"})
		return
	}

	targetApp, appErr := h.getApplicationForJob(c.Request.Context(), userID, jobOID)
	if appErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch applications"})
		return
	}
	if targetApp == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only generate quiz for jobs you already applied"})
		return
	}

	jobDoc, err := h.jobRepo.FindByID(c.Request.Context(), req.JobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch job"})
		return
	}
	if jobDoc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	user, err := h.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch candidate profile"})
		return
	}

	cvURL := strings.TrimSpace(user.CvURL)
	if cvURL == "" {
		cvURL = strings.TrimSpace(targetApp.CvURL)
	}

	cvText, cvTextUsed := h.resolveCVText(c.Request.Context(), userID, user.CvText, cvURL)

	messages := buildInterviewQuizPromptMessages(user, jobDoc, req.QuestionCount, cvURL, cvText)
	reply, err := h.chat.Complete(c.Request.Context(), messages)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "ai provider failed", "detail": err.Error()})
		return
	}

	questions, err := parseInterviewQuizQuestions(reply, req.QuestionCount)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "ai provider returned invalid quiz", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, interviewQuizResponse{
		JobID:         req.JobID,
		QuestionCount: len(questions),
		Questions:     questions,
		CVURL:         cvURL,
		CVReady:       cvURL != "",
		CVTextUsed:    cvTextUsed,
		Model:         h.model,
	})
}

func currentUserID(c *gin.Context) (bson.ObjectID, bool) {
	rawID, exists := c.Get(auth.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	userIDHex, ok := rawID.(string)
	if !ok || userIDHex == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	userID, err := bson.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return bson.ObjectID{}, false
	}

	return userID, true
}

func (h *Handler) getApplicationForJob(ctx context.Context, userID, jobID bson.ObjectID) (*application.Application, error) {
	apps, err := h.appRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for i := range apps {
		if apps[i].JobID == jobID {
			return &apps[i], nil
		}
	}

	return nil, nil
}

func (h *Handler) resolveCVText(ctx context.Context, userID bson.ObjectID, cachedCVText string, cvURL string) (string, bool) {
	if strings.TrimSpace(cachedCVText) != "" {
		return cachedCVText, true
	}

	if cvURL == "" {
		return "", false
	}

	snippet, err := fetchTextSnippetFromURL(ctx, cvURL)
	if err != nil {
		return "", false
	}

	if len(snippet) < 120 {
		return "", false
	}

	if _, updateErr := h.userRepo.UpdateSelf(ctx, userID, auth.UserSelfUpdate{CvText: &snippet}); updateErr != nil {
		// no-op: request should continue even if cache update fails
	}

	return snippet, true
}

func fetchTextSnippetFromURL(ctx context.Context, rawURL string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode >= http.StatusBadRequest {
		return "", fmt.Errorf("cv fetch failed with status %d", res.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(res.Body, 8<<20))
	if err != nil {
		return "", err
	}

	text, err := extractTextFromDocument(rawURL, res.Header.Get("Content-Type"), body)
	if err != nil {
		return "", err
	}

	text = sanitizeText(text, 15000)
	if strings.TrimSpace(text) == "" {
		return "", fmt.Errorf("cv text was empty")
	}
	return text, nil
}

func extractTextFromDocument(rawURL, contentType string, body []byte) (string, error) {
	if len(body) == 0 {
		return "", fmt.Errorf("empty document")
	}

	if isPDFDocument(rawURL, contentType, body) {
		text, err := extractTextFromPDF(body)
		if err == nil && strings.TrimSpace(text) != "" {
			return text, nil
		}
	}

	return string(body), nil
}

func isPDFDocument(rawURL, contentType string, body []byte) bool {
	if strings.Contains(strings.ToLower(contentType), "pdf") {
		return true
	}

	ext := strings.ToLower(strings.TrimSpace(filepath.Ext(rawURL)))
	if ext == ".pdf" {
		return true
	}

	return len(body) >= 4 && string(body[:4]) == "%PDF"
}

func extractTextFromPDF(body []byte) (string, error) {
	reader, err := pdf.NewReader(bytes.NewReader(body), int64(len(body)))
	if err != nil {
		return "", err
	}

	plainReader, err := reader.GetPlainText()
	if err != nil {
		return "", err
	}

	data, err := io.ReadAll(io.LimitReader(plainReader, 4<<20))
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func sanitizeText(input string, maxLen int) string {
	if maxLen <= 0 {
		maxLen = 2000
	}

	var b strings.Builder
	for _, r := range input {
		if b.Len() >= maxLen {
			break
		}

		switch {
		case r == '\n' || r == '\t' || r == ' ':
			b.WriteRune(' ')
		case unicode.IsLetter(r), unicode.IsNumber(r), unicode.IsPunct(r):
			b.WriteRune(r)
		}
	}

	collapsed := strings.Join(strings.Fields(b.String()), " ")
	if len(collapsed) > maxLen {
		return collapsed[:maxLen]
	}
	return collapsed
}

func buildPromptMessages(user *auth.User, jobDoc *job.Job, question string, history []chatHistoryItem, cvURL, cvText string) []LLMMessage {
	systemPrompt := `Bạn là một nhà tuyển dụng senior trong lĩnh vực IT đang trực tiếp phỏng vấn ứng viên.

Nhiệm vụ:
- Dựa vào nội dung CV và toàn bộ yêu cầu job để đưa lời khuyên sát thực tế tuyển dụng.
- Đặt các câu hỏi phỏng vấn liên quan đúng lĩnh vực đang tuyển.
- Đưa mẫu câu trả lời tốt cho từng câu hỏi để ứng viên luyện tập.

	Quy tắc bắt buộc:
	- Chỉ dùng thông tin từ CV context, job context và lịch sử chat.
	- Không bịa thêm kinh nghiệm/dự án nếu dữ liệu không có.
	- Nếu thiếu dữ liệu, nêu rõ giả định ngắn gọn.
	- Luôn tham chiếu lịch sử chat để tránh lặp lại ý cũ và trả lời tiếp mạch hội thoại.
	- Trả lời trực tiếp, sát câu hỏi người dùng hiện tại; không tự ý chuyển sang format checklist dài nếu người dùng không yêu cầu.
	- Chỉ dùng bố cục nhiều mục (đánh giá/câu hỏi mẫu/lời khuyên...) khi người dùng yêu cầu rõ các nội dung đó.
	- Mặc định ngắn gọn, thực tế, tập trung đúng điểm người dùng hỏi.
	- Không dùng ký tự markdown định dạng như **, __, # trong câu trả lời.

	Ngôn ngữ: tiếng Việt, rõ ràng, súc tích, chuyên nghiệp. Không dùng markdown code block.`

	candidateProfile := strings.TrimSpace(fmt.Sprintf(
		"Ứng viên: %s\nEmail: %s\nHeadline: %s\nSĐT: %s\nThành phố: %s\nCV_URL: %s",
		user.FullName,
		user.Email,
		user.Headline,
		user.Phone,
		user.City,
		defaultIfEmpty(cvURL, "(chưa có)"),
	))

	jobContext := strings.TrimSpace(fmt.Sprintf(
		"Job đã ứng tuyển:\n- Vị trí: %s\n- Công ty: %s\n- Địa điểm: %s\n- Mức lương: %s\n- Loại hình: %s\n- Cấp độ: %s\n- Mô tả: %s\n- Toàn bộ yêu cầu (requirements):\n%s\n- Trách nhiệm chính:\n%s\n- Quyền lợi:\n%s\n- Tags: %s",
		jobDoc.Title,
		jobDoc.Company,
		jobDoc.Location,
		jobDoc.Salary,
		jobDoc.EmploymentType,
		jobDoc.ExperienceLevel,
		jobDoc.Description,
		numberedListOrFallback(jobDoc.Requirements, "(không có)"),
		numberedListOrFallback(jobDoc.Responsibilities, "(không có)"),
		numberedListOrFallback(jobDoc.Benefits, "(không có)"),
		joinOrFallback(jobDoc.Tags, "(không có)"),
	))

	cvContext := "Nội dung CV chưa đọc được tự động từ file, hãy dựa trên hồ sơ ứng viên + job để tư vấn, và nhắc người dùng bổ sung thông tin dự án nếu cần."
	if strings.TrimSpace(cvText) != "" {
		cvContext = "Trích đoạn CV (đã rút gọn): " + cvText
	}

	messages := []LLMMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: "[CONTEXT_CANDIDATE]\n" + candidateProfile},
		{Role: "user", Content: "[CONTEXT_JOB]\n" + jobContext},
		{Role: "user", Content: "[CONTEXT_CV]\n" + cvContext},
	}

	if len(history) > 20 {
		history = history[len(history)-20:]
	}

	for _, item := range history {
		role := strings.ToLower(strings.TrimSpace(item.Role))
		if role != "assistant" && role != "user" {
			continue
		}
		content := strings.TrimSpace(item.Content)
		if content == "" {
			continue
		}
		if len(content) > 2000 {
			content = content[:2000]
		}
		messages = append(messages, LLMMessage{Role: role, Content: content})
	}

	messages = append(messages, LLMMessage{Role: "user", Content: strings.TrimSpace(question)})
	return messages
}

func sanitizeAssistantReply(reply string) string {
	cleaned := strings.ReplaceAll(reply, "**", "")
	return strings.TrimSpace(cleaned)
}

func joinOrFallback(items []string, fallback string) string {
	if len(items) == 0 {
		return fallback
	}
	return strings.Join(items, "; ")
}

func numberedListOrFallback(items []string, fallback string) string {
	if len(items) == 0 {
		return fallback
	}

	lines := make([]string, 0, len(items))
	for i, item := range items {
		lines = append(lines, fmt.Sprintf("%d. %s", i+1, strings.TrimSpace(item)))
	}

	return strings.Join(lines, "\n")
}

func defaultIfEmpty(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func buildInterviewQuizPromptMessages(user *auth.User, jobDoc *job.Job, questionCount int, cvURL, cvText string) []LLMMessage {
	systemPrompt := `Bạn là chuyên gia tuyển dụng kỹ thuật IT tạo bộ quiz phỏng vấn theo JD.

Yêu cầu bắt buộc:
- Chỉ dùng dữ liệu từ CV context và JD context được cung cấp.
- Không bịa thông tin chưa có trong CV/JD.
- Tạo đúng số câu hỏi được yêu cầu.
- Mỗi câu có đúng 4 lựa chọn A, B, C, D.
- Chỉ có 1 đáp án đúng cho mỗi câu.
- Độ khó phải từ mức trung bình-khó đến khó (không hỏi quá cơ bản).
- Ưu tiên câu hỏi chuyên môn thực chiến: kiến trúc, debug, xử lý sự cố, tối ưu hiệu năng, bảo mật, CI/CD, trade-off kỹ thuật.
- Câu nhiễu (đáp án sai) phải hợp lý, gần đúng về mặt kỹ thuật, tránh đáp án sai quá lộ liễu.
- Tránh các câu chỉ hỏi nhớ lại thông tin hiển nhiên từ CV/JD theo kiểu nhận diện đơn giản.
- Bám sát stack trong JD và kinh nghiệm trong CV để cá nhân hóa câu hỏi.
- Trả kết quả ở dạng JSON hợp lệ duy nhất, không markdown, không giải thích ngoài JSON.

Schema JSON bắt buộc:
{
  "questions": [
    {
      "number": 1,
      "question": "...",
      "options": [
        {"label": "A", "text": "..."},
        {"label": "B", "text": "..."},
        {"label": "C", "text": "..."},
        {"label": "D", "text": "..."}
      ],
      "correct_answer": "A",
      "explanation": "..."
    }
  ]
}`

	candidateContext := strings.TrimSpace(fmt.Sprintf(
		"Ứng viên: %s\nEmail: %s\nHeadline: %s\nSĐT: %s\nThành phố: %s\nCV_URL: %s",
		user.FullName,
		user.Email,
		user.Headline,
		user.Phone,
		user.City,
		defaultIfEmpty(cvURL, "(chưa có)"),
	))

	jobContext := strings.TrimSpace(fmt.Sprintf(
		"JD:\n- Vị trí: %s\n- Công ty: %s\n- Địa điểm: %s\n- Mức lương: %s\n- Loại hình: %s\n- Cấp độ: %s\n- Mô tả: %s\n- Yêu cầu:\n%s\n- Trách nhiệm:\n%s\n- Quyền lợi:\n%s\n- Tags: %s",
		jobDoc.Title,
		jobDoc.Company,
		jobDoc.Location,
		jobDoc.Salary,
		jobDoc.EmploymentType,
		jobDoc.ExperienceLevel,
		jobDoc.Description,
		numberedListOrFallback(jobDoc.Requirements, "(không có)"),
		numberedListOrFallback(jobDoc.Responsibilities, "(không có)"),
		numberedListOrFallback(jobDoc.Benefits, "(không có)"),
		joinOrFallback(jobDoc.Tags, "(không có)"),
	))

	cvContext := "CV chưa đọc được tự động. Dựa trên profile + JD để tạo quiz, và ưu tiên câu hỏi bám kỹ năng cốt lõi của JD."
	if strings.TrimSpace(cvText) != "" {
		cvContext = "Trích đoạn CV (đã rút gọn): " + cvText
	}

	requestPrompt := fmt.Sprintf(
		"Tạo chính xác %d câu trắc nghiệm phỏng vấn theo schema JSON bắt buộc. Tỷ lệ mong muốn: 70%% câu chuyên sâu kỹ thuật thực chiến, 30%% câu tình huống áp dụng theo bối cảnh dự án. Ưu tiên độ khó phù hợp interview thật cho vị trí %s cấp độ %s.",
		questionCount,
		defaultIfEmpty(jobDoc.Title, "IT"),
		defaultIfEmpty(jobDoc.ExperienceLevel, "middle-senior"),
	)

	return []LLMMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: "[CANDIDATE]\n" + candidateContext},
		{Role: "user", Content: "[JOB]\n" + jobContext},
		{Role: "user", Content: "[CV]\n" + cvContext},
		{Role: "user", Content: requestPrompt},
	}
}

func buildHREvaluationPromptMessages(candidate *auth.User, jobDoc *job.Job, question, cvURL, cvText string) []LLMMessage {
	systemPrompt := `Bạn là chuyên gia tuyển dụng kỹ thuật IT hỗ trợ HR đánh giá hồ sơ ứng viên.

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
}`

	candidateContext := strings.TrimSpace(fmt.Sprintf(
		"Ứng viên: %s\nEmail: %s\nHeadline: %s\nSĐT: %s\nThành phố: %s\nCV_URL: %s",
		candidate.FullName,
		candidate.Email,
		candidate.Headline,
		candidate.Phone,
		candidate.City,
		defaultIfEmpty(cvURL, "(chưa có)"),
	))

	jobContext := strings.TrimSpace(fmt.Sprintf(
		"JD:\n- Vị trí: %s\n- Công ty: %s\n- Địa điểm: %s\n- Mức lương: %s\n- Loại hình: %s\n- Cấp độ: %s\n- Mô tả: %s\n- Yêu cầu:\n%s\n- Trách nhiệm:\n%s\n- Quyền lợi:\n%s\n- Tags: %s",
		jobDoc.Title,
		jobDoc.Company,
		jobDoc.Location,
		jobDoc.Salary,
		jobDoc.EmploymentType,
		jobDoc.ExperienceLevel,
		jobDoc.Description,
		numberedListOrFallback(jobDoc.Requirements, "(không có)"),
		numberedListOrFallback(jobDoc.Responsibilities, "(không có)"),
		numberedListOrFallback(jobDoc.Benefits, "(không có)"),
		joinOrFallback(jobDoc.Tags, "(không có)"),
	))

	cvContext := "CV chưa đọc được tự động. Dựa trên profile + JD để đánh giá và nêu rõ giới hạn dữ liệu."
	if strings.TrimSpace(cvText) != "" {
		cvContext = "Trích đoạn CV (đã rút gọn): " + cvText
	}

	return []LLMMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: "[CANDIDATE]\n" + candidateContext},
		{Role: "user", Content: "[JOB]\n" + jobContext},
		{Role: "user", Content: "[CV]\n" + cvContext},
		{Role: "user", Content: strings.TrimSpace(question)},
	}
}

func parseHRScoreAndNotes(raw string) (int, string) {
	type parsedFull struct {
		Score           int      `json:"score"`
		Summary         string   `json:"summary"`
		MatchingSkills  []string `json:"matching_skills"`
		Strengths       []string `json:"strengths"`
		Weaknesses      []string `json:"weaknesses"`
		Recommendations []string `json:"recommendations"`
	}

	trimmed := strings.TrimSpace(raw)
	if start := strings.Index(trimmed, "{"); start >= 0 {
		if end := strings.LastIndex(trimmed, "}"); end > start {
			candidateJSON := trimmed[start : end+1]
			var p parsedFull
			if err := json.Unmarshal([]byte(candidateJSON), &p); err == nil {
				// Only treat as rich JSON if at least one of the rich fields is present/non-empty
				if p.Summary != "" || len(p.MatchingSkills) > 0 || len(p.Strengths) > 0 || len(p.Weaknesses) > 0 || len(p.Recommendations) > 0 {
					notesMap := map[string]interface{}{
						"summary":         p.Summary,
						"matching_skills": p.MatchingSkills,
						"strengths":       p.Strengths,
						"weaknesses":      p.Weaknesses,
						"recommendations": p.Recommendations,
					}
					if notesBytes, err := json.Marshal(notesMap); err == nil {
						return clampScore(p.Score), string(notesBytes)
					}
				}
			}
		}
	}

	// Legacy parsing fallback
	type parsedLegacy struct {
		Score int    `json:"score"`
		Notes string `json:"notes"`
	}
	if start := strings.Index(trimmed, "{"); start >= 0 {
		if end := strings.LastIndex(trimmed, "}"); end > start {
			candidateJSON := trimmed[start : end+1]
			var p parsedLegacy
			if err := json.Unmarshal([]byte(candidateJSON), &p); err == nil {
				return clampScore(p.Score), strings.TrimSpace(p.Notes)
			}
		}
	}

	regex := regexp.MustCompile(`(?i)score\D{0,8}(\d{1,3})`)
	if m := regex.FindStringSubmatch(trimmed); len(m) == 2 {
		if n, err := strconv.Atoi(m[1]); err == nil {
			return clampScore(n), trimmed
		}
	}

	anyNum := regexp.MustCompile(`\b(\d{1,3})\b`)
	if m := anyNum.FindStringSubmatch(trimmed); len(m) == 2 {
		if n, err := strconv.Atoi(m[1]); err == nil {
			return clampScore(n), trimmed
		}
	}

	return 70, trimmed
}

func parseInterviewQuizQuestions(raw string, requestedCount int) ([]interviewQuizQuestion, error) {
	jsonCandidate := extractJSONObject(raw)
	if jsonCandidate != "" {
		questions, err := parseInterviewQuizQuestionsFromJSON(jsonCandidate, requestedCount)
		if err == nil {
			return questions, nil
		}

		repaired := repairQuizJSON(jsonCandidate)
		if repaired != jsonCandidate {
			questions, repairErr := parseInterviewQuizQuestionsFromJSON(repaired, requestedCount)
			if repairErr == nil {
				return questions, nil
			}
		}
	}

	questions, err := parseInterviewQuizQuestionsFromText(raw, requestedCount)
	if err == nil {
		return questions, nil
	}

	if jsonCandidate == "" {
		log.Printf("ERROR: Failed to parse interview quiz. Payload is not valid JSON. Raw Reply:\n%s", raw)
		return nil, fmt.Errorf("quiz payload is not valid json")
	}

	_, parseErr := parseInterviewQuizQuestionsFromJSON(jsonCandidate, requestedCount)
	log.Printf("ERROR: Failed to parse interview quiz. Error: %v. Raw Reply:\n%s", parseErr, raw)
	return nil, fmt.Errorf("cannot parse quiz json: %w", parseErr)
}

func parseInterviewQuizQuestionsFromJSON(rawJSON string, requestedCount int) ([]interviewQuizQuestion, error) {
	type payloadQuestion struct {
		Number        int                   `json:"number"`
		Question      string                `json:"question"`
		Options       []interviewQuizOption `json:"options"`
		CorrectAnswer string                `json:"correct_answer"`
		Explanation   string                `json:"explanation"`
	}

	type payload struct {
		Questions []payloadQuestion `json:"questions"`
	}

	var parsed payload
	if err := json.Unmarshal([]byte(rawJSON), &parsed); err != nil {
		return nil, fmt.Errorf("cannot parse quiz json: %w", err)
	}

	if len(parsed.Questions) == 0 {
		return nil, fmt.Errorf("quiz json does not contain any question")
	}

	normalized := make([]interviewQuizQuestion, 0, len(parsed.Questions))
	for _, q := range parsed.Questions {
		questionText := sanitizeAssistantReply(strings.TrimSpace(q.Question))
		if questionText == "" {
			continue
		}

		optionTexts := map[string]string{}
		for _, opt := range q.Options {
			label := strings.ToUpper(strings.TrimSpace(opt.Label))
			text := sanitizeAssistantReply(strings.TrimSpace(opt.Text))
			if text == "" {
				continue
			}
			if label != "A" && label != "B" && label != "C" && label != "D" {
				continue
			}
			if _, exists := optionTexts[label]; exists {
				continue
			}
			optionTexts[label] = text
		}

		if optionTexts["A"] == "" || optionTexts["B"] == "" || optionTexts["C"] == "" || optionTexts["D"] == "" {
			continue
		}

		correctAnswer := strings.ToUpper(strings.TrimSpace(q.CorrectAnswer))
		if correctAnswer != "A" && correctAnswer != "B" && correctAnswer != "C" && correctAnswer != "D" {
			continue
		}

		normalized = append(normalized, interviewQuizQuestion{
			Question: questionText,
			Options: []interviewQuizOption{
				{Label: "A", Text: optionTexts["A"]},
				{Label: "B", Text: optionTexts["B"]},
				{Label: "C", Text: optionTexts["C"]},
				{Label: "D", Text: optionTexts["D"]},
			},
			CorrectAnswer: correctAnswer,
			Explanation:   sanitizeAssistantReply(strings.TrimSpace(q.Explanation)),
		})
	}

	if len(normalized) == 0 {
		return nil, fmt.Errorf("quiz json has no valid question after normalization")
	}

	if requestedCount > 0 && len(normalized) > requestedCount {
		normalized = normalized[:requestedCount]
	}

	for i := range normalized {
		normalized[i].Number = i + 1
	}

	return normalized, nil
}

func repairQuizJSON(raw string) string {
	repaired := strings.TrimSpace(raw)
	if repaired == "" {
		return repaired
	}

	replacer := strings.NewReplacer(
		"\u201c", `"`,
		"\u201d", `"`,
		"\u2018", `'`,
		"\u2019", `'`,
	)
	repaired = replacer.Replace(repaired)

	for _, key := range []string{"questions", "number", "question", "options", "label", "text", "correct_answer", "explanation"} {
		repaired = strings.ReplaceAll(repaired, "'"+key+"'", `"`+key+`"`)
	}

	// 1. Fix missing comma between "correct_answer" and "explanation"
	correctAnswerComma := regexp.MustCompile(`(?s)("correct_answer"\s*:\s*("[ABCD]"|[ABCD]))\s*("explanation"\s*:)`)
	repaired = correctAnswerComma.ReplaceAllString(repaired, `$1, $3`)

	// 2. Fix unquoted correct_answer
	unquotedAnswer := regexp.MustCompile(`("correct_answer"\s*:\s*)([ABCD])(\s*[,}])`)
	repaired = unquotedAnswer.ReplaceAllString(repaired, `${1}"${2}"${3}`)

	quotedAnswerSingle := regexp.MustCompile(`("correct_answer"\s*:\s*)'([ABCD])'`)
	repaired = quotedAnswerSingle.ReplaceAllString(repaired, `${1}"${2}"`)

	// 3. Fix unquoted label
	unquotedLabel := regexp.MustCompile(`("label"\s*:\s*)([ABCD])(\s*[,}])`)
	repaired = unquotedLabel.ReplaceAllString(repaired, `${1}"${2}"${3}`)

	quotedLabelSingle := regexp.MustCompile(`("label"\s*:\s*)'([ABCD])'`)
	repaired = quotedLabelSingle.ReplaceAllString(repaired, `${1}"${2}"`)

	// 4. Fix missing comma between "label" and "text" inside options
	labelComma := regexp.MustCompile(`(?s)("label"\s*:\s*("[ABCD]"|[ABCD]))\s*("text"\s*:)`)
	repaired = labelComma.ReplaceAllString(repaired, `$1, $3`)

	// 5. Fix missing comma between adjacent objects (e.g. } { or } \n { )
	optionsComma := regexp.MustCompile(`(?s)\}\s*\{`)
	repaired = optionsComma.ReplaceAllString(repaired, `}, {`)

	// 6. Fix trailing commas before closing braces/brackets
	trailingComma := regexp.MustCompile(`,\s*([}\]])`)
	repaired = trailingComma.ReplaceAllString(repaired, `$1`)

	return repaired
}

func parseInterviewQuizQuestionsFromText(raw string, requestedCount int) ([]interviewQuizQuestion, error) {
	lines := strings.Split(strings.ReplaceAll(raw, "\r", ""), "\n")
	cleanLines := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			cleanLines = append(cleanLines, trimmed)
		}
	}

	if len(cleanLines) == 0 {
		return nil, fmt.Errorf("quiz text is empty")
	}

	answerSectionIdx := -1
	for i, line := range cleanLines {
		lowered := strings.ToLower(line)
		if strings.HasPrefix(lowered, "đáp án") || strings.HasPrefix(lowered, "dap an") || strings.HasPrefix(lowered, "answers") {
			answerSectionIdx = i
			break
		}
	}

	questionLines := cleanLines
	answerLines := []string{}
	if answerSectionIdx >= 0 {
		questionLines = cleanLines[:answerSectionIdx]
		answerLines = cleanLines[answerSectionIdx+1:]
	}

	questionsByNumber := map[int]*interviewQuizQuestion{}
	currentQuestion := 0

	questionRegex := regexp.MustCompile(`(?i)^c[âa]u\s*(\d+)\s*[:.)-]\s*(.+)$`)
	optionRegex := regexp.MustCompile(`(?i)^[-*]?\s*([ABCD])\s*[.)-:]\s*(.+)$`)
	inlineAnswerRegex := regexp.MustCompile(`(?i)^đ[áa]p\s*[áa]n\s*đ[úu]ng\s*[:：]\s*([ABCD])$`)

	for _, line := range questionLines {
		if m := questionRegex.FindStringSubmatch(line); len(m) == 3 {
			number, _ := strconv.Atoi(m[1])
			questionText := sanitizeAssistantReply(strings.TrimSpace(m[2]))
			if number > 0 && questionText != "" {
				questionsByNumber[number] = &interviewQuizQuestion{
					Number:   number,
					Question: questionText,
				}
				currentQuestion = number
			}
			continue
		}

		if m := optionRegex.FindStringSubmatch(line); len(m) == 3 && currentQuestion > 0 {
			question := questionsByNumber[currentQuestion]
			if question == nil {
				continue
			}
			label := strings.ToUpper(strings.TrimSpace(m[1]))
			text := sanitizeAssistantReply(strings.TrimSpace(m[2]))
			if text == "" {
				continue
			}

			duplicate := false
			for _, opt := range question.Options {
				if opt.Label == label {
					duplicate = true
					break
				}
			}
			if duplicate {
				continue
			}

			question.Options = append(question.Options, interviewQuizOption{Label: label, Text: text})
			continue
		}

		if m := inlineAnswerRegex.FindStringSubmatch(line); len(m) == 2 && currentQuestion > 0 {
			question := questionsByNumber[currentQuestion]
			if question != nil {
				question.CorrectAnswer = strings.ToUpper(strings.TrimSpace(m[1]))
			}
		}
	}

	answerRegex := regexp.MustCompile(`(?i)^c[âa]u\s*(\d+)\s*[:.)-]\s*([ABCD])\s*(?:[-:–]\s*(.+))?$`)
	for _, line := range answerLines {
		m := answerRegex.FindStringSubmatch(line)
		if len(m) != 4 {
			continue
		}

		number, _ := strconv.Atoi(m[1])
		question := questionsByNumber[number]
		if question == nil {
			continue
		}

		question.CorrectAnswer = strings.ToUpper(strings.TrimSpace(m[2]))
		explanation := sanitizeAssistantReply(strings.TrimSpace(m[3]))
		if explanation != "" {
			question.Explanation = explanation
		}
	}

	normalized := make([]interviewQuizQuestion, 0, len(questionsByNumber))
	orderedNumbers := make([]int, 0, len(questionsByNumber))
	for number := range questionsByNumber {
		orderedNumbers = append(orderedNumbers, number)
	}
	sort.Ints(orderedNumbers)

	for _, number := range orderedNumbers {
		question := questionsByNumber[number]
		if question.Question == "" || len(question.Options) < 4 {
			continue
		}
		if question.CorrectAnswer == "" {
			question.CorrectAnswer = "A"
		}

		normalized = append(normalized, interviewQuizQuestion{
			Number:        question.Number,
			Question:      question.Question,
			Options:       question.Options,
			CorrectAnswer: question.CorrectAnswer,
			Explanation:   question.Explanation,
		})
	}

	if len(normalized) == 0 {
		return nil, fmt.Errorf("cannot parse quiz from plain text")
	}

	if requestedCount > 0 && len(normalized) > requestedCount {
		normalized = normalized[:requestedCount]
	}

	for i := range normalized {
		normalized[i].Number = i + 1
	}

	return normalized, nil
}

func extractJSONObject(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}

	trimmed = strings.TrimPrefix(trimmed, "```json")
	trimmed = strings.TrimPrefix(trimmed, "```")
	trimmed = strings.TrimSuffix(trimmed, "```")
	trimmed = strings.TrimSpace(trimmed)

	if strings.HasPrefix(trimmed, "{") && strings.HasSuffix(trimmed, "}") {
		return trimmed
	}

	start := strings.Index(trimmed, "{")
	end := strings.LastIndex(trimmed, "}")
	if start >= 0 && end > start {
		return strings.TrimSpace(trimmed[start : end+1])
	}

	return ""
}

func clampScore(score int) int {
	if score < 0 {
		return 0
	}
	if score > 100 {
		return 100
	}
	return score
}
