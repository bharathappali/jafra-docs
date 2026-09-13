---
title: Uninstall and limitations
sidebar_position: 3
---

## Remove Jafra

For a source installation:

```bash
./install-jafra.sh --teardown
```

This removes the webhook first, then the agent, analyzer, controller, and
`jafra-system` namespace. It does not uninstall cert-manager.

To delete the complete Kind cluster:

```bash
kind delete cluster --name jafra
```

Deleting the analyzer PVC destroys durable chunks, stitched recordings, and
duplicate identity history.

## v0.0.1 limitations

- The supported environment is Kind or compatible generic Kubernetes.
  OpenShift is not supported.
- Workload recordings and the node agent depend on a shared hostPath rooted
  at `/var/lib/jafra/recordings`.
- Recording leaf directories use mode `0777` so different application UIDs
  and the unprivileged agent can share and delete files.
- Pod policies that reject hostPath or the injected shape are incompatible.
- The controller has one replica and is not highly available.
- The webhook handles Pod creation only and supports only continuous mode.
- Invalid explicit opt-in configuration fails admission.
- The selected-container mount relies on kubelet accepting an init-created
  `subPathExpr`.
- Agent acknowledgement state is process-local.
- The analyzer uses one replica and a ReadWriteOnce PVC.
- Duplicate detection is local to that PVC.
- The analyzer stores immutable chunks as well as eagerly stitched recording
  files, increasing storage consumption.
- The analyzer does not upload recordings to object storage.
- gRPC ingest uses Quarkus's separate server on port `9090`.

These are properties of the released design, not configuration mistakes.
