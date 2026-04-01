output "resource_group_name" {
  description = "Resource group name"
  value       = module.rg.name
}

output "resource_group_location" {
  description = "Resource group location"
  value       = module.rg.location
}

output "acr_login_server" {
  description = "ACR login server URL"
  value       = module.acr.login_server
}

output "acr_name" {
  description = "ACR name"
  value       = module.acr.name
}

output "acr_id" {
  description = "ACR resource ID"
  value       = module.acr.id
}

output "acr_admin_username" {
  description = "ACR admin username"
  value       = module.acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "ACR admin password"
  value       = module.acr.admin_password
  sensitive   = true
}
