# Herdr Plugin Core

Private, dependency-free runtime primitives shared by plugins in the
[Herdr plugins repository](https://github.com/oullin/herdr-plugins). This package
is installed from the managed repository checkout and is not published to npm.

## Usage

Plugins declare `@oullin/herdr-plugin-core` as a direct
`file:../../package/core` dependency. Their Herdr build command installs
the local package into the plugin's `node_modules` directory.

The package exposes TypeScript source for Node.js 24. It provides Herdr CLI
transport, plugin context parsing, platform path resolution, atomic persistence,
process execution handling, and test helpers. Plugin-specific business rules
remain in their plugin packages.

## Entrypoints

- `@oullin/herdr-plugin-core` contains supported runtime APIs.
- `@oullin/herdr-plugin-core/herdr-cli` contains the compatibility facade and all CLI concerns.
- `@oullin/herdr-plugin-core/herdr-cli/{transport,responses,workspaces,tabs,config,panes}` exposes independently composable CLI concerns.
- `@oullin/herdr-plugin-core/path-resolvers/{config,state}` exposes focused platform path resolvers.
- `@oullin/herdr-plugin-core/persistence/{atomic-file,json-file}` exposes focused persistence stores.
- `@oullin/herdr-plugin-core/testing` contains command-runner test doubles.

## Licence

[MIT](LICENSE)
