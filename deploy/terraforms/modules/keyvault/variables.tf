variable "name" {
  description = "Key Vault name (globally unique)"
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

variable "tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
}

variable "sku_name" {
  description = "Key Vault SKU (standard or premium)"
  type        = string
  default     = "standard"
}

variable "soft_delete_retention_days" {
  description = "Soft delete retention in days (7-90)"
  type        = number
  default     = 7
}

variable "purge_protection_enabled" {
  description = "Enable purge protection"
  type        = bool
  default     = false
}

# ── Access ──────────────────────────────────────────────────────────────────
variable "deployer_object_id" {
  description = "Object ID of the user/SP running Terraform (for managing secrets)"
  type        = string
}

variable "aks_secret_provider_object_id" {
  description = "Object ID of the AKS Key Vault CSI identity. Empty to skip."
  type        = string
  default     = ""
}

# ── Secrets ─────────────────────────────────────────────────────────────────
variable "secrets" {
  description = "Map of secret name → value to create in the vault"
  type        = map(string)
  default     = {}
}

# ── Tags ────────────────────────────────────────────────────────────────────
variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}
