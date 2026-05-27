# CI/CD & GitOps Pipeline

## Tổng quan

JobBridge AI dùng **GitHub Actions** cho CI/CD và **ArgoCD** cho GitOps deployment. Toàn bộ quy trình từ code push đến production xảy ra tự động, không cần tay.

```
Developer push code
       │
       ▼
GitHub Actions (CI)
  ├── Test backend
  ├── Test frontend
  ├── Build Docker images (Kaniko)
  ├── Scan images (Trivy)
  └── Push to ACR
       │
       ▼
GitHub Actions (CD)
  ├── Update image tags trong values-azure-argocd.yaml
  └── Commit & push to repo
       │
       ▼
ArgoCD (GitOps)
  ├── Detect thay đổi trong repo
  ├── helm upgrade jobbridge
  └── Rolling update trên AKS
```

---

## Workflow 1: CI Build + Scan + Push

**File:** `.github/workflows/ci-build-scan-push.yml`  
**Trigger:** Push lên branch `main`

### Các bước

```yaml
jobs:
  test-backend:
    - Checkout code
    - Setup Go 1.24
    - go test ./...
    - go vet ./...

  test-frontend:
    - Checkout code
    - Setup Node 22
    - npm ci
    - npm run build
    - npm run test

  build-and-push:
    needs: [test-backend, test-frontend]
    strategy:
      matrix:
        service: [auth, jobs, ai, gateway, frontend]
    steps:
      - Build Docker image với Kaniko
        # Kaniko build trong cluster, không cần Docker daemon
        # Tag: acrjobbridge.azurecr.io/jobbridge-{service}:sha-{commit}
      
      - Scan image với Trivy
        # CVE scan, fail nếu có HIGH/CRITICAL vulnerabilities
      
      - Push to ACR
        # acrjobbridge.azurecr.io/jobbridge-{service}:sha-abc1234
```

### Image tagging

```
acrjobbridge.azurecr.io/jobbridge-auth:sha-abc1234
acrjobbridge.azurecr.io/jobbridge-jobs:sha-abc1234
acrjobbridge.azurecr.io/jobbridge-ai:sha-abc1234
acrjobbridge.azurecr.io/jobbridge-gateway:sha-abc1234
acrjobbridge.azurecr.io/jobbridge-frontend:sha-abc1234
```

Mỗi build có tag duy nhất từ commit SHA → dễ rollback.

---

## Workflow 2: CD Deploy AKS

**File:** `.github/workflows/deploy-aks.yml`  
**Trigger:** Sau khi CI workflow thành công

### Các bước

```yaml
steps:
  - Checkout code
  
  - Extract image tags từ CI outputs
    # tags = "sha-abc1234"
  
  - Update values-azure-argocd.yaml:
    # services.auth.image.tag: sha-abc1234
    # services.jobs.image.tag: sha-abc1234
    # services.ai.image.tag: sha-abc1234
    # services.gateway.image.tag: sha-abc1234
    # services.frontend.image.tag: sha-abc1234
  
  - git config user.email "github-actions@github.com"
  - git add deploy/helm/jobbridge/values-azure-argocd.yaml
  - git commit -m "chore(cd): update argocd image tags to sha-abc1234 [skip ci]"
    # [skip ci] để không trigger lại CI
  - git push
```

Sau bước này, file `values-azure-argocd.yaml` trong repo đã được cập nhật.

---

## Workflow 3: Terraform Infrastructure

**File:** `.github/workflows/azure-terraform-layers.yml`  
**Trigger:** Manual (`workflow_dispatch`) hoặc push vào `deploy/terraforms/**`

### Các bước

```yaml
steps:
  - Azure login (Service Principal hoặc OIDC)
  - Setup Terraform
  - Layer 01 Foundation:
      terraform init
      terraform plan -out=plan01
      terraform apply plan01
  - Layer 02 Cluster:
      terraform init
      terraform plan -out=plan02
      terraform apply plan02
  - Layer 03 Security:
      terraform init
      terraform plan -out=plan03
      terraform apply plan03
```

---

## Workflow 4: Bootstrap ArgoCD

**File:** `.github/workflows/bootstrap-argocd.yml`  
**Trigger:** Manual (chạy một lần khi setup cluster mới)

### Các bước

```bash
# 1. Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.x.x/cert-manager.yaml

# 2. Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/.../argocd-install.yaml

# 3. Apply ArgoCD configs
kubectl apply -f deploy/argocd/argocd-cmd-params-cm.yaml
kubectl apply -f deploy/argocd/argocd-server-ingress.yaml

# 4. Create ArgoCD Application
kubectl apply -f deploy/argocd/jobbridge-application.yaml
```

---

## ArgoCD GitOps

**Config:** `deploy/argocd/`

### jobbridge-application.yaml

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: jobbridge
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Huste6/datn-jobBridgeSmart.git
    targetRevision: main
    path: deploy/helm/jobbridge
    helm:
      valueFiles:
        - values-azure-argocd.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: jobbridge
  syncPolicy:
    automated:
      prune: true      # Xóa resources không còn trong chart
      selfHeal: true   # Tự sửa nếu ai thay đổi cluster trực tiếp
    syncOptions:
      - CreateNamespace=true
```

### Cách ArgoCD hoạt động

```
1. ArgoCD watch repo https://github.com/Huste6/datn-jobBridgeSmart
2. Mỗi 3 phút (hoặc khi có webhook), check thay đổi
3. Khi values-azure-argocd.yaml thay đổi:
   - ArgoCD phát hiện "out of sync"
   - Chạy: helm template + kubectl apply
   - Rolling update pods với image tag mới
4. Report sync status trên ArgoCD UI
```

### ArgoCD UI

Truy cập: `https://argocd.jobbridge.duckdns.org`

Cho phép:
- Xem sync status của từng application
- Xem resource tree (Deployment, Service, Pod, etc.)
- Manual sync/rollback
- Xem deployment history

---

## Zero-Downtime Deployment

Rolling update strategy được cấu hình trong Helm chart:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0    # Không có pod nào bị down trong quá trình update
    maxSurge: 1          # Tạo thêm 1 pod mới trước khi xóa pod cũ
```

Kết hợp với PodDisruptionBudget:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
spec:
  minAvailable: 1   # Ít nhất 1 pod phải available
```

---

## GitHub Secrets cần thiết

Để CI/CD chạy, cần cấu hình secrets trong GitHub repository:

| Secret | Mô tả |
|--------|-------|
| `AZURE_CREDENTIALS` | Service Principal JSON để login Azure |
| `ACR_LOGIN_SERVER` | URL của ACR (VD: `acrjobbridge.azurecr.io`) |
| `ACR_USERNAME` | ACR username |
| `ACR_PASSWORD` | ACR password hoặc token |
| `KUBE_CONFIG` | Base64-encoded kubeconfig |

---

## Toàn bộ Flow từ Code đến Production

```
Developer
  git push origin main
  │
  ▼
GitHub Actions: ci-build-scan-push
  ├── go test  ✓
  ├── npm test ✓
  ├── docker build → acrjobbridge.azurecr.io/jobbridge-*:sha-abc1234 ✓
  ├── trivy scan ✓
  └── docker push ✓
  │
  ▼
GitHub Actions: deploy-aks
  ├── Update values-azure-argocd.yaml
  │     services.*.image.tag: sha-abc1234
  └── git commit "chore(cd): update argocd image tags [skip ci]"
  │
  ▼
GitHub repo (values-azure-argocd.yaml đã thay đổi)
  │
  ▼
ArgoCD (phát hiện thay đổi sau polling)
  ├── helm upgrade jobbridge --values values-azure-argocd.yaml
  └── Rolling update pods trên AKS
  │
  ▼
AKS Production
  └── Pods mới với image sha-abc1234 đang chạy
      Zero downtime ✓

Tổng thời gian: ~5-10 phút từ push đến production
```

---

## Local ArgoCD Bootstrap

```bash
chmod +x deploy/scripts/bootstrap-argocd.sh
./deploy/scripts/bootstrap-argocd.sh
```

Script thực hiện toàn bộ setup ArgoCD cho cluster mới.

---

## SonarQube Code Quality

Dự án có cấu hình SonarQube tại `sonar-project.properties`:

```properties
sonar.projectKey=jobbridge
sonar.projectName=JobBridge AI
sonar.sources=backend,frontend/src
sonar.tests=backend/tests,frontend/src
```

Chạy scan (nếu có SonarQube server):

```bash
sonar-scanner
```
