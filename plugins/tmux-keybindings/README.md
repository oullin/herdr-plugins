# Tmux Keybindings

Apply a canonical tmux-style keymap to Herdr and open a compact binding reference as a centered modal dialog. Press `Option+Command+T` to open it; repeat the chord inside the dialog or press `Esc` to close it. This is a direct Herdr binding and leaves the built-in `prefix+?` help binding untouched.

The plugin owns only the bindings below. It preserves comments, unrelated settings, and unrelated custom commands in `config.toml`, records the original managed values under `HERDR_PLUGIN_STATE_DIR`, validates every change with `herdr config check`, and rolls back a rejected edit atomically.

| Prefix key         | Action                        |
| ------------------ | ----------------------------- |
| `Option+Command+T` | Open/close the binding dialog |
| `d`                | Detach                        |
| `c`                | New tab                       |
| `,`                | Rename tab                    |
| `n` / `p`          | Next / previous tab           |
| `1..9`             | Switch tab                    |
| `&`                | Close tab                     |
| `%` / `"`          | Split right / down            |
| arrows             | Focus the adjacent pane       |
| `o`                | Cycle panes                   |
| `;`                | Focus the last pane           |
| `x`                | Close pane                    |
| `z`                | Zoom pane                     |
| `[`                | Copy mode                     |
| `w`                | Workspace navigation          |

## Install and apply

```sh
herdr plugin install oullin/herdr-plugins/plugins/tmux-keybindings
herdr plugin action invoke oullin.tmux-keybindings.apply
```

The apply action follows `HERDR_CONFIG_PATH` when it is set. Otherwise it uses `%APPDATA%\herdr\config.toml` on Windows and `~/.config/herdr/config.toml` (or `$XDG_CONFIG_HOME/herdr/config.toml`) on Linux and macOS. A workspace-start hook idempotently reapplies the profile after installation; restoring the original bindings disables that automatic apply until the manual apply action is invoked again.

## Open the dialog

Use `Option+Command+T`, or invoke the action directly. The underlying Herdr binding is `alt+super+t`, so it does not depend on a terminal-specific bridge:

```sh
herdr plugin action invoke oullin.tmux-keybindings.toggle
```

The popup is session-modal and leaves the tiled tab layout unchanged. Its header repeats both closing shortcuts so the exit path is always visible.

## Restore and uninstall

Restore the values and any `alt+super+t` custom command that existed before the first apply:

```sh
herdr plugin action invoke oullin.tmux-keybindings.restore
```

Restore before uninstalling if you no longer want the tmux profile:

```sh
herdr plugin action invoke oullin.tmux-keybindings.restore
herdr plugin uninstall oullin.tmux-keybindings
```

Uninstalling does not silently rewrite `config.toml` or delete plugin-owned state. This makes source removal predictable and leaves recovery data available if an uninstall is interrupted.

## Development

From the repository root:

```sh
vp install --frozen-lockfile
vp run ready
herdr plugin link plugins/tmux-keybindings
herdr plugin action invoke oullin.tmux-keybindings.apply
herdr plugin log list --plugin oullin.tmux-keybindings
```

Installation links the repository-local `@oullin/herdr-plugin-core` package from the same Herdr-managed checkout. The plugin is strict TypeScript executed natively by Node.js 24 and calls Herdr through the injected `HERDR_BIN_PATH`.

## Licence

[MIT](LICENSE)
