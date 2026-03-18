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
