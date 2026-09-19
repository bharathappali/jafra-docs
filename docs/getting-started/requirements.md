---
title: Prerequisites
sidebar_position: 1
---

Before installing Jafra, prepare a local Kubernetes environment and the tools
used by the installation workflow.

## Local Kind environment

Install the following command-line tools:

- Docker
- `kubectl`
- Kind
- Git

Confirm they are available:

```bash
docker version
kubectl version --client
kind version
git --version
```

Jafra's installer can install cert-manager for you. cert-manager is required
because the Jafra Controller receives Kubernetes admission requests over TLS.

## Create a cluster

The examples use a Kind cluster named `jafra`:

```bash
kind create cluster --name jafra
kubectl cluster-info --context kind-jafra
```

If you use another name, set `KIND_CLUSTER` when running Jafra's scripts.

## Building from source

The standard installation builds images with Docker when they are not already
available. The standalone multi-platform image builder uses Podman.

Install these toolchains only when developing or testing an individual
component outside its container build:

- Go for the Jafra Controller
- Rust and `protoc` for the Jafra Agent
- Java 21 and Maven for the Jafra Analyzer

The [image build guide](../build/build-images.md) provides the correct command
and build context for each component.

## Kubernetes compatibility

Jafra v0.0.2 stores workload recordings on an `emptyDir` volume
(`jafra-recordings`). The agent mounts the kubelet pods root to discover and
delete closed files. Kind and generic Kubernetes are supported; OpenShift is
supported with the SCC bindings under `deploy/openshift/`.

- Kind: [Install Jafra on Kind](./quick-start.md)
- OpenShift: [Install Jafra on OpenShift](./openshift-quick-start.md)
- SCC detail: [OpenShift security and SCCs](../deploy/openshift-security.md)
