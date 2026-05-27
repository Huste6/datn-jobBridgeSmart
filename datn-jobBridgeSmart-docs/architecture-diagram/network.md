# Network Architecture – JobBridge AI

> Mô tả chi tiết tầng network để vẽ diagram phần networking.

---

## Azure Virtual Network

```
Azure VNet
Name:    vnet-jobbridge
CIDR:    10.0.0.0/16
Region:  Southeast Asia (Singapore)
```

---

## Subnet Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  Azure VNet: 10.0.0.0/16                                               │
│                                                                        │
│  ┌─────────────────────────────┐                                       │
│  │  Public Subnet              │                                       │
│  │  10.0.1.0/24 – AZ-1        │                                       │
│  │                             │                                       │
│  │  ┌──────────────┐           │                                       │
│  │  │ NAT Gateway  │           │  ← Outbound internet cho private      │
│  │  └──────────────┘           │                                       │
│  │  ┌──────────────┐           │                                       │
│  │  │Azure Bastion │           │  ← SSH/RDP an toàn, không expose 22  │
│  │  └──────────────┘           │                                       │
│  │  ┌──────────────────────┐   │                                       │
│  │  │ Application Gateway  │   │  ← Entry point HTTPS:443 + WAF       │
│  │  │ (WAF v2)             │   │                                       │
│  │  └──────────────────────┘   │                                       │
│  └─────────────────────────────┘                                       │
│                                                                        │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐     │
│  │  Private Subnet – AZ-1      │  │  Private Subnet – AZ-2      │     │
│  │  10.0.2.0/24                │  │  10.0.3.0/24                │     │
│  │                             │  │                             │     │
│  │  AKS Node Pool              │  │  AKS Node Pool              │     │
│  │  (System nodes)             │  │  (User nodes – scale out)   │     │
│  └─────────────────────────────┘  └─────────────────────────────┘     │
│                                                                        │
│  ┌─────────────────────────────┐                                       │
│  │  Database Subnet (private)  │                                       │
│  │  10.0.4.0/24                │                                       │
│  │                             │                                       │
│  │  MongoDB StatefulSet        │  ← Chỉ AKS services mới reach được   │
│  │  (in-cluster, PVC: 5Gi)     │                                       │
│  └─────────────────────────────┘                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Traffic Flow – Inbound (User → App)

```
Internet
   │
   ▼ DNS lookup: jobbridge.duckdns.org
DuckDNS (Free Dynamic DNS)
   │ Resolve → Azure Public IP
   ▼
Azure Application Gateway
  ┌─────────────────────────────────────┐
  │  WAF v2 (OWASP rules)               │
  │  Listener: HTTPS :443               │
  │  SSL Certificate (cert-manager /    │
  │  Let's Encrypt hoặc Azure cert)     │
  └─────────────────────────────────────┘
   │
   ▼ Route to backend pool
AKS Ingress (NGINX Ingress Controller)
   │
   ├── /          → frontend-svc:80   (React App)
   └── /api/*     → gateway-svc:8080  (API Gateway)
```

---

## Traffic Flow – Internal (Service to Service)

```
API Gateway :8080
   │
   ├── /api/auth/*     → auth-svc:8081   (ClusterIP)
   ├── /api/users/*    → auth-svc:8081
   ├── /api/hr/*       → auth-svc:8081
   ├── /api/admin/*    → auth-svc:8081
   ├── /api/public/*   → auth-svc:8081
   ├── /api/jobs/*     → jobs-svc:8082   (ClusterIP)
   ├── /api/applications/* → jobs-svc:8082
   └── /api/ai/*       → ai-svc:8085    (ClusterIP)

Services → MongoDB
   auth-svc  ──┐
   jobs-svc  ──┼──► mongodb-svc:27017 (ClusterIP, Headless)
   ai-svc    ──┘
```

---

## Traffic Flow – Outbound (App → External)

```
AKS Pods
   │
   ▼ via NAT Gateway (10.0.1.x)
Internet
   ├──► OpenAI API (api.openai.com:443)
   │    AI Service → gpt-4o-mini
   │
   ├──► Cloudinary CDN (api.cloudinary.com:443)
   │    Auth Service → upload avatar / CV PDF
   │
   └──► GitHub (api.github.com)
        ArgoCD → watch repository changes
```

---

## Network Security Groups (NSG)

### Public Subnet NSG

| Direction | Protocol | Port | Source | Destination | Action |
|-----------|----------|------|--------|-------------|--------|
| Inbound | TCP | 443 | Any | App Gateway | Allow |
| Inbound | TCP | 80 | Any | App Gateway | Allow (redirect → 443) |
| Inbound | TCP | 22 | Any | Any | Deny |
| Outbound | Any | Any | Any | VNet | Allow |

### Private Subnet NSG (AKS)

| Direction | Protocol | Port | Source | Destination | Action |
|-----------|----------|------|--------|-------------|--------|
| Inbound | TCP | 8080-8085 | App Gateway | AKS pods | Allow |
| Inbound | TCP | 443 | AKS | AKS | Allow (internal) |
| Outbound | TCP | 443 | AKS | Internet | Allow (via NAT) |
| Outbound | TCP | 27017 | AKS services | MongoDB | Allow |
| Inbound | Any | Any | Internet | AKS | Deny |

### Database Subnet NSG

| Direction | Protocol | Port | Source | Destination | Action |
|-----------|----------|------|--------|-------------|--------|
| Inbound | TCP | 27017 | Private Subnet | MongoDB | Allow |
| Inbound | Any | Any | Any other | MongoDB | Deny |
| Outbound | Any | Any | MongoDB | Private Subnet | Allow |

---

## DNS Configuration

```
DuckDNS records:
  jobbridge.duckdns.org        → Azure App Gateway Public IP
  grafana.jobbridge.duckdns.org → Azure App Gateway Public IP (path-based)
  argocd.jobbridge.duckdns.org  → Azure App Gateway Public IP (path-based)

Kubernetes Internal DNS (CoreDNS):
  auth-svc.services.svc.cluster.local      → 10.x.x.x (ClusterIP)
  jobs-svc.services.svc.cluster.local      → 10.x.x.x
  ai-svc.services.svc.cluster.local        → 10.x.x.x
  mongodb-svc.data.svc.cluster.local       → 10.x.x.x
  gateway-svc.backend.svc.cluster.local    → 10.x.x.x
  frontend-svc.frontend.svc.cluster.local  → 10.x.x.x
```

---

## TLS / Certificate Management

```
cert-manager (trong AKS)
   │
   ▼ ACME HTTP-01 challenge
Let's Encrypt
   │
   ▼ Issue wildcard cert
TLS Secret: jobbridge-tls
   │
   ▼ Mount vào Ingress
NGINX Ingress → HTTPS termination
```

---

## Network Policies (Kubernetes)

```yaml
# Chỉ services namespace được kết nối tới data namespace
NetworkPolicy:
  - From: namespace=services → To: namespace=data, port=27017
  - From: namespace=backend  → To: namespace=services, port=8081-8085
  - From: ingress-nginx      → To: namespace=frontend, port=80
  - From: ingress-nginx      → To: namespace=backend, port=8080
  - Default: Deny all ingress/egress không match
```

---

## Diagram vẽ network (hướng dẫn cho designer)

**Bố cục từ trên xuống:**

```
[Internet / Users]
        │ HTTPS
        ▼
[DuckDNS] ──resolve──► [Azure Public IP]
        │
        ▼
[Azure Application Gateway]  ← đặt ở Public Subnet box
  WAF v2 | SSL Termination
        │
        ▼ (qua Internet Gateway)
[NGINX Ingress Controller]   ← đặt trong AKS Cluster box
        │
   ┌────┴────┐
   ▼         ▼
[Frontend]  [Gateway]  ← 2 namespace box
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
  [Auth]   [Jobs]    [AI]    ← services namespace
    │         │         │
    └─────────┼─────────┘
              ▼
          [MongoDB]          ← data namespace, database subnet
```

**Đường mạng cần vẽ:**
- Liền nét xanh đậm = User traffic (HTTPS)
- Liền nét xanh nhạt = Internal ClusterIP traffic
- Đứt nét cam = Outbound external API (OpenAI, Cloudinary)
- Đứt nét đỏ = CI/CD flow (GitHub Actions → ACR → ArgoCD)
