---
title: Profile a Java workload
sidebar_position: 1
---

Enroll a Java workload by adding Jafra metadata to its Pod template. Jafra
injects async-profiler only into the containers you name; async-profiler
performs the profiling and writes the JFR recordings that Jafra collects and
analyzes.

## Minimal Pod metadata

```yaml
metadata:
  labels:
    jafra.io/enabled: "true"
    jafra.io/mode: "continuous"
  annotations:
    jafra.io/containers: "application"
```

`jafra.io/containers` is a comma-separated list. Every name must match a
container in the Pod.

Existing Pods are not retroactively modified. Update the owning Deployment
template and start a new rollout.

## Profiler settings

All profiler annotations are optional:

```yaml
metadata:
  annotations:
    jafra.io/event: "ctimer"
    jafra.io/interval: "20ms"
    jafra.io/wall: "100ms"
    jafra.io/alloc: "1m"
    jafra.io/live: "true"
    jafra.io/lock: "10ms"
    jafra.io/nativemem: "2m"
    jafra.io/nativelock: "10ms"
    jafra.io/memlimit: "128m"
    jafra.io/loop: "5m"
    jafra.io/chunktime: "5s"
    jafra.io/chunksize: "32m"
    jafra.io/jfrsync: "default"
```

The values above are the v0.0.1 defaults. `chunktime` must be at least five
seconds. Supported events are `ctimer`, `cpu`, `wall`, and `itimer`.

`ctimer` avoids requiring `perf_event_open` privileges. Keep
`jfrsync=default` when reports need JDK events such as GC, compilation, and
I/O. Use `none`, `false`, or `off` to disable JFR synchronization.

## Mutation result

A successful mutation adds:

```yaml
metadata:
  annotations:
    jafra.io/injected: "true"
    jafra.io/injected-version: "0.0.1"
```

It also mounts the target container's recording directory at `/jfr-data` and
appends an `-agentpath` expression to a literal `JAVA_TOOL_OPTIONS`.

The controller rejects `JAVA_TOOL_OPTIONS` supplied through `valueFrom`
because it cannot safely evaluate and merge that value.

## End-to-end example

```bash
kubectl apply -f deploy/examples/auth-cache.yaml
kubectl rollout status deployment/auth-cache --timeout=120s
kubectl get pod -l app.kubernetes.io/name=auth-cache -o yaml
kubectl exec deployment/auth-cache -c auth-cache -- ls -lah /jfr-data
```

After roughly one rotation interval, expect `profile-0.jfr` and a newer
recording.
