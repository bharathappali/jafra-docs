---
title: Jafra Analyzer
sidebar_position: 3
---

The Jafra Analyzer is the central service for JFR recording data. It receives
completed chunks from every Agent, verifies their integrity, reconstructs
recordings, applies JDK Mission Control rules, and exposes JVM evidence
through HTTP APIs.

It is a Java 21 service built with Quarkus and JDK Mission Control libraries.

## What the Analyzer does

For every upload, the Analyzer:

1. validates workload metadata and protocol version;
2. enforces ordered frame offsets;
3. verifies the final SHA-256 checksum;
4. commits the chunk and its identity to persistent storage;
5. reconstructs contiguous recording data;
6. acknowledges the Agent only after the chunk is durable.

This commit-before-acknowledgement behavior allows Agents to retry without
creating duplicate data.

## Analysis experiences

- **Recording inventory** shows available files by namespace, Pod, and
  container.
- **Automated reports** run JDK Mission Control rules and return scored
  findings.
- **Event summaries** expose counts and statistics from the event types
  present in the recording.
- **Time-window queries** combine the rotations that overlap an incident
  period.

See [Use the Analyzer API](../use/analyzer-api.md) for request examples.

## Configuration

| Property | v0.0.1 value | Purpose |
| --- | --- | --- |
| `quarkus.http.port` | `8080` | HTTP API |
| `quarkus.grpc.server.port` | `9090` | gRPC ingest |
| `quarkus.http.host` | `0.0.0.0` | HTTP bind address |
| `quarkus.grpc.server.host` | `0.0.0.0` | gRPC bind address |
| `jafra.ingest.max-metadata-length` | `4096` | Ingest metadata limit |
| `jafra.ingest.max-active-streams` | `32` | Concurrent ingest streams |
| `jafra.storage.root` | `/var/lib/jafra/analyzer` | Persistent storage root |

The supplied Deployment runs one replica, mounts a 5 GiB ReadWriteOnce PVC,
sets heap options `-Xms256m -Xmx1024m`, and limits container memory to 2 GiB.
On startup, it removes incomplete transfers, reloads durable identities, and
reconstructs recordings.

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

In v0.0.1, setting `quarkus.log.console.json=true` alone does not provide JSON
console formatting because the corresponding logging extension is absent.
Chunk and stitch messages still include JSON metadata strings.
