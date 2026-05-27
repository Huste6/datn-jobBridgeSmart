# Kubernetes & Helm – Deploy lên AKS

## Tổng quan

Toàn bộ application được deploy lên AKS bằng **Helm chart** tại `deploy/helm/jobbridge/`.

```
deploy/helm/jobbridge/
├── Chart.yaml                  – Chart metadata
├── values.yaml                 – Default values (tất cả environments)
├── values-local.yaml           – Override cho local minikube/kind
├── values-azure.yaml           – Override cho Azure production
├── values-azure-argocd.yaml    – Target của ArgoCD auto-deploy (image tags tự động cập nhật)
└── templates/
    ├── _helpers.tpl            – Helm helper functions
    ├── app-workloads.yaml      – Deployments + Services + ConfigMaps
    ├── mongodb-statefulset.yaml – MongoDB StatefulSet
    ├── mongodb-service.yaml    – MongoDB Service
    ├── ingress.yaml            – Ingress NGINX
    ├── hpa.yaml                – HorizontalPodAutoscaler
    ├── pdb.yaml                – PodDisruptionBudget
    ├── secret.yaml             – Kubernetes Secret
    ├── secret-provider-class.yaml – Azure Key Vault CSI
    └── clusterissuer.yaml      – cert-manager ClusterIssuer
```

---

## Services được Deploy

Từ `values.yaml`, 5 services được define:

| Service | Image | Port | Replicas |
|---------|-------|------|---------|
| `frontend` | `nginx:latest` | 80 | 1 |
| `gateway` | `jobbridge-gateway` | 8080 | 1 |
| `auth` | `jobbridge-auth` | 8081 | 1 |
| `jobs` | `jobbridge-jobs` | 8082 | 1 |
| `ai` | `jobbridge-ai` | 8085 | 1 |

---

## Template: app-workloads.yaml

Template này loop qua danh sách services và tạo cho mỗi service:

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $name }}
spec:
  replicas: {{ $svc.replicas }}
  selector:
    matchLabels:
      app: {{ $name }}
  template:
    spec:
      containers:
        - name: {{ $name }}
          image: {{ $svc.image.repository }}:{{ $svc.image.tag }}
          ports:
            - containerPort: {{ $svc.port }}
          envFrom:
            - configMapRef:
                name: jobbridge-config
            - secretRef:
                name: jobbridge-secret  # hoặc Azure Key Vault CSI
```

### Service (ClusterIP)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ $name }}-svc
spec:
  type: ClusterIP
  selector:
    app: {{ $name }}
  ports:
    - port: {{ $svc.port }}
      targetPort: {{ $svc.port }}
```

---

## Template: MongoDB StatefulSet

MongoDB chạy như **StatefulSet** để đảm bảo stable storage:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
spec:
  serviceName: mongodb
  replicas: 1
  template:
    spec:
      containers:
        - name: mongodb
          image: mongo:7.0
          volumeMounts:
            - name: data
              mountPath: /data/db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 5Gi  # Azure Disk
```

---

## Template: Ingress

NGINX Ingress với TLS (cert-manager / Let's Encrypt):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - jobbridge.duckdns.org
      secretName: jobbridge-tls
  rules:
    - host: jobbridge.duckdns.org
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: gateway-svc
                port: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port: 80
```

---

## Template: Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ $name }}-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: {{ $name }}
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Template: Azure Key Vault CSI

Thay vì dùng Kubernetes Secret thông thường, production dùng Azure Key Vault CSI:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    keyvaultName: "kv-jobbridge"
    objects: |
      array:
        - |
          objectName: JWT-SECRET
          objectType: secret
        - |
          objectName: OPENAI-API-KEY
          objectType: secret
        # ... các secrets khác
  secretObjects:
    - secretName: jobbridge-secret
      type: Opaque
      data:
        - objectName: JWT-SECRET
          key: JWT_SECRET
```

Secrets được mount vào pod như environment variables, không lưu plaintext trong Git.

---

## Values Files

### values.yaml (Default)

```yaml
services:
  frontend:
    image:
      repository: nginx
      tag: latest
    port: 80
    replicas: 1

  gateway:
    image:
      repository: acrjobbridge.azurecr.io/jobbridge-gateway
      tag: latest
    port: 8080
    replicas: 1

  auth:
    image:
      repository: acrjobbridge.azurecr.io/jobbridge-auth
      tag: latest
    port: 8081
    replicas: 1

  jobs:
    image:
      repository: acrjobbridge.azurecr.io/jobbridge-jobs
      tag: latest
    port: 8082
    replicas: 1

  ai:
    image:
      repository: acrjobbridge.azurecr.io/jobbridge-ai
      tag: latest
    port: 8085
    replicas: 1

mongodb:
  enabled: true
  storage: 5Gi

ingress:
  enabled: true
  host: jobbridge.duckdns.org
  tls: true
```

### values-azure-argocd.yaml (CI/CD Target)

File này được CI/CD tự động cập nhật image tags:

```yaml
services:
  gateway:
    image:
      tag: sha-abc1234  # ← CI tự update
  auth:
    image:
      tag: sha-abc1234
  jobs:
    image:
      tag: sha-abc1234
  ai:
    image:
      tag: sha-abc1234
  frontend:
    image:
      tag: sha-abc1234
```

ArgoCD theo dõi file này và deploy khi có thay đổi.

---

## Chạy Helm thủ công

### Install lần đầu

```bash
# Kết nối AKS
az aks get-credentials --resource-group rg-jobbridge --name aks-jobbridge

# Install chart
helm install jobbridge ./deploy/helm/jobbridge \
  --namespace jobbridge \
  --create-namespace \
  --values ./deploy/helm/jobbridge/values-azure.yaml
```

### Upgrade

```bash
helm upgrade jobbridge ./deploy/helm/jobbridge \
  --namespace jobbridge \
  --values ./deploy/helm/jobbridge/values-azure.yaml
```

### Rollback

```bash
helm rollback jobbridge 1  # Rollback về revision 1
```

### Xem trạng thái

```bash
helm list -n jobbridge
kubectl get pods -n jobbridge
kubectl get svc -n jobbridge
kubectl get ingress -n jobbridge
```

---

## Local Development với Helm

```bash
# Dùng minikube hoặc kind
helm install jobbridge ./deploy/helm/jobbridge \
  --values ./deploy/helm/jobbridge/values-local.yaml
```

`values-local.yaml` override:
- Tắt TLS ingress
- Dùng local image tags
- Giảm resource requests

---

## Networking trong Cluster

```
[Internet] → [LoadBalancer (Azure)] → [Ingress NGINX]
                                              │
                              ┌───────────────┴───────────────┐
                              │  Rule: /api → gateway-svc:8080 │
                              │  Rule: / → frontend-svc:80     │
                              └───────────────────────────────┘

[Pods giao tiếp qua ClusterIP Services]
gateway-svc:8080 → gateway pod
auth-svc:8081    → auth pod
jobs-svc:8082    → jobs pod
ai-svc:8085      → ai pod
mongodb-svc:27017 → mongodb statefulset
```

Gateway config env vars trỏ đến service names:

```yaml
AUTH_SERVICE_URL: http://auth-svc:8081
JOBS_SERVICE_URL: http://jobs-svc:8082
AI_SERVICE_URL:   http://ai-svc:8085
```

---

## Monitoring

Prometheus + Grafana được cài bằng script:

```bash
chmod +x deploy/scripts/install-monitoring.sh
./deploy/scripts/install-monitoring.sh
```

Grafana dashboard tại: `https://grafana.jobbridge.duckdns.org`
