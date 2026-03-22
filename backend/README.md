# Backend (Golang)

## Requirements
- Go 1.24+
- Docker or Podman (for local MongoDB)

## Run local database with Podman Compose (MongoDB)
From project root (`datn-jobBridge`):

```bash
podman compose up -d mongodb
```

Stop database:

```bash
podman compose down
```

If you prefer Docker:

```bash
docker compose up -d mongodb
docker compose down
```

Default local connection:
- Host: `localhost`
- Port: `27018`
- Database: `jobbridge`
- URI: `mongodb://127.0.0.1:27018/jobbridge`

## Run locally
```bash
go mod tidy
go run ./cmd/auth
go run ./cmd/jobs
go run ./cmd/gateway
```

Health check:
```bash
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8080/health
```

## Environment variables
- `GATEWAY_PORT` (default: `8080`)
- `AUTH_SERVICE_URL` (default: `http://localhost:8081`)
- `JOBS_SERVICE_URL` (default: `http://localhost:8082`)
- `AUTH_SERVICE_PORT` (default: `8081`)
- `JOBS_SERVICE_PORT` (default: `8082`)
- `PORT` (used by legacy `cmd/api`, default: `8080`)
- `GIN_MODE` (default: `debug`)
- `MONGODB_URI` (default/example in `.env.example`)
- `MONGODB_DB` (default/example in `.env.example`)
- `JWT_SECRET` (default/example in `.env.example`)
- `JWT_ISSUER` (default/example in `.env.example`)
- `ACCESS_TOKEN_TTL_MINUTES` (default/example in `.env.example`)
- `CLOUDINARY_URL` (for avatar upload)
- `CLOUDINARY_FOLDER` (default: `jobbridge/user`)
- Alternative to `CLOUDINARY_URL`:
	- `CLOUDINARY_CLOUD_NAME`
	- `CLOUDINARY_API_KEY`
	- `CLOUDINARY_API_SECRET`

## Auth API (User)
- `POST /api/auth/register`
	- Request body: `{"email":"user@example.com","password":"secret123","full_name":"Nguyen Van A"}`
- `POST /api/auth/login`
	- Request body: `{"email":"user@example.com","password":"secret123"}`
- `GET /api/users/me`
	- Header: `Authorization: Bearer <access_token>`
- `PATCH /api/users/me`
	- Header: `Authorization: Bearer <access_token>`
	- Request body (any subset): `{"full_name":"Nguyen Van A","phone":"0901234567","city":"Ha Noi","headline":"Backend Developer"}`
- `POST /api/users/me/avatar`
	- Header: `Authorization: Bearer <access_token>`
	- Content-Type: `multipart/form-data`
	- Field: `avatar=<file>`
	- Upload target folder: `jobbridge/user` (configurable via `CLOUDINARY_FOLDER`)
- `POST /api/users/me/onboarding`
	- Header: `Authorization: Bearer <access_token>`
	- Request body: `{"role":"recruiter","phone":"0901234567","city":"Ha Noi","headline":"Talent Acquisition lead"}`
	- `full_name` is optional. If omitted, backend keeps current full name.

## Run with Tilt (auto-reload)
Project root contains a `Tiltfile` configured for local orchestration.

1. Install Tilt (Windows):
	- PowerShell script (official):
	  - `iex ((new-object net.webclient).DownloadString('https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.ps1'))`
	  - binary path: `C:\Users\Admin\bin\tilt.exe`
	- `choco install tilt`
	- or `scoop install tilt`
2. From project root (`datn-jobBridge`), run:
	- `tilt up`
	- if Tilt is not on PATH: `C:\Users\Admin\bin\tilt.exe up`
3. Open Tilt UI:
	- http://localhost:10350

Tilt resources:
- `backend-auth` (Auth/User API): http://localhost:8081/health
- `backend-jobs` (Jobs API): http://localhost:8082/health
- `backend-gateway` (API Gateway): http://localhost:8080/health
- `frontend-web` (Vite React): http://localhost:5173

When files in `backend/*` or `frontend/*` change, Tilt will rebuild/restart the corresponding resource automatically and show status/logs in Tilt UI.

PowerShell health check (avoid curl prompt):
```powershell
Invoke-WebRequest http://localhost:8080/health -UseBasicParsing
```
