import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { ConfigurationManager } from '#tmux-keybindings/application/configuration-manager';
import { KEYBINDING_PROFILE } from '#tmux-keybindings/domain/keybinding-profile';
import { ConfigPathResolver } from '#tmux-keybindings/infrastructure/config-path-resolver';
import { KeybindingConfigEditor } from '#tmux-keybindings/infrastructure/keybinding-config-editor';
import { FakeHerdrClient, FakeStateRepository } from '#tmux-keybindings/testing/support/fakes';

describe('ConfigurationManager', () => {
	function subject(): {
		readonly client: FakeHerdrClient;
		readonly manager: ConfigurationManager;
		readonly state: FakeStateRepository;
	} {
		const client = new FakeHerdrClient();
		const state = new FakeStateRepository();
		const manager = new ConfigurationManager(client, new KeybindingConfigEditor(), new ConfigPathResolver(), state);

		return { client, manager, state };
	}

	it('validates, reloads, and restores an isolated config', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-config-',
			),
		);

		const configPath = join(directory, 'config.toml');
		const original = '[keys]\nprefix = "ctrl+a"\n\n[theme]\nname = "nord"\n';

		writeFileSync(configPath, original);

		const { client, manager, state } = subject();
		const environment = { HERDR_CONFIG_PATH: configPath };

		expect(
			manager.apply(environment),
		).toBe('applied');
		expect(
			manager.apply(environment),
		).toBe('unchanged');
		expect(client.validatedPaths).toEqual([configPath, configPath]);
		expect(client.reloadCalls).toBe(2);
		expect(state.snapshots.size).toBe(1);
		expect(
			manager.restore(environment),
		).toBe('restored');
		expect(
			readFileSync(configPath, 'utf8'),
		).toBe(original);
		expect(state.automaticApplyDisabled).toBe(true);
	});

	it('rolls back atomically when Herdr rejects the candidate', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-rollback-',
			),
		);

		const configPath = join(directory, 'config.toml');
		const original = '[theme]\nname = "nord"\n';

		writeFileSync(configPath, original);

		const { client, manager, state } = subject();

		client.validationError = new Error('invalid config');

		expect(() => manager.apply({ HERDR_CONFIG_PATH: configPath })).toThrowError('invalid config');
		expect(
			readFileSync(configPath, 'utf8'),
		).toBe(original);
		expect(state.snapshots.size).toBe(0);
		expect(client.reloadCalls).toBe(0);
	});

	it('migrates the legacy help override to the dedicated dialog shortcut', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-migration-',
			),
		);

		const configPath = join(directory, 'config.toml');
		const original = '[keys]\nprefix = "ctrl+a"\n';

		const legacyApplied = [
			'[keys]',
			'prefix = "ctrl+b"',
			'help = ""',
			'',
			'[[keys.command]]',
			'key = "prefix+?"',
			'type = "plugin_action"',
			'command = "oullin.tmux-keybindings.toggle"',
			'description = "open tmux keybinding dialog"',
			'',
		].join('\n');

		writeFileSync(configPath, legacyApplied);

		const { manager, state } = subject();

		state.snapshots.set(configPath, {
			version: 1,
			configPath,
			keysSectionExisted: true,
			assignments: {
				...Object.fromEntries(KEYBINDING_PROFILE.map(({ key }) => [key, null])),
				prefix: 'prefix = "ctrl+a"',
				help: null,
			},
			displacedCommands: [],
		});

		expect(
			manager.apply({ HERDR_CONFIG_PATH: configPath }),
		).toBe('applied');

		const migrated = readFileSync(configPath, 'utf8');

		expect(migrated).not.toContain('help = ""');
		expect(migrated).not.toContain('key = "prefix+?"');
		expect(migrated).toContain('key = "alt+super+t"');
		expect(state.snapshots.get(configPath)?.version).toBe(5);
		expect(state.snapshots.get(configPath)?.assignments).not.toHaveProperty('help');

		expect(
			manager.restore({ HERDR_CONFIG_PATH: configPath }),
		).toBe('restored');
		expect(
			readFileSync(configPath, 'utf8').trimEnd(),
		).toBe(original.trimEnd());
	});

	it('migrates the super-only shortcut without losing the displaced command', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-super-migration-',
			),
		);

		const configPath = join(directory, 'config.toml');
		const displacedCommand = ['[[keys.command]]', 'key = "prefix+super+q"', 'type = "shell"', 'command = "old-super"', ''].join('\n');
		const original = ['[keys]', 'prefix = "ctrl+a"', '', displacedCommand].join('\n');

		const superApplied = [
			'[keys]',
			'prefix = "ctrl+b"',
			'',
			'[[keys.command]]',
			'key = "prefix+super+q"',
			'type = "plugin_action"',
			'command = "oullin.tmux-keybindings.toggle"',
			'description = "open tmux keybinding dialog"',
			'',
		].join('\n');

		writeFileSync(configPath, superApplied);

		const { manager, state } = subject();

		state.snapshots.set(configPath, {
			version: 2,
			configPath,
			keysSectionExisted: true,
			assignments: {
				...Object.fromEntries(KEYBINDING_PROFILE.map(({ key }) => [key, null])),
				prefix: 'prefix = "ctrl+a"',
			},
			displacedCommands: [{ line: 3, text: displacedCommand }],
		});

		expect(
			manager.apply({ HERDR_CONFIG_PATH: configPath }),
		).toBe('applied');

		const migrated = readFileSync(configPath, 'utf8');

		expect(migrated).toContain('command = "old-super"');
		expect(migrated).toContain('key = "alt+super+t"');
		expect(
			migrated.match(/oullin\.tmux-keybindings\.toggle/gu),
		).toHaveLength(1);
		expect(state.snapshots.get(configPath)?.version).toBe(5);

		expect(
			manager.restore({ HERDR_CONFIG_PATH: configPath }),
		).toBe('restored');
		expect(
			readFileSync(configPath, 'utf8').trimEnd(),
		).toBe(original.trimEnd());
	});

	it('migrates the Hyperkey modifier chord to the direct dialog shortcut', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-hyper-migration-',
			),
		);

		const configPath = join(directory, 'config.toml');

		const hyperApplied = [
			'[keys]',
			'prefix = "ctrl+b"',
			'',
			'[[keys.command]]',
			'key = "prefix+ctrl+alt+shift+super+q"',
			'type = "plugin_action"',
			'command = "oullin.tmux-keybindings.toggle"',
			'description = "open tmux keybinding dialog"',
			'',
		].join('\n');

		writeFileSync(configPath, hyperApplied);

		const { manager, state } = subject();

		state.snapshots.set(configPath, {
			version: 3,
			configPath,
			keysSectionExisted: true,
			assignments: Object.fromEntries(KEYBINDING_PROFILE.map(({ key }) => [key, null])),
			displacedCommands: [],
		});

		expect(
			manager.apply({ HERDR_CONFIG_PATH: configPath }),
		).toBe('applied');

		const migrated = readFileSync(configPath, 'utf8');

		expect(migrated).not.toContain('key = "prefix+ctrl+alt+shift+super+q"');
		expect(migrated).toContain('key = "alt+super+t"');
		expect(state.snapshots.get(configPath)?.version).toBe(5);
	});

	it('migrates the terminal bridge to the direct dialog shortcut', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-bridge-migration-',
			),
		);

		const configPath = join(directory, 'config.toml');

		const bridgeApplied = [
			'[keys]',
			'prefix = "ctrl+b"',
			'',
			'[[keys.command]]',
			'key = "prefix+ctrl+g"',
			'type = "plugin_action"',
			'command = "oullin.tmux-keybindings.toggle"',
			'description = "open tmux keybinding dialog"',
			'',
		].join('\n');

		writeFileSync(configPath, bridgeApplied);

		const { manager, state } = subject();

		state.snapshots.set(configPath, {
			version: 4,
			configPath,
			keysSectionExisted: true,
			assignments: Object.fromEntries(KEYBINDING_PROFILE.map(({ key }) => [key, null])),
			displacedCommands: [],
		});

		expect(
			manager.apply({ HERDR_CONFIG_PATH: configPath }),
		).toBe('applied');

		const migrated = readFileSync(configPath, 'utf8');

		expect(migrated).not.toContain('key = "prefix+ctrl+g"');
		expect(migrated).toContain('key = "alt+super+t"');
		expect(state.snapshots.get(configPath)?.version).toBe(5);
	});

	it('does not reapply automatically after a restore', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-automatic-',
			),
		);

		const configPath = join(directory, 'config.toml');

		writeFileSync(configPath, '');

		const { manager, state } = subject();

		state.automaticApplyDisabled = true;

		expect(
			manager.apply({ HERDR_CONFIG_PATH: configPath }, true),
		).toBe('automatic-disabled');
		expect(
			readFileSync(configPath, 'utf8'),
		).toBe('');
	});
});
