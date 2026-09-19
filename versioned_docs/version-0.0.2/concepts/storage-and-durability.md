---
title: Recording storage and durability
sidebar_position: 2
---

## Node recording layout

In v0.0.2, workload recordings use an **`emptyDir` volume** named
`jafra-recordings` (OpenShift-friendly). The agent discovers files under the
kubelet emptyDir path:

```text
/var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~empty-dir/jafra-recordings/
  <namespace>/
    <podUID>/
      <container>/
        .jafra-identity.json
        profile-0.jfr
        profile-1.jfr
```

The selected application container sees only its leaf directory at
`/jfr-data`. The agent mounts `/var/lib/kubelet/pods` and watches the
`jafra-recordings` volume name (defaults: `JAFRA_RECORDING_ROOT`,
`JAFRA_RECORDING_VOLUME`).

In `grpc` mode, the agent deletes a source file only when:

1. every discovered chunk is `ACCEPTED` or `DUPLICATE`;
2. the file has no incomplete tail;
3. a newer `profile-N.jfr` sibling exists;
4. `JAFRA_DELETE_CLOSED_FILES=true`.

The active file is not deleted. `log-only` mode never deletes recordings.

## Analyzer PVC layout

```text
/var/lib/jafra/analyzer/
  tmp/<chunkId>.part                 # in-flight frames; discarded on abort/recover
  chunks/<chunkId>.jfr               # committed payload (durable)
  chunks/<chunkId>.meta              # durable identity
  stitch-cache/<hash>.jfr            # on-demand analysis JFRs (TTL + ~2 Gi budget)
  identities/<podUID>.json           # namespace + pod name for HTTP queries
```

- `tmp` holds an in-progress stream.
- A committed payload and metadata pair under `chunks` is the **only durable
  recording payload**.
- `stitch-cache` holds short-lived concatenations built for `/report` and
  `/summary`. It is not a second durable copy. A reaper deletes unused
  entries after TTL (default two minutes) or when the cache exceeds its byte
  budget (default 2 Gi). It never deletes `chunks/`.
- `identities` maps pod UIDs to names used by the HTTP catalog.

`ACCEPTED` is sent only after the chunk metadata is durable. On startup, the
analyzer removes abandoned part files and payloads without metadata, reloads
the chunk index, and deletes any legacy `recordings/**/stitched.jfr` files
from earlier builds. Contiguous chunk prefixes are stitched into the cache on
demand.

## Duplicate handling

The deterministic chunk ID includes cluster, pod UID, container, filename,
offset, and length. If the agent retries an already committed ID, the
analyzer returns `DUPLICATE` without storing another copy.

Replacing the analyzer PVC removes this identity history. The next upload is
then treated as new.

## Capacity characteristics

Plan PVC capacity primarily around **durable chunks** (roughly most of a 5 Gi
volume). Reserve about **1–2 Gi** for the stitch cache. Continuous profiling
can still fill the PVC with chunks alone; chunk GC is deferred in v0.0.2.
The supplied manifest provisions a 5 GiB ReadWriteOnce PVC and runs a single
analyzer replica.
