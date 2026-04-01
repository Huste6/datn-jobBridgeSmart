output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.name
}

output "aks_id" {
  description = "AKS cluster ID"
  value       = module.aks.id
}

output "kube_config_raw" {
  description = "Raw kubeconfig"
  value       = module.aks.kube_config_raw
  sensitive   = true
}

output "kubelet_identity_object_id" {
  description = "Kubelet managed identity object ID"
  value       = module.aks.kubelet_identity_object_id
}

output "keyvault_secrets_provider_identity_client_id" {
  description = "Key Vault CSI provider identity client ID (for SecretProviderClass)"
  value       = module.aks.keyvault_secrets_provider_identity_client_id
}

output "keyvault_secrets_provider_identity_object_id" {
  description = "Key Vault CSI provider identity object ID (for Key Vault access policy)"
  value       = module.aks.keyvault_secrets_provider_identity_object_id
}
