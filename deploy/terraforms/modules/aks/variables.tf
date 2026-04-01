# ── Cluster ─────────────────────────────────────────────────────────────────
variable "name" {
  description = "AKS cluster name"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix for the cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.30"
}

variable "sku_tier" {
  description = "AKS SKU tier (Free or Standard)"
  type        = string
  default     = "Free"
}

# ── Node pool ───────────────────────────────────────────────────────────────
variable "node_pool_name" {
  description = "Name of the default node pool"
  type        = string
  default     = "system"
}

variable "node_vm_size" {
  description = "VM size for nodes"
  type        = string
  default     = "Standard_B2s"
}

variable "node_enable_auto_scaling" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = true
}

variable "node_min_count" {
  description = "Minimum node count (when autoscaling enabled)"
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Maximum node count (when autoscaling enabled)"
  type        = number
  default     = 2
}

variable "node_count" {
  description = "Fixed node count (when autoscaling disabled)"
  type        = number
  default     = 1
}

variable "node_os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 30
}

variable "node_os_disk_type" {
  description = "OS disk type (Managed or Ephemeral)"
  type        = string
  default     = "Managed"
}

variable "node_max_pods" {
  description = "Maximum pods per node"
  type        = number
  default     = 50
}

# ── Addons ──────────────────────────────────────────────────────────────────
variable "enable_keyvault_secrets_provider" {
  description = "Enable Azure Key Vault Secrets Provider CSI driver"
  type        = bool
  default     = true
}

# ── Network ─────────────────────────────────────────────────────────────────
variable "network_plugin" {
  description = "Network plugin (kubenet or azure)"
  type        = string
  default     = "kubenet"
}

# ── ACR integration ────────────────────────────────────────────────────────
variable "acr_id" {
  description = "ACR resource ID to grant AcrPull role. Empty string to skip."
  type        = string
  default     = ""
}

# ── Tags ────────────────────────────────────────────────────────────────────
variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
