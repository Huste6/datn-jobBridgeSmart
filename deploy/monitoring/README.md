# Monitoring Stack (Prometheus + Grafana)

This folder contains the monitoring values used to deploy
`kube-prometheus-stack` into namespace `monitoring`.

## Public Grafana HTTPS

The values file enables Grafana ingress with cert-manager on:

- `https://grafana.jobbridge.duckdns.org`

TLS secret:

- `monitoring-grafana-tls`

## Install

```bash
bash deploy/scripts/install-monitoring.sh
```

The install script also applies custom dashboard manifest automatically when present:

- `deploy/monitoring/jobbridge-dashboard-configmap.yaml`
- `deploy/monitoring/jobbridge-pod-stress-dashboard-configmap.yaml`

## Verify

```bash
kubectl -n monitoring get pods
kubectl -n monitoring get svc
kubectl -n monitoring get ingress,certificate,secret
```

## Enable API metrics source (ingress-nginx)

Run once so Prometheus can collect ingress request/error/latency metrics:

```bash
helm upgrade ingress-nginx ingress-nginx/ingress-nginx \
	--namespace ingress-nginx \
	--reuse-values \
	--set controller.metrics.enabled=true \
	--set controller.metrics.serviceMonitor.enabled=true \
	--set controller.metrics.serviceMonitor.additionalLabels.release=monitoring
```

## Install custom JobBridge dashboard

```bash
kubectl apply -f deploy/monitoring/jobbridge-dashboard-configmap.yaml
```

Dashboard name:

- `JobBridge - API & Pod Health`
- `JobBridge - Pod Stress Test`

`JobBridge - Pod Stress Test` lets you pick a specific pod and visualize:

- CPU usage vs CPU limit
- Memory usage vs Memory limit
- Network Rx/Tx
- Restarts in last 15 minutes

## Access Grafana from local machine

```bash
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
```

Open: http://localhost:3000

Get admin password:

```bash
kubectl -n monitoring get secret monitoring-grafana -o jsonpath='{.data.admin-password}' | base64 -d; echo
```
