#!/bin/bash
set -e

# setup-azure.sh
# One-time setup script to push all variables from .env to Azure Key Vault

# Default values
KV_NAME=$1
ENV_FILE=$2

if [ -z "$KV_NAME" ]; then
    echo "Usage: $0 <keyvault-name> [path/to/.env]"
    echo "Example: $0 kv-jobbridge-prod ../../backend/.env"
    exit 1
fi

if [ -z "$ENV_FILE" ]; then
    # Default to interpreting path relative to the script location
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    ENV_FILE="$SCRIPT_DIR/../../backend/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

echo "Verifying Azure CLI authentication..."
az account show > /dev/null 2>&1 || {
    echo "Not logged in. Running 'az login'..."
    az login
}

echo "Reading secrets from $ENV_FILE and pushing to Azure Key Vault: '$KV_NAME'..."
echo "------------------------------------------------------------"

# Read .env file line by line
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines, lines with only whitespace, and comments
    if [[ -z "${key// /}" ]] || [[ "$key" =~ ^[[:space:]]*#.* ]]; then
        continue
    fi

    # Strip carriage returns (\r) often found in Windows files
    key=$(echo "$key" | tr -d '\r')
    value=$(echo "$value" | tr -d '\r')

    # Remove enclosing quotes from value if they exist
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Azure Key Vault secret names can only contain alphanumeric characters and dashes.
    # Convert underscores to hyphens (e.g. JWT_SECRET -> JWT-SECRET).
    kv_secret_name=$(echo "$key" | tr '_' '-')

    echo "Updating secret: $kv_secret_name ..."
    
    # Execute the Azure CLI command to set/create the secret
    if az keyvault secret set --vault-name "$KV_NAME" --name "$kv_secret_name" --value "$value" > /dev/null 2>&1; then
        echo "  [OK] Successfully created/updated: $kv_secret_name"
    else
        echo "  [ERROR] Failed to set $kv_secret_name. Do you have 'Key Vault Secrets Officer' role assigned?"
    fi
done < "$ENV_FILE"

echo "------------------------------------------------------------"
echo "Done! All configuration secrets pushed to $KV_NAME."
