#!/bin/bash
set -e

# deploy-infra.sh
# Script to orchestrate and deploy all Terraform layers sequentially

echo "Checking Azure CLI authentication..."
az account show > /dev/null 2>&1 || {
    echo "You are not logged in. Running 'az login'..."
    az login
}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$SCRIPT_DIR/../../deploy/terraforms/layers"

LAYERS=(
    "01-foundation"
    "02-cluster"
    "03-security"
)

echo "Starting automated deployment for all infrastructure layers..."
echo "------------------------------------------------------------"

for LAYER in "${LAYERS[@]}"; do
    LAYER_DIR="$BASE_DIR/$LAYER"
    
    if [ ! -d "$LAYER_DIR" ]; then
        echo "Directory $LAYER_DIR does not exist. Skipping..."
        continue
    fi

    echo ">>> Deploying Layer: $LAYER..."
    cd "$LAYER_DIR" || exit 1

    # Format code
    terraform fmt

    # Initialize Terraform (will download providers or authenticate backend)
    echo "  > Running terraform init..."
    terraform init -input=false

    # Apply the configuration automatically
    echo "  > Running terraform apply..."
    terraform apply -auto-approve

    echo ">>> Finished applying Layer: $LAYER"
    echo "------------------------------------------------------------"
done

echo "🎉 All Terraform infrastructure layers successfully deployed!"
echo "Next step: You can now deploy your application via Helm."
