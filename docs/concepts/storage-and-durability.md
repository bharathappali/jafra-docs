---
title: Recording storage and durability
sidebar_position: 2
---

## Node recording layout

The controller and agent share this node directory:

```text
/var/lib/jafra/recordings/
  <namespace>/
    <podUID>/
      <container>/
        .jafra-identity.json
        profile-0.jfr
        profile-1.jfr
```

The selected application container sees only its leaf directory at
`/jfr-data`. The agent sees the complete tree at `/jfr-data`.

In `grpc` mode, the agent deletes a source file only when:

1. every discovered chunk is `ACCEPTED` or `DUPLICATE`;
2. the file has no incomplete tail;
3. a newer `profile-N.jfr` sibling exists;
4. `JAFRA_DELETE_CLOSED_FILES=true`.

The active file is not deleted. `log-only` mode never deletes recordings.

## Analyzer PVC layout

```text
/var/lib/jafra/analyzer/
  tmp/<chunkId>.part
  chunks/<chunkId>.jfr
  chunks/<chunkId>.meta
  recordings/<cluster>/<podUID>/<container>/<file>/
    stitched.jfr
    manifest.json
  identities/<podUID>.json
```

- `tmp` holds an in-progress stream.
- A committed payload and metadata pair under `chunks` is the durable chunk.
- `recordings` contains the contiguous reconstruction from offset zero.
- `identities` maps pod UIDs to names used by the HTTP catalog.

`ACCEPTED` is sent only after the chunk metadata is durable. On startup, the
analyzer removes abandoned part files and payloads without metadata, reloads
the chunk index, and rebuilds recording stitches.

## Duplicate handling

The deterministic chunk ID includes cluster, pod UID, container, filename,
offset, and length. If the agent retries an already committed ID, the
analyzer returns `DUPLICATE` without storing another copy.

Replacing the analyzer PVC removes this identity history. The next upload is
then treated as new.

## Capacity characteristics

The v0.0.1 analyzer stores committed chunks and stitched recordings, so
capacity planning must account for both. The supplied manifest provisions a
5 GiB ReadWriteOnce PVC and runs a single analyzer replica.
