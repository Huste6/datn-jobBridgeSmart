terraform {
  # Mặc định dùng local state.
  # Để dùng remote state (ví dụ Azure Storage), uncomment và cấu hình:
  #
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "stjobbridgetfstate"
  #   container_name       = "tfstate"
  #   key                  = "01-foundation.tfstate"
  # }
}
