---
title: Jafra Controller
sidebar_position: 1
---

The Jafra Controller automates async-profiler injection through the Kubernetes
workload lifecycle. It runs as a mutating admission webhook and prepares
selected Java containers for continuous JFR recording as each Pod is created.

Application images do not need to package async-profiler, and teams do not
need to change application code. Recording configuration stays in the Pod
template.

## What the Controller does

For every eligible Pod, the Controller:

1. validates the requested containers and async-profiler options;
2. adds an init container with async-profiler;
3. prepares node-local recording directories and workload identity;
4. mounts the profiler library and the container's recording directory;
5. adds the async-profiler startup option to `JAVA_TOOL_OPTIONS`;
6. marks the Pod with the Jafra version that performed the injection.

## Workload selection

A Pod is enrolled only when:

- namespace is neither `kube-system` nor `jafra-system`;
- `jafra.io/enabled` equals `true`;
- `jafra.io/mode` equals `continuous`;
- it has not already been marked as injected;
- `jafra.io/containers` names at least one existing container.

This explicit model prevents unintentional recording. An enabled Pod with an
invalid mode or container target is denied with a configuration error. A Pod
without a Jafra mode is left unchanged.

## Recording options

| Annotation | Default | Validation |
| --- | --- | --- |
| `jafra.io/event` | `ctimer` | `ctimer`, `cpu`, `wall`, or `itimer` |
| `jafra.io/interval` | `20ms` | positive duration |
| `jafra.io/wall` | `100ms` | positive duration |
| `jafra.io/alloc` | `1m` | positive `k`, `m`, or `g` size |
| `jafra.io/live` | `true` | `true` or `false` |
| `jafra.io/lock` | `10ms` | positive duration |
| `jafra.io/nativemem` | `2m` | positive size |
| `jafra.io/nativelock` | `10ms` | positive duration |
| `jafra.io/memlimit` | `128m` | positive size |
| `jafra.io/loop` | `5m` | at least one second |
| `jafra.io/chunktime` | `5s` | at least five seconds |
| `jafra.io/chunksize` | `32m` | positive size |
| `jafra.io/jfrsync` | `default` | `default`, `profile`, `none`, `false`, or `off` |

The defaults are designed to provide broad JVM evidence without requiring
Linux performance-counter privileges. `ctimer` provides CPU sampling, while
`jfrsync=default` adds JDK events needed for GC, compilation, and I/O
analysis.

Duration suffixes are `ns`, `us`, `ms`, `s`, `m`, `h`, and `d`, subject to
the field-specific minimums.

## Runtime details

- Init image: `quay.io/bharathappali/async-profiler:v4.5`
- Profiler library: `/jafra-agent/libasyncProfiler.so`
- Container recording mount: `/jfr-data`
- Node recording root: `/var/lib/jafra/recordings`
- Webhook path: `/mutate-v1-pod`
- Webhook TLS port: `9443`
- Metrics port: `8080`
- Health and readiness port: `8081`

The Controller is stateless and acts only during Pod creation. Changing Jafra
metadata on an existing Pod does not reinject it; update the owning workload
and recreate the Pod.

See [Profile a workload](../use/profile-workload.md) for a complete opt-in
example.
