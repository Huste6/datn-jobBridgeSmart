#!/bin/bash
set -e

# setup-tfstate-backend.sh
# Script to bootstrap the prerequisites (Resource Group, Storage Account, Container) 
# needed for Terraform Azure remote state backend.

# Default variables
RESOURCE_GROUP_NAME="rg-terraform-state"
STORAGE_ACCOUNT_NAME="stjobbridgetfstate1" # Must be globally unique, change if needed
CONTAINER_NAME="tfstate"
LOCATION="eastus"

echo "Checking Azure CLI authentication..."
az account show > /dev/null 2>&1 || {
    echo "You are not logged in. Running 'az login'..."
    az login
}

echo "Bootstrapping Terraform Remote State Backend in Azure..."
echo "------------------------------------------------------------"

# 1. Create Resource Group
echo ">>> Creating Resource Group: $RESOURCE_GROUP_NAME in $LOCATION..."
az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION" > /dev/null

# 2. Create Storage Account
echo ">>> Creating Storage Account: $STORAGE_ACCOUNT_NAME..."
az storage account create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$STORAGE_ACCOUNT_NAME" \
    --sku Standard_LRS \
    --encryption-services blob > /dev/null

# 3. Create Blob Container
echo ">>> Creating Storage Container: $CONTAINER_NAME..."
# Fetch the storage account key
ACCOUNT_KEY=$(az storage account keys list \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --query '[0].value' \
    -o tsv)

az storage container create \
    --name "$CONTAINER_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$ACCOUNT_KEY" > /dev/null

echo "------------------------------------------------------------"
echo "🎉 Terraform State Storage Account successfully created!"
echo ""
echo "Update your 'backend.tf' files with the following configuration:"
echo "------------------------------------------------------------"
cat <<EOF
terraform {
  backend "azurerm" {
    resource_group_name  = "$RESOURCE_GROUP_NAME"
    storage_account_name = "$STORAGE_ACCOUNT_NAME"
    container_name       = "$CONTAINER_NAME"
    key                  = "terraform.tfstate" # (Change key for each layer, e.g. 01-foundation.tfstate)
  }
}
EOF
echo "------------------------------------------------------------"
