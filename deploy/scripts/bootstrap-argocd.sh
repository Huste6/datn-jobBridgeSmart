#!/usr/bin/env bash
set -euo pipefail

# bootstrap-argocd.sh
# Installs Argo CD into AKS, exposes UI via ingress-nginx, and bootstraps JobBridge app.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$SCRIPT_DIR/../.."

ARGOCD_NAMESPACE="${ARGOCD_NAMESPACE:-argocd}"
ARGOCD_HOST="${1:-argocd.jobbridge.duckdns.org}"
APP_REPO_URL="${2:-https://github.com/Huste6/datn-jobBridgeSmart.git}"
APP_TARGET_REVISION="${3:-main}"
APP_NAME="${4:-jobbridge}"
CERT_MANAGER_NAMESPACE="${CERT_MANAGER_NAMESPACE:-cert-manager}"
CERT_MANAGER_VERSION="${CERT_MANAGER_VERSION:-v1.15.3}"

for cmd in kubectl sed; do
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo "Error: required command '$cmd' is not installed."
    exit 1
  fi
done

echo "Checking Kubernetes connectivity..."
kubectl cluster-info > /dev/null

echo "Installing/refreshing cert-manager (required for TLS certificates)..."
kubectl apply -f "https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.crds.yaml"
kubectl apply -f "https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml"

echo "Waiting for cert-manager deployments..."
for dep in cert-manager cert-manager-webhook cert-manager-cainjector; do
  kubectl -n "$CERT_MANAGER_NAMESPACE" rollout status "deployment/$dep" --timeout=300s
done

echo "Ensuring namespace '$ARGOCD_NAMESPACE' exists..."
kubectl create namespace "$ARGOCD_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "Installing/refreshing Argo CD core components..."
if ! kubectl apply -n "$ARGOCD_NAMESPACE" -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"; then
  echo "Standard apply failed. Retrying with server-side apply to avoid CRD annotation size issues..."
  kubectl apply --server-side -n "$ARGOCD_NAMESPACE" -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"
fi

if ! kubectl get crd applicationsets.argoproj.io > /dev/null 2>&1; then
  echo "ApplicationSet CRD is missing. Installing it with server-side apply..."
  kubectl apply --server-side -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/crds/applicationset-crd.yaml"
fi

echo "Waiting for required Argo CD deployments..."
kubectl -n "$ARGOCD_NAMESPACE" rollout status "statefulset/argocd-application-controller" --timeout=300s
for dep in argocd-repo-server argocd-server; do
  kubectl -n "$ARGOCD_NAMESPACE" rollout status "deployment/$dep" --timeout=300s
done

echo "Configuring Argo CD server for HTTP behind ingress..."
kubectl apply -f "$REPO_ROOT/deploy/argocd/argocd-cmd-params-cm.yaml"
kubectl -n "$ARGOCD_NAMESPACE" rollout restart deployment argocd-server
kubectl -n "$ARGOCD_NAMESPACE" rollout status deployment/argocd-server --timeout=300s

echo "Applying Argo CD UI ingress for host: $ARGOCD_HOST"
tmp_ingress_manifest="$(mktemp)"
sed "s|__ARGOCD_HOST__|$ARGOCD_HOST|g" "$REPO_ROOT/deploy/argocd/argocd-server-ingress.yaml" > "$tmp_ingress_manifest"
kubectl apply -f "$tmp_ingress_manifest"
rm -f "$tmp_ingress_manifest"

echo "Setting Argo CD external URL to match ingress host..."
kubectl -n "$ARGOCD_NAMESPACE" patch configmap argocd-cm --type merge -p "{\"data\":{\"url\":\"https://$ARGOCD_HOST\"}}"

echo "Applying JobBridge Application manifest..."
kubectl apply -f "$REPO_ROOT/deploy/argocd/jobbridge-application.yaml"

echo "Patching app source to repo '$APP_REPO_URL' @ '$APP_TARGET_REVISION'..."
kubectl -n "$ARGOCD_NAMESPACE" patch application "$APP_NAME" --type merge -p "{\"spec\":{\"source\":{\"repoURL\":\"$APP_REPO_URL\",\"targetRevision\":\"$APP_TARGET_REVISION\"}}}"

echo "Current Argo CD application status:"
kubectl -n "$ARGOCD_NAMESPACE" get application "$APP_NAME" -o wide

echo ""
echo "Argo CD UI: https://$ARGOCD_HOST"
echo "Username: admin"
echo "Initial password command:"
echo "kubectl -n $ARGOCD_NAMESPACE get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo"
echo ""
echo "If DNS is not ready yet, temporary local access:"
echo "kubectl -n $ARGOCD_NAMESPACE port-forward svc/argocd-server 8081:80"
echo "Open http://localhost:8081"
