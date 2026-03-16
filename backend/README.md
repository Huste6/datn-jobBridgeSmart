# Backend (Golang)

## Requirements
- Go 1.24+

## Run locally
```bash
go mod tidy
go run ./cmd/api
```

Health check:
```bash
curl http://localhost:8080/health
```

## Environment variables
- `PORT` (default: `8080`)
- `GIN_MODE` (default: `debug`)
