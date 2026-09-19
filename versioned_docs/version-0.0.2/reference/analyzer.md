---
title: Jafra Analyzer
sidebar_position: 3
---

The Jafra Analyzer is the central service for JFR recording data. It receives
completed chunks from every Agent, verifies their integrity, stores durable
chunk payloads, stitches recordings on demand for analysis, applies JDK
Mission Control rules, and exposes JVM evidence through HTTP APIs.

It is a Java 21 service built with Quarkus and JDK Mission Control libraries.

## What the Analyzer does

For every upload, the Analyzer:

1. validates workload metadata and protocol version;
2. enforces ordered frame offsets;
3. verifies the final SHA-256 checksum;
4. commits the chunk payload and `.meta` identity to persistent storage;
5. acknowledges the Agent only after that identity is durable.

This commit-before-acknowledgement behavior allows Agents to retry without
creating duplicate data. Contiguous reconstructions for HTTP analysis are
built later into a bounded stitch cache, not as a second durable copy on
ingest.

## Analysis experiences

- **Recording inventory** shows available files by namespace, Pod, and
  container.
- **Automated reports** run JDK Mission Control rules and return scored
  findings.
- **Event summaries** expose counts and statistics from the event types
  present in the recording.
- **Time-window queries** combine the rotations that overlap an incident
  period, with stitch-cache reuse and event filtering for sliding windows.

See [Use the Analyzer API](../use/analyzer-api.md) for request examples.

## Configuration

| Property | v0.0.2 value | Purpose |
| --- | --- | --- |
| `quarkus.http.port` | `8080` | HTTP API |
| `quarkus.grpc.server.port` | `9090` | gRPC ingest |
| `quarkus.http.host` | `0.0.0.0` | HTTP bind address |
| `quarkus.grpc.server.host` | `0.0.0.0` | gRPC bind address |
| `jafra.ingest.max-metadata-length` | `4096` | Ingest metadata limit |
| `jafra.ingest.max-active-streams` | `32` | Concurrent ingest streams |
| `jafra.storage.root` | `/var/lib/jafra/analyzer` | Persistent storage root |
| `jafra.storage.stitch-cache.max-bytes` | `2147483648` (2 Gi) | Stitch-cache budget |
| `jafra.storage.stitch-cache.ttl` | `PT2M` | Unused entry TTL |

The supplied Deployment runs one replica, mounts a 5 GiB ReadWriteOnce PVC,
sets heap options `-Xms256m -Xmx1024m`, and limits container memory to 2 GiB.
On startup, it removes incomplete transfers, reloads durable identities, and
clears legacy durable `stitched.jfr` files if present.

## HTTP endpoints

- `GET /health`
- `GET /q/health`
- `GET /q/metrics`
- `GET /api/v1/status`
- `GET /api/v1/recordings`
- `GET /api/v1/namespaces/{namespace}/pods/{pod}/containers/{container}`
- `GET .../report`
- `GET .../summary`
- `GET .../recordings/{filename}/report`
- `GET .../recordings/{filename}/summary`

Report endpoints return JMC rule results. Summary endpoints return raw event
aggregates. Both support recording selection and time-window filtering.

## Metrics and logs

Prometheus metrics are available through `/q/metrics`, including accepted,
duplicate, rejected, checksum-failure, and protocol-failure ingest counters.

Chunk and stitch messages include JSON metadata strings in log lines.
