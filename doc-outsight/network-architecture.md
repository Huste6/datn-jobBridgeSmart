# Network Architecture — JobBridge AI

> Region: **us-east-1** | VPC CIDR: **10.0.0.0/16**

---

## Subnet Layout

| Subnet | CIDR | AZ | Loại | Thành phần |
|---|---|---|---|---|
| Public Subnet | 10.0.1.0/24 | AZ-a | Public | NAT Gateway, Bastion Host (SSM) |
| Private Subnet AZ-a | 10.0.2.0/24 | AZ-a | Private | EKS Node Group |
| Private Subnet AZ-b | 10.0.3.0/24 | AZ-b | Private | EKS Node Group |
| Private Subnet AZ-c | 10.0.4.0/24 | AZ-c | Private | EKS Node Group |
| Database Subnet | 10.0.5.0/24 | Multi-AZ | Private | RDS Subnet Group (PostgreSQL) |

---

## Mermaid — Network Topology

```mermaid
graph TB
    %% External (ngoài VPC)
    USERS["👥 Users / Internet"]
    R53["🌐 Amazon Route 53\n(DNS)"]
    WAF["🛡️ AWS WAF\n(Web ACL)"]

    %% VPC boundary
    subgraph VPC["🏠 VPC: 10.0.0.0/16  (us-east-1)"]
        IGW["🌐 Internet Gateway"]

        subgraph PUBLIC["📡 Public Subnet — 10.0.1.0/24  (AZ-a)"]
            ALB["⚖️ Application Load Balancer\n(HTTPS :443) — ENI in public subnet"]
            NAT["🔀 NAT Gateway\n(outbound cho private subnets)"]
            BASTION["🖥️ Bastion Host\n(SSM)"]
        end

        subgraph PRIVATE_A["🔒 Private Subnet AZ-a — 10.0.2.0/24"]
            EKS_A["☸️ EKS Node Group\n(Private)"]
        end

        subgraph PRIVATE_B["🔒 Private Subnet AZ-b — 10.0.3.0/24"]
            EKS_B["☸️ EKS Node Group\n(Private)"]
        end

        subgraph PRIVATE_C["🔒 Private Subnet AZ-c — 10.0.4.0/24"]
            EKS_C["☸️ EKS Node Group\n(Private)"]
        end

        subgraph DB_SUBNET["🗄️ Database Subnet — 10.0.5.0/24 (private, Multi-AZ)"]
            RDS_GROUP["📦 RDS Subnet Group"]
            RDS["🐘 Amazon RDS\n(PostgreSQL)"]
        end
    end

    %% Inbound flow: Internet → IGW → ALB (trong public subnet) → EKS
    USERS --> R53 --> WAF --> IGW --> ALB
    ALB --> EKS_A & EKS_B & EKS_C

    %% Outbound flow: EKS (private) → NAT → IGW → Internet
    EKS_A & EKS_B & EKS_C -->|"outbound\n(NAT)"| NAT

    %% EKS → RDS (database tier)
    EKS_A & EKS_B & EKS_C --> RDS_GROUP
    RDS_GROUP --> RDS
```

---

## Mermaid — Routing Tables

```mermaid
graph LR
    subgraph RT_PUBLIC["Route Table — Public Subnet"]
        direction TB
        R1["0.0.0.0/0 → Internet Gateway"]
        R2["10.0.0.0/16 → local"]
    end

    subgraph RT_PRIVATE["Route Table — Private Subnets (AZ-a/b/c)"]
        direction TB
        R3["0.0.0.0/0 → NAT Gateway"]
        R4["10.0.0.0/16 → local"]
    end

    subgraph RT_DB["Route Table — Database Subnet"]
        direction TB
        R5["10.0.0.0/16 → local"]
        R6["❌ No internet route"]
    end
```

---

## Mermaid — Security Groups

```mermaid
graph TB
    subgraph SG_ALB["SG: alb-sg"]
        A1["Inbound: 443 (HTTPS) từ 0.0.0.0/0"]
        A2["Outbound: All → EKS Node SG"]
    end

    subgraph SG_EKS["SG: eks-node-sg"]
        B1["Inbound: 443, 10250 từ alb-sg"]
        B2["Inbound: All từ eks-node-sg (nội bộ cluster)"]
        B3["Outbound: 5432 → rds-sg"]
        B4["Outbound: 443 → 0.0.0.0/0 (qua NAT)"]
    end

    subgraph SG_RDS["SG: rds-sg"]
        C1["Inbound: 5432 từ eks-node-sg ONLY"]
        C2["Outbound: Deny all"]
    end

    subgraph SG_BASTION["SG: bastion-sg"]
        D1["Inbound: 22 từ Corporate IP range"]
        D2["Outbound: 22 → eks-node-sg, rds-sg"]
    end

    SG_ALB --> SG_EKS
    SG_EKS --> SG_RDS
    SG_BASTION --> SG_EKS
```

---

## Mermaid — Network Access Control (NACLs)

```mermaid
graph TB
    subgraph NACL_PUBLIC["NACL — Public Subnet"]
        NP1["100 ALLOW 0.0.0.0/0 TCP 443 IN"]
        NP2["110 ALLOW 0.0.0.0/0 TCP 80 IN"]
        NP3["120 ALLOW 0.0.0.0/0 TCP 1024-65535 IN (Ephemeral)"]
        NP4["* DENY ALL"]
    end

    subgraph NACL_PRIVATE["NACL — Private Subnets"]
        NR1["100 ALLOW 10.0.0.0/16 ALL IN"]
        NR2["110 ALLOW 0.0.0.0/0 TCP 1024-65535 IN (Ephemeral)"]
        NR3["* DENY ALL"]
    end

    subgraph NACL_DB["NACL — Database Subnet"]
        ND1["100 ALLOW 10.0.2.0/24 TCP 5432 IN"]
        ND2["110 ALLOW 10.0.3.0/24 TCP 5432 IN"]
        ND3["120 ALLOW 10.0.4.0/24 TCP 5432 IN"]
        ND4["* DENY ALL"]
    end
```

---

## Mermaid — Internal Traffic (mTLS + Network Policies)

```mermaid
graph LR
    subgraph EKS_CLUSTER["Amazon EKS Cluster"]
        subgraph NS_FRONTEND["namespace: frontend"]
            FE["Frontend Pod\nReact/Nginx"]
        end
        subgraph NS_BACKEND["namespace: backend"]
            GW["API Gateway Pod\nNode.js / Go"]
        end
        subgraph NS_SERVICES["namespace: services"]
            AUTH["Auth Service Pod"]
            JOB["Job Service Pod"]
            AI["AI Service Pod"]
        end
        subgraph NS_DATA["namespace: data"]
            PG["PostgreSQL (RDS Proxy)"]
        end

        MTLS["🔐 mTLS\nAWS App Mesh / Istio / Linkerd\n+ Calico Network Policies"]
    end

    FE -->|"mTLS"| GW
    GW -->|"mTLS"| AUTH
    GW -->|"mTLS"| JOB
    GW -->|"mTLS"| AI
    AUTH -->|"mTLS"| PG
    JOB -->|"mTLS"| PG
    AI -->|"mTLS"| PG
```

---

## Lưu ý kiến trúc (Known Issues)

| # | Vấn đề tiềm ẩn | Đề xuất sửa |
|---|---|---|
| 1 | Database Subnet chỉ có 1 AZ (10.0.5.0/24) | Thêm 10.0.6.0/24 (AZ-b), 10.0.7.0/24 (AZ-c) cho Multi-AZ RDS |
| 2 | Bastion Host exposed qua SSH | Dùng SSM Session Manager thay thế, remove SG port 22 |
| 3 | Single NAT Gateway (điểm lỗi duy nhất) | Thêm NAT Gateway mỗi AZ để HA |
| 4 | ALB không có WAF rule rõ ràng | Định nghĩa cụ thể AWS Managed Rules + rate limiting |
