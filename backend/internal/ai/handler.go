package ai

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
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
	}
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

	cvText, cvTextUsed := h.resolveCVText(c.Request.Context(), cvURL)

	messages := buildPromptMessages(user, jobDoc, req.Message, nil, cvURL, cvText)

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

func (h *Handler) resolveCVText(ctx context.Context, cvURL string) (string, bool) {
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
- Không dùng ký tự markdown định dạng như **, __, # trong câu trả lời.

Format trả lời:
1) Đánh giá mức độ phù hợp CV vs job (điểm mạnh / điểm thiếu).
2) 3-5 câu hỏi phỏng vấn trọng tâm theo đúng vị trí.
3) Gợi ý câu trả lời mẫu chất lượng cao cho từng câu hỏi.
4) Lời khuyên cải thiện ngay trước buổi phỏng vấn.

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
