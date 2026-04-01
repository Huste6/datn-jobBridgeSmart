output "id" {
  description = "AKS cluster ID"
  value       = azurerm_kubernetes_cluster.this.id
}

output "name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.this.name
}

output "kube_config_raw" {
  description = "Raw kubeconfig for kubectl"
  value       = azurerm_kubernetes_cluster.this.kube_config_raw
  sensitive   = true
}

output "kube_config_host" {
  description = "Kubernetes API server host"
  value       = azurerm_kubernetes_cluster.this.kube_config[0].host
  sensitive   = true
}

# ── Identity outputs (needed by Key Vault layer) ───────────────────────────
output "kubelet_identity_object_id" {
  description = "Object ID of the kubelet managed identity"
  value       = azurerm_kubernetes_cluster.this.kubelet_identity[0].object_id
}

output "keyvault_secrets_provider_identity_client_id" {
  description = "Client ID of the Key Vault secrets provider identity"
  value       = var.enable_keyvault_secrets_provider ? azurerm_kubernetes_cluster.this.key_vault_secrets_provider[0].secret_identity[0].client_id : ""
}

output "keyvault_secrets_provider_identity_object_id" {
  description = "Object ID of the Key Vault secrets provider identity"
  value       = var.enable_keyvault_secrets_provider ? azurerm_kubernetes_cluster.this.key_vault_secrets_provider[0].secret_identity[0].object_id : ""
}
