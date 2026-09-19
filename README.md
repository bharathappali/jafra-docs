# Jafra documentation

This repository contains the Docusaurus site for Jafra. Enabled documentation
versions are listed in `versions.json` (latest first). Authoring content lives
in `docs/`; frozen snapshots live under `versioned_docs/`.

## Documentation baseline (v0.0.2)

Content for v0.0.2 is derived from:

- `jafra-io` `dev` at the release pin commit (after this docs merge)
- `jafra-controller` tag `v0.0.2` (`82f5306`)
- `jafra-agent` tag `v0.0.2` (`f49dce3`)
- `jafra-analyzer` tag `v0.0.2` (`d83b50c`)

Do not use a newer untagged checkout as evidence for a frozen version page.

## Local development

Node.js matching `package.json` `engines.node` is required.

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

`docs/` is the authoring copy. Published snapshots are
`versioned_docs/version-<semver>/` and enabled via `versions.json` /
`docusaurus.config.ts` (`includeCurrentVersion: false`).

When correcting a frozen version, apply the same release-accurate change to
that snapshot (and to `docs/` only if it still matches that release). Future
releases should update `docs/` first, then run:

```bash
npm run docusaurus -- docs:version <semver>
```

No site-publishing workflow is configured in this repository.
