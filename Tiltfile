# Local development orchestration for Go services in JobBridge AI.

watch_settings(ignore=[
  '**/.git/**',
  '**/node_modules/**',
])

# Backend API service (Gin)
local_resource(
  'backend-api',
  serve_cmd='cd backend && go run ./cmd/api',
  deps=[
    'backend/cmd',
    'backend/internal',
    'backend/go.mod',
    'backend/go.sum',
    'backend/.env.example',
  ],
  labels=['golang', 'backend'],
)

# Frontend web service (Vite + React)
local_resource(
  'frontend-web',
  serve_cmd='cd frontend && npm run dev -- --host 0.0.0.0 --port 5173',
  deps=[
    'frontend/src',
    'frontend/public',
    'frontend/index.html',
    'frontend/package.json',
    'frontend/package-lock.json',
    'frontend/vite.config.ts',
    'frontend/tsconfig.json',
    'frontend/tsconfig.app.json',
    'frontend/tsconfig.node.json',
  ],
  labels=['frontend', 'react'],
)
