# Tmux Keybindings

Apply a canonical tmux-style keymap to Herdr and open a compact binding reference as a centred modal dialog.

## Install

Tmux Keybindings requires Herdr 0.7.4 or newer and Node.js 24.12 or newer within the Node.js 24 release line.

Install the plugin, then apply the profile immediately:

```sh
herdr plugin install oullin/herdr-plugins/plugins/tmux-keybindings
herdr plugin action invoke oullin.tmux-keybindings.apply
```

Press `Option+Command+T` to open the dialog. Repeat the chord inside the dialog or press `Esc` to close it. This direct Herdr binding leaves the built-in `prefix+?` help binding untouched.

![The Tmux Keybindings modal listing the configured global, tab, and pane shortcuts](../../docs/images/tmux-keybindings.png)

## Actions

| Action     | Command                                                      | Effect                                                  |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| Apply      | `herdr plugin action invoke oullin.tmux-keybindings.apply`   | Apply the canonical tmux-style profile.                 |
| Open/close | `herdr plugin action invoke oullin.tmux-keybindings.toggle`  | Toggle the modal binding reference for the active pane. |
| Restore    | `herdr plugin action invoke oullin.tmux-keybindings.restore` | Restore the bindings recorded before the first apply.   |

A `workspace.created` hook idempotently reapplies the profile to new workspaces. Restoring the original bindings disables that automatic apply until the manual apply action is invoked again.

## Keymap

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

The apply action follows `HERDR_CONFIG_PATH` when it is set. Otherwise it uses `%APPDATA%\herdr\config.toml` on Windows and `~/.config/herdr/config.toml` (or `$XDG_CONFIG_HOME/herdr/config.toml`) on Linux and macOS.

The popup is session-modal and leaves the tiled tab layout unchanged. Its title keeps Esc visible, and the footer lists both supported closing shortcuts. The underlying direct binding is `alt+super+t`, so it does not depend on a terminal-specific bridge.

## Restore and uninstall

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
