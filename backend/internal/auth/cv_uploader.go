package auth

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type CvUploader struct {
	apiKey    string
	apiSecret string
	cloudName string
	folder    string
	http      *http.Client
}

func NewCvUploader(cloudinaryURL, folder string) (*CvUploader, error) {
	if strings.TrimSpace(cloudinaryURL) == "" {
		return nil, nil
	}

	u, err := url.Parse(cloudinaryURL)
	if err != nil {
		return nil, err
	}
	if u.Scheme != "cloudinary" {
		return nil, fmt.Errorf("invalid cloudinary url scheme")
	}

	apiKey := strings.TrimSpace(u.User.Username())
	apiSecret, _ := u.User.Password()
	cloudName := strings.TrimSpace(u.Host)
	if apiKey == "" || apiSecret == "" || cloudName == "" {
		return nil, fmt.Errorf("invalid cloudinary url credentials")
	}

	folder = strings.TrimSpace(folder)
	if folder == "" {
		folder = "jobbridge/cv"
	}

	return &CvUploader{
		apiKey:    apiKey,
		apiSecret: apiSecret,
		cloudName: cloudName,
		folder:    folder,
		http:      &http.Client{Timeout: 30 * time.Second},
	}, nil
}

func (u *CvUploader) Enabled() bool {
	return u != nil
}

func (u *CvUploader) UploadRaw(ctx context.Context, userID string, filename string, data []byte) (string, error) {
	timestamp := time.Now().Unix()
	publicID := fmt.Sprintf("cv_%s_%d", userID, timestamp)
	signature := u.sign(timestamp, publicID)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if err := writer.WriteField("api_key", u.apiKey); err != nil {
		return "", err
	}
	if err := writer.WriteField("timestamp", strconv.FormatInt(timestamp, 10)); err != nil {
		return "", err
	}
	if err := writer.WriteField("folder", u.folder); err != nil {
		return "", err
	}
	if err := writer.WriteField("public_id", publicID); err != nil {
		return "", err
	}
	if err := writer.WriteField("signature", signature); err != nil {
		return "", err
	}

	fileWriter, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := fileWriter.Write(data); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	uploadURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/raw/upload", u.cloudName)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := u.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var payload struct {
		SecureURL string `json:"secure_url"`
		Error     struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", err
	}

	if resp.StatusCode >= 400 {
		if payload.Error.Message != "" {
			return "", fmt.Errorf("%s", payload.Error.Message)
		}
		return "", fmt.Errorf("cloudinary upload failed")
	}

	if strings.TrimSpace(payload.SecureURL) == "" {
		return "", fmt.Errorf("cloudinary response missing secure_url")
	}

	return payload.SecureURL, nil
}

func (u *CvUploader) sign(timestamp int64, publicID string) string {
	base := fmt.Sprintf("folder=%s&public_id=%s&timestamp=%d%s", u.folder, publicID, timestamp, u.apiSecret)
	hash := sha1.Sum([]byte(base))
	return hex.EncodeToString(hash[:])
}
