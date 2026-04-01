###############################################################################
# Layer 02 – Cluster (AKS)
# Depends on Layer 01 (Resource Group + ACR must exist)
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

# ── Lookup resources from Layer 01 ─────────────────────────────────────────
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = var.resource_group_name
}

# ── AKS Cluster ───────────────────────────────────────────────────────────
module "aks" {
  source              = "../../modules/aks"
  name                = var.aks_cluster_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  dns_prefix          = var.aks_dns_prefix
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.aks_sku_tier

  # Node pool – budget optimized
  node_vm_size             = var.node_vm_size
  node_enable_auto_scaling = var.node_enable_auto_scaling
  node_min_count           = var.node_min_count
  node_max_count           = var.node_max_count
  node_os_disk_size_gb     = var.node_os_disk_size_gb
  node_max_pods            = var.node_max_pods

  # Addons
  enable_keyvault_secrets_provider = var.enable_keyvault_secrets_provider

  # Network
  network_plugin = var.network_plugin

  # ACR integration
  acr_id = data.azurerm_container_registry.acr.id

  tags = var.tags
}
