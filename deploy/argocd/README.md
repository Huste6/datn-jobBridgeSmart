# Argo CD GitOps Deployment (AKS)

This repository already has a GitOps update workflow in [.github/workflows/deploy-aks.yml](../../.github/workflows/deploy-aks.yml) that writes image tags to [deploy/helm/jobbridge/values-azure-argocd.yaml](../helm/jobbridge/values-azure-argocd.yaml).

After Argo CD is installed, it watches Git commits and auto-syncs the Helm release to AKS.

## What this folder contains

- [deploy/argocd/jobbridge-application.yaml](jobbridge-application.yaml): Argo CD Application for JobBridge Helm chart.
- [deploy/argocd/argocd-cmd-params-cm.yaml](argocd-cmd-params-cm.yaml): Enables Argo CD server insecure mode for HTTP ingress.
- [deploy/argocd/argocd-server-ingress.yaml](argocd-server-ingress.yaml): NGINX ingress for Argo CD UI.

## Bootstrap from local machine

1. Make sure your `kubectl` context points to AKS.
2. Run:

```bash
bash deploy/scripts/bootstrap-argocd.sh argocd.jobbridge.duckdns.org https://github.com/Huste6/datn-jobBridgeSmart.git main
```

## Bootstrap from GitHub Actions

Use workflow [.github/workflows/bootstrap-argocd.yml](../../.github/workflows/bootstrap-argocd.yml) with `workflow_dispatch`.

Inputs:

- `aks_resource_group`: AKS resource group (example: `rg-jobbridge`)
- `aks_cluster_name`: AKS cluster name (example: `aks-jobbridge`)
- `argocd_host`: host for Argo CD UI
- `app_repo_url`: repo Argo CD tracks
- `app_target_revision`: branch/tag Argo CD tracks

## UI access

- Primary URL: `http://<argocd_host>`
- Username: `admin`
- Initial password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo
```

If DNS is not ready, temporary local access:

```bash
kubectl -n argocd port-forward svc/argocd-server 8081:80
```

Open `http://localhost:8081`.

## GitOps flow in this project

1. CI builds and pushes container images to ACR.
2. [.github/workflows/deploy-aks.yml](../../.github/workflows/deploy-aks.yml) updates [deploy/helm/jobbridge/values-azure-argocd.yaml](../helm/jobbridge/values-azure-argocd.yaml) and commits changes to Git.
3. Argo CD detects the new Git commit and syncs the Helm release to AKS.
4. You can verify commit-to-cluster drift and sync status in the Argo CD UI.