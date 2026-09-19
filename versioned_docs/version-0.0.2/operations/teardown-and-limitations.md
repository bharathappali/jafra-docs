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

Deleting the analyzer PVC destroys durable chunks, identities, and any
stitch-cache contents on that volume.

## v0.0.2 limitations

- Supported environments include Kind, generic Kubernetes, and OpenShift
  (with the supplied SCC bindings for OpenShift).
- Workload recordings use an `emptyDir` volume (`jafra-recordings`). The agent
  must mount the kubelet pods root to discover and delete closed files.
- The controller has one replica and is not highly available.
- The webhook handles Pod creation only and supports only continuous mode.
- Invalid explicit opt-in configuration fails admission.
- The selected-container mount relies on kubelet accepting an init-created
  `subPathExpr`.
- Agent acknowledgement state is process-local.
- The analyzer uses one replica and a ReadWriteOnce PVC.
- Duplicate detection is local to that PVC.
- Durable storage is chunks-only; analysis uses an on-demand stitch cache with
  TTL and a ~2 Gi byte budget. Chunk GC / retention is not included in
  v0.0.2.
- The analyzer does not upload recordings to object storage.
- gRPC ingest uses Quarkus's separate server on port `9090`.
- Very large analysis windows may exceed stitch-cache budget or practical JMC
  heap limits (`-Xmx1024m`).

These are properties of the released design, not configuration mistakes.
