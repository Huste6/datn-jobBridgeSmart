###############################################################################
# Layer 03 – Security (Key Vault + Secrets)
# Depends on Layer 01 (RG) + Layer 02 (AKS identity)
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
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# ── Lookup resources from previous layers ──────────────────────────────────
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

data "azurerm_client_config" "current" {}

data "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_cluster_name
  resource_group_name = var.resource_group_name
}

# ── Key Vault ──────────────────────────────────────────────────────────────
module "keyvault" {
  source              = "../../modules/keyvault"
  name                = var.keyvault_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id

  # Access policies
  deployer_object_id            = data.azurerm_client_config.current.object_id
  aks_secret_provider_object_id = data.azurerm_kubernetes_cluster.aks.key_vault_secrets_provider[0].secret_identity[0].object_id

  # Application secrets
  secrets = {
    "JWT-SECRET"            = var.jwt_secret
    "OPENAI-API-KEY"        = var.openai_api_key
    "CLOUDINARY-URL"        = var.cloudinary_url
    "CLOUDINARY-FOLDER"     = var.cloudinary_folder
    "CLOUDINARY-API-KEY"    = var.cloudinary_api_key
    "CLOUDINARY-API-SECRET" = var.cloudinary_api_secret
  }

  tags = var.tags
}
