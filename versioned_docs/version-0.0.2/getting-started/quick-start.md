---
title: Install Jafra on Kind
sidebar_position: 3
---

In this guide, you will install the complete Jafra stack, profile a sample
Java workload, and confirm that its recordings are available through the
Analyzer API.

## 1. Get Jafra

Clone the Jafra repository with its components:

```bash
git clone --recurse-submodules https://github.com/bharathappali/jafra-io.git
cd jafra-io
```

## 2. Create the Kind cluster

```bash
kind create cluster --name jafra
kubectl config use-context kind-jafra
```

## 3. Install the product

Run the installer with cert-manager:

```bash
./install-jafra.sh --install-cert-manager
```

The installer builds the v0.0.2 images, loads them into Kind, and deploys:

- the Jafra Controller and its admission webhook;
- the Jafra Analyzer and persistent volume;
- one Jafra Agent on each Kind node.

Confirm the product is ready:

```bash
kubectl get pods -n jafra-system -o wide
kubectl get mutatingwebhookconfiguration jafra-controller
```

Every Jafra Pod should report `Running`, and all readiness columns should be
complete.

## 4. Profile the sample application

```bash
kubectl apply -f deploy/examples/auth-cache.yaml
kubectl rollout status deployment/auth-cache --timeout=120s
```

Confirm that the application was enrolled:

```bash
kubectl get pod -l app.kubernetes.io/name=auth-cache \
  -o jsonpath='{.items[0].metadata.annotations.jafra\.io/injected-version}{"\n"}'
```

The command should print `0.0.2`.

## 5. Confirm JFR recording

Allow approximately one minute for the first rotation, then list the files
visible to the application:

```bash
kubectl exec deployment/auth-cache -c auth-cache -- ls -lah /jfr-data
```

You should see `profile-0.jfr` and a newer active recording.

## 6. Query Jafra

Forward the Analyzer service:

```bash
kubectl -n jafra-system port-forward svc/jafra-analyzer 8080:8080
```

In another terminal:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/api/v1/status
curl http://127.0.0.1:8080/api/v1/recordings
```

The recordings response should include the sample namespace, Pod, container,
and JFR files.

## Next steps

- [Profile your own workload](../use/profile-workload.md)
- [Request reports and event summaries](../use/analyzer-api.md)
- [Understand how Jafra works](../concepts/architecture.md)
- [Validate every stage of the pipeline](../operations/validate.md)
- [Install on OpenShift](../deploy/openshift-install.md) (if you deploy to OCP)
- [OpenShift security and SCCs](../deploy/openshift-security.md)
