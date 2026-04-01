###############################################################################
# Module: Azure Key Vault
###############################################################################

resource "azurerm_key_vault" "this" {
  name                       = var.name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = var.tenant_id
  sku_name                   = var.sku_name
  soft_delete_retention_days = var.soft_delete_retention_days
  purge_protection_enabled   = var.purge_protection_enabled

  tags = var.tags
}

# ---------------------------------------------------------------------------
# Access Policy – Deployer (user or service principal running Terraform)
# ---------------------------------------------------------------------------
resource "azurerm_key_vault_access_policy" "deployer" {
  key_vault_id = azurerm_key_vault.this.id
  tenant_id    = var.tenant_id
  object_id    = var.deployer_object_id

  secret_permissions = [
    "Get", "List", "Set", "Delete", "Purge", "Recover",
  ]
}

# ---------------------------------------------------------------------------
# Access Policy – AKS CSI Secret Store Provider identity
# ---------------------------------------------------------------------------
resource "azurerm_key_vault_access_policy" "aks_csi" {
  count        = var.aks_secret_provider_object_id != "" ? 1 : 0
  key_vault_id = azurerm_key_vault.this.id
  tenant_id    = var.tenant_id
  object_id    = var.aks_secret_provider_object_id

  secret_permissions = [
    "Get", "List",
  ]
}

# ---------------------------------------------------------------------------
# Secrets – created from a map so the module stays generic
# ---------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "this" {
  for_each     = var.secrets
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.deployer]
}
