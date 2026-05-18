# 6) Deployment Architecture Diagram

## File can ve
- `deployment_architecture.png`

## Noi dung can co
So do trien khai day du cua he thong JobBridge AI tren Azure, the hien:
- Developer push code len GitHub
- GitHub Actions CI: build Docker image, scan, push len ACR (Azure Container Registry)
- ArgoCD (chay trong AKS) detect thay doi Helm values, sync len cluster
- AKS Cluster chua: Ingress Controller, 4 Pod (frontend, gateway, auth, jobs, ai), MongoDB StatefulSet
- Ngoai cluster: Azure Key Vault (luu secrets), Cloudinary (luu CV/avatar), OpenAI API

## Bo cuc goi y (tu trai sang phai, tu tren xuong duoi)

```
[Developer] --> [GitHub Repository]
                    |
             [GitHub Actions CI]
             (build, test, scan, push)
                    |
             [Azure Container Registry (ACR)]
                    |
             [ArgoCD] <-- (watch Helm values)
                    |
         [Azure Kubernetes Service (AKS)]
         +----------------------------------+
         |  [Ingress NGINX]                |
         |  [Frontend Pod]                 |
         |  [API Gateway Pod]              |
         |  [Auth Service Pod]             |
         |  [Jobs Service Pod]             |
         |  [AI Service Pod]               |
         |  [MongoDB StatefulSet]          |
         +----------------------------------+
                    |           |          |
          [Azure Key Vault] [Cloudinary] [OpenAI API]
```

## Prompt goi y de gen anh (copy vao chat gen anh)
"Ve so do deployment architecture cho JobBridge AI. Phong cach ky thuat, nen sang, chu ro. Bo cuc tu tren xuong duoi va tu trai sang phai. Gom cac thanh phan: (1) Developer push code len GitHub; (2) GitHub Actions CI: build Docker image, Trivy scan, push len Azure Container Registry (ACR); (3) ArgoCD detect Helm values change, sync xuong AKS; (4) Khoi AKS Cluster ben trong co: Ingress NGINX, Frontend Nginx Pod, API Gateway Go Pod, Auth Service Pod, Jobs Service Pod, AI Service Pod, MongoDB StatefulSet; (5) Ben ngoai cluster co: Azure Key Vault (luu JWT/secrets), Cloudinary CDN (luu CV/avatar file), OpenAI API (AI inference). Ve mui ten luong: Developer -> GitHub -> CI -> ACR -> ArgoCD -> AKS. Ve mui ten tu cac Pod ben trong AKS ra ngoai: AI Service -> OpenAI API, Auth Service -> Cloudinary, tat ca Service -> Key Vault. Dung mau xanh duong cho Azure thanh phan, vang cho external API, xanh la cho Kubernetes cluster."

## Ten file chinh xac
deployment_architecture.png
