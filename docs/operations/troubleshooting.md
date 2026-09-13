---
title: Troubleshooting
sidebar_position: 2
---

## Opted-in Pods are rejected

Inspect the admission error and controller logs:

```bash
kubectl logs -n jafra-system deployment/jafra-controller
kubectl get events --sort-by=.lastTimestamp
```

Common causes are an unsupported mode, a missing or unknown target container,
`chunktime` below five seconds, an invalid profiler value, or
`JAVA_TOOL_OPTIONS` supplied through `valueFrom`.

Because the webhook uses a fail-closed policy, TLS or controller failure can
also block matching Pod creation. Check the certificate, Service endpoints,
controller readiness, and webhook CA bundle.

## No injection occurred

Confirm the labels and annotation are on the Pod template before the Pod was
created:

```bash
kubectl get pod <pod> --show-labels
kubectl get pod <pod> -o jsonpath='{.metadata.annotations}{"\n"}'
```

The mode must be `continuous`, enabled must be `true`, and target container
names must match exactly. Pods in `kube-system` and `jafra-system` are
intentionally skipped. Existing Pods must be recreated.

## No JFR files

Check:

```bash
kubectl describe pod <pod>
kubectl logs <pod> -c jafra-profiler-init
kubectl exec <pod> -c <container> -- printenv JAVA_TOOL_OPTIONS
kubectl exec <pod> -c <container> -- ls -lah /jfr-data
```

The application must be a JVM process that accepts the injected agent path.
Check init-container completion, mount errors, application logs, and memory
limits.

## Agent sees files but analyzer is empty

The raw DaemonSet manifest starts in `log-only`. Verify and change it:

```bash
kubectl get daemonset jafra-agent -n jafra-system -o yaml
kubectl set env daemonset/jafra-agent -n jafra-system JAFRA_MODE=grpc
kubectl rollout status daemonset/jafra-agent -n jafra-system
```

Then verify analyzer DNS and port `9090`, and inspect both services' logs.

## Image pull errors in Kind

The v0.0.1 published-image helper and manifests use different registry
names. Check the exact image requested by each workload:

```bash
kubectl get deploy,daemonset -n jafra-system \
  -o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[*].image
```

Build and load images using the manifest names, or consistently retag and
update every component. Do not assume an image loaded under another registry
name satisfies the manifest.

## Reports return no useful rules

Keep `jafra.io/jfrsync: "default"` when you need JDK events. Without those
events, many JMC rules correctly return not-applicable. Also use a closed
rotation or a valid time window; a live file may not support complete rule
analysis.

## Host storage or permission failures

This release requires node hostPath access and uses mode `0777` recording
leaf directories. Inspect Pod scheduling events and mount failures. A cluster
policy that forbids this storage model cannot run Jafra v0.0.1.
