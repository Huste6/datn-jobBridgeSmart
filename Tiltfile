# Local development orchestration for Go services in JobBridge AI.

watch_settings(ignore=[
  '**/.git/**',
  '**/node_modules/**',
])

# MongoDB dependency (start existing Podman container)
local_resource(
  'mongodb',
  cmd='podman container exists jobbridge-mongodb && (podman start jobbridge-mongodb || echo jobbridge-mongodb already running)',
  allow_parallel=False,
  auto_init=True,
  labels=['database'],
)

# Backend auth service
local_resource(
  'backend-auth',
  serve_cmd='cd backend && go run ./cmd/auth',
  deps=[
    'backend/cmd',
    'backend/internal',
    'backend/go.mod',
    'backend/go.sum',
    'backend/.env.example',
  ],
  resource_deps=['mongodb'],
  labels=['golang', 'backend', 'auth'],
)

# Backend jobs service
local_resource(
  'backend-jobs',
  serve_cmd='cd backend && go run ./cmd/jobs',
  deps=[
    'backend/cmd',
    'backend/internal',
    'backend/go.mod',
    'backend/go.sum',
    'backend/.env.example',
  ],
  resource_deps=['mongodb'],
  labels=['golang', 'backend', 'jobs'],
)

# Backend API Gateway service
local_resource(
  'backend-gateway',
  serve_cmd='cd backend && go run ./cmd/gateway',
  deps=[
    'backend/cmd',
    'backend/internal',
    'backend/go.mod',
    'backend/go.sum',
    'backend/.env.example',
  ],
  resource_deps=['backend-auth', 'backend-jobs'],
  labels=['golang', 'backend', 'gateway'],
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
  resource_deps=['backend-gateway'],
  labels=['frontend', 'react'],
)
