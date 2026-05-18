# Sơ đồ: Kiến trúc Terraform IaC 3 Tầng

## Mục đích
Minh họa cấu trúc 3 module Terraform độc lập và các tài nguyên Azure được quản lý.

## Mô tả sơ đồ (dùng để gen ảnh)

Vẽ sơ đồ theo chiều dọc từ trên xuống, kiểu "layered stack" (xếp tầng), phong cách technical diagram, nền trắng.

---

### Bố cục tổng thể

```
┌─────────────────────────────────────────────────────────┐
│               AZURE SUBSCRIPTION                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TẦNG 01 — FOUNDATION                           │   │
│  │  (Chạy đầu tiên, ít thay đổi nhất)              │   │
│  │                                                 │   │
│  │   [Resource Group: rg-jobbridge]                │   │
│  │   [Azure Container Registry: acrjobbridge]      │   │
│  │        └── Tier: Basic | ~$5/tháng              │   │
│  └─────────────────────────────────────────────────┘   │
│                       ↓ depends_on                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TẦNG 02 — CLUSTER                              │   │
│  │  (Hạ tầng tính toán)                            │   │
│  │                                                 │   │
│  │   [AKS Cluster]                                 │   │
│  │    ├── Node: Standard_B2s (2 vCPU, 4GB)        │   │
│  │    ├── Auto-scale: 1 → 2 nodes                  │   │
│  │    ├── Network: kubenet (miễn phí)               │   │
│  │    └── ~$30/tháng                               │   │
│  └─────────────────────────────────────────────────┘   │
│                       ↓ depends_on                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TẦNG 03 — SECURITY                             │   │
│  │  (Bảo mật & quản lý bí mật)                     │   │
│  │                                                 │   │
│  │   [Azure Key Vault: kv-jobbridge]  Free tier    │   │
│  │    ├── Secret: MONGODB_URI                      │   │
│  │    ├── Secret: JWT_SECRET                       │   │
│  │    ├── Secret: OPENAI_API_KEY                   │   │
│  │    ├── Secret: CLOUDINARY_API_KEY               │   │
│  │    ├── Secret: CLOUDINARY_CLOUD_NAME            │   │
│  │    └── Secret: ACR_PASSWORD                     │   │
│  │   [Managed Identity] → quyền đọc Key Vault      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### Phần bổ sung bên phải: Key Vault CSI Secret Injection Flow

Vẽ luồng từ trái sang phải:

```
[Azure Key Vault]
   6 secrets
        │
        ▼
[CSI Driver: secrets-store.csi.k8s.io]
   chạy trong AKS cluster (DaemonSet)
        │
        ├── Khi Pod khởi động: fetch secret → mount vào /mnt/secrets
        │
        ├── Sau mỗi 5 phút: kiểm tra secret mới → cập nhật tự động
        │
        └── [Pod] nhận ENV vars từ mounted secrets
             ├── Không cần restart
             └── Không lưu secrets trong Git/ConfigMap
```

---

## Màu sắc gợi ý
- Tầng 01 (Foundation): xanh lam nhạt (#DBEAFE)
- Tầng 02 (Cluster): xanh teal nhạt (#CCFBF1)  
- Tầng 03 (Security): tím nhạt (#EDE9FE)
- Azure icons: màu xanh Azure (#0078D4)
- Mũi tên depends_on: xám (#6B7280)
- Border: #E5E7EB
- Font chữ: Inter/Roboto

## Kích thước đề xuất
- Tỉ lệ: 3:4 (chiều dọc) hoặc chia đôi ngang (Terraform bên trái, CSI flow bên phải)
- Độ rộng tối thiểu: 1400px

## Tên file output
`terraform_3layer_architecture.png`
