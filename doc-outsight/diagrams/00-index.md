# Index — AWS Architecture Diagrams (JobBridge AI)

> Gen ảnh tại: https://mermaid.live — copy block ```mermaid ... ``` vào editor → Export PNG/SVG

---

## 🌐 Network Layer (01–05)

| # | File | Nội dung |
|---|---|---|
| 01 | [01-network-topology.md](01-network-topology.md) | VPC tổng quan: subnet, IGW, NAT, ALB, EKS, RDS |
| 02 | [02-routing-tables.md](02-routing-tables.md) | Route table của public / private / database subnet |
| 03 | [03-security-groups.md](03-security-groups.md) | SG rules cho ALB, EKS nodes, RDS, Bastion |
| 04 | [04-nacls.md](04-nacls.md) | NACL inbound/outbound rules theo subnet |
| 05 | [05-internal-traffic-mtls.md](05-internal-traffic-mtls.md) | mTLS + Calico giữa các service trong EKS |

---

## ☁️ Resources Layer (06–11)

| # | File | Nội dung |
|---|---|---|
| 06 | [06-request-flow-e2e.md](06-request-flow-e2e.md) | Luồng request end-to-end: User → Route53 → ALB → EKS → RDS |
| 07 | [07-cicd-pipeline.md](07-cicd-pipeline.md) | CI/CD: GitHub Actions → ECR → Argo CD → EKS |
| 08 | [08-serverless-messaging.md](08-serverless-messaging.md) | Email / Event / Async Job / Alarm: SNS, SQS, Lambda, SES |
| 09 | [09-eks-addons-autoscaling.md](09-eks-addons-autoscaling.md) | EKS Add-ons, IRSA, HPA, Cluster Autoscaler |
| 10 | [10-observability.md](10-observability.md) | CloudWatch, OTEL, X-Ray, OpenSearch, Grafana, Kibana |
| 11 | [11-private-services.md](11-private-services.md) | ECR, Secrets Manager, SSM, S3, CloudWatch |

---

## 🔐 IAM / Security Layer (12–23)

| # | File | Nội dung |
|---|---|---|
| 12 | [12-iam-hierarchy.md](12-iam-hierarchy.md) | Cây phân cấp Root → Groups → IRSA Roles |
| 13 | [13-iam-devops.md](13-iam-devops.md) | DevOps Team — full infra, giới hạn IAM write |
| 14 | [14-iam-backend.md](14-iam-backend.md) | Backend Team — namespace backend/services, dev only |
| 15 | [15-iam-frontend.md](15-iam-frontend.md) | Frontend Team — namespace frontend only |
| 16 | [16-iam-data.md](16-iam-data.md) | Data Team — RDS full (dev), read+snapshot (prod) |
| 17 | [17-iam-security.md](17-iam-security.md) | Security Team — read-all + WAF + GuardDuty + IAM |
| 18 | [18-iam-aiml.md](18-iam-aiml.md) | AI/ML Team — ai-service namespace + model artifacts |
| 19 | [19-iam-management.md](19-iam-management.md) | Management — billing read-only only |
| 20 | [20-irsa-service-accounts.md](20-irsa-service-accounts.md) | IRSA roles cho từng pod (least privilege per pod) |
| 21 | [21-permission-boundaries.md](21-permission-boundaries.md) | Permission Boundaries — chặn privilege escalation |
| 22 | [22-scp-organization.md](22-scp-organization.md) | SCP Organization-level guardrails (prod / dev / shared) |
| 23 | [23-cognito-auth.md](23-cognito-auth.md) | Cognito: User Pool, JWT flow, Lambda triggers, Social login |

---

## Cách gen ảnh nhanh

**Online (mermaid.live):**
1. Mở file `.md` → copy block ` ```mermaid ... ``` `
2. Paste vào https://mermaid.live
3. Export → PNG hoặc SVG

**CLI (batch export):**
```bash
# Cài mmdc
npm install -g @mermaid-js/mermaid-cli

# Export từng file (chạy trong thư mục diagrams/)
for f in *.md; do mmdc -i "$f" -o "${f%.md}.png"; done
```
