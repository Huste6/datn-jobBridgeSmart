# IAM Roles & Permissions theo Phòng ban — JobBridge AI

> Nguyên tắc: **Least Privilege** — mỗi thực thể chỉ có quyền tối thiểu cần thiết

---

## Tổng quan các phòng ban

| Phòng ban | Trách nhiệm chính | Môi trường |
|---|---|---|
| **DevOps / Platform** | Quản lý hạ tầng, EKS, CI/CD, monitoring | Dev + Staging + Prod |
| **Backend Team** | API Gateway, Auth, Job, AI services | Dev + Staging |
| **Frontend Team** | React/Nginx frontend | Dev + Staging |
| **Data / DB Team** | RDS, migrations, backup | Dev + Staging + Prod (read) |
| **Security Team** | WAF, Secrets, Compliance, Audit | All (read-only + WAF) |
| **AI/ML Team** | AI Service, model deployment | Dev + Staging |
| **Management** | Billing, cost reports | Billing only |

---

## Mermaid — Phân cấp IAM tổng quan

```mermaid
graph TB
    ROOT["🔐 AWS Root Account\n(MFA bắt buộc, không dùng hàng ngày)"]

    subgraph ADMIN["Administrators"]
        MASTER_ADMIN["IAM Group: platform-admins\n(AdministratorAccess — break-glass only)"]
    end

    subgraph TEAMS["Team Groups"]
        GRP_DEVOPS["IAM Group:\ndevops-engineers"]
        GRP_BACKEND["IAM Group:\nbackend-developers"]
        GRP_FRONTEND["IAM Group:\nfrontend-developers"]
        GRP_DATA["IAM Group:\ndata-engineers"]
        GRP_SECURITY["IAM Group:\nsecurity-auditors"]
        GRP_AI["IAM Group:\nai-ml-engineers"]
        GRP_MGMT["IAM Group:\nmanagement"]
    end

    subgraph SERVICE_ROLES["Service Account Roles (IRSA — EKS)"]
        ROLE_FE["Role: sa-frontend"]
        ROLE_GW["Role: sa-api-gateway"]
        ROLE_AUTH["Role: sa-auth-service"]
        ROLE_JOB["Role: sa-job-service"]
        ROLE_AI["Role: sa-ai-service"]
        ROLE_ARGO["Role: sa-argocd"]
        ROLE_CA["Role: sa-cluster-autoscaler"]
        ROLE_EBS["Role: sa-ebs-csi"]
        ROLE_LB["Role: sa-load-balancer-controller"]
        ROLE_CW["Role: sa-cloudwatch-agent"]
        ROLE_OTEL["Role: sa-otel-collector"]
    end

    ROOT --> ADMIN
    ROOT --> TEAMS
    ROOT --> SERVICE_ROLES
```

---

## Mermaid — DevOps / Platform Team

```mermaid
graph TB
    subgraph DEVOPS_GROUP["IAM Group: devops-engineers"]
        DEVOPS_USER["👤 DevOps Engineers"]
    end

    subgraph DEVOPS_POLICIES["Policies đính kèm"]
        P1["✅ AmazonEKSClusterPolicy\n(EKS full manage)"]
        P2["✅ AmazonEKSWorkerNodePolicy\n(EC2 node group)"]
        P3["✅ AmazonEC2ContainerRegistryFullAccess\n(ECR push/pull)"]
        P4["✅ CloudWatchFullAccess\n(Logs, metrics, alarms)"]
        P5["✅ AmazonS3FullAccess\n(Helm charts, backups)"]
        P6["✅ AWSCodePipelineFullAccess\n(CI/CD pipelines)"]
        P7["✅ IAMReadOnlyAccess\n(Xem roles/policies)"]
        P8["✅ Custom: EKSNodeGroupManage\n(Scale node groups)"]
        P9["✅ AmazonVPCFullAccess\n(Subnets, SGs, Route Tables)"]
        P10["✅ ElasticLoadBalancingFullAccess\n(ALB management)"]
        P11["❌ KHÔNG có IAM CreateUser/DeleteUser"]
        P12["❌ KHÔNG có RDS DeleteInstance"]
        P13["❌ KHÔNG có Billing access"]
    end

    DEVOPS_GROUP --> DEVOPS_POLICIES
```

---

## Mermaid — Backend Team

```mermaid
graph TB
    subgraph BACKEND_GROUP["IAM Group: backend-developers"]
        BE_USER["👤 Backend Developers"]
    end

    subgraph BACKEND_POLICIES["Policies đính kèm"]
        B1["✅ AmazonEKSClusterPolicy (read-only)\nekubectl get/describe/logs — Dev/Staging"]
        B2["✅ AmazonEC2ContainerRegistryPowerUser\n(pull + push image)"]
        B3["✅ CloudWatchLogsReadOnlyAccess\n(xem logs service của mình)"]
        B4["✅ AWSSecretsManagerReadWrite\n(đọc/ghi secrets dev namespace)"]
        B5["✅ Custom: EKSNamespaceAccess\n(chỉ namespace: backend, services)"]
        B6["✅ SSMReadOnlyAccess\n(Parameter Store — read)"]
        B7["❌ KHÔNG có quyền prod cluster"]
        B8["❌ KHÔNG có quyền RDS trực tiếp"]
        B9["❌ KHÔNG có quyền namespace: frontend, data"]
    end

    BACKEND_GROUP --> BACKEND_POLICIES
```

---

## Mermaid — Frontend Team

```mermaid
graph TB
    subgraph FRONTEND_GROUP["IAM Group: frontend-developers"]
        FE_USER["👤 Frontend Developers"]
    end

    subgraph FRONTEND_POLICIES["Policies đính kèm"]
        F1["✅ AmazonEC2ContainerRegistryPowerUser\n(push/pull frontend image)"]
        F2["✅ CloudWatchLogsReadOnlyAccess\n(logs namespace: frontend)"]
        F3["✅ Custom: EKSNamespaceAccess\n(chỉ namespace: frontend)"]
        F4["✅ AmazonS3ReadOnlyAccess\n(đọc Helm chart repo)"]
        F5["❌ KHÔNG có quyền backend/services namespaces"]
        F6["❌ KHÔNG có quyền secrets (dùng qua app)"]
        F7["❌ KHÔNG có quyền RDS, SQS, Lambda"]
    end

    FRONTEND_GROUP --> FRONTEND_POLICIES
```

---

## Mermaid — Data / DB Team

```mermaid
graph TB
    subgraph DATA_GROUP["IAM Group: data-engineers"]
        DATA_USER["👤 Data Engineers"]
    end

    subgraph DATA_POLICIES["Policies đính kèm"]
        D1["✅ AmazonRDSFullAccess\n(Dev/Staging: full)\n(Prod: read-only + snapshot)"]
        D2["✅ AmazonS3FullAccess\n(Database backup bucket only)"]
        D3["✅ CloudWatchReadOnlyAccess\n(RDS metrics)"]
        D4["✅ Custom: RDSSnapshotManage\n(tạo/restore snapshots prod)"]
        D5["✅ AWSSecretsManagerReadOnly\n(đọc DB credentials)"]
        D6["❌ KHÔNG có EKS access"]
        D7["❌ KHÔNG có ECR access"]
        D8["❌ KHÔNG có IAM access"]
    end

    DATA_GROUP --> DATA_POLICIES
```

---

## Mermaid — Security Team

```mermaid
graph TB
    subgraph SEC_GROUP["IAM Group: security-auditors"]
        SEC_USER["👤 Security Engineers"]
    end

    subgraph SEC_POLICIES["Policies đính kèm"]
        S1["✅ SecurityAudit\n(Read-only toàn bộ AWS resources)"]
        S2["✅ AWSWAFFullAccess\n(Quản lý WAF rules, IP sets)"]
        S3["✅ AWSSecretsManagerReadWrite\n(Rotate secrets, audit access)"]
        S4["✅ IAMFullAccess\n(Quản lý IAM policies, review)"]
        S5["✅ CloudTrailFullAccess\n(Audit logs)"]
        S6["✅ AmazonInspector2FullAccess\n(Vulnerability scanning)"]
        S7["✅ AWSConfig (ReadOnly)\n(Compliance checking)"]
        S8["✅ GuardDutyFullAccess\n(Threat detection)"]
        S9["❌ KHÔNG có EKS deploy quyền"]
        S10["❌ KHÔNG có RDS write quyền"]
        S11["❌ KHÔNG có Lambda invoke prod"]
    end

    SEC_GROUP --> SEC_POLICIES
```

---

## Mermaid — AI/ML Team

```mermaid
graph TB
    subgraph AI_GROUP["IAM Group: ai-ml-engineers"]
        AI_USER["👤 AI/ML Engineers"]
    end

    subgraph AI_POLICIES["Policies đính kèm"]
        A1["✅ AmazonEC2ContainerRegistryPowerUser\n(push AI model images)"]
        A2["✅ Custom: EKSNamespaceAccess\n(chỉ namespace: services/ai-service)"]
        A3["✅ CloudWatchLogsReadOnlyAccess\n(AI service logs)"]
        A4["✅ AWSSecretsManagerReadOnly\n(API keys cho AI models)"]
        A5["✅ AmazonS3ReadWriteAccess\n(Model artifacts bucket)"]
        A6["✅ SageMakerFullAccess\n(nếu có SageMaker endpoints)"]
        A7["❌ KHÔNG có quyền prod deployment trực tiếp"]
        A8["❌ KHÔNG có RDS write"]
        A9["❌ KHÔNG có Lambda (trừ AI-specific)"]
    end

    AI_GROUP --> AI_POLICIES
```

---

## Mermaid — Management

```mermaid
graph TB
    subgraph MGMT_GROUP["IAM Group: management"]
        MGMT_USER["👤 Management / C-Level"]
    end

    subgraph MGMT_POLICIES["Policies đính kèm"]
        M1["✅ AWSBillingReadOnlyAccess\n(Cost Explorer, billing reports)"]
        M2["✅ AWSCostAndUsageReportAccess\n(Usage reports)"]
        M3["✅ CloudWatchReadOnlyAccess\n(High-level dashboards)"]
        M4["❌ KHÔNG có bất kỳ resource write quyền"]
        M5["❌ KHÔNG có EKS, RDS, Lambda access"]
    end

    MGMT_GROUP --> MGMT_POLICIES
```

---

## Mermaid — IRSA (Service Account Roles trong EKS)

```mermaid
graph LR
    subgraph EKS_SA["EKS Service Accounts → IAM Roles (IRSA)"]
        direction TB

        subgraph SA_FE["sa: frontend-sa\nns: frontend"]
            R_FE["Role: sa-frontend\n✅ S3:GetObject (static assets)\n✅ CloudWatch:PutMetricData"]
        end

        subgraph SA_GW["sa: api-gateway-sa\nns: backend"]
            R_GW["Role: sa-api-gateway\n✅ SecretsManager:GetSecretValue\n✅ SSM:GetParameter\n✅ SQS:SendMessage\n✅ CloudWatch:PutLogEvents"]
        end

        subgraph SA_AUTH["sa: auth-sa\nns: services"]
            R_AUTH["Role: sa-auth-service\n✅ SecretsManager:GetSecretValue (JWT)\n✅ DynamoDB (nếu dùng session store)\n✅ CloudWatch:PutLogEvents"]
        end

        subgraph SA_JOB["sa: job-sa\nns: services"]
            R_JOB["Role: sa-job-service\n✅ SQS:SendMessage, ReceiveMessage\n✅ SNS:Publish\n✅ SecretsManager:GetSecretValue\n✅ S3:PutObject (job outputs)\n✅ CloudWatch:PutLogEvents"]
        end

        subgraph SA_AI["sa: ai-sa\nns: services"]
            R_AI["Role: sa-ai-service\n✅ SecretsManager:GetSecretValue (AI API keys)\n✅ S3:GetObject (models)\n✅ SageMaker:InvokeEndpoint\n✅ CloudWatch:PutLogEvents"]
        end

        subgraph SA_ARGO["sa: argocd-sa\nns: argocd"]
            R_ARGO["Role: sa-argocd\n✅ S3:GetObject (Helm charts)\n✅ ECR:GetAuthorizationToken\n✅ ECR:BatchGetImage"]
        end

        subgraph SA_SYS["System Add-ons"]
            R_CA["sa-cluster-autoscaler\n✅ EC2:DescribeInstances\n✅ autoscaling:SetDesiredCapacity\n✅ autoscaling:TerminateInstanceInAutoScalingGroup"]
            R_EBS["sa-ebs-csi\n✅ EC2:CreateVolume\n✅ EC2:AttachVolume\n✅ EC2:DeleteVolume"]
            R_LB["sa-load-balancer-controller\n✅ ElasticLoadBalancing:*\n✅ EC2:DescribeSubnets\n✅ CertificateManager:ListCertificates"]
            R_CW["sa-cloudwatch-agent\n✅ CloudWatch:PutMetricData\n✅ CloudWatch:PutLogEvents\n✅ ec2:DescribeTags"]
        end
    end
```

---

## Mermaid — Permission Boundaries

```mermaid
graph TB
    subgraph BOUNDARY["Permission Boundaries (ngăn privilege escalation)"]
        PB1["Boundary: developer-boundary\nDeny: iam:CreateUser\nDeny: iam:AttachUserPolicy\nDeny: iam:PutRolePolicy\nDeny: organizations:*\nDeny: account:*"]

        PB2["Boundary: service-account-boundary\nAllow: chỉ services cụ thể\n(SecretsManager, S3, SQS, SNS,\n CloudWatch, SSM, ECR)\nDeny: iam:*, ec2:*, rds:*\nDeny: eks:CreateCluster"]
    end

    subgraph APPLIES["Áp dụng cho"]
        PB1 --> GRP_DEV["All developer groups\n(backend, frontend, ai-ml)"]
        PB2 --> SA_ALL["All IRSA Service Account Roles"]
    end
```

---

## Mermaid — SCP (Service Control Policies) — Organization Level

```mermaid
graph TB
    subgraph ORG["AWS Organizations"]
        ROOT_OU["Root OU"]

        subgraph PROD_OU["OU: Production"]
            SCP_PROD["SCP: production-guardrails\n✅ Allow: ap-southeast-1, us-east-1 only\n❌ Deny: ec2:TerminateInstances (không có approval)\n❌ Deny: rds:DeleteDBInstance\n❌ Deny: s3:DeleteBucket\n❌ Deny: cloudtrail:StopLogging\n❌ Deny: config:DeleteConfigRule\n❌ Deny: guardduty:DeleteDetector"]
        end

        subgraph DEV_OU["OU: Development"]
            SCP_DEV["SCP: dev-cost-control\n❌ Deny: ec2:RunInstances (type p*, g*, x*)\n(không dùng GPU/high-mem instances)\n❌ Deny: RDS db.r5.*, db.x1.*\n✅ Allow: tất cả instance <= t3.large"]
        end
    end

    ROOT_OU --> SCP_PROD
    ROOT_OU --> SCP_DEV
```

---

## Ma trận quyền hạn tổng hợp

| Service / Action | DevOps | Backend | Frontend | Data | Security | AI/ML | Management |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| EKS — full cluster | ✅ | ❌ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| EKS — namespace backend | ✅ | ✅ | ❌ | ❌ | 👁️ | ❌ | ❌ |
| EKS — namespace frontend | ✅ | ❌ | ✅ | ❌ | 👁️ | ❌ | ❌ |
| EKS — namespace services | ✅ | ✅ | ❌ | ❌ | 👁️ | ✅ AI only | ❌ |
| ECR — push | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| RDS — read | ✅ | ❌ | ❌ | ✅ | 👁️ | ❌ | ❌ |
| RDS — write/manage | ✅ Dev | ❌ | ❌ | ✅ Dev | ❌ | ❌ | ❌ |
| Secrets Manager | ✅ | ✅ Dev | ❌ | 👁️ | ✅ | 👁️ | ❌ |
| CloudWatch Logs | ✅ | ✅ own | ✅ own | ✅ own | ✅ | ✅ own | 👁️ |
| WAF | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| IAM | ✅ read | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Billing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ read |
| S3 — Helm charts | ✅ | 👁️ | 👁️ | ❌ | 👁️ | ❌ | ❌ |
| SQS / SNS | ✅ | ✅ send | ❌ | ❌ | 👁️ | ✅ | ❌ |
| Lambda | ✅ | ❌ | ❌ | ❌ | 👁️ | ✅ AI | ❌ |

> **Chú thích:** ✅ = Full access | 👁️ = Read-only | ❌ = Không có quyền | Dev = chỉ môi trường Dev/Staging

---

## Lưu ý bảo mật

| # | Best Practice | Trạng thái |
|---|---|---|
| 1 | MFA bắt buộc cho tất cả IAM users | Bắt buộc enforce |
| 2 | Access Key rotation 90 ngày | Enforce qua IAM Policy |
| 3 | Không dùng root account hàng ngày | Root chỉ dùng break-glass |
| 4 | CloudTrail bật toàn region | Ghi log tất cả API calls |
| 5 | AWS Config rules — kiểm tra compliance | Enable SecurityHub |
| 6 | GuardDuty — threat detection | Enable tất cả accounts |
| 7 | Permission Boundary cho tất cả developers | Tránh privilege escalation |
| 8 | IRSA thay vì node-level IAM role | Least privilege per pod |
| 9 | SCP ở Organization level | Ngăn destructive actions trên prod |
| 10 | Secrets Manager — auto rotation 30 ngày | Không hardcode credentials |
