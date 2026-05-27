# Azure Resources – JobBridge AI

> Mô tả chi tiết từng Azure resource để vẽ diagram phần resources.

---

## Resource Group

```
Name:     rg-jobbridge
Region:   Southeast Asia
Contains: Tất cả resources bên dưới
```

---

## Compute – AKS Cluster

```
┌─────────────────────────────────────────────────────────┐
│  Azure Kubernetes Service (AKS)                         │
│  Name: aks-jobbridge                                    │
│  K8s version: 1.29.x                                    │
│  Network plugin: Azure CNI                              │
│                                                         │
│  Node Pool: system                                      │
│  VM Size: Standard_B2s (2 vCPU, 4GB RAM)               │
│  Node count: 1 (auto-scale: 1–10)                       │
│  OS: Ubuntu Linux                                       │
│                                                         │
│  Features enabled:                                      │
│  ✓ Azure Key Vault CSI Secret Store                     │
│  ✓ Azure Workload Identity                              │
│  ✓ Cluster Autoscaler                                   │
│  ✓ Azure Monitor integration                            │
└─────────────────────────────────────────────────────────┘
```

**Kubernetes Workloads bên trong AKS:**

| Namespace | Workload | Image | Port | HPA |
|-----------|---------|-------|------|-----|
| `frontend` | frontend | jobbridge-frontend:sha-xxx | 80 | ✓ |
| `backend` | gateway | jobbridge-gateway:sha-xxx | 8080 | ✓ |
| `services` | auth | jobbridge-auth:sha-xxx | 8081 | ✓ |
| `services` | jobs | jobbridge-jobs:sha-xxx | 8082 | ✓ |
| `services` | ai | jobbridge-ai:sha-xxx | 8085 | ✓ |
| `data` | mongodb | mongo:7.0 | 27017 | ✗ |

---

## Container Registry – ACR

```
┌─────────────────────────────────────────┐
│  Azure Container Registry (ACR)         │
│  Name: acrjobbridge                     │
│  Login server: acrjobbridge.azurecr.io  │
│  SKU: Basic                             │
│  Admin: disabled (dùng RBAC)            │
│                                         │
│  Images:                                │
│  • jobbridge-auth:sha-{commit}          │
│  • jobbridge-jobs:sha-{commit}          │
│  • jobbridge-ai:sha-{commit}            │
│  • jobbridge-gateway:sha-{commit}       │
│  • jobbridge-frontend:sha-{commit}      │
│                                         │
│  AKS Role Assignment:                   │
│  AKS Kubelet Identity → AcrPull role    │
└─────────────────────────────────────────┘
```

---

## Secrets Management – Azure Key Vault

```
┌─────────────────────────────────────────┐
│  Azure Key Vault                        │
│  Name: kv-jobbridge                     │
│  SKU: Standard                          │
│                                         │
│  Secrets:                               │
│  ┌─────────────────────────────────┐    │
│  │  JWT-SECRET                     │    │
│  │  JWT-ISSUER                     │    │
│  │  ACCESS-TOKEN-TTL-MINUTES       │    │
│  │  OPENAI-API-KEY                 │    │
│  │  MODEL                          │    │
│  │  URL-BASE                       │    │
│  │  CLOUDINARY-URL                 │    │
│  │  CLOUDINARY-FOLDER              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Access Policies:                       │
│  • Terraform deployer: Get/Set/Delete   │
│  • AKS CSI Driver identity: Get/List    │
│                                         │
│  Mount path in pods:                    │
│  /mnt/secrets-store/<secret-name>       │
└─────────────────────────────────────────┘
```

---

## Storage – Azure Blob Storage

```
┌─────────────────────────────────────────┐
│  Azure Storage Account                  │
│  Name: satfjobbridge                    │
│  Purpose: Terraform state backend       │
│                                         │
│  Containers:                            │
│  • tfstate/                             │
│    ├── 01-foundation.tfstate            │
│    ├── 02-cluster.tfstate               │
│    └── 03-security.tfstate              │
│                                         │
│  Redundancy: LRS (Locally Redundant)    │
└─────────────────────────────────────────┘
```

---

## Networking Resources

```
┌─────────────────────────────────────────┐
│  Azure Application Gateway              │
│  SKU: WAF_v2                            │
│  Features:                              │
│  • HTTPS Listener (:443)                │
│  • HTTP → HTTPS redirect                │
│  • OWASP 3.2 WAF rules                  │
│  • Backend pool → AKS Ingress IP        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Azure NAT Gateway                      │
│  Attached to: Public Subnet             │
│  Purpose: Outbound internet for         │
│  private subnet pods (OpenAI,           │
│  Cloudinary API calls)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Azure Bastion                          │
│  Purpose: Secure SSH/RDP access         │
│  to AKS nodes without exposing          │
│  port 22 to internet                    │
└─────────────────────────────────────────┘
```

---

## Monitoring Resources

```
┌─────────────────────────────────────────┐
│  Prometheus (in-cluster)                │
│  Deployed via: kube-prometheus-stack    │
│  Scrapes: all pods /metrics endpoint    │
│  Retention: 15 days                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Grafana (in-cluster)                   │
│  URL: grafana.jobbridge.duckdns.org     │
│  Datasource: Prometheus                 │
│  Dashboards:                            │
│  • Kubernetes cluster overview          │
│  • Pod CPU/Memory usage                 │
│  • HTTP request rate per service        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Azure Monitor                          │
│  Container Insights: enabled            │
│  Log Analytics: AKS node logs           │
│  Alerts: node CPU > 80%, pod crash      │
└─────────────────────────────────────────┘
```

---

## Identity & Access Resources

```
┌─────────────────────────────────────────┐
│  Azure Managed Identity                 │
│  Type: User-assigned                    │
│  Used by: AKS Kubelet (ACR pull)        │
│           AKS CSI Driver (Key Vault)    │
│                                         │
│  Role Assignments:                      │
│  • AcrPull on ACR resource              │
│  • Key Vault Secrets User on KV         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Azure Service Principal                │
│  Used by: GitHub Actions CI/CD          │
│  Permissions:                           │
│  • Push images to ACR                   │
│  • Get AKS credentials                  │
│  • Terraform (Contributor on RG)        │
└─────────────────────────────────────────┘
```

---

## CI/CD Resources

```
┌─────────────────────────────────────────┐
│  GitHub Repository                      │
│  github.com/Huste6/datn-jobBridgeSmart  │
│                                         │
│  GitHub Actions Workflows:              │
│  • ci-build-scan-push.yml               │
│    Trigger: push backend/** frontend/** │
│  • deploy-aks.yml                       │
│    Trigger: after CI success            │
│  • azure-terraform-layers.yml           │
│    Trigger: manual / infra changes      │
│  • bootstrap-argocd.yml                 │
│    Trigger: manual (one-time)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ArgoCD (in-cluster)                    │
│  Namespace: argocd                      │
│  URL: argocd.jobbridge.duckdns.org      │
│                                         │
│  Application: jobbridge                 │
│  Source: GitHub repo (main branch)      │
│  Path: deploy/helm/jobbridge            │
│  Values: values-azure-argocd.yaml       │
│  Sync: Automated (self-heal + prune)    │
│  Target: namespace jobbridge on AKS     │
└─────────────────────────────────────────┘
```

---

## External Services (không phải Azure)

```
┌──────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                        │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Cloudinary CDN      │  │  OpenAI API              │  │
│  │                      │  │                          │  │
│  │  Used for:           │  │  Endpoint:               │  │
│  │  • Avatar images     │  │  api.openai.com/v1       │  │
│  │  • CV PDF files      │  │                          │  │
│  │                      │  │  Model: gpt-4o-mini      │  │
│  │  Folder structure:   │  │                          │  │
│  │  jobbridge/user/     │  │  Features:               │  │
│  │  jobbridge/cv/       │  │  • Interview Coach       │  │
│  │                      │  │  • Interview Quiz        │  │
│  │  Called by:          │  │  • HR CV Evaluation      │  │
│  │  Auth Service        │  │                          │  │
│  │  (upload on CV/      │  │  Called by:              │  │
│  │   avatar change)     │  │  AI Service only         │  │
│  └──────────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Resource Summary Table

| Resource | Azure Service | Name | SKU/Size |
|----------|--------------|------|---------|
| Kubernetes | AKS | aks-jobbridge | Standard_B2s × 1 |
| Container Registry | ACR | acrjobbridge | Basic |
| Secrets | Key Vault | kv-jobbridge | Standard |
| Terraform State | Blob Storage | satfjobbridge | LRS |
| Load Balancer | Application Gateway | agw-jobbridge | WAF_v2 |
| Outbound NAT | NAT Gateway | nat-jobbridge | Standard |
| Remote Access | Azure Bastion | bastion-jobbridge | Basic |
| Monitoring | Azure Monitor | (built-in AKS) | Free tier |
| Monitoring | Prometheus+Grafana | in-cluster | Open source |
| DNS | DuckDNS | jobbridge.duckdns.org | Free |
| File Storage | Cloudinary | external | Free/Paid |
| AI | OpenAI | external | Pay-per-use |

---

## Terraform Layers → Resources Mapping

```
Layer 01 – Foundation
  └── azurerm_resource_group     → rg-jobbridge
  └── azurerm_container_registry → acrjobbridge

Layer 02 – Cluster
  └── azurerm_kubernetes_cluster → aks-jobbridge
  └── azurerm_role_assignment    → AKS kubelet → AcrPull

Layer 03 – Security
  └── azurerm_key_vault          → kv-jobbridge
  └── azurerm_key_vault_secret   → JWT_SECRET, OPENAI_API_KEY, ...
  └── azurerm_key_vault_access_policy → deployer + AKS CSI
```
