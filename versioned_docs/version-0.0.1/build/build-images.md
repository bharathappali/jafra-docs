---
title: Build Jafra images
sidebar_position: 1
---

Build all product images together or work with one component at a time. Run
these commands from the root of the Jafra repository.

## Build all release images with Docker

`install-jafra.sh` builds any missing image and later deploys it. To rebuild
all three regardless of the local image cache:

```bash
JAFRA_VERSION=0.0.1 ./install-jafra.sh --force-build
```

This also loads and deploys the images. For build-only workflows, use Podman
or the component commands below.

## Build all images with Podman

```bash
./build-jafra.sh --platform linux/amd64
```

For an Apple Silicon Kind cluster:

```bash
./build-jafra.sh --platform linux/arm64
```

Build both architectures and assemble `:0.0.1` manifest lists:

```bash
./build-jafra.sh --multi-platform
```

Useful options:

```bash
./build-jafra.sh --component controller
./build-jafra.sh --component agent --platform linux/arm64
./build-jafra.sh --component analyzer --no-cache
```

The defaults are version `0.0.1`, platform `linux/amd64`, and registry
`quay.io/bharathappali`. Override them with `JAFRA_VERSION`,
`JAFRA_PLATFORM`, and `JAFRA_REGISTRY`.

## Build components individually

### Controller

The controller has a self-contained build context:

```bash
(cd jafra-controller && go test ./...)
docker build \
  -f jafra-controller/Dockerfile \
  -t quay.io/bharathappali/jafra-controller:0.0.1 \
  jafra-controller
```

### Agent

The agent build generates Rust bindings from the shared protobuf, so its
container context must be the umbrella root:

```bash
(cd jafra-agent && cargo test)
docker build \
  -f jafra-agent/Dockerfile \
  -t quay.io/bharathappali/jafra-agent:0.0.1 \
  .
```

Local Rust tests require `protoc` on `PATH`.

### Analyzer

The analyzer also consumes the shared protobuf:

```bash
mvn -f jafra-analyzer/pom.xml test
docker build \
  -f jafra-analyzer/Dockerfile \
  -t quay.io/bharathappali/jafra-analyzer:0.0.1 \
  .
```

## Load into Kind

```bash
kind load docker-image quay.io/bharathappali/jafra-controller:0.0.1 --name jafra
kind load docker-image quay.io/bharathappali/jafra-agent:0.0.1 --name jafra
kind load docker-image quay.io/bharathappali/jafra-analyzer:0.0.1 --name jafra
```

The image names must match those in the v0.0.1 manifests unless you
explicitly update the workload images before deployment.
