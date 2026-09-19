---
title: Validate your installation
sidebar_position: 1
---

Use these checks to follow one recording from workload enrollment to central
analysis.

## 1. Control plane

```bash
kubectl get certificate -n jafra-system
kubectl get deployment jafra-controller -n jafra-system
kubectl get mutatingwebhookconfiguration jafra-controller
kubectl logs -n jafra-system deployment/jafra-controller
```

The certificate and Deployment must be ready before the webhook is useful.

## 2. Pod mutation

```bash
kubectl apply -f deploy/examples/checkpoint-1-pods.yaml
kubectl get pod plain-pod -o jsonpath='{.metadata.annotations.jafra\.io/injected}{"\n"}'
kubectl get pod profiled-pod -o jsonpath='{.metadata.annotations.jafra\.io/injected-version}{"\n"}'
```

The plain Pod should print no injection value. The profiled Pod should print
`0.0.2`. This checkpoint tests mutation, not JFR generation.

## 3. Java recording

```bash
kubectl apply -f deploy/examples/auth-cache.yaml
kubectl rollout status deployment/auth-cache --timeout=120s
kubectl exec deployment/auth-cache -c auth-cache -- ls -lah /jfr-data
```

After a rotation interval, expect at least one closed `profile-N.jfr` and one
newer recording.

Optionally validate a closed file with a local JDK:

```bash
pod="$(kubectl get pod -l app.kubernetes.io/name=auth-cache \
  -o jsonpath='{.items[0].metadata.name}')"
kubectl cp "${pod}:/jfr-data/profile-0.jfr" ./profile-0.jfr -c auth-cache
jfr summary ./profile-0.jfr
```

## 4. Agent upload

```bash
kubectl get daemonset jafra-agent -n jafra-system \
  -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="JAFRA_MODE")].value}{"\n"}'
kubectl logs -n jafra-system daemonset/jafra-agent
```

Mode should be `grpc`. Agent logs should show discovery and successful
acknowledgement rather than repeated retries or permanent rejection.

## 5. Analyzer durability and APIs

```bash
kubectl logs -n jafra-system deployment/jafra-analyzer
kubectl exec -n jafra-system deploy/jafra-analyzer -- \
  ls -la /var/lib/jafra/analyzer/chunks
kubectl -n jafra-system port-forward svc/jafra-analyzer 8080:8080
```

Then:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/api/v1/status
curl http://127.0.0.1:8080/api/v1/recordings
```

A healthy end-to-end run has durable chunks, a named workload in the
recording catalog, and report or summary output for that workload.
