package auth

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"unicode"

	pdf "github.com/ledongthuc/pdf"
)

func ExtractCVText(filename, contentType string, data []byte) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("empty cv file")
	}

	text, err := extractCVTextFromDocument(filename, contentType, data)
	if err != nil {
		return "", err
	}

	text = sanitizeCVText(text, 20000)
	if strings.TrimSpace(text) == "" {
		return "", fmt.Errorf("cv text was empty")
	}

	return text, nil
}

func extractCVTextFromDocument(filename, contentType string, body []byte) (string, error) {
	if isPDFCV(filename, contentType, body) {
		if text, err := extractTextFromPDF(body); err == nil && strings.TrimSpace(text) != "" {
			return text, nil
		}
	}

	return string(body), nil
}

func isPDFCV(filename, contentType string, body []byte) bool {
	if strings.Contains(strings.ToLower(contentType), "pdf") {
		return true
	}

	ext := strings.ToLower(strings.TrimSpace(filepath.Ext(filename)))
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

	data, err := io.ReadAll(io.LimitReader(plainReader, 6<<20))
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func sanitizeCVText(input string, maxLen int) string {
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
