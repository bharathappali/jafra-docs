---
title: How Jafra works
sidebar_position: 1
---

import architectureImage from '@site/assets/imgs/jafra_v002_arch_n_flow.png';

Jafra coordinates three distinct responsibilities: async-profiler records JVM
events, node-local Agents collect completed JFR chunks, and the Analyzer
applies JDK Mission Control rules. Application teams get continuous evidence
without packaging recording infrastructure into every service.

<figure className="architecture-visual">
  <img
    src={architectureImage}
    alt="JAFRA v0.0.2 architecture and recording flow"
  />
  <figcaption>
    JAFRA v0.0.2 architecture and recording flow. Workload recordings use an
    emptyDir volume discovered via the kubelet path; the analyzer PVC stores
    durable chunks only, with an on-demand stitch-cache for analysis.
  </figcaption>
</figure>

```mermaid
flowchart TB
    apiServer["Kubernetes API server"]
    controller["jafra-controller webhook"]
    pod["Opted-in Java Pod"]
    profiler["async-profiler"]
    emptyDir["emptyDir jafra-recordings"]
    agent["jafra-agent DaemonSet"]
    analyzer["jafra-analyzer"]
    pvc["Analyzer PVC chunks"]
    cache["stitch-cache"]
    client["HTTP client"]

    apiServer -->|"Pod CREATE admission"| controller
    controller -->|"JSON patch"| apiServer
    apiServer --> pod
    pod --> profiler
    profiler -->|"Rotating JFR files"| emptyDir
    agent -->|"Discover finalized chunks"| emptyDir
    agent -->|"gRPC upload"| analyzer
    analyzer --> pvc
    client -->|"Reports and summaries"| analyzer
    analyzer -->|"On-demand stitch"| cache
```

## 1. Opt in a workload

You select a Java workload using labels and annotations on its Pod template.
When Kubernetes creates the Pod, the Jafra Controller validates that
configuration and adds everything async-profiler needs to start recording:

- an init container carrying async-profiler;
- an `emptyDir` for `libasyncProfiler.so`;
- an `emptyDir` volume `jafra-recordings` for rotating JFRs;
- a per-container `/jfr-data` mount;
- downward-API identity variables;
- an async-profiler `-agentpath` option in `JAVA_TOOL_OPTIONS`.

The workload image is not modified. The profiler is prepared by an init
container and loaded through `JAVA_TOOL_OPTIONS` when the JVM starts.

For each selected container, the controller creates:

```text
<namespace>/<podUID>/<container>/
```

under the recordings emptyDir. The application sees this location as
`/jfr-data` and writes rotating `profile-N.jfr` files. Identity metadata
stored beside the files preserves the namespace, Pod, and container that
produced them.

## 2. Collect complete recording chunks

One Jafra Agent runs on each Linux node. It watches kubelet emptyDir paths for
`jafra-recordings` and parses JFR headers to determine when a chunk is
complete. It does not assume that a filesystem notification means the JVM has
finished writing.

Chunks from different recordings can upload concurrently, while chunks from
the same file remain ordered. Periodic rescans make collection resilient to
missed or bursty filesystem events.

## 3. Store recordings centrally

The agent streams each chunk to the Jafra Analyzer over gRPC. The analyzer
validates the upload sequence and SHA-256 checksum before acknowledging it.
Retries are safe because every chunk has a deterministic identity and an
already stored chunk is recognized as a duplicate.

Accepted chunks are stored on the analyzer PVC as the only durable payload.
Contiguous prefixes are available to stitch into a short-lived cache for HTTP
queries by namespace, Pod, and container.

## 4. Turn recordings into operational evidence

The Analyzer HTTP API supports two complementary views:

- **Automated reports** run JDK Mission Control rules and return scored
  findings by topic.
- **Event summaries** aggregate the raw event types present in a recording,
  including useful numeric and text fields.

Both views can target a recording or a time window. Sliding `last=` windows
reuse covering stitch-cache files when data is unchanged and filter events to
the requested range.

## Reliability model

- A source rotation remains on its node until every complete chunk is
  acknowledged and a newer rotation exists.
- Agent restarts can cause a retry, but durable analyzer identities prevent a
  duplicate recording from being stored.
- Analyzer recovery removes incomplete transfers, reloads committed chunk
  metadata, and drops legacy durable stitches.
- Analyzer durability is provided by a single ReadWriteOnce PVC for chunks
  (and identities); the stitch cache is ephemeral.
