# Tmux Keybindings

Apply a canonical tmux-style keymap to Herdr and keep a resize-aware binding reference beside the active terminal. Press `Ctrl+B /` to open the panel as a right-side split without moving focus; repeat `Ctrl+B /` to close it. Herdr's native `Ctrl+B ?` shortcut continues to open its `? keybinds` help.

The plugin owns only the bindings below. It preserves comments, unrelated settings, and unrelated custom commands in `config.toml`, records the original managed values under `HERDR_PLUGIN_STATE_DIR`, validates every change with `herdr config check`, and rolls back a rejected edit atomically.

| Prefix key | Action                      |
| ---------- | --------------------------- |
| `/`        | Toggle the keybinding panel |
| `?`        | Open Herdr keybinding help  |
| `d`        | Detach                      |
| `c`        | New tab                     |
| `,`        | Rename tab                  |
| `n` / `p`  | Next / previous tab         |
| `1..9`     | Switch tab                  |
| `&`        | Close tab                   |
| `%` / `"`  | Split right / down          |
| arrows     | Focus the adjacent pane     |
| `o`        | Cycle panes                 |
| `;`        | Focus the last pane         |
| `x`        | Close pane                  |
| `z`        | Zoom pane                   |
| `[`        | Copy mode                   |
| `w`        | Workspace navigation        |

## Install and apply

```sh
herdr plugin install oullin/herdr-plugins/plugins/tmux-keybindings
herdr plugin action invoke oullin.tmux-keybindings.apply
```

The apply action follows `HERDR_CONFIG_PATH` when it is set. Otherwise it uses `%APPDATA%\herdr\config.toml` on Windows and `~/.config/herdr/config.toml` (or `$XDG_CONFIG_HOME/herdr/config.toml`) on Linux and macOS. A workspace-start hook idempotently reapplies the profile after installation; restoring the original bindings disables that automatic apply until the manual apply action is invoked again.

## Toggle the panel

Use `Ctrl+B /`, or invoke the action directly. Repeat `Ctrl+B /` to close the panel:

```sh
herdr plugin action invoke oullin.tmux-keybindings.toggle
```

Pane identity is tracked independently for each workspace and tab. If the panel was closed manually, the next toggle discards the stale record and opens a fresh panel. Herdr's normal session layout persistence keeps an open panel in the tab layout across detach and reattach.

## Restore and uninstall

Restore the original managed values and any displaced `prefix+/` custom command. Installations upgraded from version 0.1.1 also retain custom commands saved when the panel used `prefix+?`:

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
