---
title: Install Jafra on OpenShift
sidebar_position: 4
---

In this guide, you will install the complete Jafra stack on OpenShift, profile
a sample Java workload, and confirm that its recordings are available through
the Analyzer API.

For SCC permissions and the security model, see
[OpenShift security and SCCs](../deploy/openshift-security.md). For split
admin workflows and teardown detail, see
[Install on OpenShift](../deploy/openshift-install.md).

## 1. Get Jafra

Clone the Jafra repository with its components:

```bash
git clone --recurse-submodules https://github.com/bharathappali/jafra-io.git
cd jafra-io
```

## 2. Log in to the cluster

```bash
oc login ...
# or point kubectl at an OpenShift context
kubectl config current-context
```

Confirm OpenShift APIs are visible:

```bash
kubectl api-resources --api-group=security.openshift.io | head
```

You need **cluster-admin once** (or an admin who already applied
`deploy/openshift/` SCC bindings). Images must be pullable as
`quay.io/bharathappali/jafra-*:0.0.2` (or retag / add pull secrets).

## 3. Install the product

Run the installer with cert-manager:

```bash
./install-jafra.sh --target openshift --install-cert-manager
```

If images and cert-manager are already available and you only need deploy +
SCC bindings:

```bash
./install-jafra.sh --target openshift --deploy-only
```

The installer applies OpenShift SCC bindings, then deploys:

- the Jafra Controller and its admission webhook;
- the Jafra Analyzer and persistent volume;
- one Jafra Agent on each eligible Linux node (switched to `grpc` mode).

Unlike Kind, OpenShift does **not** build or load images locally; nodes pull
from the registry.

Confirm the product is ready:

```bash
kubectl get pods -n jafra-system -o wide
kubectl get rolebinding -n jafra-system -l app.kubernetes.io/part-of=jafra
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

The command should print `0.0.2`. Opted-in app Pods do **not** need a custom
SCC; they use an injected `emptyDir` for recordings.

## 5. Confirm JFR recording

Allow approximately one minute for the first rotation, then list the files
visible to the application:

```bash
kubectl exec deployment/auth-cache -c auth-cache -- ls -lah /jfr-data
```

You should see `profile-0.jfr` and a newer active recording.

## 6. Query Jafra

Forward the Analyzer service (or use an OpenShift route if you expose one):

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

- [OpenShift security and SCCs](../deploy/openshift-security.md)
- [Install on OpenShift](../deploy/openshift-install.md) (admin split, images,
  teardown)
- [Profile your own workload](../use/profile-workload.md)
- [Request reports and event summaries](../use/analyzer-api.md)
- [Validate every stage of the pipeline](../operations/validate.md)
