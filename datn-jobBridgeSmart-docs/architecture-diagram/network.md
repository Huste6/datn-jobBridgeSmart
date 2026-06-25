# Network Architecture – JobBridge AI

> Mô tả chi tiết tầng network để vẽ diagram phần networking.

---

## Azure Virtual Network

```
Azure VNet (AKS Managed)
Name:    aks-vnet-xxx (auto-created in node Resource Group)
Region:  Malaysia West
```

---

## Subnet Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  Azure Managed VNet (aks-vnet-xxx)                                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  AKS Flat Node Subnet                                            │  │
│  │                                                                  │  │
│  │  • System Nodes & User Node Pool (Standard_B2s VMSS)              │  │
│  │  • NGINX Ingress Controller Pods (with Standard Load Balancer)    │  │
│  │  • Frontend & Backend Application Pods (namespaced)               │  │
│  │  • MongoDB StatefulSet Pod (namespace: data, PVC: Azure Disk)     │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Traffic Flow – Inbound (User → App)

```
Internet
   │
   ▼ DNS lookup: jobbridge.duckdns.org
DuckDNS (Free Dynamic DNS)
   │ Resolve → Azure Load Balancer Public IP
   ▼
Azure Load Balancer (AKS Standard Load Balancer)
   │
   ▼ Exposes port :80 & :443
AKS NGINX Ingress Controller
  ┌─────────────────────────────────────┐
  │  SSL Termination (cert-manager /    │
  │  Let's Encrypt SSL certificate)     │
  └─────────────────────────────────────┘
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
   ▼ via Standard Load Balancer Outbound Routing
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

The cluster network is secured using a single flat Azure Network Security Group (`aks-agentpool-xxx-nsg`) generated automatically by AKS on the node pool subnet:

| Direction | Protocol | Port | Source | Destination | Action | Description |
|-----------|----------|------|--------|-------------|--------|-------------|
| Inbound | TCP | 80, 443 | Any | Ingress controller | Allow | Exposes NGINX Ingress |
| Inbound | Any | Any | Internet | AKS nodes | Deny | Blocks direct access from internet |
| Outbound | Any | Any | AKS | Internet | Allow | Allowed outbound traffic |

Internal security and microservice isolation (blocking direct access to the database or private services) is enforced at the Kubernetes layer using **Network Policies** instead of subnet-level NSGs.

---

## DNS Configuration

```
DuckDNS records:
  jobbridge.duckdns.org        → Azure AKS Load Balancer Public IP
  grafana.jobbridge.duckdns.org → Azure AKS Load Balancer Public IP (path-routing)
  argocd.jobbridge.duckdns.org  → Azure AKS Load Balancer Public IP (path-routing)

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
[DuckDNS] ──resolve──► [Azure Load Balancer Public IP]
        │
        ▼
[Azure Load Balancer (Standard)]
        │
        ▼ (Port 80/443 inbound)
[NGINX Ingress Controller]   ← đặt trong AKS Cluster box (SSL termination)
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
          [MongoDB]          ← data namespace (AKS Persistent Volume)
```

**Đường mạng cần vẽ:**
- Liền nét xanh đậm = User traffic (HTTPS)
- Liền nét xanh nhạt = Internal ClusterIP traffic
- Đứt nét cam = Outbound external API (OpenAI, Cloudinary)
- Đứt nét đỏ = CI/CD flow (GitHub Actions → ACR → ArgoCD)
