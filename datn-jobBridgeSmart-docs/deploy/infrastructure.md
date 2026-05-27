# Infrastructure – Terraform & Azure

## Tổng quan

Hạ tầng của JobBridge AI được provision bằng **Terraform** theo kiến trúc 3 layers trên **Microsoft Azure**.

```
deploy/terraforms/
├── layers/
│   ├── 01-foundation/   – Resource Group + ACR
│   ├── 02-cluster/      – AKS Cluster
│   └── 03-security/     – Azure Key Vault
└── modules/
    ├── acr/             – Azure Container Registry module
    ├── aks/             – Azure Kubernetes Service module
    ├── keyvault/        – Azure Key Vault module
    └── resource-group/  – Resource Group module
```

## Tại sao 3 layers?

Mỗi layer có lifecycle khác nhau:

| Layer | Thay đổi | Lý do |
|-------|---------|-------|
| Foundation | Rất hiếm | Resource Group và ACR ổn định |
| Cluster | Thỉnh thoảng | AKS upgrade, scaling |
| Security | Khi cần | Thêm/sửa secrets |

Tách layers giúp `terraform apply` ít rủi ro hơn – không sợ vô tình xoá cluster khi chỉ thêm secret.

---

## Layer 01 – Foundation

**Path:** `deploy/terraforms/layers/01-foundation/`

### Resources tạo ra

**Azure Resource Group**
```hcl
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name  # default: "rg-jobbridge"
  location = var.location             # default: "Southeast Asia"
}
```

**Azure Container Registry (ACR)**
```hcl
resource "azurerm_container_registry" "main" {
  name                = var.acr_name   # default: "acrjobbridge"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"        # Cost-optimized
  admin_enabled       = false          # Dùng RBAC thay admin password
}
```

### Outputs

- `acr_login_server` – URL để push/pull images (VD: `acrjobbridge.azurecr.io`)
- `resource_group_name`

---

## Layer 02 – Cluster

**Path:** `deploy/terraforms/layers/02-cluster/`

### Resources tạo ra

**AKS Cluster**
```hcl
resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-jobbridge"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  dns_prefix          = "jobbridge"

  default_node_pool {
    name       = "system"
    node_count = 1           # Cost-optimized: 1 node
    vm_size    = "Standard_B2s"
  }

  network_profile {
    network_plugin = "kubenet"  # Đơn giản, không cần Azure CNI
  }

  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }
}
```

**ACR Pull Permission**
```hcl
resource "azurerm_role_assignment" "acr_pull" {
  principal_id         = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name = "AcrPull"
  scope                = data.azurerm_container_registry.main.id
}
```

AKS node identity được cấp quyền `AcrPull` để tự pull images từ ACR, không cần secret.

### Key Features

- **CSI Secret Store Driver** – Tự động mount secrets từ Azure Key Vault vào pods
- **kubenet** – Network plugin đơn giản, cost-effective cho dev/staging
- **1 node** – Tiết kiệm chi phí, đủ cho demo/DATN

### Outputs

- `kube_config` – Kubeconfig để kết nối kubectl
- `cluster_name`
- `node_identity_object_id` – Dùng cho Key Vault access policy

---

## Layer 03 – Security

**Path:** `deploy/terraforms/layers/03-security/`

### Resources tạo ra

**Azure Key Vault**
```hcl
resource "azurerm_key_vault" "main" {
  name                = "kv-jobbridge"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
}
```

**Secrets được lưu trong Key Vault**

| Secret name | Mô tả |
|-------------|-------|
| `JWT-SECRET` | Secret key để ký JWT tokens |
| `JWT-ISSUER` | Issuer claim trong JWT |
| `ACCESS-TOKEN-TTL-MINUTES` | Thời hạn JWT |
| `OPENAI-API-KEY` | OpenAI API key |
| `MODEL` | Tên model OpenAI |
| `URL-BASE` | Base URL của OpenAI API |
| `CLOUDINARY-URL` | Cloudinary credentials URL |
| `CLOUDINARY-FOLDER` | Cloudinary upload folder |

**Access Policies**

```hcl
# Deployer (người chạy Terraform)
resource "azurerm_key_vault_access_policy" "deployer" {
  secret_permissions = ["Get", "List", "Set", "Delete", "Purge"]
}

# AKS CSI Driver (identity của AKS node)
resource "azurerm_key_vault_access_policy" "aks" {
  secret_permissions = ["Get", "List"]  # Chỉ đọc
}
```

---

## Terraform State Backend

Terraform state được lưu trên **Azure Storage Account** (không phải local).

```bash
# Setup một lần duy nhất
chmod +x deploy/scripts/setup-tfstate-backend.sh
./deploy/scripts/setup-tfstate-backend.sh
```

Script này tạo:
- Storage Account: `satfjobbridge`
- Container: `tfstate`
- State file: `terraform.tfstate` (remote)

### Backend config trong mỗi layer

```hcl
# layers/01-foundation/backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "satfjobbridge"
    container_name       = "tfstate"
    key                  = "01-foundation.tfstate"
  }
}
```

Mỗi layer có file `.tfstate` riêng, tránh conflict.

---

## Chạy Terraform

### Prerequisites

```bash
# Login Azure
az login

# Cài Terraform
winget install HashiCorp.Terraform
```

### Chạy thủ công từng layer

```bash
# Layer 01
cd deploy/terraforms/layers/01-foundation
terraform init
terraform plan
terraform apply

# Layer 02 (sau khi 01 xong)
cd ../02-cluster
terraform init
terraform plan
terraform apply

# Layer 03
cd ../03-security
terraform init
terraform plan
terraform apply
```

### Chạy tự động (script)

```bash
chmod +x deploy/scripts/deploy-infra.sh
./deploy/scripts/deploy-infra.sh
```

Script này chạy tuần tự cả 3 layers và handle outputs giữa layers.

---

## Setup Secrets trong Key Vault

Sau khi tạo Key Vault, điền secrets từ file `.env`:

```bash
# Từ root directory
chmod +x deploy/scripts/setup-azure.sh
./deploy/scripts/setup-azure.sh
```

Script đọc file `.env` và push từng biến vào Key Vault.

---

## Topo Azure Resources

```
Resource Group: rg-jobbridge
├── Azure Container Registry: acrjobbridge
│   └── Images: jobbridge-auth, jobbridge-jobs, jobbridge-ai, 
│               jobbridge-gateway, jobbridge-frontend
├── AKS Cluster: aks-jobbridge
│   └── Node Pool: system (1x Standard_B2s)
│        └── Kubernetes workloads (Helm release: jobbridge)
└── Azure Key Vault: kv-jobbridge
    └── Secrets: JWT_SECRET, OPENAI_API_KEY, ...

Storage Account: satfjobbridge (resource group: rg-tfstate)
└── Container: tfstate
    ├── 01-foundation.tfstate
    ├── 02-cluster.tfstate
    └── 03-security.tfstate
```

---

## Chi phí ước tính (Azure Southeast Asia)

| Resource | SKU | Ước tính/tháng |
|---------|-----|----------------|
| AKS (1 node Standard_B2s) | B2s | ~$30 |
| ACR | Basic | ~$5 |
| Key Vault | Standard | ~$1 |
| Storage (state) | LRS | < $1 |
| **Tổng** | | **~$36/tháng** |

*Chú ý: AKS management fee = $0 (miễn phí cho cluster ≤ 1 node với free tier)*
