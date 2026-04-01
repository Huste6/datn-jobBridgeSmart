variable "location" {
  description = "Azure region"
  type        = string
  default     = "southeastasia"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "rg-jobbridge"
}

variable "acr_name" {
  description = "ACR name (globally unique, alphanumeric only)"
  type        = string
  default     = "acrjobbridge"
}

variable "acr_sku" {
  description = "ACR SKU"
  type        = string
  default     = "Basic" # $5/month – cheapest
}

variable "acr_admin_enabled" {
  description = "Enable ACR admin user"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    project     = "jobbridge"
    environment = "production"
    managed_by  = "terraform"
  }
}
