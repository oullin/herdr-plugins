import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { ConfigurationManager } from '#tmux-keybindings/application/configuration-manager';
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

		const applied = readFileSync(configPath, 'utf8');

		expect(applied).toContain('help = "prefix+?"');
		expect(applied).toContain('key = "prefix+/"');
		expect(state.snapshots.get(configPath)?.version).toBe(2);
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

	it('migrates legacy state and preserves a newly displaced slash command', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-tmux-migration-',
			),
		);

		const configPath = join(directory, 'config.toml');
		const originalAssignments = '[keys]\nprefix = "ctrl+a"\nhelp = "ctrl+h"\n';
		const legacyHelp = ['[[keys.command]]', 'key = "prefix+?"', 'type = "shell"', 'command = "old-help"', ''].join('\n');
		const slashCommand = ['[[keys.command]]', 'key = "prefix+/"', 'type = "shell"', 'command = "slash-help"', ''].join('\n');
		const editor = new KeybindingConfigEditor();
		const originalSnapshot = editor.apply(`${originalAssignments}\n${legacyHelp}`, configPath).snapshot;
		const legacyApplied = editor.apply(originalAssignments, configPath).content.replace('help = "prefix+?"', 'help = ""').replace('key = "prefix+/"', 'key = "prefix+?"');

		writeFileSync(configPath, `${legacyApplied}\n${slashCommand}`);

		const { manager, state } = subject();

		state.snapshots.set(configPath, {
			...originalSnapshot,
			version: 1,
			displacedCommands: [{ line: 4, text: legacyHelp }],
		});

		expect(
			manager.apply({ HERDR_CONFIG_PATH: configPath }),
		).toBe('applied');

		const migrated = state.snapshots.get(configPath);

		expect(migrated?.version).toBe(2);
		expect(migrated?.assignments).toEqual(originalSnapshot.assignments);
		expect(
			migrated?.displacedCommands.map((command) => command.text),
		).toEqual([legacyHelp, slashCommand]);
		expect(
			readFileSync(configPath, 'utf8'),
		).not.toContain('command = "slash-help"');

		expect(
			manager.restore({ HERDR_CONFIG_PATH: configPath }),
		).toBe('restored');

		const restored = readFileSync(configPath, 'utf8');

		expect(restored).toContain('prefix = "ctrl+a"');
		expect(restored).toContain('help = "ctrl+h"');
		expect(restored).toContain('command = "old-help"');
		expect(restored).toContain('command = "slash-help"');
		expect(restored).not.toContain('oullin.tmux-keybindings.toggle');
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
