# Jafra documentation

This repository contains the Docusaurus site for Jafra. The currently enabled
documentation version is the frozen v0.0.1 release.

## Documentation baseline

Content for v0.0.1 is derived only from:

- `jafra-io` commit `8011c13db0efa3759898c8ded18410321b46c40c`
- `jafra-controller` commit `530791e1e28948b735a62c9618572c11a0fb5e4f`
- `jafra-agent` commit `2920ef299ba3414b3235ca52b36fcb15b98acb1d`
- `jafra-analyzer` commit `feb0e868175f858a426be75e28ffc1fe45298c54`

Do not use a current component checkout as evidence for v0.0.1.

## Local development

Node.js 20.17.0 or newer is required.

```bash
npm ci
npm start
```

The local server normally uses `http://localhost:3000`.

## Production build

```bash
npm run typecheck
npm run build
npm run serve
```

The generated output is written to `build/` and is not committed.

## Version maintenance

`docs/` is the authoring copy. `versioned_docs/version-0.0.1/` is the
published snapshot and v0.0.1 is the only version enabled in
`docusaurus.config.ts`.

When correcting v0.0.1 documentation, apply the same release-accurate change
to the authoring copy and snapshot. Do not introduce behavior from another
release. Future release work should first establish its exact product and
component baseline, then create a distinct Docusaurus version.

No site-publishing workflow is configured in this repository.
