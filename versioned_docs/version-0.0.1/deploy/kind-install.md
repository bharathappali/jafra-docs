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
`JAFRA_VERSION=0.0.1` for this release.

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

## Published-image installer caveat

The v0.0.1 `pull-jafra.sh` pulls images named
`quay.io/causa-ai-hub/jafra-*:0.0.1`, while the Kubernetes manifests
refer to `quay.io/bharathappali/jafra-*:0.0.1`. The script does not rewrite
the three manifest image references.

Consequently, loading the pulled tags does not guarantee that Kind uses
them; the cluster may try to pull the different manifest names. Prefer
`install-jafra.sh` with the release source and manifest image names. If using
published images, retag all three to the manifest names before `kind load`,
or update all three workload image references consistently.

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
