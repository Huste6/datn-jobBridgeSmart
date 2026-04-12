#!/usr/bin/env bash
set -euo pipefail

# Install Prometheus + Grafana stack into namespace monitoring.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$SCRIPT_DIR/../.."
NAMESPACE="${MONITORING_NAMESPACE:-monitoring}"
RELEASE_NAME="${MONITORING_RELEASE_NAME:-monitoring}"
VALUES_FILE="${MONITORING_VALUES_FILE:-$REPO_ROOT/deploy/monitoring/kube-prometheus-stack-values.yaml}"

for cmd in helm kubectl; do
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo "Error: required command '$cmd' is not installed."
    exit 1
  fi
done

if [ ! -f "$VALUES_FILE" ]; then
  echo "Error: values file not found: $VALUES_FILE"
  exit 1
fi

echo "Checking Kubernetes connectivity..."
kubectl cluster-info > /dev/null

echo "Adding/updating Helm repo prometheus-community..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts > /dev/null 2>&1 || true
helm repo update > /dev/null

echo "Installing/upgrading kube-prometheus-stack in namespace '$NAMESPACE'..."
helm upgrade --install "$RELEASE_NAME" prometheus-community/kube-prometheus-stack \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values "$VALUES_FILE"

echo "Waiting for core deployments..."
kubectl -n "$NAMESPACE" rollout status deployment/"$RELEASE_NAME"-kube-prometheus-operator --timeout=600s
kubectl -n "$NAMESPACE" rollout status deployment/"$RELEASE_NAME"-grafana --timeout=600s

shopt -s nullglob
dashboard_files=("$REPO_ROOT"/deploy/monitoring/*dashboard-configmap.yaml)
shopt -u nullglob

for dashboard_file in "${dashboard_files[@]}"; do
  echo "Applying dashboard manifest: $dashboard_file"
  kubectl apply -f "$dashboard_file"
done

echo "Monitoring stack installed."
echo "Grafana admin password command:"
echo "kubectl -n $NAMESPACE get secret $RELEASE_NAME-grafana -o jsonpath='{.data.admin-password}' | base64 -d; echo"
echo "Local access command:"
echo "kubectl -n $NAMESPACE port-forward svc/$RELEASE_NAME-grafana 3000:80"
echo "Open http://localhost:3000"
