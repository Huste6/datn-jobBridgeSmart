# ============================================================================
# Layer 03: Security – Copy thành terraform.tfvars rồi điền giá trị
# QUAN TRỌNG: File này chứa secrets, KHÔNG commit lên git!
# ============================================================================

# References từ Layer 01 & 02
resource_group_name = "rg-jobbridge"
aks_cluster_name    = "aks-jobbridge"

# Key Vault name phải globally unique
keyvault_name = "kv-jobbridge"

# Secrets – thay bằng giá trị thật
jwt_secret          = "your-strong-jwt-secret-here"
openai_api_key      = ""
cloudinary_url      = ""
cloudinary_folder   = "jobbridge/user"
cloudinary_api_key  = ""
cloudinary_api_secret = ""
