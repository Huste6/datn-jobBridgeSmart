# ── References to previous layers ──────────────────────────────────────────
variable "resource_group_name" {
  description = "Resource group name (from Layer 01)"
  type        = string
  default     = "rg-jobbridge"
}

variable "aks_cluster_name" {
  description = "AKS cluster name (from Layer 02)"
  type        = string
  default     = "aks-jobbridge"
}

# ── Key Vault config ───────────────────────────────────────────────────────
variable "keyvault_name" {
  description = "Key Vault name (globally unique)"
  type        = string
  default     = "kv-jobbridge"
}

# ── Application secrets ────────────────────────────────────────────────────
variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudinary_url" {
  description = "Cloudinary connection URL"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudinary_folder" {
  description = "Cloudinary upload folder"
  type        = string
  default     = "jobbridge/user"
}

variable "cloudinary_api_key" {
  description = "Cloudinary API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudinary_api_secret" {
  description = "Cloudinary API secret"
  type        = string
  sensitive   = true
  default     = ""
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
