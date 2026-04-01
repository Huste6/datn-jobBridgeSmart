output "keyvault_name" {
  description = "Key Vault name"
  value       = module.keyvault.name
}

output "keyvault_uri" {
  description = "Key Vault URI"
  value       = module.keyvault.vault_uri
}

output "keyvault_tenant_id" {
  description = "Key Vault tenant ID (for SecretProviderClass)"
  value       = module.keyvault.tenant_id
}

output "keyvault_secrets_provider_identity_client_id" {
  description = "AKS CSI identity client ID (for SecretProviderClass userAssignedIdentityID)"
  value       = data.azurerm_kubernetes_cluster.aks.key_vault_secrets_provider[0].secret_identity[0].client_id
}
