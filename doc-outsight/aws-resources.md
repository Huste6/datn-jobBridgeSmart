# AWS Resources — JobBridge AI

> Region: **us-east-1** | Cluster: **Amazon EKS (Managed)**

---

## Danh sách tài nguyên tổng quan

| Nhóm | Service | Mục đích |
|---|---|---|
| Compute | Amazon EKS | Chạy toàn bộ workload container |
| Database | Amazon RDS (PostgreSQL) | Lưu trữ dữ liệu chính |
| Container Registry | Amazon ECR | Private Docker image registry |
| Load Balancing | Application Load Balancer | HTTPS ingress, SSL termination |
| DNS | Amazon Route 53 | DNS routing cho domain |
| Security | AWS WAF | Web Application Firewall |
| Secrets | AWS Secrets Manager | Database credentials, API keys |
| Config | AWS Systems Manager (Parameter Store) | App configuration, feature flags |
| Storage | Amazon S3 | Helm chart repo, backups |
| Messaging | Amazon SNS | Event notifications, email topics |
| Queue | Amazon SQS | Email queue, async job queue |
| Serverless | AWS Lambda | Email sender, job processor, alarm handler |
| Email | Amazon SES | Gửi email transactional |
| Monitoring | Amazon CloudWatch | Logs, metrics, alarms |
| Tracing | AWS X-Ray | Distributed tracing |
| Telemetry | AWS Distro for OpenTelemetry | Traces & metrics pipeline |
| Search/Logs | Amazon OpenSearch Service | Log aggregation, search |
| Visualization | Grafana / Kibana | Dashboard, log visualization |
| CI/CD | GitHub Actions + Argo CD | Pipeline và GitOps deploy |
| Image Scanning | Trivy | Container vulnerability scanning |

---

## Mermaid — Toàn bộ luồng request (End-to-End)

```mermaid
graph TB
    USER["👥 Users / Internet"]
    R53["🌐 Route 53"]
    WAF["🛡️ AWS WAF"]
    ALB["⚖️ ALB (HTTPS:443)"]

    subgraph EKS["☸️ Amazon EKS Cluster"]
        subgraph NS_FE["namespace: frontend"]
            FE["React/Nginx Pod"]
            FE_HPA["HPA"]
            FE_SVC["Service (ClusterIP)"]
            FE_ING["Ingress (ALB Controller)"]
        end
        subgraph NS_BE["namespace: backend"]
            GW["API Gateway\n(Node.js/Go)"]
            GW_HPA["HPA"]
            GW_SVC["Service (ClusterIP)"]
        end
        subgraph NS_SVC["namespace: services"]
            AUTH["Auth Service"]
            JOB["Job Service"]
            AI["AI Service"]
            AUTH_HPA["HPA"]
            JOB_HPA["HPA"]
            AI_HPA["HPA"]
            SVC_SVC["Service (ClusterIP)"]
        end
        subgraph NS_DATA["namespace: data"]
            PG_PROXY["RDS Proxy"]
        end
    end

    RDS["🐘 RDS PostgreSQL"]

    USER --> R53 --> WAF --> ALB --> FE_ING
    FE_ING --> FE_SVC --> FE --> GW_SVC
    GW_SVC --> GW --> AUTH & JOB & AI
    AUTH & JOB & AI --> SVC_SVC --> PG_PROXY --> RDS
```

---

## Mermaid — CI/CD Pipeline

```mermaid
graph LR
    subgraph GITHUB["GitHub"]
        REPO["📁 Repository"]
        GA["⚙️ GitHub Actions"]
    end

    subgraph PIPELINE["CI/CD Steps"]
        direction TB
        S1["1️⃣ Code Checkout"]
        S2["2️⃣ Build & Test"]
        S3["3️⃣ Docker Build"]
        S4["4️⃣ Trivy Scan\n(CVE Check)"]
        S5["5️⃣ Push Image → ECR"]
        S6["6️⃣ Helm Package"]
        S7["7️⃣ Push Chart → S3"]
        S8["8️⃣ Deploy via Argo CD"]
        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8
    end

    ECR["📦 Amazon ECR\n(Private Registry)"]
    S3_HELM["🪣 Amazon S3\n(Helm Chart Repo)"]
    ARGO["🐙 Argo CD\n(GitOps)"]
    EKS["☸️ Amazon EKS"]

    REPO --> GA --> PIPELINE
    S5 --> ECR
    S7 --> S3_HELM
    S8 --> ARGO --> EKS
    ECR --> EKS
```

---

## Mermaid — Serverless & Messaging

```mermaid
graph LR
    subgraph EMAIL_FLOW["Email Sending Workflow"]
        direction LR
        SNS_EMAIL["📢 SNS\n(Email Topic)"]
        SQS_EMAIL["📥 SQS\n(Email Queue)"]
        LAMBDA_EMAIL["λ Lambda\n(Email Sender)"]
        SES["✉️ Amazon SES\n(Email Service)"]
        SNS_EMAIL --> SQS_EMAIL --> LAMBDA_EMAIL --> SES
    end

    subgraph EVENT_FLOW["Event Notifications"]
        direction LR
        APP_EV["📱 Application"]
        SNS_NOTIF["📢 SNS\n(Notifications)"]
        DEST["📬 Email / SMS / Webhook"]
        APP_EV --> SNS_NOTIF --> DEST
    end

    subgraph ASYNC_FLOW["Async Job Processing"]
        direction LR
        APP_JOB["📱 Application"]
        SQS_JOB["📥 SQS\n(Job Queue)"]
        LAMBDA_JOB["λ Lambda\n(Job Processor)"]
        APP_JOB --> SQS_JOB --> LAMBDA_JOB
    end

    subgraph ALARM_FLOW["Alarm & Auto-Remediation"]
        direction LR
        CW_ALARM["📊 CloudWatch\n(Alarms)"]
        LAMBDA_ALARM["λ Lambda\n(Alarm Handler)"]
        SNS_NOTIFY["📢 SNS\n(Notify)"]
        SSM_AUTO["⚙️ SSM\n(Automate)"]
        CW_ALARM --> LAMBDA_ALARM --> SNS_NOTIFY & SSM_AUTO
    end
```

---

## Mermaid — EKS Cluster Internal (Addons + IRSA)

```mermaid
graph TB
    subgraph EKS_CLUSTER["☸️ Amazon EKS (Managed by AWS)"]

        subgraph ADDONS["System Add-ons"]
            VPC_CNI["VPC CNI"]
            COREDNS["CoreDNS"]
            KUBE_PROXY["kube-proxy"]
            EBS_CSI["AWS EBS CSI Driver"]
            METRICS["Metrics Server"]
            AUTOSCALER["Cluster Autoscaler"]
        end

        subgraph IRSA["IAM Roles for Service Accounts (IRSA)"]
            OIDC["OIDC Provider"]
            IAM_ROLE["IAM Role"]
            AWS_SVC["AWS Services\n(Least Privilege)"]
            OIDC --> IAM_ROLE --> AWS_SVC
        end

        subgraph SCALING["User Workloads — Auto Scaling"]
            HPA_INFO["HPA Enabled\nMin: 2 pods | Max: 10 pods"]
            CA_INFO["Cluster Autoscaler\n(EC2 Node scale-out/in)"]
        end
    end
```

---

## Mermaid — Observability Stack

```mermaid
graph LR
    subgraph SOURCES["Nguồn dữ liệu"]
        APP["📱 Application\n(EKS Pods)"]
        INFRA["🖥️ Infrastructure\n(EC2, RDS, ALB)"]
        LAMBDA["λ Lambda Functions"]
    end

    subgraph COLLECT["Thu thập"]
        OTEL["AWS Distro\nOpenTelemetry"]
        CW_AGENT["CloudWatch Agent"]
        XRAY_SDK["X-Ray SDK"]
    end

    subgraph STORE["Lưu trữ & Xử lý"]
        CW["📊 Amazon\nCloudWatch\n(Logs & Metrics)"]
        OPENSEARCH["🔍 Amazon\nOpenSearch Service"]
        XRAY["🔎 AWS X-Ray\n(Traces)"]
    end

    subgraph VIZ["Visualization"]
        GRAFANA["📈 Grafana"]
        KIBANA["📋 Kibana"]
        CW_DASH["CloudWatch\nDashboards"]
    end

    subgraph ALERT["Alerting"]
        CW_ALARM["⚠️ CloudWatch Alarms"]
        SNS_ALERT["📢 SNS → Email/Slack"]
    end

    APP & INFRA & LAMBDA --> OTEL & CW_AGENT & XRAY_SDK
    OTEL --> CW & OPENSEARCH
    CW_AGENT --> CW
    XRAY_SDK --> XRAY
    CW --> GRAFANA & CW_DASH & CW_ALARM
    OPENSEARCH --> KIBANA
    CW_ALARM --> SNS_ALERT
```

---

## Mermaid — Private Services (Support Infrastructure)

```mermaid
graph TB
    subgraph PRIVATE_SVC["🔐 Private Services"]
        ECR["📦 Amazon ECR\nContainer Registry\n(Private)"]
        SECRETS["🔑 AWS Secrets Manager\nDB creds, API Keys, JWT secrets"]
        PARAM["📋 AWS Systems Manager\nParameter Store\nApp configs, feature flags"]
        S3["🪣 Amazon S3\nHelm Chart Repo\nDatabase Backups"]
        CW["📊 Amazon CloudWatch\nLogs & Metrics"]
    end

    EKS["☸️ EKS Pods"] -->|"Pull image"| ECR
    EKS -->|"Get secrets"| SECRETS
    EKS -->|"Read config"| PARAM
    ARGO["🐙 Argo CD"] -->|"Pull chart"| S3
    EKS -->|"Push logs"| CW
    RDS["🐘 RDS"] -->|"Push metrics"| CW
```

---

## Resource Sizing (Tham khảo)

| Resource | Loại / Size | Ghi chú |
|---|---|---|
| EKS Node Group | t3.medium (mỗi AZ) | Min: 1, Max: 5 per AZ |
| RDS PostgreSQL | db.t3.medium | Multi-AZ, 100 GB storage |
| ALB | - | 1 ALB cho toàn bộ |
| NAT Gateway | - | 1 per AZ (đề xuất HA) |
| ECR | - | Image scanning bật |
| S3 | Standard | Versioning + lifecycle policy |
| SQS | Standard Queue | 4 queues: email, job, DLQ x2 |
| Lambda | 512MB, 15s timeout | 3 functions |
| SES | - | Verify domain + DKIM |

---

## Lưu ý kiến trúc (Known Issues)

| # | Vấn đề | Đề xuất |
|---|---|---|
| 1 | API Gateway dùng Node.js/Go — nếu là 2 service riêng thì cần tách rõ | Xác định rõ: 1 service Node.js làm gateway hay Go microservice? |
| 2 | AI Service không có queue, gọi sync | Nên thêm SQS queue trước AI Service để tránh timeout |
| 3 | RDS Proxy chưa thấy rõ trong diagram gốc | Thêm RDS Proxy để quản lý connection pooling |
| 4 | Không thấy Redis/ElastiCache | Nên thêm cache layer cho session và API cache |
| 5 | Argo CD không có RBAC rõ ràng | Cần định nghĩa Argo CD projects và AppProjects per team |
