---
title: Install the stack on Kind
sidebar_position: 2
---

## Recommended: install from source

Create the expected cluster:

```bash
kind create cluster --name jafra
kubectl config use-context kind-jafra
```

Install cert-manager and the complete stack:

```bash
./install-jafra.sh --install-cert-manager
```

For later iterations:

```bash
./install-jafra.sh                 # build only missing images
./install-jafra.sh --force-build   # rebuild every component
./install-jafra.sh --deploy-only   # apply manifests without image work
```

Set `KIND_CLUSTER` if the cluster has another name. Keep
`JAFRA_VERSION=0.0.2` for this release.

## Deployment sequence

The installer deliberately orders resources:

1. verify Docker, `kubectl`, Kind, and the selected cluster;
2. install or require cert-manager;
3. create `jafra-system`, RBAC, and the controller certificate;
4. wait for the certificate;
5. deploy and wait for the controller before registering the webhook;
6. deploy the analyzer and its 5 GiB PVC;
7. deploy the agent DaemonSet in `log-only`;
8. change the agent to `JAFRA_MODE=grpc` and wait for restart.

This ordering avoids registering a failing TLS webhook and prevents the agent
from streaming before the analyzer is ready.

## Published-image installer

`pull-jafra.sh` pulls `${JAFRA_REGISTRY}/jafra-*:${JAFRA_VERSION}` (defaults
`quay.io/bharathappali` / `0.0.2`), loads them into Kind when needed, applies
manifests, and **pins** controller/agent/analyzer workloads to those images
even if the YAML still lists another tag. Prefer:

```bash
JAFRA_REGISTRY=quay.io/bharathappali JAFRA_VERSION=0.0.2 ./pull-jafra.sh --force-pull
```

For OpenShift, use [Install on OpenShift](./openshift-install.md) and review
[OpenShift security and SCCs](./openshift-security.md) before binding SCCs:

```bash
./install-jafra.sh --target openshift --deploy-only
# or with cert-manager
./install-jafra.sh --target openshift --install-cert-manager
```

## Verify installation

```bash
kubectl get pods -n jafra-system -o wide
kubectl rollout status deployment/jafra-controller -n jafra-system
kubectl rollout status deployment/jafra-analyzer -n jafra-system
kubectl rollout status daemonset/jafra-agent -n jafra-system
kubectl get mutatingwebhookconfiguration jafra-controller
kubectl get certificate -n jafra-system
```

The controller and analyzer should each have one ready Pod. The agent should
have one ready Pod per eligible Linux node.
