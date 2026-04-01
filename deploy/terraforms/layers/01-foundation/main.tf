###############################################################################
# Layer 01 – Foundation (Resource Group + ACR)
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }
}

provider "azurerm" {
  features {}
}

# ── Resource Group ─────────────────────────────────────────────────────────
module "rg" {
  source   = "../../modules/resource-group"
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# ── Azure Container Registry ──────────────────────────────────────────────
module "acr" {
  source              = "../../modules/acr"
  name                = var.acr_name
  resource_group_name = module.rg.name
  location            = module.rg.location
  sku                 = var.acr_sku
  admin_enabled       = var.acr_admin_enabled
  tags                = var.tags
}
