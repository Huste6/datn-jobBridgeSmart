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
go run ./cmd/api
```

Health check:
```bash
curl http://localhost:8080/health
```

## Environment variables
- `PORT` (default: `8080`)
- `GIN_MODE` (default: `debug`)
- `MONGODB_URI` (default/example in `.env.example`)
- `MONGODB_DB` (default/example in `.env.example`)
- `JWT_SECRET` (default/example in `.env.example`)
- `JWT_ISSUER` (default/example in `.env.example`)
- `ACCESS_TOKEN_TTL_MINUTES` (default/example in `.env.example`)

## Auth API (User)
- `POST /api/auth/register`
	- Request body: `{"email":"user@example.com","password":"secret123","full_name":"Nguyen Van A"}`
- `POST /api/auth/login`
	- Request body: `{"email":"user@example.com","password":"secret123"}`
- `GET /api/users/me`
	- Header: `Authorization: Bearer <access_token>`
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
- `backend-api` (Gin API): http://localhost:8080/health
- `frontend-web` (Vite React): http://localhost:5173

When files in `backend/*` or `frontend/*` change, Tilt will rebuild/restart the corresponding resource automatically and show status/logs in Tilt UI.

PowerShell health check (avoid curl prompt):
```powershell
Invoke-WebRequest http://localhost:8080/health -UseBasicParsing
```
