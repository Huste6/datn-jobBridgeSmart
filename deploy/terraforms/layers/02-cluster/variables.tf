# ── References to Layer 01 resources ────────────────────────────────────────
variable "resource_group_name" {
  description = "Resource group name (from Layer 01)"
  type        = string
  default     = "rg-jobbridge"
}

variable "acr_name" {
  description = "ACR name (from Layer 01)"
  type        = string
  default     = "acrjobbridge"
}

# ── AKS cluster config ─────────────────────────────────────────────────────
variable "aks_cluster_name" {
  description = "AKS cluster name"
  type        = string
  default     = "aks-jobbridge"
}

variable "aks_dns_prefix" {
  description = "DNS prefix for AKS"
  type        = string
  default     = "jobbridge"
}

variable "kubernetes_version" {
  description = "Kubernetes version. Set null to let Azure choose a supported default for the region/SKU."
  type        = string
  default     = null
}

variable "aks_sku_tier" {
  description = "AKS SKU tier (Free = no SLA but $0)"
  type        = string
  default     = "Free"
}

# ── Node pool ───────────────────────────────────────────────────────────────
variable "node_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_B2s" # ~$30/month – cheapest viable
}

variable "node_enable_auto_scaling" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = true
}

variable "node_min_count" {
  description = "Minimum node count"
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Maximum node count"
  type        = number
  default     = 2
}

variable "node_os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 30
}

variable "node_max_pods" {
  description = "Max pods per node"
  type        = number
  default     = 50
}

# ── Addons ──────────────────────────────────────────────────────────────────
variable "enable_keyvault_secrets_provider" {
  description = "Enable Key Vault CSI Secret Store driver"
  type        = bool
  default     = true
}

# ── Network ─────────────────────────────────────────────────────────────────
variable "network_plugin" {
  description = "Network plugin (kubenet or azure)"
  type        = string
  default     = "kubenet"
}

# ── Tags ────────────────────────────────────────────────────────────────────
variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    project     = "jobbridge"
    environment = "production"
    managed_by  = "terraform"
  }
}
