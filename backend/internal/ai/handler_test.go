package ai

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/job"
)

func TestExtractJSONObject_StripsCodeFenceAndNoise(t *testing.T) {
	raw := "prefix text\n```json\n{\"questions\":[]}\n```\ntrailing text"
	got := extractJSONObject(raw)
	want := "{\"questions\":[]}"
	if got != want {
		t.Fatalf("unexpected json extract: got %q, want %q", got, want)
	}
}

func TestParseInterviewQuizQuestions_ValidPayload(t *testing.T) {
	raw := `{
		"questions": [
			{
				"number": 1,
				"question": "What is CI/CD?",
				"options": [
					{"label":"A","text":"One"},
					{"label":"B","text":"Two"},
					{"label":"C","text":"Three"},
					{"label":"D","text":"Four"}
				],
				"correct_answer":"C",
				"explanation":"Short reason"
			},
			{
				"number": 2,
				"question": "What is Kubernetes?",
				"options": [
					{"label":"A","text":"Alpha"},
					{"label":"B","text":"Beta"},
					{"label":"C","text":"Gamma"},
					{"label":"D","text":"Delta"}
				],
				"correct_answer":"A"
			}
		]
	}`

	questions, err := parseInterviewQuizQuestions(raw, 2)
	if err != nil {
		t.Fatalf("parseInterviewQuizQuestions returned error: %v", err)
	}

	if len(questions) != 2 {
		t.Fatalf("unexpected question count: got %d, want %d", len(questions), 2)
	}
	if questions[0].Number != 1 || questions[1].Number != 2 {
		t.Fatalf("unexpected normalized numbers: %+v", questions)
	}
	if questions[0].CorrectAnswer != "C" {
		t.Fatalf("unexpected correct answer: got %q", questions[0].CorrectAnswer)
	}
	if len(questions[0].Options) != 4 {
		t.Fatalf("expected 4 options, got %d", len(questions[0].Options))
	}
}

func TestParseInterviewQuizQuestions_AllowFewerThanRequested(t *testing.T) {
	raw := `{"questions":[{"question":"Q1","options":[{"label":"A","text":"A1"},{"label":"B","text":"B1"},{"label":"C","text":"C1"},{"label":"D","text":"D1"}],"correct_answer":"A"}]}`
	questions, err := parseInterviewQuizQuestions(raw, 2)
	if err != nil {
		t.Fatalf("expected parser to return available questions, got error: %v", err)
	}
	if len(questions) != 1 {
		t.Fatalf("expected one parsed question, got %d", len(questions))
	}
}

func TestParseInterviewQuizQuestions_RepairsUnquotedAnswers(t *testing.T) {
	raw := `{
		"questions": [
			{
				"question": "Which one is right?",
				"options": [
					{"label":"A","text":"Option A"},
					{"label":"B","text":"Option B"},
					{"label":"C","text":"Option C"},
					{"label":"D","text":"Option D"}
				],
				"correct_answer": A
			}
		]
	}`

	questions, err := parseInterviewQuizQuestions(raw, 1)
	if err != nil {
		t.Fatalf("parseInterviewQuizQuestions returned error: %v", err)
	}
	if len(questions) != 1 {
		t.Fatalf("unexpected question count: got %d, want 1", len(questions))
	}
	if questions[0].CorrectAnswer != "A" {
		t.Fatalf("unexpected correct answer: got %q, want %q", questions[0].CorrectAnswer, "A")
	}
}

func TestParseInterviewQuizQuestions_FallbackPlainText(t *testing.T) {
	raw := `Câu 1: Câu hỏi chuyên môn
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D

Đáp án
Câu 1: C - Giải thích ngắn`

	questions, err := parseInterviewQuizQuestions(raw, 1)
	if err != nil {
		t.Fatalf("parseInterviewQuizQuestions returned error: %v", err)
	}
	if len(questions) != 1 {
		t.Fatalf("unexpected question count: got %d, want 1", len(questions))
	}
	if questions[0].Question == "" || len(questions[0].Options) != 4 {
		t.Fatalf("unexpected parsed question payload: %+v", questions[0])
	}
}

func TestBuildPromptMessages_TrimsHistoryToLast20(t *testing.T) {
	candidate := &auth.User{
		FullName: "Candidate",
		Email:    "candidate@example.com",
		Headline: "Backend Engineer",
		Phone:    "0901",
		City:     "Ha Noi",
	}
	jobDoc := &job.Job{
		Title:            "DevOps",
		Company:          "CloudNova",
		Location:         "Da Nang",
		Salary:           "20 - 30",
		EmploymentType:   "Full-time",
		ExperienceLevel:  "Senior",
		Description:      "desc",
		Requirements:     []string{"req1"},
		Responsibilities: []string{"resp1"},
		Benefits:         []string{"benefit1"},
		Tags:             []string{"Go"},
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	history := make([]chatHistoryItem, 0, 25)
	for i := 1; i <= 25; i++ {
		history = append(history, chatHistoryItem{Role: "user", Content: fmt.Sprintf("message-%d", i)})
	}

	messages := buildPromptMessages(candidate, jobDoc, "latest question", history, "", "")
	if len(messages) != 25 {
		t.Fatalf("unexpected message count: got %d, want %d", len(messages), 25)
	}

	if messages[4].Content != "message-6" {
		t.Fatalf("expected oldest retained history to be message-6, got %q", messages[4].Content)
	}
	if messages[len(messages)-1].Content != "latest question" {
		t.Fatalf("expected last message to be latest user question, got %q", messages[len(messages)-1].Content)
	}
}

func TestParseHRScoreAndNotes_ReadsJSONAndClampsScore(t *testing.T) {
	score, notes := parseHRScoreAndNotes(`{"score": 120, "notes": "good fit"}`)
	if score != 100 {
		t.Fatalf("expected clamped score 100, got %d", score)
	}
	if notes != "good fit" {
		t.Fatalf("unexpected notes: got %q", notes)
	}
}

func TestSanitizeAssistantReply_RemovesMarkdownMarkers(t *testing.T) {
	got := sanitizeAssistantReply(" **hello** ")
	if got != "hello" {
		t.Fatalf("unexpected sanitized reply: got %q", got)
	}
}

func TestBuildInterviewQuizPromptMessages_IncludesRequestedCount(t *testing.T) {
	candidate := &auth.User{FullName: "A", Email: "a@example.com"}
	jobDoc := &job.Job{Title: "DevOps", Company: "X"}
	messages := buildInterviewQuizPromptMessages(candidate, jobDoc, 7, "", "")
	if len(messages) == 0 {
		t.Fatal("expected non-empty prompt messages")
	}
	last := messages[len(messages)-1].Content
	if !strings.Contains(last, "7") {
		t.Fatalf("expected request message to include question count, got %q", last)
	}
}

func TestParseInterviewQuizQuestions_MalformedJSONWithLooseObjects(t *testing.T) {
	raw := `<quiz>
{
  "questions": [
    {
      "number": 8,
      "question": "Trong hệ thống gợi ý, bạn sử dụng model ranking dựa trên implicit feedback (view, click, apply). Để tránh bias do position effect (người dùng thường click vào vị trí đầu), bạn nên áp dụng kỹ thuật nào trong quá trình huấn luyện?",
      {
      "label": "A",
      "text": "Position bias correction bằng inverse propensity scoring (IPS)"
    },
      "options": [
        {"label": "A", "text": "Position bias correction bằng inverse propensity scoring (IPS)"},
        {"label": "B", "text": "Sử dụng trọng số sample theo số lần click"},
        {"label": "C", "text": "Lọc bỏ các mẫu có vị trí > 3 trong tập huấn luyện"},
        {"label": "D", "text": "Huấn luyện model trên tập data đã shuffle ngẫu nhiên vị trí"}
      ],
      "correct_answer": "A",
      "explanation": "IPS là phương pháp chuẩn để sửa position bias trong implicit feedback."
    }
  ]
}
</quiz>`

	questions, err := parseInterviewQuizQuestions(raw, 1)
	if err != nil {
		t.Fatalf("expected parser to parse loose/malformed JSON, got error: %v", err)
	}
	if len(questions) != 1 {
		t.Fatalf("expected 1 parsed question, got %d", len(questions))
	}
	q := questions[0]
	if q.Question == "" || !strings.Contains(q.Question, "Trong hệ thống gợi ý") {
		t.Fatalf("unexpected question text: %q", q.Question)
	}
	if len(q.Options) != 4 {
		t.Fatalf("expected 4 options, got %d", len(q.Options))
	}
	if q.Options[0].Text != "Position bias correction bằng inverse propensity scoring (IPS)" {
		t.Fatalf("unexpected Option A: %q", q.Options[0].Text)
	}
	if q.CorrectAnswer != "A" {
		t.Fatalf("unexpected correct answer: got %q, want A", q.CorrectAnswer)
	}
	if q.Explanation != "IPS là phương pháp chuẩn để sửa position bias trong implicit feedback." {
		t.Fatalf("unexpected explanation: got %q", q.Explanation)
	}
}

