output "id" {
  description = "Container registry ID"
  value       = azurerm_container_registry.this.id
}

output "name" {
  description = "Container registry name"
  value       = azurerm_container_registry.this.name
}

output "login_server" {
  description = "Login server URL (e.g. myacr.azurecr.io)"
  value       = azurerm_container_registry.this.login_server
}

output "admin_username" {
  description = "Admin username"
  value       = azurerm_container_registry.this.admin_username
  sensitive   = true
}

output "admin_password" {
  description = "Admin password"
  value       = azurerm_container_registry.this.admin_password
  sensitive   = true
}
