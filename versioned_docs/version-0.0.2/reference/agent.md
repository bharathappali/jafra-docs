---
title: Jafra Agent
sidebar_position: 2
---

The Jafra Agent moves completed JFR data produced by async-profiler from
Kubernetes nodes to central analysis. It runs as a DaemonSet so every
eligible Linux node has a local collector.

## What the Agent does

The Agent continuously:

1. discovers JFR files created by enrolled workloads;
2. reads JFR headers to identify complete chunks;
3. queues chunks without blocking application recording;
4. uploads them to the Jafra Analyzer in order;
5. retries transient failures safely;
6. removes acknowledged, closed rotations when configured.

The JVM can continue writing the active file while completed data moves
through the pipeline.

## Operating modes

In `log-only` mode, the Agent reports discovered chunks through structured
logs and leaves recordings on the node. This is useful for validating
discovery before enabling ingest.

In `grpc` mode, the Agent uploads chunks to the Analyzer. `ACCEPTED` and
`DUPLICATE` complete a chunk, `RETRY` triggers bounded backoff, and `REJECTED`
retains the source for investigation.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `JAFRA_RECORDING_ROOT` | `/var/lib/kubelet/pods` | Kubelet pods root for emptyDir discovery |
| `JAFRA_RECORDING_VOLUME` | `jafra-recordings` | emptyDir volume name to watch |
| `JAFRA_MODE` | `log-only` | `log-only` or `grpc` |
| `JAFRA_NODE_NAME` | `unknown-node` | Node identity sent in telemetry |
| `JAFRA_CLUSTER_ID` | `local-demo` | Stable cluster identity |
| `JAFRA_ANALYZER_ENDPOINT` | `http://jafra-analyzer.jafra-system.svc.cluster.local:9090` | gRPC endpoint |
| `JAFRA_RESCAN_INTERVAL` | `10s` | Periodic discovery interval |
| `JAFRA_MAX_ACTIVE_READERS` | `8` | Concurrent file readers |
| `JAFRA_MAX_IN_FLIGHT_CHUNKS` | `8` | Concurrent chunk uploads |
| `JAFRA_FRAME_SIZE` | `131072` | Upload frame size in bytes |
| `JAFRA_RETRY_INITIAL_DELAY` | `1s` | Initial retry delay |
| `JAFRA_RETRY_MAX_DELAY` | `30s` | Maximum retry delay |
| `JAFRA_DELETE_CLOSED_FILES` | `true` | Reclaim acknowledged rotations |

Durations accept integer values with `ms`, `s`, `m`, or `h`.

## Safe collection and cleanup

The agent discovers JFRs under:

```text
/var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~empty-dir/jafra-recordings/
  <namespace>/<podUID>/<container>/*.jfr
```

It parses each 68-byte JFR chunk header. A chunk is finalized only when the
declared size is present and required metadata offsets are non-zero.
Filesystem notifications wake discovery but do not prove finalization.

The in-memory wake channel holds 1024 entries. Overflow causes a full rescan,
so a burst of events does not permanently lose a recording. Chunks from one
file upload serially; separate files can proceed in parallel.

The Agent deletes a source rotation only after all complete chunks are
acknowledged, no incomplete tail remains, and a newer rotation exists. The
active recording is never reclaimed.

Agent acknowledgements are process-local. If the Agent restarts before
cleanup, the Analyzer's durable chunk identity makes re-upload safe.
