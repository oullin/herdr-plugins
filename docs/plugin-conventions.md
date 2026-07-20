# Plugin conventions

Every Herdr plugin lives in `plugins/<name>` and is independently installable from that repository subdirectory.

Each plugin must include:

- a valid `herdr-plugin.toml` manifest;
- a scoped package name in `package.json`;
- its own version, README, tests, and MIT license;
- explicit supported platforms and minimum Herdr version;
- no runtime dependency on files outside its plugin directory.

Runtime commands should call Herdr through `HERDR_BIN_PATH`, use argv arrays in the manifest, and avoid shell-specific behavior so the plugin works on Linux, macOS, and Windows.

Each plugin package must define native Node.js ESM aliases in its `imports` map, grouped by architectural concern. Production and test modules must use those aliases; relative module specifiers are not allowed.

Add new plugin packages to the root catalog and keep their tests runnable through `vp test`. Shared development-only code can live in `packages/*`; repository tooling can live in `tools/*`.
