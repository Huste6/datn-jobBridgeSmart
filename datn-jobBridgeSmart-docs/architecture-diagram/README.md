# JobBridge AI – Architecture Diagram Specification

> File này mô tả toàn bộ kiến trúc để nhờ AI/designer vẽ lại thành diagram ảnh.
> Kiến trúc dựa trên **Microsoft Azure** (không phải AWS).
> Tham khảo thêm: [network.md](network.md) và [resources.md](resources.md)

---

## Tổng quan layout diagram

Diagram được chia thành **4 khu vực chính** bố cục như sau:

```
┌─────────────────┬──────────────────────────────────────────┬──────────────────────┐
│                 │         AZURE VNET 10.0.0.0/16            │                      │
│  CI/CD PIPELINE │  ┌──────────────────────────────────────┐ │  AZURE PRIVATE       │
│  (GitHub        │  │       AKS CLUSTER                    │ │  SERVICES            │
│   Actions)      │  │  (Namespaces + Workloads)            │ │  + EXTERNAL SERVICES │
│                 │  └──────────────────────────────────────┘ │                      │
└─────────────────┴──────────────────────────────────────────┴──────────────────────┘
│                       OBSERVABILITY & MONITORING LAYER                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Khu vực 1 – CI/CD PIPELINE (cột trái)

**Màu nền:** Xám đậm hoặc xanh dương đậm  
**Border:** Nét đứt

### Các bước (flow từ trên xuống dưới):

```
GitHub Repository
        ↓
GitHub Actions (CI/CD)
  ├── Code Checkout
  ├── Build & Test (go test / npm test)
  ├── Docker Build (multi-stage)
  ├── Scan Image (Trivy – CVE)
  └── Push Image to ACR
        ↓
Azure Container Registry (ACR)
  [acrjobbridge.azurecr.io]
        ↓
  ┌─────────────────────────┐
  │  Update Helm Values     │
  │  values-azure-argocd.yaml│
  │  image.tag: sha-abc1234 │
  └─────────────────────────┘
        ↓
ArgoCD (GitOps)
  [Deploy to AKS]
```

**Mũi tên:** Liên tục (→), màu xanh lá  
**Icon:** GitHub logo, Docker whale, Helm logo, ArgoCD logo

---

## Khu vực 2 – AZURE VNET (khu vực trung tâm lớn nhất)

**Màu nền:** Xanh dương nhạt  
**Border:** Nét liền, màu xanh dương  
**Label:** `Azure VNet (AKS Managed)`

### 2.1 – Entry Points (phía trên VNet)

```
Users / Internet
      ↓
DuckDNS (Free DNS)
[jobbridge.duckdns.org]
      ↓
Azure Load Balancer (Standard)
[Port 80/443 Public IP]
      ↓
AKS NGINX Ingress Controller
```

### 2.2 – Flat Node Subnet

**Màu nền:** Cam nhạt  
**Label:** `AKS Subnet – flat namespace structure`

Chứa:
- **AKS Node Pool** (VM: Standard_B2s, managed by Azure)
- **NGINX Ingress Controller** – handles SSL termination (cert-manager) and path routing.
- **MongoDB StatefulSet** (chạy trong AKS data namespace, Persistent Volume = Azure Disk)

---

## Khu vực 3 – AKS CLUSTER (bên trong VNet, khung nổi bật)

**Màu nền:** Trắng hoặc xanh cực nhạt  
**Border:** Nét đứt cam, dày  
**Label:** `Azure Kubernetes Service – AKS (Managed by Azure)`

### 3.1 – System Add-ons (box nhỏ bên trái)

```
System Add-ons:
• Azure CNI (networking)
• CoreDNS
• NGINX Ingress Controller
• cert-manager (Let's Encrypt TLS)
• Azure Key Vault CSI Driver
• Cluster Autoscaler
• Metrics Server
```

### 3.2 – Workload Identity (box nhỏ giữa)

```
Azure AD Workload Identity
        ↓
  OIDC Provider → Managed Identity → Azure Services
                                     (Least Privilege)
```

### 3.3 – User Workloads (box lớn bên phải)

```
Auto Scaling Enabled (Min: 1, Max: 10)
```

### 3.4 – Namespaces (4 box trong User Workloads)

#### Namespace: frontend (màu xanh dương nhạt)
```
┌─────────────────────────────┐
│  Namespace: frontend        │
│                             │
│  Frontend Pod               │
│  (React + Nginx)    [HPA]   │
│                             │
│  Service (ClusterIP :80)    │
│                             │
│  Ingress                    │
│  (NGINX Ingress Controller) │
└─────────────────────────────┘
```

#### Namespace: backend (màu xanh lá nhạt)
```
┌─────────────────────────────┐
│  Namespace: backend         │
│                             │
│  API Gateway Pod    [HPA]   │
│  (Go / Gin :8080)           │
│                             │
│  Service (ClusterIP :8080)  │
└─────────────────────────────┘
```

#### Namespace: services (màu cam nhạt)
```
┌──────────────────────────────────┐
│  Namespace: services             │
│                                  │
│  Auth Service Pod  [HPA] :8081   │
│  Jobs Service Pod  [HPA] :8082   │
│  AI Service Pod    [HPA] :8085   │
│                                  │
│  Service (ClusterIP per pod)     │
└──────────────────────────────────┘
```

#### Namespace: data (màu tím nhạt)
```
┌─────────────────────────────┐
│  Namespace: data            │
│                             │
│  MongoDB StatefulSet        │
│  (mongo:7.0 :27017)         │
│                             │
│  PersistentVolume           │
│  (Azure Disk 5Gi)           │
└─────────────────────────────┘
```

### 3.5 – Internal Traffic

```
Internal Traffic:
Network Policies (Azure CNI) + TLS between services
```

---

## Khu vực 4 – AZURE PRIVATE SERVICES (cột phải)

**Màu nền:** Xám nhạt  
**Border:** Nét liền xám

### Azure Managed Services

```
Azure Container Registry (ACR)
[acrjobbridge.azurecr.io]
Image pull: AKS → ACR (AcrPull role)

Azure Key Vault
[kv-jobbridge]
Secrets: JWT_SECRET, OPENAI_API_KEY,
         CLOUDINARY_URL, ...
Access: AKS CSI Driver → mount to pods

Azure Blob Storage
[Terraform state backend]
Container: tfstate

Azure Monitor
[Metrics, Logs, Alerts]
```

### External Services (bên ngoài Azure, box riêng)

```
┌─────────────────────────────────────┐
│  EXTERNAL SERVICES                  │
│                                     │
│  Cloudinary CDN                     │
│  (Avatar upload, CV PDF upload)     │
│                                     │
│  OpenAI API                         │
│  (gpt-4o-mini – AI Features)        │
│  Interview Coach, Quiz, CV Eval     │
└─────────────────────────────────────┘
```

---

## Khu vực 5 – OBSERVABILITY & MONITORING (dải dưới cùng)

**Màu nền:** Xám đậm nhạt  
**Border:** Nét đứt

```
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Prometheus     │  │  Grafana         │  │  Azure Monitor   │  │  ArgoCD UI       │
│  (Metrics       │  │  (Dashboards)    │  │  (Logs & Alerts) │  │  (GitOps status) │
│   Collection)   │  │  grafana.        │  │                  │  │  argocd.         │
│                 │  │  jobbridge.      │  │                  │  │  jobbridge.      │
│                 │  │  duckdns.org     │  │                  │  │  duckdns.org     │
└─────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Các mũi tên và luồng dữ liệu

| Mũi tên | Từ | Đến | Màu | Kiểu |
|---------|-----|-----|-----|------|
| User traffic | Users/Internet | DuckDNS → App Gateway | Xanh lá đậm | Liền |
| HTTPS request | App Gateway | NGINX Ingress → Pods | Xanh lá đậm | Liền |
| API proxy | API Gateway | Auth/Jobs/AI services | Xanh dương | Liền |
| DB query | Services | MongoDB | Tím | Liền |
| AI call | AI Service | OpenAI API | Cam | Đứt |
| File upload | Auth Service | Cloudinary | Cam | Đứt |
| CI build | GitHub Actions | ACR | Xanh lá | Đứt |
| CD deploy | ArgoCD | AKS | Đỏ cam | Đứt |
| Secret fetch | AKS (CSI) | Azure Key Vault | Đỏ | Đứt |
| Image pull | AKS | ACR | Xanh dương | Đứt |
| Metrics | Pods | Prometheus → Grafana | Xám | Đứt |

---

## Bottom Summary Boxes (6 box hàng dưới cùng)

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  SECURITY        │ │  NETWORKING      │ │  RELIABILITY     │
│ • Azure RBAC     │ │ • Azure CNI      │ │ • HPA per service│
│ • Key Vault      │ │ • Standard LB    │ │ • PodDisruption  │
│   Secrets        │ │ • NGINX Ingress  │ │   Budget         │
│ • Non-root       │ │ • TLS cert-mgr   │ │ • Rolling Update │
│   containers     │ │ • Network Policy │ │ • MongoDB PVC    │
│ • Network Policy │ │                  │ │   (Azure Disk)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  COST OPT        │ │  DEVOPS          │ │  COMPLIANCE      │
│ • 1 node AKS     │ │ • GitOps ArgoCD  │ │ • Azure Policy   │
│ • Cluster        │ │ • IaC Terraform  │ │ • Azure Monitor  │
│   Autoscaler     │ │   (3 layers)     │ │   Audit Logs     │
│ • Distroless     │ │ • GitHub Actions │ │ • Trivy CVE scan │
│   images         │ │ • Trivy security │ │ • Non-root pods  │
│ • Basic ACR SKU  │ │   scanning       │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## Legend (góc phải dưới)

```
LEGEND:
──────────►  User Traffic (HTTPS)
- - - - - ►  Internal Traffic (ClusterIP)
·  ·  ·  ►  CI/CD Flow
── ── ── ►  Async / External API
```

---

## Màu sắc tổng thể

| Khu vực | Màu nền | Màu border |
|---------|---------|------------|
| CI/CD Pipeline | #1a1a2e (navy dark) | #4a90d9 |
| Azure VNet | #e8f4fd (blue very light) | #0078d4 (Azure blue) |
| Flat Node Subnet | #fff3e0 (orange light) | #ff9800 |
| AKS Cluster | #ffffff with #ff6f00 border | #ff6f00 (orange) |
| NS: frontend | #e3f2fd | #1976d2 |
| NS: backend | #e8f5e9 | #388e3c |
| NS: services | #fff8e1 | #f57c00 |
| NS: data | #f3e5f5 | #7b1fa2 |
| Private Services | #f5f5f5 | #757575 |
| External Services | #fce4ec | #c62828 |
| Observability | #263238 (dark) | #546e7a |
