###############################################################################
# Module: Azure Kubernetes Service
###############################################################################

resource "azurerm_kubernetes_cluster" "this" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  # Free tier = $0 for control plane (no SLA)
  sku_tier = var.sku_tier

  # ── Default node pool ────────────────────────────────────────────────────
  default_node_pool {
    name                = var.node_pool_name
    vm_size             = var.node_vm_size
    enable_auto_scaling = var.node_enable_auto_scaling
    min_count           = var.node_enable_auto_scaling ? var.node_min_count : null
    max_count           = var.node_enable_auto_scaling ? var.node_max_count : null
    node_count          = var.node_enable_auto_scaling ? null : var.node_count
    os_disk_size_gb     = var.node_os_disk_size_gb
    os_disk_type        = var.node_os_disk_type
    max_pods            = var.node_max_pods
  }

  # ── Identity ─────────────────────────────────────────────────────────────
  identity {
    type = "SystemAssigned"
  }

  # ── Key Vault Secrets Provider (CSI driver) ──────────────────────────────
  dynamic "key_vault_secrets_provider" {
    for_each = var.enable_keyvault_secrets_provider ? [1] : []
    content {
      secret_rotation_enabled  = true
      secret_rotation_interval = "5m"
    }
  }

  # ── Network ──────────────────────────────────────────────────────────────
  network_profile {
    network_plugin    = var.network_plugin
    load_balancer_sku = "standard"
  }

  tags = var.tags
}

# ---------------------------------------------------------------------------
# ACR Pull role assignment – allow AKS to pull images
# ---------------------------------------------------------------------------
resource "azurerm_role_assignment" "acr_pull" {
  count                            = var.acr_id != "" ? 1 : 0
  principal_id                     = azurerm_kubernetes_cluster.this.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = var.acr_id
  skip_service_principal_aad_check = true
}
