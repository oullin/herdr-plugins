# Plugin conventions

Every Herdr plugin lives in `plugins/<name>` and is independently installable from that repository subdirectory.

Each plugin must include:

- a valid `herdr-plugin.toml` manifest;
- a scoped package name in `package.json`;
- its own version, README, tests, and MIT licence;
- explicit supported platforms and minimum Herdr version;
- no runtime dependency outside the Herdr-managed repository checkout.

Shared runtime dependencies must be private workspace packages declared through stable `file:` paths in `dependencies`. Every plugin with runtime dependencies must include a cross-platform `[[build]]` command that installs production packages into the plugin directory with npm. The dependency and plugin must remain in the same managed repository checkout; do not publish shared packages or require a registry for repository-owned code.

Runtime commands should call Herdr through `HERDR_BIN_PATH`, use argv arrays in the manifest, and avoid shell-specific behaviour so the plugin works on Linux, macOS, and Windows.

Each plugin package must define native Node.js ESM aliases in its `imports` map, grouped by architectural concern. Production and test modules must use those aliases; relative module specifiers are not allowed.

All editable filenames, identifiers, messages, tests, and documentation must use British English. Ecosystem-mandated keys and canonical legal filenames keep their required names.

Add new plugin packages to the root catalogue and keep their tests runnable through `vp test`. Supported shared runtime code belongs in `@oullin/herdr-plugin-core`; repository tooling can live in `tools/*`.
