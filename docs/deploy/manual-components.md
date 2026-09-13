---
title: Deploy each component
sidebar_position: 3
---

Build and load the images first. Run all commands from the Jafra repository
root.

## 1. cert-manager

The webhook certificate cannot become ready without cert-manager:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl wait --for=condition=Established crd/certificates.cert-manager.io --timeout=120s
kubectl rollout status deployment/cert-manager -n cert-manager --timeout=180s
kubectl rollout status deployment/cert-manager-webhook -n cert-manager --timeout=180s
kubectl rollout status deployment/cert-manager-cainjector -n cert-manager --timeout=180s
```

## 2. Controller

Do not register the webhook until its serving certificate and Deployment are
ready:

```bash
kubectl apply -f deploy/controller/namespace.yaml
kubectl apply -f deploy/controller/rbac.yaml
kubectl apply -f deploy/controller/certificate.yaml
kubectl wait --for=condition=Ready \
  certificate/jafra-controller-serving-cert \
  -n jafra-system --timeout=120s
kubectl apply -f deploy/controller/service.yaml
kubectl apply -f deploy/controller/deployment.yaml
kubectl rollout status deployment/jafra-controller \
  -n jafra-system --timeout=120s
kubectl apply -f deploy/controller/webhook.yaml
```

The service sends admission traffic to controller port `9443`. Metrics use
`8080`; health and readiness use `8081`.

## 3. Analyzer

```bash
kubectl apply -f deploy/analyzer/deployment.yaml
kubectl rollout status deployment/jafra-analyzer \
  -n jafra-system --timeout=180s
```

The manifest creates the PVC, Deployment, and Service. HTTP is port `8080`
and gRPC is port `9090`.

## 4. Agent

```bash
kubectl apply -f deploy/agent/rbac.yaml
kubectl apply -f deploy/agent/daemonset.yaml
kubectl rollout status daemonset/jafra-agent \
  -n jafra-system --timeout=120s
```

The manifest starts in `log-only`. After the analyzer is ready, enable
upload:

```bash
kubectl set env daemonset/jafra-agent \
  -n jafra-system JAFRA_MODE=grpc
kubectl rollout status daemonset/jafra-agent \
  -n jafra-system --timeout=120s
```

## 5. Smoke test

```bash
kubectl apply -f deploy/examples/checkpoint-1-pods.yaml
kubectl get pod plain-pod -o yaml
kubectl get pod profiled-pod -o yaml
```

This checkpoint verifies webhook mutation only. Its profiled Pod is not a
Java workload and therefore cannot validate JFR production. Use the
`auth-cache` example for the end-to-end pipeline.
