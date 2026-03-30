package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

type LLMMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatClient interface {
	Complete(ctx context.Context, messages []LLMMessage) (string, error)
}

type OpenAIClient struct {
	apiKey     string
	baseURL    string
	model      string
	httpClient *http.Client
}

type chatCompletionRequest struct {
	Model       string       `json:"model"`
	Messages    []LLMMessage `json:"messages"`
	Temperature float64      `json:"temperature"`
	MaxTokens   *int         `json:"max_tokens,omitempty"`
}

type chatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content json.RawMessage `json:"content"`
		} `json:"message"`
		Text string `json:"text"`
	} `json:"choices"`
}

type providerError struct {
	Error interface{} `json:"error"`
}

func NewOpenAIClient(apiKey, baseURL, model string) *OpenAIClient {
	if strings.TrimSpace(apiKey) == "" {
		return nil
	}

	trimmedBase := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if trimmedBase == "" {
		trimmedBase = "https://api.openai.com/v1"
	}

	trimmedModel := strings.TrimSpace(model)
	if trimmedModel == "" {
		trimmedModel = "gpt-4o-mini"
	}

	return &OpenAIClient{
		apiKey:  apiKey,
		baseURL: trimmedBase,
		model:   trimmedModel,
		httpClient: &http.Client{
			Timeout: 75 * time.Second,
			Transport: &http.Transport{
				Proxy: http.ProxyFromEnvironment,
				DialContext: (&net.Dialer{
					Timeout:   15 * time.Second,
					KeepAlive: 30 * time.Second,
				}).DialContext,
				TLSHandshakeTimeout:   30 * time.Second,
				ResponseHeaderTimeout: 45 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			},
		},
	}
}

func (c *OpenAIClient) Model() string {
	if c == nil {
		return ""
	}
	return c.model
}

func (c *OpenAIClient) Complete(ctx context.Context, messages []LLMMessage) (string, error) {
	if c == nil {
		return "", fmt.Errorf("ai client not configured")
	}
	if len(messages) == 0 {
		return "", fmt.Errorf("messages cannot be empty")
	}

	payload := chatCompletionRequest{
		Model:       c.model,
		Messages:    messages,
		Temperature: 0.35,
		MaxTokens:   nil,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	endpoint := c.baseURL + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.doWithRetry(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	resBody, err := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	if err != nil {
		return "", err
	}

	if res.StatusCode >= http.StatusBadRequest {
		var providerErr providerError
		if err := json.Unmarshal(resBody, &providerErr); err == nil && providerErr.Error != nil {
			return "", fmt.Errorf("llm error (%d): %v", res.StatusCode, providerErr.Error)
		}
		return "", fmt.Errorf("llm error (%d): %s", res.StatusCode, strings.TrimSpace(string(resBody)))
	}

	var parsed chatCompletionResponse
	if err := json.Unmarshal(resBody, &parsed); err != nil {
		return "", err
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("llm returned no choices")
	}

	content := extractChoiceContent(parsed.Choices[0].Message.Content, parsed.Choices[0].Text)
	if content == "" {
		return "", fmt.Errorf("llm returned empty content")
	}

	return content, nil
}

func extractChoiceContent(rawContent json.RawMessage, fallbackText string) string {
	trimmedFallback := strings.TrimSpace(fallbackText)

	if len(rawContent) == 0 {
		return trimmedFallback
	}

	var asString string
	if err := json.Unmarshal(rawContent, &asString); err == nil {
		if strings.TrimSpace(asString) != "" {
			return strings.TrimSpace(asString)
		}
	}

	var parts []struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(rawContent, &parts); err == nil && len(parts) > 0 {
		chunks := make([]string, 0, len(parts))
		for _, p := range parts {
			if t := strings.TrimSpace(p.Text); t != "" {
				chunks = append(chunks, t)
			}
		}
		if len(chunks) > 0 {
			return strings.Join(chunks, "\n")
		}
	}

	var asObject struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(rawContent, &asObject); err == nil {
		if strings.TrimSpace(asObject.Text) != "" {
			return strings.TrimSpace(asObject.Text)
		}
	}

	return trimmedFallback
}

func (c *OpenAIClient) doWithRetry(req *http.Request) (*http.Response, error) {
	const maxAttempts = 3
	var lastErr error

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		clonedReq := req.Clone(req.Context())
		res, err := c.httpClient.Do(clonedReq)
		if err == nil {
			return res, nil
		}

		lastErr = err
		if !isTransientNetErr(err) || attempt == maxAttempts {
			break
		}

		select {
		case <-req.Context().Done():
			return nil, req.Context().Err()
		case <-time.After(time.Duration(attempt) * time.Second):
		}
	}

	return nil, lastErr
}

func isTransientNetErr(err error) bool {
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}

	var netErr net.Error
	if errors.As(err, &netErr) {
		return true
	}

	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "tls handshake timeout") ||
		strings.Contains(msg, "timeout") ||
		strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "temporary")
}
