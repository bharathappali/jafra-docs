---
title: Use the Analyzer API
sidebar_position: 2
---

Use the Analyzer API to discover recordings, investigate a time window, run
automated JDK Mission Control rules, or inspect raw JVM events.

Forward the HTTP service to your workstation:

```bash
kubectl -n jafra-system port-forward svc/jafra-analyzer 8080:8080
```

## Health, metrics, and status

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/q/health
curl http://127.0.0.1:8080/q/metrics
curl http://127.0.0.1:8080/api/v1/status
```

Status includes durable chunk count and `stitchedBytes` (current
**stitch-cache** size, not a durable recordings tree).

## Find recordings

```bash
curl 'http://127.0.0.1:8080/api/v1/recordings'
curl 'http://127.0.0.1:8080/api/v1/recordings?namespace=default'
curl 'http://127.0.0.1:8080/api/v1/recordings?namespace=default&pod=auth-cache-abc&container=auth-cache'
```

Queries use namespace, Pod name, and container name. Pod UID remains the
durable workload-instance identity on disk.

## Automated JMC report

```bash
base='http://127.0.0.1:8080/api/v1/namespaces/default/pods/auth-cache-abc/containers/auth-cache'
curl "$base/report"
curl "$base/report?filter=heap"
curl "$base/recordings/profile-3.jfr/report"
```

Without a recording or window, `/report` analyzes the latest closed
rotation. It skips the live file because JMC rules require a complete chunk
set. The response maps rule IDs to score, name, topic, and description.

## Raw event summary

```bash
curl "$base/summary"
curl "$base/summary?filter=heap"
curl "$base/recordings/profile-3.jfr/summary"
```

`/summary` does not run JMC rules. It groups recorded event types and reports
counts, selected text values, and numeric min/max/average statistics.

## Time windows

Both report and summary endpoints accept:

```bash
curl "$base/report?last=5m"
curl "$base/summary?last=1h"
curl "$base/report?from=2026-08-17T09:00:00Z&to=2026-08-17T09:10:00Z"
curl "$base/report?before=2026-08-17T09:10:00Z"
curl "$base/report?after=2026-08-17T09:00:00Z"
```

`last` is a **wall-clock** window ending at request time (`now − duration` …
`now`). It accepts seconds, minutes, hours, or days up to seven days.
Absolute values use ISO-8601. Do not combine the `last`, `from`/`to`,
`before`, and `after` families. A valid window with no overlapping recording
returns `404`.

### Stitch cache and reuse

Time-window analysis selects every overlapping rotation and stitches
contiguous chunk payloads into `stitch-cache/` on demand. Before creating a
new file, the analyzer reuses an existing cache entry when:

1. the workload’s data fingerprint is unchanged (no new or changed
   recordings);
2. the cached file’s time span still covers the request clipped to available
   data;
3. the cached recording set is a superset of what this request needs.

When a wider cached file is reused, `/report` and `/summary` still **filter
events** to the requested `from`/`to` so findings match the wall-clock window.

The response includes `recordings` (overlapping files for the request),
`start`/`end` (their coverage), and `from`/`to` (the requested window).
