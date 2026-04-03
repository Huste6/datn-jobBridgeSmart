# ============================================================================
# Layer 02: Cluster – Copy thành terraform.tfvars rồi điền giá trị
# ============================================================================

# References từ Layer 01
resource_group_name = "rg-jobbridge"
acr_name            = "acrjobbridge"

# AKS config
aks_cluster_name = "aks-jobbridge"
aks_dns_prefix   = "jobbridge"
# Leave version unset so Azure picks a currently supported version for this region and SKU.
# kubernetes_version = "1.29.x"
aks_sku_tier = "Free" # $0 – no SLA

# Node pool – tối ưu chi phí
node_vm_size             = "Standard_B2als_v2" # Cheaper burstable option available in malaysiawest
node_enable_auto_scaling = false              # Keep exactly 1 node for lowest predictable cost
node_min_count           = 1
node_max_count           = 1
node_os_disk_size_gb     = 30
node_max_pods            = 50

# Addons
enable_keyvault_secrets_provider = true

# Network
network_plugin = "kubenet"
