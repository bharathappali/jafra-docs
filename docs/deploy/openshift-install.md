---
title: Install on OpenShift
sidebar_position: 3
---

Jafra v0.0.2 supports OpenShift. Workload recordings use an `emptyDir` volume;
only the node Agent needs elevated OpenShift permissions to discover those
files under the kubelet path. Opted-in application Pods stay on standard
restricted policies.

For the security and SCC model, see
[OpenShift security and SCCs](./openshift-security.md).

## Prerequisites

- An OpenShift cluster and a `kubectl` context (or `oc login`) that can reach
  it
- Images available to the cluster (`quay.io/bharathappali/jafra-*:0.0.2` or
  your registry)
- cert-manager for webhook TLS (install with the script or ask a cluster
  admin)
- Cluster-admin (or equivalent) **once** to create the custom agent SCC and
  RoleBindings, unless an admin already applied
  [`deploy/openshift/`](https://github.com/bharathappali/jafra-io/tree/dev/deploy/openshift)

Confirm the API surface:

```bash
kubectl api-resources --api-group=security.openshift.io | head
# or
oc whoami
```

## Recommended: install script

From the `jafra-io` repository root:

```bash
# Full path: SCC bindings + cert-manager (if needed) + deploy
./install-jafra.sh --target openshift --install-cert-manager

# Images already in the registry; manifests + SCC only
./install-jafra.sh --target openshift --deploy-only

# Remove Jafra from the cluster
./install-jafra.sh --target openshift --teardown
```

You can also set `JAFRA_TARGET=openshift`. Defaults use
`JAFRA_VERSION=0.0.2` and the image tags in the deploy manifests.

Unlike Kind, OpenShift **does not** build or `kind load` images. Nodes must
pull from the registry (or use `imagePullSecrets` on the ServiceAccounts).

## What the script does on OpenShift

1. Detects OpenShift APIs (`security.openshift.io`).
2. Ensures namespace `jafra-system` exists.
3. Creates custom SCC `jafra-agent` (and its `use` ClusterRole) if missing.
4. Applies RoleBindings that attach SCCs to platform ServiceAccounts
   ([`scc-platform.yaml`](https://github.com/bharathappali/jafra-io/blob/dev/deploy/openshift/scc-platform.yaml)).
5. Deploys the same controller, analyzer, and agent manifests used on Kind.
6. Switches the agent to `JAFRA_MODE=grpc` after the analyzer is ready.

## Split admin workflow

If your team separates cluster-admin and namespace-admin:

**Cluster admin (one-time):**

```bash
kubectl apply -f deploy/controller/namespace.yaml
kubectl apply -f deploy/openshift/scc-jafra-agent.yaml
kubectl apply -f deploy/openshift/scc-platform.yaml
# cert-manager cluster-wide if not already installed
```

**Namespace admin (`jafra-system`) afterward:**

```bash
./install-jafra.sh --target openshift --deploy-only
```

Namespace admin needs create/update on Deployments, DaemonSet, Services,
PVC, ServiceAccounts, Secrets, and cert-manager `Issuer` / `Certificate` in
`jafra-system`. They do **not** need a custom SCC for application namespaces.

## Verify

```bash
kubectl get pods -n jafra-system -o wide
kubectl get rolebinding -n jafra-system -l app.kubernetes.io/part-of=jafra
kubectl get scc jafra-agent
kubectl get mutatingwebhookconfiguration jafra-controller
```

Then opt in a workload the same way as on Kind:

```bash
kubectl apply -f deploy/examples/auth-cache.yaml
```

Confirm injection and `/jfr-data` files, then use the
[Analyzer API](../use/analyzer-api.md).

## Images and pull secrets

Manifests default to `quay.io/bharathappali/jafra-{controller,agent,analyzer}:0.0.2`.
If the cluster cannot pull publicly, mirror the images and either update the
Deployment/DaemonSet image fields or attach `imagePullSecrets` to:

- `jafra-controller` ServiceAccount
- `jafra-agent` ServiceAccount
- `default` ServiceAccount in `jafra-system` (analyzer)

## Next steps

- [OpenShift security and SCCs](./openshift-security.md) — permissions,
  threat model, and what is *not* privileged
- [Profile a workload](../use/profile-workload.md)
- [Validate the pipeline](../operations/validate.md)
- [Troubleshooting](../operations/troubleshooting.md)
